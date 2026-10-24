import fs from 'node:fs';
import {policy} from './policy.mjs';
import path from 'node:path';
import {scanHistory,git,DESTINATION_URL} from './publication-scanner.mjs';
import {atomicJSON,hashFile} from './evidence-runner.mjs';
export function exportUnit({source,destination,unit,base,hooksPath}){
 if(!path.isAbsolute(source)||!path.isAbsolute(destination)||fs.existsSync(destination))throw Error('fresh absolute export directory required');
 if(!/^[A-Za-z0-9._/-]+$/.test(unit.branch)||!unit.branch.startsWith(policy.branch_prefix))throw Error('run-owned branch required');
 const before=scanHistory({repo:source,base,head:unit.head,acceptedCommits:unit.commits,allowedPaths:unit.allowedPaths,exceptions:unit.exceptions||[],destinationUrl:DESTINATION_URL});
 if(before.commits.at(-1)?.tree!==unit.tree)throw Error('accepted tree drift');
 fs.mkdirSync(destination,{recursive:false});
 git(destination,['init','--quiet']);
 git(destination,['config','core.hooksPath',hooksPath]);
 git(destination,['fetch','--no-tags','--quiet',source,unit.head]);
 git(destination,['checkout','--quiet','-b',unit.branch,unit.head]);
 git(destination,['remote','add','origin',DESTINATION_URL]);
 if(git(destination,['status','--porcelain=v1','-uall']).trim())throw Error('dirty clean export');
 if(git(destination,['rev-parse','HEAD']).trim()!==unit.head||git(destination,['rev-parse','HEAD^{tree}']).trim()!==unit.tree)throw Error('export identity drift');
 const after=scanHistory({repo:destination,base,head:unit.head,acceptedCommits:unit.commits,allowedPaths:unit.allowedPaths,exceptions:unit.exceptions||[],destinationUrl:DESTINATION_URL});
 return {source_head:unit.head,export_head:unit.head,tree:unit.tree,mapping:unit.commits.map(c=>({original:c,exported:c})),scan:after,private_files_copied:false};
}
