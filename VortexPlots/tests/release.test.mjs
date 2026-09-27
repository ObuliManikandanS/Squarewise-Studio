import test from 'node:test';
import assert from 'node:assert/strict';
import {calculate,observations,areaMetrics} from '../app/data.ts';
test('sparse asking records do not become a supported valuation',()=>{const o=observations[0];const r=calculate({localityId:o.localityId,propertyType:o.propertyType,basis:o.basis,category:o.category,area:1000,unit:'sq ft'});assert.equal(r.evidence.length,2);assert.equal(r.status,'unavailable');assert.equal(r.rate,null);assert.equal(r.total,null)});
test('agricultural land uses plot area and acreage conversion',()=>{const input={localityId:'chennai--adyar',propertyType:'Agricultural land',basis:'Plot area',category:'asking',area:1,unit:'acre',manualRate:100};assert.equal(calculate(input).total,4356000);assert.throws(()=>calculate({...input,basis:'Super built-up area'}))});
test('building scenarios preserve quoted area basis',()=>{for(const basis of ['Carpet area','Built-up area','Super built-up area']){const r=calculate({localityId:'chennai--adyar',propertyType:'Apartment',basis,category:'asking',area:800,unit:'sq ft',manualRate:6000});assert.equal(r.total,4800000);assert.equal(r.inputs.basis,basis)}});
