import directory from '../data/locations.json' with {type:'json'};
import records from '../data/observations.json' with {type:'json'};
export const datasetVersion='tn-2026-09-20.4';
export const officialGuidelineUrl='https://tnreginet.gov.in/portal/';
export const districtSource='https://igod.gov.in/sg/TN/E042/organizations';
export const districts=directory;
export const slug=(s:string)=>s.toLowerCase().replace(/[^a-z0-9]+/g,'-');
export const localities=directory.flatMap(d=>d.localities.map(name=>({id:`${d.id}--${slug(name)}`,name,districtId:d.id,district:d.name,kind:'Search locality',status:'Administrative classification pending verification'})));
export type Observation={id:string;localityId:string;propertyType:string;basis:string;category:'guideline'|'transaction'|'asking';rate:number;effectiveDate:string;collectedDate:string;sourceUrl:string;sourceName:string;sampleSize:number;verified:boolean;reuseApproved:boolean};
export const observations=records as Observation[];
export const propertyTypes=['Land','Apartment','Independent house','Villa','Commercial'];
export const units:Record<string,number>={'sq ft':1,'sq m':10.76391041671,'cent':435.6,'acre':43560,'ground':2400};
export const money=(n:number|null)=>n===null?'Unavailable':new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(n);
export type Inputs={localityId:string;propertyType:string;area:number;unit:string;basis:string;category:string;manualRate?:number;acquisitionCost?:number;acquisitionDate?:string;label?:string};
export function validate(input:Inputs){
 const loc=localities.find(l=>l.id===input.localityId);
 if(!loc)throw Error('Choose a listed locality.');
 if(!propertyTypes.includes(input.propertyType))throw Error('Choose a property type.');
 if(!Object.hasOwn(units,input.unit)||!Number.isFinite(input.area)||input.area<=0||input.area*units[input.unit]>10000000)throw Error('Enter a valid positive area up to 10,000,000 sq ft.');
 if(!['asking','transaction','guideline'].includes(input.category))throw Error('Select a price category.');
 if(input.basis!==(input.propertyType==='Land'?'Plot area':'Built-up area'))throw Error('Area basis does not match property type.');
 if(input.manualRate!==undefined&&(!Number.isFinite(input.manualRate)||input.manualRate<=0||input.manualRate>1000000))throw Error('Enter a positive user rate up to ₹10,00,000/sq ft.');
 if(input.acquisitionCost!==undefined&&(!Number.isFinite(input.acquisitionCost)||input.acquisitionCost<0))throw Error('Acquisition cost cannot be negative.');
 if(input.acquisitionDate&&(!/^\d{4}-\d{2}-\d{2}$/.test(input.acquisitionDate)||!Number.isFinite(Date.parse(input.acquisitionDate))||input.acquisitionDate>new Date().toISOString().slice(0,10)))throw Error('Enter a valid acquisition date in the past.');
 return loc;
}
export function calculate(input:Inputs){
 const loc=validate(input),areaSqft=input.area*units[input.unit];
 const evidence=observations.filter(o=>o.localityId===loc.id&&o.propertyType===input.propertyType&&o.basis===input.basis&&o.category===input.category&&o.verified&&o.reuseApproved&&Date.parse(o.effectiveDate)<=Date.now()&&Date.now()-Date.parse(o.effectiveDate)<365*86400000);
 // No price-category mixing and no district fallback. Baseline is not a trained model.
 const rates=evidence.map(e=>e.rate).sort((a,b)=>a-b); const rate=rates.length?(rates[Math.floor((rates.length-1)/2)]+rates[Math.ceil((rates.length-1)/2)])/2:null;
 const used=input.manualRate??rate;
 return {inputs:input,locality:loc,areaSqft,rate:used,total:used===null?null:used*areaSqft,category:input.manualRate!==undefined?'User scenario (unverified)':input.category,method:'Area × rate; no trained model',modelVersion:null,datasetVersion,evidence,range:input.manualRate===undefined&&rates.length>1?[rates[0],rates[rates.length-1]]:null,status:input.manualRate!==undefined?'scenario':rate===null?'unavailable':'observed',createdAt:new Date().toISOString()};
}
export type Result=ReturnType<typeof calculate>;

export function areaMetrics(a:{carpet:number;built:number;superArea:number;rate:number}){
 for(const v of Object.values(a))if(!Number.isFinite(v)||v<=0||v>10000000)throw Error('Enter positive values up to 10,000,000.');
 if(a.carpet>a.built||a.built>a.superArea)throw Error('Carpet area must be ≤ built-up area ≤ super built-up area.');
 return {...a,loading:(a.superArea-a.carpet)/a.carpet*100,efficiency:a.carpet/a.superArea*100,wallArea:a.built-a.carpet,commonArea:a.superArea-a.built,total:a.rate*a.superArea,usableCost:a.rate*a.superArea/a.carpet,rateSqm:a.rate*units['sq m']};
}
