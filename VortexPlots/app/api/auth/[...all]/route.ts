import {getAuth,mailReady} from '@/lib/auth-server.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
async function handler(req:Request){
  if(new URL(req.url).pathname.endsWith('/request-password-reset')&&!mailReady())
    return Response.json({message:'Email recovery is not configured yet.'},{status:503});
  try{return await getAuth().handler(req)}
  catch{return Response.json({message:'Account service is temporarily unavailable.'},{status:503})}
}
export {handler as GET,handler as POST};
