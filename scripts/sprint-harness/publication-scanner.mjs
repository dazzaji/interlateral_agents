import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {hashFile,sha} from './evidence-runner.mjs';
import {policy,assertPolicy} from './policy.mjs';
export const DESTINATION=policy.repository;
export const DESTINATION_URL='https://github.com/'+DESTINATION+'.git';
export function git(repo,args){const env={...process.env};for(const key of Object.keys(env))if(key.startsWith('GIT_'))delete env[key];Object.assign(env,{GIT_TERMINAL_PROMPT:'0',GIT_CONFIG_NOSYSTEM:'1',GIT_NO_REPLACE_OBJECTS:'1'});return execFileSync('/usr/bin/git',args,{cwd:repo,encoding:'utf8',maxBuffer:32*1024*1024,timeout:20000,env});}
export function canonicalRemote(url){if(url===DESTINATION_URL||url==='git@github.com:'+DESTINATION+'.git'||url==='https://github.com/'+DESTINATION)return DESTINATION;throw Error('destination identity not authorized');}
export function assertDirectTransport(repo){
 for(const key of Object.keys(process.env))if(key.startsWith('GIT_')&&!['GIT_TERMINAL_PROMPT','GIT_CONFIG_NOSYSTEM','GIT_NO_REPLACE_OBJECTS','GIT_PAGER'].includes(key)&&process.env[key])throw Error('unapproved Git environment override');
 try{const value=git(repo,['config','--get-regexp','^url\..*\.(insteadof|pushinsteadof)$']);if(value.trim())throw Error('Git URL rewriting is not permitted for publication');}catch(e){if(e.status!==1)throw e;}
}
export function scanText(text,context,exceptions=[]){
 const rules=[
  ['credential',/(?:github_pat_[A-Za-z0-9_]{20,}|gh[pousr]_[A-Za-z0-9]{20,}|(?<![A-Za-z0-9_-])sk-(?:proj-)?[A-Za-z0-9_-]{24,}|AKIA[0-9A-Z]{16}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)/],
  ['private-path',/(?:\/Users\/|\/home\/|[A-Za-z]:\\Users\\|~\/(?:Dropbox|Desktop|Documents)\/)/i],
  ['private-run-record',/comms\.md/i],
 ];
 for(const term of policy.private_terms)if(text.toLowerCase().includes(term.toLowerCase()))throw Error('disclosure scan blocked configured private term');
 for(const [rule,re] of rules)if(re.test(text)){
  const permit=exceptions.some(x=>x.rule===rule&&x.context===context&&x.sha256===sha(text)&&x.reviewed===true&&rule!=='credential');
  if(!permit)throw Error(`disclosure scan blocked ${rule}; object ${sha(context).slice(0,16)}`);
 }
 return true;
}
export function verifyBody(body,title){if(!body||!title||title.length>200)throw Error('missing public text');scanText(title,'PR title');scanText(body,'PR body');if(!body.includes('Proposed for your review.'))throw Error('proposal framing missing');if(/Generated with\s*\[?Claude Code/i.test(body)&&!/Authoring: Claude Code/i.test(body))throw Error('unverified authoring claim');return {body_sha256:sha(body),title_sha256:sha(title)};}
export function scanHistory({repo,base,head,acceptedCommits,allowedPaths,exceptions=[],destinationUrl}){
 assertPolicy();
 canonicalRemote(destinationUrl);
 if(![base,head,...acceptedCommits].every(x=>/^[0-9a-f]{40}$/.test(x)))throw Error('invalid pinned commits');
 if(!Array.isArray(allowedPaths)||!allowedPaths.length||new Set(acceptedCommits).size!==acceptedCommits.length)throw Error('invalid acceptance policy');
 git(repo,['cat-file','-e',base+'^{commit}']);git(repo,['cat-file','-e',head+'^{commit}']);git(repo,['merge-base','--is-ancestor',base,head]);
 const commits=git(repo,['rev-list','--reverse',base+'..'+head]).trim().split('\n').filter(Boolean);
 if(JSON.stringify([...commits].sort())!==JSON.stringify([...acceptedCommits].sort())||!commits.length)throw Error('outgoing commits differ from accepted cohort');
 const records=[];
 for(const commit of commits){
  scanText(git(repo,['show','-s','--format=%B',commit]),'commit-message:'+commit,exceptions);
  const changed=git(repo,['diff-tree','-r','--no-commit-id','--name-only','-z',base,commit]).split('\0').filter(Boolean);
  for(const p of changed)if(!allowedPaths.includes(p))throw Error('unaccepted changed path '+sha(p).slice(0,16));
  const entries=git(repo,['ls-tree','-r','-z',commit]).split('\0').filter(Boolean);
  const blobs=[];
  for(const entry of entries){
   const split=entry.indexOf('\t'),meta=entry.slice(0,split).split(' '),p=entry.slice(split+1);
   if(split<0||meta[1]!=='blob'||!['100644','100755'].includes(meta[0]))throw Error('unsupported tree entry');
   const reviewedTemplate=/(^|\/)\.env\.example$/.test(p)&&exceptions.some(x=>x.rule==='baseline-example-template'&&x.reviewed===true&&x.base===base&&x.path===p&&x.blob===meta[2]&&git(repo,['rev-parse',base+':'+p]).trim()===meta[2]);
   if((/(^|\/)(work|\.env(?:\..*)?|\.ssh|\.codex|\.claude)(\/|$)/i.test(p)&&!reviewedTemplate)||/[\r\n]/.test(p))throw Error('excluded tree path '+sha(p).slice(0,16));
   scanText(p,'path:'+p,exceptions);
   const content=git(repo,['cat-file','blob',meta[2]]);if(content.includes('\0')||content.includes('\ufffd'))throw Error('unreviewed binary blob '+meta[2]);
   scanText(content,'blob:'+meta[2],exceptions);blobs.push({path:p,blob:meta[2],sha256:sha(content)});
  }
  records.push({commit,tree:git(repo,['rev-parse',commit+'^{tree}']).trim(),blobs});
 }
 return {version:1,status:'PASS',destination:DESTINATION,policy_sha256:policy.digest,base,head,commits:records,scanner_sha256:hashFile(fileURLToPath(import.meta.url)),policy:{allowedPaths,exceptions},completed_at:new Date().toISOString()};
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===path.resolve(process.argv[1])){try{const policy=JSON.parse(fs.readFileSync(process.argv[2]));const result=scanHistory(policy);console.log(JSON.stringify(result));}catch(e){console.error(JSON.stringify({status:'FAIL',reason:e.message}));process.exitCode=1;}}
