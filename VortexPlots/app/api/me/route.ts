import {headers} from 'next/headers';
import {getAuth,mailReady} from '@/lib/auth-server.mjs';
import {database} from '@/lib/database.mjs';
export const dynamic='force-dynamic';
export async function GET(){try{await database().query('SELECT 1 FROM "user" LIMIT 1');const session=await getAuth().api.getSession({headers:await headers()});return Response.json({user:session?.user??null,available:true,recoveryAvailable:mailReady(),emailVerification:mailReady()},{headers:{'Cache-Control':'private, no-store'}})}catch{return Response.json({user:null,available:false,recoveryAvailable:false,emailVerification:false},{status:503,headers:{'Cache-Control':'private, no-store'}})}}
