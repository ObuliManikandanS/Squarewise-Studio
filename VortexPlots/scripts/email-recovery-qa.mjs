// Isolated integration test. Resend is intercepted in this process; no real emails are sent.
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {randomBytes} from 'node:crypto';
import assert from 'node:assert/strict';
const requireQA=createRequire(resolve(process.env.PGLITE_QA_ROOT||'/tmp/vortex-qa','package.json'));
const {PGlite}=requireQA('@electric-sql/pglite');
const {PGLiteSocketServer}=requireQA('@electric-sql/pglite-socket');
const db=await PGlite.create(),socket=new PGLiteSocketServer({db,host:'127.0.0.1',port:55433,maxConnections:20});
await socket.start();
Object.assign(process.env,{DATABASE_URL:'postgresql://postgres:postgres@127.0.0.1:55433/postgres',BETTER_AUTH_URL:'http://127.0.0.1:4302',BETTER_AUTH_SECRET:randomBytes(32).toString('hex'),RESEND_API_KEY:'isolated-test-only',EMAIL_FROM:'VortexPlots QA <no-reply@example.test>'});
const origin=process.env.BETTER_AUTH_URL,messages=[];let rejectDelivery=false,pool;
const realFetch=globalThis.fetch;
globalThis.fetch=async(url,options)=>{assert.equal(String(url),'https://api.resend.com/emails','Unexpected outbound request');if(rejectDelivery)return new Response('{}',{status:503});messages.push(JSON.parse(options.body));return Response.json({id:crypto.randomUUID()})};
let checks=0;const pass=label=>{checks++;console.log('PASS '+label)};
try{
 const {getAuth,authOptions}=await import('../lib/auth-server.mjs');
 const {database}=await import('../lib/database.mjs');pool=database();
 const {getMigrations}=await import('better-auth/db/migration');await (await getMigrations(authOptions())).runMigrations();
 const auth=getAuth();
 async function call(path,body,cookie){return auth.handler(new Request(origin+'/api/auth'+path,{method:body?'POST':'GET',headers:{origin,'content-type':'application/json',...(cookie?{cookie}:{})},body:body?JSON.stringify(body):undefined}))}
 const email='recovery-qa@example.test',password=randomBytes(20).toString('base64url');
 let response=await call('/sign-up/email',{name:'Disposable Recovery QA',email,password});assert.equal(response.status,200);assert.equal(messages.length,1);assert.ok(messages[0].text.includes('/verify-email?'));pass('Registration requests a verification email');
 const link=messages[0].text.match(/https?:\/\/\S+/)[0];response=await auth.handler(new Request(link));assert.ok(response.status<400);pass('Verification link verifies the actual account');
 response=await call('/sign-in/email',{email,password});assert.equal(response.status,200);const cookie=response.headers.getSetCookie().map(v=>v.split(';')[0]).join('; ');
 response=await call('/request-password-reset',{email,redirectTo:origin+'/reset-password'});assert.equal(response.status,200);const resetLink=messages.at(-1).text.match(/https?:\/\/\S+/)[0];const token=new URL(resetLink).pathname.split('/').at(-1);assert.ok(resetLink.includes('callbackURL='));
 const expires=(await pool.query('SELECT "expiresAt" FROM verification WHERE identifier=$1',['reset-password:'+token])).rows[0].expiresAt;assert.ok(new Date(expires)-Date.now()>1700000&&new Date(expires)-Date.now()<=1800000);pass('Recovery email contains a valid 30-minute reset link');
 response=await auth.handler(new Request(resetLink));assert.equal(new URL(response.headers.get('location')).pathname,'/reset-password');pass('Reset link opens the correct page');
 const newPassword=randomBytes(20).toString('base64url');response=await call('/reset-password',{token,newPassword});assert.equal(response.status,200);assert.equal((await call('/get-session',undefined,cookie)).status,200);assert.equal(await (await call('/get-session',undefined,cookie)).json(),null);pass('Password reset invalidates existing sessions');
 assert.equal((await call('/reset-password',{token,newPassword})).status,400);pass('Reset token is single-use');
 assert.equal((await call('/sign-in/email',{email,password:newPassword})).status,200);assert.equal((await call('/sign-in/email',{email,password})).status,401);pass('New password works and old password is rejected');
 const count=messages.length;response=await call('/request-password-reset',{email:'unknown@example.test',redirectTo:origin+'/reset-password'});assert.equal(response.status,200);assert.equal(messages.length,count);pass('Unknown addresses receive a neutral response without email');
 // Expiration check uses a freshly issued token and an isolated database clock fixture.
 response=await call('/request-password-reset',{email,redirectTo:origin+'/reset-password'});assert.equal(response.status,200);const expiredLink=messages.at(-1).text.match(/https?:\/\/\S+/)[0],expiredToken=new URL(expiredLink).pathname.split('/').at(-1);await pool.query('UPDATE verification SET "expiresAt"=now()-interval \'1 minute\' WHERE identifier=$1',['reset-password:'+expiredToken]);assert.equal((await call('/reset-password',{token:expiredToken,newPassword})).status,400);pass('Expired reset token is rejected');
 rejectDelivery=true;response=await call('/send-verification-email',{email:'recovery-qa@example.test',callbackURL:origin+'/sign-in?verified=1'}); // Verified accounts appropriately do not need mail.
 const callbacks=authOptions();await assert.rejects(()=>callbacks.emailAndPassword.sendResetPassword({user:{email},url:origin+'/unused'}),/delivery failed/);pass('Provider failure cannot be reported as successful delivery');
 console.log('EMAIL RECOVERY QA PASS '+checks);
}finally{globalThis.fetch=realFetch;await pool?.end();await socket.stop();await db.close();}
