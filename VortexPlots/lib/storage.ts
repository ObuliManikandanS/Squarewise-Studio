import {headers} from 'next/headers';
import {getAuth} from './auth-server.mjs';
import {database} from './database.mjs';

export async function identity(){const session=await getAuth().api.getSession({headers:await headers()});if(!session)throw Error('AUTH_REQUIRED');return session.user;}
async function ownerFor(recordKey:string){const user=await identity();if(!recordKey.startsWith(`${encodeURIComponent(user.id)}/`))throw Error('AUTH_REQUIRED');return user.id;}
export function store(){return {
  async get(recordKey:string,_options?:{type:'json'}){const owner=await ownerFor(recordKey);const rows=await database().query('SELECT value FROM saved_records WHERE key=$1 AND owner_id=$2',[recordKey,owner]);return rows.rows[0]?.value??null;},
  async setJSON(recordKey:string,value:unknown){const owner=await ownerFor(recordKey);await database().query('INSERT INTO saved_records(key,owner_id,value) VALUES($1,$2,$3) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=now() WHERE saved_records.owner_id=EXCLUDED.owner_id',[recordKey,owner,JSON.stringify(value)]);},
  async delete(recordKey:string){const owner=await ownerFor(recordKey);await database().query('DELETE FROM saved_records WHERE key=$1 AND owner_id=$2',[recordKey,owner]);},
  async list({prefix}:{prefix:string}){const owner=await ownerFor(prefix);const rows=await database().query('SELECT key FROM saved_records WHERE owner_id=$1 AND starts_with(key,$2)',[owner,prefix]);return {blobs:rows.rows as {key:string}[]};},
};}
export function key(userId:string,kind:string,id:string){if(!/^[a-z0-9-]{1,80}$/i.test(id))throw Error('Invalid record identifier');return `${encodeURIComponent(userId)}/${kind}/${id}`;}
export async function list(userId:string,kind:string){const db=store(),rows=await db.list({prefix:`${encodeURIComponent(userId)}/${kind}/`});return (await Promise.all(rows.blobs.map(b=>db.get(b.key,{type:'json'})))).filter(Boolean).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));}
export function sameOrigin(req:Request){const origin=req.headers.get('origin');const expected=process.env.BETTER_AUTH_URL||process.env.RENDER_EXTERNAL_URL;if(!origin||(expected?origin!==new URL(expected).origin:new URL(origin).host!==(req.headers.get('host')||new URL(req.url).host)))throw Error('ORIGIN_REJECTED');}
export function failure(e:unknown){const message=e instanceof Error?e.message:'Request failed';const unavailable=/CONFIGURED|ECONN|connection|database|relation|column/i.test(message);const status=message==='AUTH_REQUIRED'?401:message==='ORIGIN_REJECTED'?403:unavailable?503:400;return Response.json({error:message==='AUTH_REQUIRED'?'Sign in to continue.':message==='ORIGIN_REJECTED'?'Request origin rejected.':unavailable?'Saved information is temporarily unavailable. Please try again later.':message},{status,headers:{'Cache-Control':'private, no-store'}});}
