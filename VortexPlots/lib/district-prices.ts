import {summarizePrices} from './price-summary.ts';
import {localities, observations, currentPrices, priceDate, type Observation} from '../app/data.ts';

/** Never mix categories, property types or quoted area bases into one district price. */
export function districtPriceGroups(districtId:string, records:Observation[]=currentPrices, now=Date.now()) {
  const places=new Map(localities.filter(l=>l.districtId===districtId).map(l=>[l.id,l.name]));
  const groups=new Map<string,Observation[]>();
  const seen=new Set<string>();
  for(const row of records){
    const age=now-Date.parse(priceDate(row));
    if(!places.has(row.localityId)||(!row.screened&&(!row.verified||!row.reuseApproved))||!Number.isFinite(row.rate)||row.rate<=0||!Number.isFinite(age)||age<0||age>=365*86400000||!row.sourceUrl.startsWith('https://')||seen.has(row.id))continue;
    seen.add(row.id);
    const key=JSON.stringify([row.category,row.propertyType,row.basis]);
    groups.set(key,[...(groups.get(key)||[]),row]);
  }
  return [...groups.values()].map(rows=>({
    ...summarizePrices(rows,now)!, category:rows[0].category, propertyType:rows[0].propertyType, basis:rows[0].basis,
    min:Math.min(...rows.map(o=>o.rate)), max:Math.max(...rows.map(o=>o.rate)), count:rows.length,
    average:rows.reduce((n,o)=>n+o.rate,0)/rows.length,
    updated:rows.map(o=>priceDate(o)).sort().at(-1)!,
    places:[...new Set(rows.map(o=>places.get(o.localityId)!))],
    sources:[...new Map(rows.map(o=>[o.sourceUrl,{name:o.sourceName,url:o.sourceUrl}])).values()],
  })).sort((a,b)=>a.category.localeCompare(b.category)||(['Land','Agricultural land','Apartment'].indexOf(a.propertyType)<0?99:['Land','Agricultural land','Apartment'].indexOf(a.propertyType))-(['Land','Agricultural land','Apartment'].indexOf(b.propertyType)<0?99:['Land','Agricultural land','Apartment'].indexOf(b.propertyType))||a.propertyType.localeCompare(b.propertyType)||a.basis.localeCompare(b.basis));
}
