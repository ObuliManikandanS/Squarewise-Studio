import test from 'node:test';
import assert from 'node:assert/strict';
import {api} from '../lib/api-client.ts';
test('API errors handle gateway HTML, malformed JSON and null without leaking parser details',async t=>{
 for(const [body,status,message]of [['<html>upstream failed</html>',502,'temporarily unavailable'],['not json',200,'unexpected response'],['null',400,'Could not complete'],['{"error":"Please sign in."}',401,'Please sign in.']]){
  t.mock.method(globalThis,'fetch',async()=>new Response(body,{status}));
  await assert.rejects(api('/api/dashboard'),new RegExp(message));
  t.mock.restoreAll();
 }
});
