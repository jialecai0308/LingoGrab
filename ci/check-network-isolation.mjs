import assert from 'node:assert/strict';
import http from 'node:http';
import {createRequire} from 'node:module';
import {isolatePage} from './browser-fixtures.mjs';
const {chromium}=createRequire(import.meta.url)('playwright');
const server=http.createServer((req,res)=>res.end('<!doctype html><title>CI isolation</title>'));
await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
try{
 browser=await chromium.launch({headless:true});
 const page=await browser.newPage();await isolatePage(page);
 await page.goto('http://127.0.0.1:'+server.address().port);
 const result=await page.evaluate(async()=>{
   navigator.sendBeacon('https://ci-egress.invalid/api/track',new Blob(['synthetic']));
   let blocked=false;try{await fetch('https://ci-egress.invalid/publish',{method:'POST',body:'synthetic'});}catch{blocked=true;}
   return {beaconDropped:window.__ciDroppedBeacons===1,externalWriteBlocked:blocked,loopbackAccessible:(await fetch('/')).ok};
 });
 assert.deepEqual(result,{beaconDropped:true,externalWriteBlocked:true,loopbackAccessible:true});
 console.log(JSON.stringify(result));
}finally{await browser?.close();await new Promise(r=>server.close(r));}
