import fs from 'node:fs';
import {policy as authority} from './policy.mjs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {scanHistory,git,canonicalRemote,DESTINATION} from './publication-scanner.mjs';
import {hashFile} from './evidence-runner.mjs';
export function checkPush({repo,remote,url,updates,policy,remoteRefs}){
 if(policy.policy_sha256!==authority.digest)throw Error('push policy identity mismatch');
 if(remote!=='origin'||canonicalRemote(url)!==DESTINATION||canonicalRemote(git(repo,['remote','get-url','--push',remote]).trim())!==DESTINATION)throw Error('unauthorized push destination');
 if(!Array.isArray(remoteRefs))throw Error('remote lookup failed');
 if(updates.length!==1)throw Error('exactly one explicit branch push required');
 const [localRef,localSha,remoteRef,remoteSha]=updates[0];
 if(localRef!=='HEAD'&&localRef!==`refs/heads/${policy.branch}`&&localRef!==policy.head||remoteRef!==`refs/heads/${policy.branch}`||!remoteRef.startsWith('refs/heads/'+authority.branch_prefix)||localSha!==policy.head||/^0+$/.test(localSha))throw Error('unapproved ref/SHA');
 const current=remoteRefs.find(x=>x.ref===remoteRef)?.sha||'0'.repeat(40);
 if(current!==remoteSha||current!=='0'.repeat(40)&&current!==localSha)throw Error('occupied or changed branch');
 if(!remoteRefs.some(x=>x.ref==='refs/heads/'+authority.base_ref&&x.sha===policy.base))throw Error('upstream base drift');
 return scanHistory({...policy,repo,destinationUrl:url});
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===path.resolve(process.argv[1])){
 try{
  const [remote,url]=process.argv.slice(2),repo=process.cwd();
  const config=path.join(git(repo,['rev-parse','--absolute-git-dir']).trim(),'sprint-publication-policy.json');
  const policy=JSON.parse(fs.readFileSync(config));
  if(policy.scanner_sha256!==hashFile(path.join(path.dirname(fileURLToPath(import.meta.url)),'publication-scanner.mjs')))throw Error('scanner pin mismatch');
  const updates=fs.readFileSync(0,'utf8').trim().split('\n').filter(Boolean).map(l=>l.trim().split(/\s+/));
  const refs=git(repo,['ls-remote','--heads',url]).trim().split('\n').filter(Boolean).map(l=>{const [sha,ref]=l.split(/\s+/);if(!/^[0-9a-f]{40}$/.test(sha)||!ref)throw Error('invalid remote response');return {sha,ref};});
  checkPush({repo,remote,url,updates,policy,remoteRefs:refs});
 }catch(e){console.error('Sprint push refused: '+e.message);process.exitCode=1;}
}
