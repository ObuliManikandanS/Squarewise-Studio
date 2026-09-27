import assert from 'node:assert/strict';
import test from 'node:test';
import {districtPriceGroups} from '../lib/district-prices.ts';
import {observations,districts} from '../app/data.ts';
const now=Date.parse('2026-09-23T12:00:00Z');
test('district min/max uses source rates and names its sampled locality',()=>{const [g]=districtPriceGroups('chennai',observations,now);assert.equal(g.min,45900000/2601);assert.equal(g.max,60000000/3003);assert.deepEqual(g.places,['Anna Nagar']);assert.equal(g.count,2);assert.equal(g.sources.length,2)});
test('districts without evidence stay unavailable instead of inheriting Chennai rates',()=>{for(const d of districts.filter(d=>d.id!=='chennai'))assert.deepEqual(districtPriceGroups(d.id,observations,now),[])});
test('stale, future, unverified, unknown-locality and duplicate records are excluded',()=>{const o=observations[0];const bad=[{...o,id:'stale',effectiveDate:'2020-01-01'},{...o,id:'future',effectiveDate:'2030-01-01'},{...o,id:'unverified',verified:false},{...o,id:'unknown',localityId:'unknown'},{...o,id:'invalid',rate:NaN}];assert.deepEqual(districtPriceGroups('chennai',bad,now),[]);assert.equal(districtPriceGroups('chennai',[o,o],now)[0].count,1)});
test('different property types, bases and price categories never form a shared range',()=>{const o=observations[0];const rows=[o,{...o,id:'test-guideline',category:'guideline'},{...o,id:'test-land',propertyType:'Land',basis:'Plot area'},{...o,id:'test-carpet',basis:'Carpet area'}];assert.equal(districtPriceGroups('chennai',rows,now).length,4)});
