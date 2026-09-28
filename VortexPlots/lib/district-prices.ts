import {summarizePrices,usablePrices} from './price-summary.ts';
import {localities, currentPrices, type Observation} from '../app/data.ts';

/** Never mix categories, property types or quoted area bases into one district price. */
export function districtPriceGroups(districtId:string, records:Observation[]=currentPrices, now=Date.now()) {
  const places=new Map(localities.filter(l=>l.districtId===districtId).map(l=>[l.id,l.name]));
  const groups=new Map<string,Observation[]>();
  for(const row of usablePrices(records,now)){
    if(!places.has(row.localityId))continue;
    const key=JSON.stringify([row.category,row.propertyType,row.basis]);
    groups.set(key,[...(groups.get(key)||[]),row]);
  }
  return [...groups.values()].map(rows=>({
    ...summarizePrices(rows,now)!, category:rows[0].category, propertyType:rows[0].propertyType, basis:rows[0].basis,
    places:[...new Set(rows.map(o=>places.get(o.localityId)!))],
    sources:[...new Map(rows.map(o=>[o.sourceUrl,{name:o.sourceName,url:o.sourceUrl}])).values()],
  })).sort((a,b)=>a.category.localeCompare(b.category)||(['Land','Agricultural land','Apartment'].indexOf(a.propertyType)<0?99:['Land','Agricultural land','Apartment'].indexOf(a.propertyType))-(['Land','Agricultural land','Apartment'].indexOf(b.propertyType)<0?99:['Land','Agricultural land','Apartment'].indexOf(b.propertyType))||a.propertyType.localeCompare(b.propertyType)||a.basis.localeCompare(b.basis));
}
