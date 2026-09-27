import {localities, observations, type Observation} from '../app/data.ts';

/** Never mix categories, property types or quoted area bases into one district price. */
export function districtPriceGroups(districtId:string, records:Observation[]=observations, now=Date.now()) {
  const places=new Map(localities.filter(l=>l.districtId===districtId).map(l=>[l.id,l.name]));
  const groups=new Map<string,Observation[]>();
  const seen=new Set<string>();
  for(const row of records){
    const age=now-Date.parse(row.effectiveDate);
    if(!places.has(row.localityId)||!row.verified||!row.reuseApproved||!Number.isFinite(row.rate)||row.rate<=0||!Number.isFinite(age)||age<0||age>=365*86400000||!row.sourceUrl.startsWith('https://')||seen.has(row.id))continue;
    seen.add(row.id);
    const key=JSON.stringify([row.category,row.propertyType,row.basis]);
    groups.set(key,[...(groups.get(key)||[]),row]);
  }
  return [...groups.values()].map(rows=>({
    category:rows[0].category, propertyType:rows[0].propertyType, basis:rows[0].basis,
    min:Math.min(...rows.map(o=>o.rate)), max:Math.max(...rows.map(o=>o.rate)), count:rows.length,
    updated:rows.map(o=>o.effectiveDate).sort().at(-1)!,
    places:[...new Set(rows.map(o=>places.get(o.localityId)!))],
    sources:[...new Map(rows.map(o=>[o.sourceUrl,{name:o.sourceName,url:o.sourceUrl}])).values()],
  })).sort((a,b)=>a.category.localeCompare(b.category)||a.propertyType.localeCompare(b.propertyType)||a.basis.localeCompare(b.basis));
}
