import {database} from '@/lib/database.mjs';
export const dynamic = 'force-dynamic';

export async function GET() {
  if (!process.env.DATABASE_URL) return Response.json({status:'degraded',service:'VortexPlots',database:'not_configured'}, {headers:{'Cache-Control':'no-store'}});
  try {
    await database().query('SELECT 1 FROM saved_records LIMIT 1');
    return Response.json({status:'ok',service:'VortexPlots'}, {headers:{'Cache-Control':'no-store'}});
  } catch {
    return Response.json({status:'unavailable',service:'VortexPlots'}, {status:503,headers:{'Cache-Control':'no-store'}});
  }
}
