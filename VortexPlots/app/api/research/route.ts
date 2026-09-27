import {z} from 'zod';
import {createHash} from 'node:crypto';
import {identity,key,list,store,sameOrigin,failure} from '@/lib/storage';
import {jsonBody,limit,PublicError} from '@/lib/http';
import {localities} from '@/app/data';
export const dynamic='force-dynamic';
const kinds=z.enum(['localities','searches','comparisons']);
export async function GET(req:Request){try{const u=await identity();const kind=kinds.parse(new URL(req.url).searchParams.get('kind'));return Response.json({rows:await list(u.id,kind)},{headers:{'Cache-Control':'no-store'}})}catch(e){return failure(e)}}
export async function POST(req:Request){try{sameOrigin(req);const u=await identity();await limit('research-save',u.id,120,3600);const b=z.object({kind:kinds,localityIds:z.array(z.string()).min(1).max(3),propertyType:z.string().max(50).optional(),basis:z.string().max(50).optional()}).parse(await jsonBody(req));const ids=[...new Set(b.localityIds)].sort();if(ids.some(id=>!localities.some(l=>l.id===id)))throw new PublicError('Choose a listed locality.');const id=createHash('sha256').update(JSON.stringify([b.kind,ids,b.propertyType,b.basis])).digest('hex').slice(0,32);const k=key(u.id,b.kind,id);if((await list(u.id,b.kind)).length>=200&&!await store().get(k))throw new PublicError('Remove an older item before adding more.');await store().setJSON(k,{id,kind:b.kind,localityIds:ids,propertyType:b.propertyType,basis:b.basis,createdAt:new Date().toISOString()});return Response.json({id,message:'Saved to your workspace.'},{status:201})}catch(e){return failure(e)}}
export async function DELETE(req:Request){try{sameOrigin(req);const u=await identity();const b=z.object({kind:kinds,id:z.string().regex(/^[a-z0-9-]{1,80}$/i)}).parse(await jsonBody(req));await store().delete(key(u.id,b.kind,b.id));return Response.json({ok:true})}catch(e){return failure(e)}}
