import {headers} from 'next/headers';
import {redirect} from 'next/navigation';
import {getAuth} from './auth-server.mjs';
export async function pageSession(){const h=await headers();try{return await getAuth().api.getSession({headers:h});}catch(error){if(error instanceof Error&&error.message==='AUTH_NOT_CONFIGURED')return null;throw error;}}
export async function requirePage(path:string){const session=await pageSession();if(!session)redirect('/sign-in?returnTo='+encodeURIComponent(path));return session;}
export function safeReturnTo(value:unknown){return typeof value==='string'&&value.startsWith('/')&&!value.startsWith('//')&&!/[\\\r\n]/.test(value)&&!/^\/(sign-in|register|forgot-password|reset-password|verify-email)([/?#]|$)/.test(value)?value:'/dashboard';}
