import fs from 'node:fs';
import path from 'node:path';
import {hashFile} from './evidence-runner.mjs';

// Policy is a pinned controller input, not authority obtained from repository text.
const file=process.env.SPRINT_HARNESS_POLICY;
const digest=process.env.SPRINT_HARNESS_POLICY_SHA256;
if(!file||!path.isAbsolute(file)||!/^[a-f0-9]{64}$/.test(digest||'')||hashFile(file)!==digest)throw Error('explicit pinned sprint publication policy required');
const value=JSON.parse(fs.readFileSync(file,'utf8'));
if(value.version!==1||!/^[A-Za-z0-9][A-Za-z0-9_.-]*\/[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(value.repository||'')||!value.repository.split('/').every(x=>!x.endsWith('.git')&&!x.includes('..')))throw Error('invalid repository policy');
if(!/^[A-Za-z0-9._-]+$/.test(value.run_id||'')||!Number.isInteger(value.generation)||value.generation<1||!value.publisher)throw Error('invalid run policy');
if(!['private','public'].includes(value.visibility)||!Number.isFinite(Date.parse(value.deadline)))throw Error('visibility/deadline required');
if(!/^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(value.base_ref||'')||value.base_ref.includes('..')||!/^sprint\/[A-Za-z0-9_-]+\/$/.test(value.branch_prefix||''))throw Error('explicit base and sprint branch prefix required');
if(!Array.isArray(value.private_terms)||value.private_terms.some(x=>typeof x!=='string'||!x.trim()))throw Error('private_terms must be an explicit array');
if(!path.isAbsolute(value.gh_path||'')||!/^[a-f0-9]{64}$/.test(value.gh_sha256||''))throw Error('pinned GitHub CLI required');
if(!path.isAbsolute(value.node_path||'')||fs.realpathSync(value.node_path)!==fs.realpathSync(process.execPath)||hashFile(value.node_path)!==value.node_sha256)throw Error('Node runtime policy mismatch');
export const policy=Object.freeze({...value,private_terms:Object.freeze([...value.private_terms]),digest,file});
export function assertPolicy(){
  if(hashFile(file)!==digest||hashFile(policy.node_path)!==policy.node_sha256)throw Error('policy/runtime drift');
}
