import test from 'node:test';
import assert from 'node:assert/strict';
import {calculate} from '../app/data.ts';
const initial={localityId:'chennai--adyar',propertyType:'Land',area:1200,unit:'sq ft',basis:'Plot area',category:'asking'};
test('default sample and Ridge gaps give distinct reasons and explicit recovery works',()=>{
 const sample=calculate(initial);
 assert.equal(sample.rate,null);assert.match(sample.availabilityMessage,/Adyar/);
 const ridge=calculate({...initial,useModel:true});
 assert.equal(ridge.rate,null);assert.match(ridge.availabilityMessage,/3,045/);assert.match(ridge.scope,/District-level Ridge/);
 const recovered=calculate({...initial,useModel:true,area:ridge.modelSupport.minArea});
 assert.equal(recovered.status,'model');assert.ok(recovered.rate>0);assert.equal(recovered.availabilityMessage,null);
 const district=calculate({...initial,priceScope:'district'});
 assert.equal(district.status,'sample');assert.ok(district.rate>0);assert.equal(district.modelVersion,null);
});
test('switching pricing modes never retains a model rate or labels scenario as a model',()=>{
 const input={...initial,area:3045,priceScope:'district'};
 const model=calculate({...input,useModel:true});
 const sample=calculate({...input,useModel:false,manualRate:undefined});
 assert.equal(sample.rate,sample.summary.representative);assert.equal(sample.modelVersion,null);assert.notEqual(sample.rate,model.rate);
 const scenario=calculate({...input,useModel:true,manualRate:5000});
 assert.equal(scenario.rate,5000);assert.equal(scenario.modelVersion,null);assert.match(scenario.scope,/User-entered/);
 assert.match(calculate({...input,useModel:true,category:'guideline'}).availabilityMessage,/asking prices only/);
});
