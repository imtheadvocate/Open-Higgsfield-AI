import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeKieResult, pollKieJobs } from '../packages/studio/src/lib/kie-jobs.mjs';
const response = (data, status=200) => ({ok:status===200,status,json:async()=>data});
const opts = {taskId:'test-task',apiKey:'test-only',interval:0,sleep:async()=>{},maxAttempts:3};
test('parses official serialized results and preserves all URLs',()=> {
  assert.deepEqual(normalizeKieResult({resultJson:'{"resultUrls":["https://example.com/a.png","https://example.com/b.png"]}'}).resultUrls,['https://example.com/a.png','https://example.com/b.png']);
});
test('waits then returns normalized result without resubmitting',async()=>{
  let calls=0; const result=await pollKieJobs({...opts,fetchImpl:async url=>{assert.match(url,/recordInfo/);return response({code:200,data:++calls===1?{state:'waiting'}:{state:'success',resultJson:'{"resultUrls":["https://example.com/a.png"]}'}})}});
  assert.equal(calls,2);assert.equal(result.url,'https://example.com/a.png');
});
for(const item of [{code:401,msg:'Unauthorized'}, {code:200,data:{state:'fail',failMsg:'failed'}}]) {
 test('stops immediately on terminal '+JSON.stringify(item),async()=>{let calls=0;await assert.rejects(pollKieJobs({...opts,fetchImpl:async()=>{calls++;return response(item)}}));assert.equal(calls,1)});
}
test('retries transient HTTP failure',async()=>{let calls=0;await pollKieJobs({...opts,fetchImpl:async()=>++calls===1?response({},503):response({code:200,data:{state:'success',resultUrls:['https://example.com/a']}})});assert.equal(calls,2)});
test('bounded timeout preserves task ID for recovery',async()=>{await assert.rejects(pollKieJobs({...opts,fetchImpl:async()=>response({code:200,data:{state:'waiting'}})}),/Resume task test-task/)});
test('malformed result is visible',()=>assert.throws(()=>normalizeKieResult({resultJson:'broken'}),/invalid result JSON/));
