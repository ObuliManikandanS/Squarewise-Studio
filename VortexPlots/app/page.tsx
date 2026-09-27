import {redirect} from 'next/navigation';
import {pageSession} from '../lib/page-session';
export default async function Home(){redirect(await pageSession()?'/dashboard':'/sign-in')}
