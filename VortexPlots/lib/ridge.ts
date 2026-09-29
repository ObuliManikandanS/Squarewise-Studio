import model from '../data/ridge-model.json' with {type:'json'};
export const ridgeModel=model;
export function ridgeSupport(districtId:string,propertyType:string,basis:string,area:number){
 const limit=model.limits.find(g=>g.districtId===districtId&&g.propertyType===propertyType&&g.basis===basis);
 const format=(n:number)=>n.toLocaleString('en-IN',{maximumFractionDigits:2});
 const reason=!model.beatsMedianBaseline?'The model is unavailable because its validation requirement is not met.':!limit||limit.count<3?'Ridge requires at least 3 compatible training records for this district, property type and area basis.':!Number.isFinite(area)||area<=0?'Enter a valid positive property area.':area<limit.minArea||area>limit.maxArea?`Ridge supports areas from ${format(limit.minArea)} to ${format(limit.maxArea)} sq ft for this selection. Your area is ${format(area)} sq ft.`:null;
 return {supported:reason===null,reason,count:limit?.count??0,minArea:limit?.minArea??null,maxArea:limit?.maxArea??null};
}
export function predictAskingRate(districtId:string,propertyType:string,basis:string,area:number){
 const limit=model.limits.find(g=>g.districtId===districtId&&g.propertyType===propertyType&&g.basis===basis);
 if(!ridgeSupport(districtId,propertyType,basis,area).supported||!limit)return null;
 const values=[districtId,propertyType,basis];let offset=0,log=model.intercept;
 for(let i=0;i<model.categories.length;i++){const index=model.categories[i].indexOf(values[i]);if(index<0)return null;log+=model.coefficients[offset+index];offset+=model.categories[i].length;}
 log+=model.coefficients[offset]*(Math.log(area)-model.mean)/model.scale;
 const rate=Math.exp(log);return Number.isFinite(rate)&&rate>0?{rate,total:rate*area,modelVersion:model.version,sampleSize:limit.count,confidence:'Low',category:'Model-estimated asking price (experimental)',method:model.algorithm}:null;
}
