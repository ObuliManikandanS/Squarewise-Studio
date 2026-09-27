import {identity} from '@/lib/storage';
import {safeFailure} from '@/lib/http';
import {pdf} from '@/lib/pdf';
import {createSnapshot} from '@/lib/report-snapshot';
export const runtime='nodejs';
export async function POST(req:Request){try{const origin=req.headers.get('origin');if(!origin||new URL(origin).host!==(req.headers.get('host')||new URL(req.url).host))return Response.json({error:'Request origin rejected.'},{status:403});const raw=await req.text();if(raw.length>12000)return Response.json({error:'Request too large.'},{status:413});await identity();const snapshot=createSnapshot(JSON.parse(raw));return new Response(new Uint8Array(await pdf(snapshot)),{headers:{'Content-Type':'application/pdf','Content-Disposition':`attachment; filename="${snapshot.filename}"`,'Cache-Control':'no-store'}})}catch(e){return safeFailure(e)}}
