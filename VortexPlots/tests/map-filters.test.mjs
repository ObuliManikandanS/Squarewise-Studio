import test from 'node:test';
import assert from 'node:assert/strict';
import {filterPrices} from '../lib/price-filters.ts';
import {districtPriceGroups} from '../lib/district-prices.ts';
import {summarizePrices} from '../lib/price-summary.ts';
import {currentPrices,localities,districts,allowedBases} from '../app/data.ts';
const now=Date.parse('2026-09-28T12:00:00Z');
test('map district cards and table summaries use identical compatible populations',()=>{
 for(const checkedOnly of [true,false])for(const [propertyType,basis] of [['Apartment','Built-up area'],['Land','Plot area']]){
  const rows=filterPrices(currentPrices,{propertyType,basis,category:'asking',checkedOnly,days:30},now);
  for(const d of districts){
   const ids=new Set(localities.filter(l=>l.districtId===d.id).map(l=>l.id));
   const summary=summarizePrices(rows.filter(r=>ids.has(r.localityId)),now);
   const group=districtPriceGroups(d.id,rows,now)[0];
   assert.equal(group?.representative,summary?.representative);
   assert.equal(group?.count,summary?.count);
   assert.equal(group?.average,summary?.average);
  }
 }
});
test('source category, freshness and checked status cannot leak into map results',()=>{
 const base={...currentPrices[0],effectiveDate:'2026-09-20',screened:true,verified:false,reuseApproved:false};
 const rows=[base,{...base,id:'old',effectiveDate:'2026-06-01'},{...base,id:'checked',verified:true,reuseApproved:true}];
 const filters={propertyType:base.propertyType,basis:base.basis,category:base.category,days:30};
 assert.equal(filterPrices(rows,filters,now).length,2);
 assert.deepEqual(filterPrices(rows,{...filters,checkedOnly:true},now).map(r=>r.id),['checked']);
 assert.equal(filterPrices(rows,{...filters,category:'guideline'},now).length,0);
 assert.equal(filterPrices(rows,{...filters,basis:'incompatible'},now).length,0);
 assert.deepEqual(allowedBases('Land'),['Plot area']);
 assert.ok(!allowedBases('Apartment').includes('Plot area'));
});
