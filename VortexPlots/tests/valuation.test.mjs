import assert from 'node:assert/strict';
import test from 'node:test';
import {calculate,districts,localities} from '../app/data.ts';
const base={localityId:'chennai--adyar',propertyType:'Land',area:1,unit:'acre',basis:'Plot area',category:'asking'};
test('one acre scenario converts exactly without manufacturing an estimate',()=>{const r=calculate({...base,manualRate:100});assert.equal(r.areaSqft,43560);assert.equal(r.total,4356000);assert.equal(r.status,'scenario');assert.equal(r.modelVersion,null);assert.equal(r.range,null)});
test('no evidence produces null, never zero or a district fallback',()=>{for(const l of localities){const r=calculate({...base,localityId:l.id});assert.equal(r.total,null);assert.equal(r.rate,null)}});
test('invalid inputs and property basis rejected',()=>{for(const patch of [{area:0},{area:NaN},{manualRate:-1},{unit:'invalid'},{localityId:'missing'},{propertyType:'Apartment'}])assert.throws(()=>calculate({...base,...patch}))});
test('directory has 38 unique districts and correct Chromepet parent',()=>{assert.equal(new Set(districts.map(d=>d.id)).size,38);assert.equal(localities.find(l=>l.name==='Chromepet').district,'Chengalpattu');assert.equal(new Set(localities.map(l=>l.id)).size,localities.length)});

import {areaMetrics} from '../app/data.ts';
test('loading uses carpet denominator and usable cost uses carpet area',()=>{const r=areaMetrics({carpet:800,built:960,superArea:1200,rate:6000});assert.equal(r.loading,50);assert.equal(r.usableCost,9000);assert.equal(r.commonArea,240);assert.equal(r.total,7200000);assert.ok(Math.abs(r.efficiency-66.6666667)<0.00001);assert.ok(Math.abs(r.rateSqm-64583.46250026)<0.00001)});
test('inconsistent area inputs cannot produce plausible-looking results',()=>{for(const patch of [{carpet:1300},{built:700},{rate:Infinity},{superArea:0}])assert.throws(()=>areaMetrics({carpet:800,built:960,superArea:1200,rate:6000,...patch}))});
