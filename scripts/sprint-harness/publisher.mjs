import fs from 'node:fs';
import {policy,assertPolicy} from './policy.mjs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {atomicJSON,hashFile,sha} from './evidence-runner.mjs';
import {DESTINATION,DESTINATION_URL,canonicalRemote,git,scanHistory,verifyBody,assertDirectTransport} from './publication-scanner.mjs';
export function readSealed(file,digest){if(hashFile(file)!==digest)throw Error('sealed manifest drift');return JSON.parse(fs.readFileSync(file));}
export function validatePublication(m){
 assertPolicy();
 const toolRoot=path.dirname(fileURLToPath(import.meta.url));
 const requiredTools=['publisher.mjs','publication-scanner.mjs','exporter.mjs','publication-hook.mjs','qualified-hooks/pre-push','evidence-runner.mjs','policy.mjs'];
 if(!Array.isArray(m.tools)||requiredTools.some(n=>!m.tools.some(p=>p.path===path.join(toolRoot,n)&&p.sha256===hashFile(p.path))))throw Error('incomplete or changed publication toolchain');
 if(m.run_id!==policy.run_id||m.generation!==policy.generation||m.policy_sha256!==policy.digest||m.repository!==DESTINATION||m.visibility!==policy.visibility||m.draft!==true||m.base_ref!==policy.base_ref||!/^[a-f0-9]{40}$/.test(m.base)||!Number.isFinite(Date.parse(m.deadline))||Date.parse(m.deadline)>Date.parse(policy.deadline))throw Error('publication scope mismatch');
 const lease=JSON.parse(fs.readFileSync(m.runtime_file));if(lease.run_id!==m.run_id||lease.generation!==m.generation||lease.status!=='RUNNING'||lease.leases.publisher!==policy.publisher||!Number.isFinite(Date.parse(lease.deadline))||Date.parse(m.deadline)>Date.parse(lease.deadline))throw Error('publisher lease/deadline absent');
 for(const name of ['G-ALL','G-QP']){
  const p=m.gates[name],gate=readSealed(p.path,p.sha256);if(gate.verdict!=='PASS'||gate.run_id!==m.run_id||gate.generation!==m.generation)throw Error('required gate not accepted');
  if(name==='G-ALL'&&(gate.base!==m.base||!m.units.every(u=>gate.accepted_heads?.includes(u.head))))throw Error('base/head absent from accepted G-ALL cohort');
  if(name==='G-QP'&&!m.tools.every(t=>gate.tools?.some(p=>p.path===t.path&&p.sha256===t.sha256)))throw Error('tools absent from accepted G-QP bundle');
 }
 for(const pin of m.tools)if(hashFile(pin.path)!==pin.sha256)throw Error('publication tooling changed');
 if(!m.tools.some(p=>p.path===fileURLToPath(import.meta.url)))throw Error('publisher pin absent');
 if(!Array.isArray(m.units)||!m.units.length)throw Error('empty publication');
 for(const u of m.units){
  assertDirectTransport(u.export);
  if(!u.id||!u.branch.startsWith(policy.branch_prefix)||!/^[A-Za-z0-9._/-]+$/.test(u.branch)||!path.isAbsolute(u.export)||!/^[a-f0-9]{40}$/.test(u.head)||!/^[a-f0-9]{40}$/.test(u.tree))throw Error('unit identity invalid');
  if(hashFile(u.body_file)!==u.body_sha256||sha(u.title)!==u.title_sha256)throw Error('PR text drift');verifyBody(fs.readFileSync(u.body_file,'utf8'),u.title);
  if(git(u.export,['status','--porcelain=v1','-uall']).trim()||git(u.export,['rev-parse','HEAD']).trim()!==u.head||git(u.export,['rev-parse','HEAD^{tree}']).trim()!==u.tree||canonicalRemote(git(u.export,['remote','get-url','--push','origin']).trim())!==DESTINATION)throw Error('export identity drift');
 }
 return m;
}
export function verifyPR(pr,m,u,body){
 const url=new URL(pr.url);const parts=url.pathname.split('/');
 if(pr.repository!==DESTINATION||pr.headRepository!==DESTINATION||pr.base!==m.base_ref||pr.baseSha!==m.base||pr.head!==u.branch||pr.sha!==u.head||pr.draft!==true||pr.state!=='open'||pr.title!==u.title||pr.body!==body||url.protocol!=='https:'||url.hostname!=='github.com'||url.port||url.username||url.password||url.search||url.hash||parts.length!==5||parts.slice(1,3).join('/')!==DESTINATION||parts[3]!=='pull'||!/^[1-9][0-9]*$/.test(parts[4]))throw Error('PR readback mismatch');
 return pr.url;
}
export async function publishUnit({manifest,unit,adapter,stateFile,now=()=>Date.now()}){
 validatePublication(manifest);
 if(!manifest.units.some(u=>JSON.stringify(u)===JSON.stringify(unit)))throw Error('unit absent from sealed cohort');
 const lock=stateFile+'.lock';try{fs.mkdirSync(lock);}catch{throw Error('publisher operation locked; reconcile before restart');}
 try{
  const body=fs.readFileSync(unit.body_file,'utf8');
  let s=fs.existsSync(stateFile)?JSON.parse(fs.readFileSync(stateFile)):{run_id:manifest.run_id,generation:manifest.generation,unit:unit.id,head:unit.head,branch:unit.branch,status:'not-started',attempts:{push:0,create:0},started_at:new Date(now()).toISOString()};
  if(s.run_id!==manifest.run_id||s.generation!==manifest.generation||s.head!==unit.head||s.branch!==unit.branch)throw Error('publication state identity mismatch');
  const save=()=>atomicJSON(stateFile,{...s,updated_at:new Date(now()).toISOString()});
  const check=(write=false)=>{
   if(fs.existsSync(manifest.stop_file)||now()>=Date.parse(manifest.deadline))throw Error('publication STOP/deadline');
   if(write&&(now()>=Date.parse(manifest.closeout_start)||Date.parse(manifest.deadline)-now()<60000))throw Error('publication reserve exhausted');
   if(write&&now()-Date.parse(s.started_at)>=600000)throw Error('unit publication operation budget exhausted');
  };
  const revalidateWrite=()=>{
   check(true);validatePublication(manifest);
   if(!manifest.units.some(u=>JSON.stringify(u)===JSON.stringify(unit)))throw Error('unit changed outside sealed cohort');
   scanHistory({repo:unit.export,base:manifest.base,head:unit.head,acceptedCommits:unit.commits,allowedPaths:unit.allowedPaths,exceptions:unit.exceptions||[],destinationUrl:DESTINATION_URL});
  };
  check();const info=await adapter.info();if(info.repository!==DESTINATION||info.visibility!==manifest.visibility||!info.push)throw Error('destination access/visibility changed');
  check();if(await adapter.branch(manifest.base_ref)!==manifest.base)throw Error('upstream main changed; rebaseline required');
  check();let prs=await adapter.prs(unit.branch);
  if(prs.some(p=>p.state!=='open'||p.draft!==true))throw Error('maintainer decision or unrelated existing PR; do not recreate');
  if(prs.length>1)throw Error('ambiguous PR ownership');
  if(prs.length){
   if(s.status==='not-started')throw Error('existing PR not established as run-owned');
   check();const pr=await adapter.pr(prs[0].number);const url=verifyPR(pr,manifest,unit,body);
   if(await adapter.branch(unit.branch)!==unit.head)throw Error('remote head differs');s.status='PR-verified';s.url=url;save();return s;
  }
  if(s.status==='PR-uncertain'||s.status==='PR-verified')throw Error('previous PR effect unresolved; no blind recreate');
  check();let remote=await adapter.branch(unit.branch);
  if(remote&&remote!==unit.head||remote&&s.status==='not-started')throw Error('occupied unrelated branch; select sealed run-scoped alternative');
  scanHistory({repo:unit.export,base:manifest.base,head:unit.head,acceptedCommits:unit.commits,allowedPaths:unit.allowedPaths,exceptions:unit.exceptions||[],destinationUrl:DESTINATION_URL});
  if(!remote){
   if(s.status==='push-uncertain')throw Error('previous push effect unresolved; reconcile before retry');
   check(true);if(s.attempts.push>=3)throw Error('push attempt budget');s.status='push-uncertain';s.attempts.push++;save();
   revalidateWrite();
   try{await adapter.push(unit);}catch(e){s.last_error='push response failed or lost';save();}
   check();remote=await adapter.branch(unit.branch);if(remote!==unit.head)throw Error('push not verified; retain uncertain state');
  }
  s.status='pushed';save();
  check();prs=await adapter.prs(unit.branch);
  if(prs.length){if(prs.length!==1)throw Error('ambiguous PR after push');const pr=await adapter.pr(prs[0].number);s.url=verifyPR(pr,manifest,unit,body);s.status='PR-verified';save();return s;}
  check(true);if(s.attempts.create>=3)throw Error('create attempt budget');s.status='PR-uncertain';s.attempts.create++;save();
  check();if(await adapter.branch(manifest.base_ref)!==manifest.base||await adapter.branch(unit.branch)!==unit.head)throw Error('remote branch drift before PR create');
  revalidateWrite();
  try{await adapter.create(unit,body);}catch(e){s.last_error='PR create response failed or lost';save();}
  // Reconciliation is always read-first. Unknown effects are never retried blindly.
  for(let n=0;n<3;n++){
   check();const found=await adapter.prs(unit.branch);if(found.length>1)throw Error('duplicate/ambiguous remote PR');
   if(found.length===1){const pr=await adapter.pr(found[0].number);s.url=verifyPR(pr,manifest,unit,body);if(await adapter.branch(unit.branch)!==unit.head)throw Error('remote head drift');s.status='PR-verified';save();return s;}
   await adapter.pause(250*(n+1));
  }
  throw Error('PR effect uncertain; saved for later read-only reconciliation');
 }finally{fs.rmdirSync(lock);}
}
export async function boundedCommand(executable,args,{cwd,input,deadline,stopFile}){
 if(!path.isAbsolute(stopFile||'')||fs.existsSync(stopFile))throw Error('command STOP scope/missing');
 const remaining=Math.min(60000,Date.parse(deadline)-Date.now()-1000);if(remaining<1)throw Error('command deadline');
 const env={PATH:'/opt/homebrew/bin:/usr/bin:/bin',GIT_TERMINAL_PROMPT:'0',GIT_CONFIG_NOSYSTEM:'1',GIT_NO_REPLACE_OBJECTS:'1',GH_PROMPT_DISABLED:'1',GH_HOST:'github.com'};
 Object.assign(env,{SPRINT_HARNESS_POLICY:policy.file,SPRINT_HARNESS_POLICY_SHA256:policy.digest,SPRINT_HARNESS_NODE:policy.node_path});
 for(const name of ['HOME','TMPDIR','LANG','LC_ALL','GH_TOKEN','GITHUB_TOKEN','GH_CONFIG_DIR','HTTPS_PROXY','HTTP_PROXY','ALL_PROXY','NO_PROXY'])if(process.env[name]!==undefined)env[name]=process.env[name];
 const child=spawn(executable,args,{cwd,detached:true,stdio:['pipe','pipe','pipe'],env});
 let output='',error='',stop=false;
 const kill=()=>{stop=true;try{process.kill(-child.pid,'SIGKILL');}catch{}};
 const timer=setTimeout(kill,remaining);
 const stopTimer=setInterval(()=>{if(fs.existsSync(stopFile))kill();},25);
 child.stdout.on('data',b=>{output+=b.toString();if(output.length>4000000)kill();});child.stderr.on('data',b=>{error+=b.toString();if(error.length>1000000)kill();});
 child.stdin.on('error',()=>{});child.stdin.end(input||'');
 const result=await new Promise(resolve=>{child.on('error',()=>resolve(null));child.on('close',code=>resolve(code));});clearTimeout(timer);clearInterval(stopTimer);
 if(result!==0||stop){const e=Error('bounded command failed');e.notFound=/HTTP 404/.test(error);throw e;}return output;
}
export function githubAdapter(m){
 assertPolicy();
 if(hashFile(policy.gh_path)!==policy.gh_sha256)throw Error('GitHub CLI pin mismatch');
 const call=async args=>boundedCommand(policy.gh_path,args,{cwd:'/',deadline:m.deadline,stopFile:m.stop_file});
 const api=async endpoint=>JSON.parse(await call(['api',endpoint]));
 const normalize=p=>({number:p.number,repository:p.base.repo.full_name,headRepository:p.head.repo?.full_name,base:p.base.ref,baseSha:p.base.sha,head:p.head.ref,sha:p.head.sha,draft:p.draft,state:p.state,title:p.title,body:p.body,url:p.html_url});
 return {
  info:async()=>{const r=await api('repos/'+DESTINATION);return {repository:r.full_name,visibility:r.private?'private':'public',push:r.permissions?.push===true};},
  branch:async name=>{try{return (await api('repos/'+DESTINATION+'/git/ref/heads/'+name)).object.sha;}catch(e){if(e.notFound)return null;throw e;}},
  prs:async branch=>{const all=JSON.parse(await call(['api','-X','GET','repos/'+DESTINATION+'/pulls','-f','state=all','-f','base='+m.base_ref,'-f','head='+DESTINATION.split('/')[0]+':'+branch,'-f','per_page=100']));if(!Array.isArray(all)||all.length>=100)throw Error('ambiguous PR list');return all.map(normalize);},
  pr:async number=>normalize(await api('repos/'+DESTINATION+'/pulls/'+number)),
  push:async u=>boundedCommand('/usr/bin/git',['push','--porcelain','origin',u.head+':refs/heads/'+u.branch],{cwd:u.export,deadline:m.deadline,stopFile:m.stop_file}),
  create:async(u,body)=>boundedCommand(policy.gh_path,['api','-X','POST','repos/'+DESTINATION+'/pulls','--input','-'],{cwd:'/',deadline:m.deadline,stopFile:m.stop_file,input:JSON.stringify({title:u.title,body,head:u.branch,base:m.base_ref,draft:true})}),
  pause:ms=>new Promise(r=>setTimeout(r,ms))
 };
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===path.resolve(process.argv[1])){
 const [file,digest,id,stateFile]=process.argv.slice(2);try{const m=readSealed(file,digest),u=m.units.find(u=>u.id===id);if(!u)throw Error('unit not in manifest');console.log(JSON.stringify(await publishUnit({manifest:m,unit:u,adapter:githubAdapter(m),stateFile})));}catch(e){console.error(JSON.stringify({status:'BLOCKED',reason:e.message}));process.exitCode=1;}
}
