import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawn,execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

export const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const controller=path.dirname(fileURLToPath(import.meta.url));
export function hashFile(p){return sha(fs.readFileSync(p));}
export function atomicJSON(file,obj){
  const temp=file+'.tmp-'+process.pid+'-'+crypto.randomBytes(5).toString('hex');
  fs.writeFileSync(temp,JSON.stringify(obj,null,2)+'\n',{flag:'wx',mode:0o600});
  fs.renameSync(temp,file);
}
export function validatePlan(plan){
  if(plan.version!==1 || !/^[a-zA-Z0-9._-]+$/.test(plan.run_id)||!Number.isInteger(plan.generation)||plan.generation<1)throw Error('invalid run identity');
  if(!path.isAbsolute(plan.cwd)||!path.isAbsolute(plan.executable)||!Array.isArray(plan.argv)||plan.argv.some(a=>typeof a!=='string'))throw Error('invalid argv/cwd');
  if(!Number.isFinite(Date.parse(plan.deadline))||!Number.isInteger(plan.timeout_ms)||plan.timeout_ms<1||plan.timeout_ms>3600000)throw Error('invalid deadline');
  if(!path.isAbsolute(plan.stop_file)||!Array.isArray(plan.inputs)||!plan.inputs.length)throw Error('missing pinned inputs');
  if(!['node-test','text','expected-red'].includes(plan.oracle?.kind))throw Error('oracle required');
  if(plan.oracle.kind==='text'&&(!Array.isArray(plan.oracle.required)||!plan.oracle.required.length))throw Error('empty text oracle');
  if(['node-test','expected-red'].includes(plan.oracle.kind)&&(!Array.isArray(plan.oracle.names)||!plan.oracle.names.length||plan.oracle.names.some(n=>typeof n!=='string'||!n)||new Set(plan.oracle.names).size!==plan.oracle.names.length))throw Error('exact test identities required');
  if(plan.oracle.kind==='expected-red'&&(!plan.oracle.required||!plan.oracle.testName||!Number.isInteger(plan.oracle.exit)||plan.oracle.exit===0))throw Error('red oracle incomplete');
  for(const input of plan.inputs)if(!path.isAbsolute(input.path)||!/^[0-9a-f]{64}$/.test(input.sha256))throw Error('invalid pin');
  const executable=fs.realpathSync(plan.executable);
  if(executable!==fs.realpathSync(process.execPath))throw Error('executable not allowlisted Node runtime');
  if(plan.executable_sha256!==hashFile(executable))throw Error('runtime hash mismatch');
  for(const input of plan.inputs)if(hashFile(input.path)!==input.sha256)throw Error('source hash mismatch: '+input.path);
  // The sealed plan selects reviewed inputs, never arbitrary Node evaluation/preloads.
  const pinned=p=>plan.inputs.some(i=>fs.realpathSync(i.path)===fs.realpathSync(p));
  if(['node-test','expected-red'].includes(plan.oracle.kind)){
    if(plan.argv[0]!=='--test'||plan.argv[1]!=='--test-concurrency=1'||plan.argv.length<3)throw Error('unauthorized test command');
    for(const arg of plan.argv.slice(2)){if(arg.startsWith('-')||!arg.endsWith('.test.js')&&!arg.endsWith('.test.mjs')||!pinned(path.resolve(plan.cwd,arg)))throw Error('unpinned or unauthorized test program');}
    if(!pinned(path.join(controller,'node-reporter.mjs')))throw Error('reporter pin required');
  }else{
    const program=path.resolve(plan.cwd,plan.argv[0]||'');
    if(plan.argv[0]?.startsWith('-')||!pinned(program))throw Error('unpinned or unauthorized program');
  }
  return executable;
}
export function oracleResult(output,exit,oracle){
  if(exit!==0&&oracle.kind!=='expected-red')return {ok:false,reason:'command failed'};
  if(oracle.kind==='text')return {ok:oracle.required.every(s=>output.includes(s)),kind:'text'};

  try{
    const events=output.trim().split('\n').map(l=>JSON.parse(l));
    if(events.some(e=>typeof e.type!=='string'||!e.type.startsWith('test:')||!e.data))throw Error('invalid event');
    const done=events.filter(e=>['test:pass','test:fail'].includes(e.type));
    const names=done.map(e=>e.data.name), exact=JSON.stringify([...names].sort())===JSON.stringify([...oracle.names].sort());
    const skipped=done.some(e=>e.data.skip||e.data.todo);
    const failures=done.filter(e=>e.type==='test:fail');
    if(oracle.kind==='expected-red'){
      const intended=failures.filter(e=>e.data.name===oracle.testName);
      const cause=intended[0]?.data?.details?.error?.cause||intended[0]?.data?.details?.error;
      return {ok:exit===oracle.exit&&exact&&!skipped&&failures.length===1&&intended.length===1&&cause?.code==='ERR_ASSERTION'&&String(cause.message).includes(oracle.required),names,fail:failures.length,kind:'expected-red'};
    }
    return {ok:exit===0&&exact&&!skipped&&done.length>0&&!failures.length,count:done.length,pass:done.length-failures.length,fail:failures.length,names};
  }catch{return {ok:false,reason:'invalid structured test events'};}
}
export function validateRecord(record){
 if(record.version!==1||!record.run_id||!Number.isInteger(record.generation)||!Array.isArray(record.argv)||!record.argv.length||!path.isAbsolute(record.cwd)||!/^[a-f0-9]{64}$/.test(record.plan_sha256)||!/^[a-f0-9]{64}$/.test(record.runner_sha256)||!Array.isArray(record.inputs)||!record.inputs.length||!Number.isFinite(Date.parse(record.started_at))||!['RUNNING','PASS','FAIL'].includes(record.status))throw Error('manifest schema violation');
 if(record.status==='PASS'&&(record.capture_status!=='ok'||!Number.isInteger(record.command_exit)||record.command_exit<0||record.command_exit>255||record.signal||record.termination||record.spawn_error||record.command_exit!==0&&record.oracle?.kind!=='expected-red'||!record.oracle?.ok||!/^[a-f0-9]{64}$/.test(record.log_sha256)||!Number.isFinite(Date.parse(record.ended_at))))throw Error('invalid PASS manifest');
 return record;
}
export async function runPlan({planPath,planHash,outDir,label}){
  if(!/^[a-zA-Z0-9._-]+$/.test(label))throw Error('invalid label');
  const raw=fs.readFileSync(planPath);
  if(sha(raw)!==planHash)throw Error('plan hash mismatch');
  const plan=JSON.parse(raw); const executable=validatePlan(plan);
  const deadline=Math.min(Date.parse(plan.deadline),Date.now()+plan.timeout_ms);
  if(Date.now()>=deadline||fs.existsSync(plan.stop_file))throw Error('deadline or STOP before start');
  fs.mkdirSync(outDir,{recursive:true});
  const recordDir=path.join(outDir,label);fs.mkdirSync(recordDir); // exclusive; never overwrite
  const log=path.join(recordDir,'command.log'), manifest=path.join(recordDir,'MANIFEST.json');
  const argv=['node-test','expected-red'].includes(plan.oracle.kind)?['--test-reporter='+path.join(controller,'node-reporter.mjs'),...plan.argv]:plan.argv;
  const record={version:1,run_id:plan.run_id,generation:plan.generation,label,started_at:new Date().toISOString(),argv:[executable,...argv],cwd:plan.cwd,plan_path:planPath,plan_sha256:planHash,runner_sha256:hashFile(fileURLToPath(import.meta.url)),runtime:process.version,runtime_sha256:hashFile(executable),inputs:plan.inputs,command_exit:null,capture_status:'pending',status:'RUNNING',deadline:plan.deadline};
  let fd;
  try{fd=fs.openSync(log,'wx',0o600);atomicJSON(manifest,validateRecord(record));}
  catch(e){if(fd!==undefined)fs.closeSync(fd);throw e;}
  let output='',captureError=null,termination=null,killTimer=null,finished=false,child;
  const max=plan.max_log_bytes||10000000;
  const env={PATH:path.dirname(executable)+':/usr/bin:/bin',TMPDIR:process.env.TMPDIR||'/tmp',LANG:'en_US.UTF-8',NO_COLOR:'1'};
  const stop=reason=>{
    if(termination)return;termination=reason;
    try{process.kill(-child.pid,'SIGTERM');}catch{}
    killTimer=setTimeout(()=>{try{process.kill(-child.pid,'SIGKILL');}catch{}},500);
  };
  const onSignal=()=>{if(child)stop('controller-interrupted');};
  process.on('SIGTERM',onSignal);process.on('SIGINT',onSignal);
  try{
    child=spawn(executable,argv,{cwd:plan.cwd,env,detached:true,stdio:['ignore','pipe','pipe']});
    record.child_pid=child.pid;atomicJSON(manifest,record);
    const consume=buf=>{
      if(captureError)return;
      try{
        if(Buffer.byteLength(output)+buf.length>max)throw Error('log bound exceeded');
        fs.writeSync(fd,buf);output+=buf.toString('utf8');
      }catch(e){captureError=e.message;stop('capture-failure');}
    };
    child.stdout.on('data',consume);child.stderr.on('data',consume);
    const timer=setInterval(()=>{if(Date.now()>=deadline)stop('timeout');else if(fs.existsSync(plan.stop_file))stop('STOP');},50);
    const result=await new Promise(resolve=>{child.once('error',e=>resolve({code:null,signal:null,error:e.message}));child.once('close',(code,signal)=>resolve({code,signal}));});
    clearInterval(timer);if(killTimer)clearTimeout(killTimer);
    if(termination){try{process.kill(-child.pid,'SIGKILL');}catch{}}
    record.command_exit=result.code;record.signal=result.signal;record.spawn_error=result.error;
    record.termination=termination;
    fs.fsyncSync(fd);fs.closeSync(fd);fd=undefined;
    for(const input of plan.inputs)if(hashFile(input.path)!==input.sha256)throw Error('input changed during command: '+input.path);
    record.ended_at=new Date().toISOString();record.log_sha256=hashFile(log);
    record.oracle=oracleResult(output,result.code,plan.oracle);
    record.capture_status=captureError?'failed':'ok';
    record.status=!captureError&&!termination&&!result.error&&record.oracle.ok?'PASS':'FAIL';
    atomicJSON(manifest,validateRecord(record));
    finished=true;
    return record;
  }catch(e){
    if(child)stop('capture-failure');
    record.capture_status='failed';record.status='FAIL';record.capture_error=e.message;record.ended_at=new Date().toISOString();
    try{atomicJSON(manifest,record);}catch{}
    throw e;
  }finally{
    process.removeListener('SIGTERM',onSignal);process.removeListener('SIGINT',onSignal);
    if(fd!==undefined)try{fs.closeSync(fd);}catch{}
    if(!finished&&child)try{process.kill(-child.pid,'SIGKILL');}catch{}
  }
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===path.resolve(process.argv[1])){
 const [planPath,planHash,outDir,label]=process.argv.slice(2);
 try{const r=await runPlan({planPath,planHash,outDir,label});console.log(JSON.stringify({label:r.label,status:r.status,command_exit:r.command_exit,capture_status:r.capture_status,oracle:r.oracle}));process.exitCode=r.status==='PASS'?0:1;}
 catch(e){console.error(JSON.stringify({status:'FAIL',capture_status:'failed',error:e.message}));process.exitCode=2;}
}
