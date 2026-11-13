import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../src';
import {database} from './helpers/database';
test('production health reports schema readiness and deployed revision without disclosing credentials',async()=>{
 const f=database();try{const response=await app.request('https://api.example.test/health',{}, {DB:f.db,BUILD_SHA:'release-fixture',ENVIRONMENT:'production',JWT_SECRET:'private-fixture'} as any);assert.equal(response.status,200);const data=await response.json() as any;assert.equal(data.course_schema,4);assert.equal(data.release,'release-fixture');assert.equal(JSON.stringify(data).includes('private-fixture'),false);}finally{f.sqlite.close();}
});
test('production health fails closed before mandatory recovery migrations',async()=>{
 const f=database();try{f.sqlite.exec('DROP TABLE password_resets');const response=await app.request('https://api.example.test/health',{}, {DB:f.db,ENVIRONMENT:'production'} as any);assert.equal(response.status,503);}finally{f.sqlite.close();}
});
