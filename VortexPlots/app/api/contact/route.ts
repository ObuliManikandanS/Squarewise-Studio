import {z} from 'zod';
import {identity,store,key,sameOrigin,failure} from '@/lib/storage';
import {jsonBody,limit} from '@/lib/http';
const schema=z.object({name:z.string().trim().min(2).max(100),email:z.string().email().max(254),phone:z.string().max(30).optional(),subject:z.enum(['Question','Data correction','Privacy request','Technical support']),message:z.string().trim().min(20).max(3000),consent:z.literal(true),website:z.string().max(0)});
export async function POST(req:Request){try{sameOrigin(req);const user=await identity();const input=schema.parse(await jsonBody(req));await limit('inquiries',user.id,3);const id=crypto.randomUUID();await store().setJSON(key(user.id,'inquiries',id),{id,...input,accountEmail:user.email,status:'received',createdAt:new Date().toISOString()});return Response.json({id,message:'Your inquiry has been saved to our support queue successfully. Reference number: '+id+'.'},{status:201});}catch(e){return failure(e)}}
