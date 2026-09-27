import {z} from 'zod';
import {identity,store,key,sameOrigin,failure} from '@/lib/storage';
import {jsonBody} from '@/lib/http';
export const dynamic='force-dynamic';
const schema=z.object({productUpdates:z.boolean(),researchReminders:z.boolean()});
export async function GET(){try{const user=await identity();const record=await store().get(key(user.id,'settings','preferences'));return Response.json(record||{productUpdates:false,researchReminders:false},{headers:{'Cache-Control':'private, no-store'}})}catch(e){return failure(e)}}
export async function PATCH(req:Request){try{sameOrigin(req);const user=await identity();const value=schema.parse(await jsonBody(req));await store().setJSON(key(user.id,'settings','preferences'),{...value,createdAt:new Date().toISOString()});return Response.json(value)}catch(e){return failure(e)}}
