// Safe local example: execute this package's real tests through its evidence runner.
// Publication tests use an in-memory adapter; this never pushes or creates a real PR.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {runPlan,hashFile,atomicJSON} from '../evidence-runner.mjs';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const run=fs.mkdtempSync(path.join(os.tmpdir(),'sprint-harness-proof-'));
const tests=['tests/evidence.test.mjs','tests/publication.test.mjs'].map(p=>path.join(root,p));
const inputs=[...fs.readdirSync(root).filter(n=>n.endsWith('.mjs')).map(n=>path.join(root,n)),path.join(root,'qualified-hooks/pre-push'),...tests];
// This catalog is deliberately limited to these flat, checked-in self-tests.
const names=tests.flatMap(p=>[...fs.readFileSync(p,'utf8').matchAll(/^test\('([^'\n]+)'/gm)].map(m=>m[1]));
if(names.length!==20)throw Error('Update the reviewed self-test catalog count before accepting changed tests');
const plan={version:1,run_id:'harness-self-test',generation:1,cwd:root,executable:fs.realpathSync(process.execPath),executable_sha256:hashFile(fs.realpathSync(process.execPath)),argv:['--test','--test-concurrency=1',...tests],deadline:new Date(Date.now()+120000).toISOString(),timeout_ms:90000,stop_file:path.join(run,'STOP'),inputs:inputs.map(p=>({path:p,sha256:hashFile(p)})),oracle:{kind:'node-test',names}};
const planPath=path.join(run,'plan.json');atomicJSON(planPath,plan);
const result=await runPlan({planPath,planHash:hashFile(planPath),outDir:run,label:'self-tests'});
console.log(JSON.stringify({status:result.status,tests:result.oracle.count,command_exit:result.command_exit,capture_status:result.capture_status,evidence:path.join(run,'self-tests/MANIFEST.json'),external_mutations:0},null,2));
process.exitCode=result.status==='PASS'?0:1;
