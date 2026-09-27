import model from '../data/ridge-model.json' with {type:'json'};
export const ridgeModel=model;
export function predictAskingRate(districtId:string,propertyType:string,basis:string,area:number){
 const limit=model.limits.find(g=>g.districtId===districtId&&g.propertyType===propertyType&&g.basis===basis);
 if(!model.beatsMedianBaseline||!limit||limit.count<3||!Number.isFinite(area)||area<limit.minArea||area>limit.maxArea)return null;
 const values=[districtId,propertyType,basis];let offset=0,log=model.intercept;
 for(let i=0;i<model.categories.length;i++){const index=model.categories[i].indexOf(values[i]);if(index<0)return null;log+=model.coefficients[offset+index];offset+=model.categories[i].length;}
 log+=model.coefficients[offset]*(Math.log(area)-model.mean)/model.scale;
 const rate=Math.exp(log);return Number.isFinite(rate)&&rate>0?{rate,total:rate*area,modelVersion:model.version,sampleSize:limit.count,confidence:'Low',category:'Model-estimated asking price (experimental)',method:model.algorithm}:null;
}
