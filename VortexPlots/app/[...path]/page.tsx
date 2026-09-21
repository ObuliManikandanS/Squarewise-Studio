import { notFound } from 'next/navigation';
import { Workspace } from '../workspace';
import {districts,localities,slug} from '../data';
const routes=['sign-in','register','dashboard','estimator','locations','price-intelligence','portfolio','reports','about','contact','account','privacy','terms','area-tools','data-health'];
export default async function Page({params}:{params:Promise<{path:string[]}>}){const {path}=await params;if(!routes.includes(path[0]))notFound();if(path[0]==='locations'&&path.length>1){const d=districts.find(x=>x.id===path[1]);if(!d||path.length>3||(path[2]&&!localities.some(l=>l.districtId===d.id&&slug(l.name)===path[2])))notFound();}else if(path.length>1)notFound();return <Workspace path={'/'+path.join('/')}/>}
