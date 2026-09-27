export type PriceRecord={id:string;localityId:string;propertyType:string;basis:string;category:string;rate:number;effectiveDate:string;collectedDate:string;sourceUrl:string;verified:boolean;reuseApproved:boolean;screened?:boolean};
export function usablePrices<T extends PriceRecord>(rows:T[],now=Date.now()):T[]{
 const seen=new Set<string>();
 return rows.filter(row=>{
  const date=Date.parse(row.effectiveDate||row.collectedDate),age=now-date;
  if(seen.has(row.id)||!Number.isFinite(row.rate)||row.rate<=0||!Number.isFinite(age)||age<0||age>=365*86400000||!/^https:\/\//.test(row.sourceUrl)||(!row.screened&&!(row.verified&&row.reuseApproved)))return false;
  seen.add(row.id);return true;
 });
}
export function representativeRate(min:number,average:number,max:number){
 if(![min,average,max].every(n=>Number.isFinite(n)&&n>0)||min>average||average>max)throw Error('A valid minimum, source average and maximum are required.');
 return (min+average+max)/3;
}
/** Homogeneous observed sample only. This is not a certified market valuation. */
export function summarizePrices(rows:PriceRecord[],now=Date.now()){
 const valid=usablePrices(rows,now);if(!valid.length)return null;
 if(new Set(valid.map(r=>JSON.stringify([r.propertyType,r.basis,r.category]))).size!==1)throw Error('Do not combine property types, price categories or area bases.');
 const rates=valid.map(r=>r.rate),min=Math.min(...rates),max=Math.max(...rates),average=rates.reduce((a,b)=>a+b,0)/rates.length;
 return {min,average,max,representative:representativeRate(min,average,max),count:valid.length,updated:valid.map(r=>r.effectiveDate||r.collectedDate).sort().at(-1)!,effectiveDateKnown:valid.every(r=>!!r.effectiveDate),confidence:'Low' as const,sourceAverageMethod:'Arithmetic mean of compatible source observations',verification:valid.every(r=>r.verified&&r.reuseApproved)?'Source-checked asking offers; not verified sales':'Screened advertisements; not independently verified'};
}
