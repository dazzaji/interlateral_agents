import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {runPlan,hashFile,atomicJSON,validateRecord,oracleResult} from '../evidence-runner.mjs';

const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const scratch=fs.mkdtempSync(path.join(os.tmpdir(),'sprint-evidence-test-'));
after(()=>fs.rmSync(scratch,{recursive:true,force:true}));
function fixture(name,body,overrides={}){
 const file=path.join(scratch,name+'.test.mjs');fs.writeFileSync(file,body);
 const plan={version:1,run_id:'synthetic-test',generation:1,cwd:scratch,executable:fs.realpathSync(process.execPath),executable_sha256:hashFile(fs.realpathSync(process.execPath)),argv:['--test','--test-concurrency=1',file],deadline:new Date(Date.now()+60000).toISOString(),timeout_ms:10000,stop_file:path.join(scratch,name+'.STOP'),inputs:[file,path.join(root,'node-reporter.mjs')].map(p=>({path:p,sha256:hashFile(p)})),oracle:{kind:'node-test',names:[name]},...overrides};
 const planPath=path.join(scratch,name+'.json');atomicJSON(planPath,plan);
 return {plan,planPath,planHash:hashFile(planPath),outDir:path.join(scratch,'evidence'),label:name};
}
test('real structured test passes with separate exit and capture fields',async()=>{
 const f=fixture('positive',"import test from 'node:test'; test('positive',()=>{});");
 const r=await runPlan(f);assert.equal(r.status,'PASS');assert.equal(r.command_exit,0);assert.equal(r.capture_status,'ok');assert.equal(r.oracle.count,1);
 await assert.rejects(runPlan(f)); // Never overwrite an existing evidence label.
});
test('real failed assertion is not success',async()=>{
 const f=fixture('negative',"import test from 'node:test'; import assert from 'node:assert/strict'; test('negative',()=>assert.equal(1,2));");
 const r=await runPlan(f);assert.equal(r.status,'FAIL');assert.notEqual(r.command_exit,0);assert.equal(r.capture_status,'ok');
});
test('capture overflow cannot report PASS',async()=>{
 const f=fixture('overflow',"import test from 'node:test'; test('overflow',()=>{});",{max_log_bytes:1});
 const r=await runPlan(f);assert.equal(r.status,'FAIL');assert.equal(r.capture_status,'failed');
});
test('STOP blocks execution before effects',async()=>{
 const f=fixture('stopped',"import test from 'node:test'; test('stopped',()=>{});");fs.writeFileSync(f.plan.stop_file,'STOP');await assert.rejects(runPlan(f),/STOP/);
});
test('source drift rejects execution',async()=>{
 const f=fixture('drift',"import test from 'node:test'; test('drift',()=>{});");fs.appendFileSync(f.plan.inputs[0].path,'\n// changed');await assert.rejects(runPlan(f),/source hash mismatch/);
});
test('wrong plan hash rejects execution',async()=>{
 const f=fixture('plan-drift',"import test from 'node:test'; test('plan-drift',()=>{});");await assert.rejects(runPlan({...f,planHash:'0'.repeat(64)}),/plan hash mismatch/);
});
test('empty and printed PASS do not prove expected tests ran',()=>{
 assert.equal(oracleResult('',0,{kind:'node-test',names:['x']}).ok,false);
 assert.equal(oracleResult('PASS',0,{kind:'node-test',names:['x']}).ok,false);
});
test('unsupported old project simulation mode is rejected',async()=>{
 const f=fixture('simulation',"import test from 'node:test'; test('simulation',()=>{});",{oracle:{kind:'simulation'}});await assert.rejects(runPlan(f),/oracle required/);
});
test('expired deadline blocks execution',async()=>{
 const f=fixture('expired',"import test from 'node:test'; test('expired',()=>{});",{deadline:new Date(0).toISOString()});await assert.rejects(runPlan(f),/deadline/);
});
test('synthetic PASS with failed capture is invalid',()=>{
 assert.throws(()=>validateRecord({version:1,run_id:'test',generation:1,argv:['node'],cwd:scratch,plan_sha256:'a'.repeat(64),runner_sha256:'a'.repeat(64),inputs:[{}],started_at:new Date().toISOString(),status:'PASS',capture_status:'failed'}),/invalid PASS/);
});
