export async function request(url:string,options:RequestInit={}):Promise<Response>{try{return await fetch(url,{...options,cache:'no-store',signal:options.signal||AbortSignal.timeout(30000)})}catch(e){if(e instanceof Error&&['TimeoutError','AbortError'].includes(e.name))throw Error('The request timed out. Please try again.');throw Error('Unable to connect. Check your internet connection.')}}
export async function api<T=Record<string,unknown>>(url:string,options:RequestInit={}):Promise<T>{
 const r=await request(url,{...options,headers:{'Content-Type':'application/json',...options.headers}});
 let body:unknown;
 try{body=await r.json()}catch{throw Error(r.ok?'The server returned an unexpected response. Please try again.':'The service is temporarily unavailable. Please try again.')}
 if(!r.ok){
  const error=body&&typeof body==='object'&&'error' in body?body.error:undefined;
  throw Error(typeof error==='string'?error:'Could not complete the request.');
 }
 return body as T;
}
