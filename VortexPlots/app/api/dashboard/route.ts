import {identity,list,failure} from '@/lib/storage';
import {database} from '@/lib/database.mjs';
export const dynamic='force-dynamic';
export async function GET(){try{const u=await identity();const kinds=['properties','estimates','localities','searches','comparisons','pdfs'];const entries=await Promise.all(kinds.map(async k=>[k,await list(u.id,k)]));const reviews=(await database().query('SELECT id,title,rating,status,created_at AS "createdAt" FROM reviews WHERE owner_id=$1',[u.id])).rows;return Response.json({user:{id:u.id,name:u.name,email:u.email},data:{...Object.fromEntries(entries),reviews}},{headers:{'Cache-Control':'private, no-store'}})}catch(e){return failure(e)}}
