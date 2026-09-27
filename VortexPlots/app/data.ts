import {predictAskingRate} from '../lib/ridge.ts';
import {usablePrices,summarizePrices} from '../lib/price-summary.ts';
import directory from '../data/locations.json' with {type:'json'};
import records from '../data/observations.json' with {type:'json'};
import supplied from '../data/screened-asking.json' with {type:'json'};
export {supplied};
export const datasetVersion='tn-2026-09-28.1';
export const officialGuidelineUrl='https://tnreginet.gov.in/portal/';
export const districtSource='https://igod.gov.in/sg/TN/E042/organizations';
export const districts=directory;
export const slug=(s:string)=>s.toLowerCase().replace(/[^a-z0-9]+/g,'-');
const directoryLocalities=directory.flatMap(d=>d.localities.map(name=>({id:`${d.id}--${slug(name)}`,name,districtId:d.id,district:d.name,kind:'Search locality',status:'Administrative classification pending verification'})));
export const localities=[...new Map([...directoryLocalities,...supplied.map(r=>({id:r.districtId+'--'+slug(r.locality),name:r.locality,districtId:r.districtId,district:directory.find(d=>d.id===r.districtId)!.name,kind:'Advertised locality',status:r.districtAssignment}))].map(l=>[l.id,l])).values()];
export type Observation={id:string;localityId:string;propertyType:string;basis:string;category:'guideline'|'transaction'|'asking';rate:number;effectiveDate:string;collectedDate:string;sourceUrl:string;sourceName:string;sampleSize:number;verified:boolean;reuseApproved:boolean;screened?:boolean};
export const observations=records as Observation[];
export const askingSamples:Observation[]=supplied.map(r=>({id:r.id,localityId:r.districtId+'--'+slug(r.locality),propertyType:r.propertyType,basis:r.basis,category:'asking',rate:r.rate,effectiveDate:r.effectiveDate||'',collectedDate:r.observedOn,sourceUrl:r.sourceUrl,sourceName:r.sourceName,sampleSize:1,verified:false,reuseApproved:false,screened:true}));
export const currentPrices=[...observations,...askingSamples];
export const priceDate=(o:Observation)=>o.effectiveDate||o.collectedDate;
export const propertyTypes=[...new Set(['Land','Apartment','Independent house','Villa','Commercial','Agricultural land',...supplied.map(r=>r.propertyType)])];
export const isLand=(type:string)=>['Land','Agricultural land','Commercial land','Industrial land'].includes(type);
export const allowedBases=(type:string)=>isLand(type)?['Plot area']:['Carpet area','Built-up area','Super built-up area',...(['Villa','Independent house'].includes(type)?['Plot area']:[])];
export const units:Record<string,number>={'sq ft':1,'sq m':10.76391041671,'cent':435.6,'acre':43560,'ground':2400};
export const money=(n:number|null)=>n===null?'Unavailable':new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(n);
export type Inputs={localityId:string;propertyType:string;area:number;unit:string;basis:string;category:string;priceScope?:'locality'|'district';useModel?:boolean;manualRate?:number;acquisitionCost?:number;acquisitionDate?:string;label?:string;carpetArea?:number;builtArea?:number;superArea?:number};
export function validate(input:Inputs){
 const loc=localities.find(l=>l.id===input.localityId);
 if(!loc)throw Error('Choose a listed locality.');
 if(input.priceScope!==undefined&&!['locality','district'].includes(input.priceScope))throw Error('Choose locality or district sample scope.');
 if(input.label!==undefined&&(input.label.trim().length<2||input.label.length>100))throw Error('Use a property name between 2 and 100 characters.');
 const areas=[input.carpetArea,input.builtArea,input.superArea];
 if(areas.some(v=>v!==undefined)){if(isLand(input.propertyType))throw Error('Land does not use carpet or built-up areas.');if(areas.some(v=>v===undefined))throw Error('Supply all three area measurements.');areaMetrics({carpet:input.carpetArea!,built:input.builtArea!,superArea:input.superArea!,rate:1});}
 if(!propertyTypes.includes(input.propertyType))throw Error('Choose a property type.');
 if(!Object.hasOwn(units,input.unit)||!Number.isFinite(input.area)||input.area<=0||input.area*units[input.unit]>10000000)throw Error('Enter a valid positive area up to 10,000,000 sq ft.');
 if(!['asking','transaction','guideline'].includes(input.category))throw Error('Select a price category.');
 if(!allowedBases(input.propertyType).includes(input.basis))throw Error('Area basis does not match property type.');
 if(input.manualRate!==undefined&&(!Number.isFinite(input.manualRate)||input.manualRate<=0||input.manualRate>1000000))throw Error('Enter a positive user rate up to ₹10,00,000/sq ft.');
 if(input.acquisitionCost!==undefined&&(!Number.isFinite(input.acquisitionCost)||input.acquisitionCost<0))throw Error('Acquisition cost cannot be negative.');
 if(input.acquisitionDate&&(!/^\d{4}-\d{2}-\d{2}$/.test(input.acquisitionDate)||!Number.isFinite(Date.parse(input.acquisitionDate))||input.acquisitionDate>new Date().toISOString().slice(0,10)))throw Error('Enter a valid acquisition date in the past.');
 return loc;
}
export function calculate(input:Inputs){
 const loc=validate(input),areaSqft=input.area*units[input.unit];
 const placeIds=new Set(localities.filter(l=>input.priceScope==='district'?l.districtId===loc.districtId:l.id===loc.id).map(l=>l.id));
 const evidence=usablePrices(currentPrices.filter(o=>placeIds.has(o.localityId)&&o.propertyType===input.propertyType&&o.basis===input.basis&&o.category===input.category));
 const summary=summarizePrices(evidence);
 const prediction=input.useModel&&input.category==='asking'?predictAskingRate(loc.districtId,input.propertyType,input.basis,areaSqft):null;
 const used=input.manualRate??(input.useModel?prediction?.rate??null:summary?.representative??null);
 return {inputs:input,locality:loc,areaSqft,rate:used,total:used===null?null:used*areaSqft,summary,scope:input.priceScope==='district'?'Explicit district sample approximation':'Exact locality sample',category:input.manualRate!==undefined?'User scenario (unverified)':prediction?.category||input.category,method:input.manualRate!==undefined?'User rate × applicable area':input.useModel?prediction?.method||'Model unavailable for selected inputs':'(Minimum + source average + maximum) ÷ 3 × applicable area',modelVersion:input.manualRate===undefined&&prediction?prediction.modelVersion:null,datasetVersion,evidence,range:!input.useModel&&input.manualRate===undefined&&summary?[summary.min,summary.max]:null,status:input.manualRate!==undefined?'scenario':prediction?'model':used===null?'unavailable':'sample',createdAt:new Date().toISOString()};
}
export type Result=ReturnType<typeof calculate>;

export function areaMetrics(a:{carpet:number;built:number;superArea:number;rate:number}){
 for(const v of Object.values(a))if(!Number.isFinite(v)||v<=0||v>10000000)throw Error('Enter positive values up to 10,000,000.');
 if(a.carpet>a.built||a.built>a.superArea)throw Error('Carpet area must be ≤ built-up area ≤ super built-up area.');
 return {...a,loading:(a.superArea-a.carpet)/a.carpet*100,efficiency:a.carpet/a.superArea*100,wallArea:a.built-a.carpet,commonArea:a.superArea-a.built,total:a.rate*a.superArea,usableCost:a.rate*a.superArea/a.carpet,rateSqm:a.rate*units['sq m']};
}
