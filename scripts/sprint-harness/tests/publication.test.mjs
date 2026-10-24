import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {hashFile,sha,atomicJSON} from '../evidence-runner.mjs';

const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const scratch=fs.mkdtempSync(path.join(os.tmpdir(),'sprint-publication-test-'));
after(()=>fs.rmSync(scratch,{recursive:true,force:true}));
const config={version:1,run_id:'reusable-test',generation:2,repository:'synthetic-owner/synthetic-repo',visibility:'public',base_ref:'trunk',branch_prefix:'sprint/reusable-test/',publisher:'test-controller',deadline:new Date(Date.now()+3600000).toISOString(),private_terms:['synthetic-private-marker'],gh_path:'/usr/bin/false',gh_sha256:hashFile('/usr/bin/false'),node_path:fs.realpathSync(process.execPath),node_sha256:hashFile(fs.realpathSync(process.execPath))};
const policyFile=path.join(scratch,'policy.json');atomicJSON(policyFile,config);
process.env.SPRINT_HARNESS_POLICY=policyFile;process.env.SPRINT_HARNESS_POLICY_SHA256=hashFile(policyFile);
const {policy}=await import('../policy.mjs');
const {git,scanHistory,scanText,canonicalRemote,DESTINATION_URL}=await import('../publication-scanner.mjs');
const {exportUnit}=await import('../exporter.mjs');
const {publishUnit,validatePublication,verifyPR}=await import('../publisher.mjs');
const {checkPush}=await import('../publication-hook.mjs');
let seq=0;
function fixture(){
 const dir=path.join(scratch,String(++seq));fs.mkdirSync(dir);const source=path.join(dir,'source');fs.mkdirSync(source);
 git(source,['init','--quiet']);git(source,['config','user.name','Synthetic Fixture']);git(source,['config','user.email','fixture@invalid.example']);git(source,['config','core.hooksPath',path.join(dir,'no-hooks')]);
 const commit=msg=>{git(source,['add','--all']);git(source,['-c','commit.gpgSign=false','commit','--quiet','-m',msg]);return git(source,['rev-parse','HEAD']).trim();};
 fs.writeFileSync(path.join(source,'README.md'),'Synthetic fixture\n');const base=commit('Base');fs.writeFileSync(path.join(source,'fix.js'),'export const fixed=true;\n');const head=commit('Fix');const tree=git(source,['rev-parse','HEAD^{tree}']).trim();
 const unit={id:'fix',branch:config.branch_prefix+'fix',head,tree,commits:[head],allowedPaths:['fix.js'],exceptions:[]};
 unit.export=path.join(dir,'export');exportUnit({source,destination:unit.export,unit,base,hooksPath:path.join(root,'qualified-hooks')});
 unit.title='Synthetic fix';unit.title_sha256=sha(unit.title);const body='Proposed for your review.\n';unit.body_file=path.join(dir,'body.md');fs.writeFileSync(unit.body_file,body);unit.body_sha256=sha(body);
 const tools=['publisher.mjs','publication-scanner.mjs','exporter.mjs','publication-hook.mjs','qualified-hooks/pre-push','evidence-runner.mjs','policy.mjs'].map(n=>({path:path.join(root,n),sha256:hashFile(path.join(root,n))}));
 const runtime_file=path.join(dir,'runtime.json');atomicJSON(runtime_file,{run_id:config.run_id,generation:config.generation,status:'RUNNING',deadline:config.deadline,leases:{publisher:config.publisher}});
 const gates={};for(const name of ['G-ALL','G-QP']){const file=path.join(dir,name+'.json');atomicJSON(file,{run_id:config.run_id,generation:config.generation,verdict:'PASS',base,accepted_heads:[head],tools});gates[name]={path:file,sha256:hashFile(file)};}
 const manifest={run_id:config.run_id,generation:config.generation,policy_sha256:policy.digest,repository:config.repository,visibility:config.visibility,draft:true,base_ref:config.base_ref,base,deadline:config.deadline,closeout_start:new Date(Date.now()+1800000).toISOString(),runtime_file,stop_file:path.join(dir,'STOP'),gates,tools,units:[unit]};
 let remote=null,pr=null,pushes=0,creates=0;
 const adapter={info:async()=>({repository:config.repository,visibility:config.visibility,push:true}),branch:async n=>n===config.base_ref?base:remote,prs:async()=>pr?[pr]:[],pr:async()=>pr,push:async()=>{pushes++;remote=head;throw Error('synthetic lost push response');},create:async(u,b)=>{creates++;pr={number:1,repository:config.repository,headRepository:config.repository,base:config.base_ref,baseSha:base,head:u.branch,sha:u.head,draft:true,state:'open',title:u.title,body:b,url:'https://github.com/'+config.repository+'/pull/1'};throw Error('synthetic lost create response');},pause:async()=>{}};
 return {dir,source,base,head,unit,manifest,body,commit,adapter,stateFile:path.join(dir,'state.json'),counts:()=>({pushes,creates}),setPR:p=>{pr=p;remote=head;}};
}
test('lost push/create responses reconcile without duplicate PRs',async()=>{
 const f=fixture();const first=await publishUnit(f);assert.equal(first.status,'PR-verified');const second=await publishUnit(f);assert.equal(second.status,'PR-verified');assert.deepEqual(f.counts(),{pushes:1,creates:1});
});
test('wrong repository remote is rejected',()=>assert.throws(()=>canonicalRemote('https://github.com/wrong/repo.git'),/destination/));
test('configured private terms and credentials are rejected',()=>{
 assert.throws(()=>scanText('synthetic-private-marker','fixture'),/private term/);
 assert.throws(()=>scanText('github'+'_pat_'+'A'.repeat(30),'fixture'),/credential/);
 assert.throws(()=>scanText('/'+'Users/'+'synthetic/private','fixture'),/private-path/);
 assert.equal(scanText('Interlateral public documentation','fixture'),true);
});
test('old run or widened publication policy is rejected',()=>{
 const f=fixture();assert.throws(()=>validatePublication({...f.manifest,run_id:'old-run'}),/scope/);assert.throws(()=>validatePublication({...f.manifest,visibility:'private'}),/scope/);assert.throws(()=>validatePublication({...f.manifest,policy_sha256:'0'.repeat(64)}),/scope/);
});
test('STOP prevents external adapter calls',async()=>{
 const f=fixture();fs.writeFileSync(f.manifest.stop_file,'STOP');await assert.rejects(publishUnit(f),/STOP/);assert.deepEqual(f.counts(),{pushes:0,creates:0});
});
test('unrelated existing PR is not adopted',async()=>{
 const f=fixture();f.setPR({state:'open',draft:true});await assert.rejects(publishUnit(f),/not established as run-owned/);assert.deepEqual(f.counts(),{pushes:0,creates:0});
});
test('earlier private history is rejected even after deletion at tip',()=>{
 const f=fixture();fs.mkdirSync(path.join(f.source,'work'));fs.writeFileSync(path.join(f.source,'work','private.md'),'synthetic private file');const bad=f.commit('Add excluded file');fs.unlinkSync(path.join(f.source,'work','private.md'));const tip=f.commit('Remove excluded tip');
 assert.throws(()=>scanHistory({repo:f.source,base:f.base,head:tip,acceptedCommits:[f.head,bad,tip],allowedPaths:['fix.js','work/private.md'],destinationUrl:DESTINATION_URL}),/excluded tree/);
});
test('push hook accepts only exact configured branch and base',()=>{
 const f=fixture();const p={policy_sha256:policy.digest,branch:f.unit.branch,base:f.base,head:f.head,acceptedCommits:[f.head],allowedPaths:['fix.js']};
 const refs=[{ref:'refs/heads/'+config.base_ref,sha:f.base}];const updates=[['HEAD',f.head,'refs/heads/'+f.unit.branch,'0'.repeat(40)]];
 assert.equal(checkPush({repo:f.unit.export,remote:'origin',url:DESTINATION_URL,updates,policy:p,remoteRefs:refs}).status,'PASS');
 assert.throws(()=>checkPush({repo:f.unit.export,remote:'origin',url:DESTINATION_URL,updates:[['HEAD',f.head,'refs/heads/'+config.base_ref,'0'.repeat(40)]],policy:p,remoteRefs:refs}),/unapproved ref/);
});
test('wrong PR readback cannot pass',()=>{
 const f=fixture();assert.throws(()=>verifyPR({url:'https://github.com/wrong/repo/pull/1'},f.manifest,f.unit,f.body),/readback/);
});
test('publication module rejects missing pinned policy',()=>{
 const env={...process.env};delete env.SPRINT_HARNESS_POLICY;delete env.SPRINT_HARNESS_POLICY_SHA256;
 const r=spawnSync(process.execPath,[path.join(root,'publisher.mjs')],{env,encoding:'utf8'});assert.notEqual(r.status,0);assert.match(r.stderr,/pinned sprint publication policy required/);
});
