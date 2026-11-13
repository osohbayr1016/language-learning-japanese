import test from 'node:test';
import assert from 'node:assert/strict';
import {inflateSync} from 'node:zlib';
import {checkpoint} from '../release-preflight.mjs';
import {verifyApi,verifyWeb} from '../smoke-production.mjs';
import {iconPng,crc32} from '../build-pwa.mjs';
const bookmark='00000085-0000024c-00004c6d-8e61117bf38d7adb71b934ebbf891683';
test('release preflight verifies dedicated DB, signing-secret presence and a restore point using GET only',async()=>{
 const calls=[];const fetcher=async(url,init)=>{assert.equal(init.method,undefined);assert.equal(init.headers.Authorization,'Bearer fixture-only');calls.push(url);return Response.json({success:true,result:url.endsWith('/secrets')?[{name:'JWT_SECRET'}]:url.endsWith('/bookmark')?{bookmark}:{name:'nihongo-mn-db'}});};
 const point=await checkpoint({token:'fixture-only',fetcher});assert.equal(point.bookmark,bookmark);assert.equal(calls.length,3);assert.equal(JSON.stringify(point).includes('fixture-only'),false);
});
test('release preflight blocks missing auth and a different database before migration',async()=>{
 await assert.rejects(checkpoint(),/CLOUDFLARE_API_TOKEN/);
 await assert.rejects(checkpoint({token:'fixture',fetcher:async()=>Response.json({success:true,result:{name:'different-course'}})}),/identity/);
 let count=0;await assert.rejects(checkpoint({token:'fixture',fetcher:async()=>Response.json({success:true,result:++count===1?{name:'nihongo-mn-db'}:[]})}),/JWT_SECRET/);
});
test('release preflight rejects provider permission failures and absent restore bookmarks',async()=>{
 await assert.rejects(checkpoint({token:'fixture',fetcher:async()=>Response.json({success:false},{status:403})}),/denied/);
 let n=0;await assert.rejects(checkpoint({token:'fixture',fetcher:async()=>Response.json({success:true,result:++n===1?{name:'nihongo-mn-db'}:n===2?[{name:'JWT_SECRET'}]:{}})}),/restore point/);
});
test('API smoke rejects a missing schema and a stale deployed commit',async()=>{
 await assert.rejects(verifyApi({fetcher:async()=>Response.json({status:'ok',course_schema:0})}),/schema/);
 await assert.rejects(verifyApi({sha:'expected',fetcher:async()=>Response.json({status:'ok',course_schema:4,release:'old'})}),/commit/);
 assert.equal((await verifyApi({sha:'expected',fetcher:async()=>Response.json({status:'ok',course_schema:4,release:'expected'})})).release,'expected');
});
test('web smoke checks the committed release, guided shell, PWA and private-cache boundary',async()=>{
 const fixture={'/release.json':{sha:'release'},'/course':'<html lang="mn"><script src="/assets/app.js"></script>','/manifest.webmanifest':{start_url:'/course'},'/offline-manifest.json':{files:['/dictionary/kanji.json']}};
 const fetcher=async url=>{const value=fixture[new URL(url).pathname];return typeof value==='string'?new Response(value):Response.json(value);};
 await verifyWeb({base:'https://example.test',sha:'release',fetcher});
 fixture['/offline-manifest.json'].files.push('/api/user/course');await assert.rejects(verifyWeb({base:'https://example.test',sha:'release',fetcher}),/Offline pack/);
});
test('installable PNG icons decode to their advertised dimensions with valid PNG checksums',()=>{
 for(const size of [192,512]){
  const data=iconPng(size);assert.deepEqual([...data.subarray(0,8)],[137,80,78,71,13,10,26,10]);assert.equal(data.readUInt32BE(16),size);assert.equal(data.readUInt32BE(20),size);
  let at=8;const idat=[];while(at<data.length){const len=data.readUInt32BE(at),type=data.toString('ascii',at+4,at+8);assert.equal(data.readUInt32BE(at+8+len),crc32(data.subarray(at+4,at+8+len)));if(type==='IDAT')idat.push(data.subarray(at+8,at+8+len));at+=12+len;}
  assert.equal(inflateSync(Buffer.concat(idat)).length,(size*4+1)*size);
 }
});
