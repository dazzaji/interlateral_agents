#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const requiredLabels = [
  ["Sprint", /^Sprint:\s*\S+/im],
  ["Gate", /^Gate:\s*\S+/im],
  ["Gate Token", /^Gate Token:\s*\S+/im],
  ["Request ID", /^Request ID:\s*\S+/im],
  ["Mutation Class", /^Mutation Class:\s*.+/im],
  ["Authority", /^Authority:\s*.+/im],
  ["Step 0 Inventory Pin", /^Step 0 Inventory Pin:\s*`?[a-f0-9]{64}`?/im],
  ["Current Branch And Status", /^Current Branch And Status:\s*.+/im],
  ["Declared Write Roots", /^Declared Write Roots:\s*.+/im],
  ["Exact Scope", /^Exact Scope:\s*.+/im],
  ["Forbidden Adjacent Actions", /^Forbidden Adjacent Actions:\s*.+/im],
  ["Exact Commands After Approval", /^Exact Commands After Approval:\s*.+/im],
  ["Expected Artifacts", /^Expected Artifacts:\s*.+/im],
  ["Rollback Or Undo Evidence", /^Rollback Or Undo Evidence:\s*.+/im],
  ["Retry History", /^Retry History:\s*.+/im],
  ["Materiality Triage", /^Materiality Triage:\s*.+/im],
  ["Residual Risks", /^Residual Risks:\s*.+/im],
  ["Reviewer Breaker Status", /^Reviewer Breaker Status:\s*.+/im],
  ["Expiry Or Invalidation", /^Expiry Or Invalidation:\s*.+/im],
];

const requiredPhrases = [
  ["class 1", /\bclass\s*1\b/i],
  ["class 2", /\bclass\s*2\b/i],
  ["class 3", /\bclass\s*3\b/i],
  ["class 4", /\bclass\s*4\b/i],
  ["rollback", /\brollback\b|\bundo\b/i],
  ["forbidden adjacent actions", /forbidden adjacent actions/i],
];

const materialityClasses = [
  {
    class: 1,
    name: "Safety, authority, live-risk, credential, runtime, or irreversible-action issue",
    rule: "STOP. Do not execute; fix before approval or escalate for explicit controller/TRUE_DAZZA risk acceptance where allowed.",
    example: "Packet asks for DNS, production data, credential, GCP/Cloudflare, protected branch, or billable mutation outside written authority.",
  },
  {
    class: 2,
    name: "Material correctness or autonomy blocker",
    rule: "PATCH. Return to requester for correction; do not approve until fixed or controller accepts a documented alternative.",
    example: "Missing Step 0 pin, stale authority hash, wrong gate token, absent rollback evidence, or command list inconsistent with requested scope.",
  },
  {
    class: 3,
    name: "Non-blocking refinement",
    rule: "DEFER WITH RATIONALE. Track the refinement, but do not block when class 1-2 items are absent.",
    example: "A clearer label, extra cross-reference, or redundant manifest entry would improve review speed but is not required for safe execution.",
  },
  {
    class: 4,
    name: "Paperwork, style, or non-authority ambiguity",
    rule: "NO BLOCK. Do not create review spiral; note only if useful.",
    example: "Minor wording/style issue, harmless ordering difference, or typo that cannot change authority, scope, safety, or evidence interpretation.",
  },
];

function usage(exitCode) {
  const out = exitCode === 0 ? console.log : console.error;
  out(`Usage:
  node ${path.basename(process.argv[1])} <gate-packet.md>
  node ${path.basename(process.argv[1])} --materiality-examples`);
  process.exit(exitCode);
}

function printMaterialityExamples() {
  for (const item of materialityClasses) {
    console.log(`Class ${item.class}: ${item.name}`);
    console.log(`Rule: ${item.rule}`);
    console.log(`Example: ${item.example}`);
    console.log("");
  }
}

function lintPacket(filePath) {
  if (!filePath) usage(2);
  let content;
  try {
    content = fs.readFileSync(filePath, "utf8");
  } catch (error) {
    console.error(`FAIL: cannot read packet file: ${error.message}`);
    return 2;
  }

  const failures = [];
  for (const [label, pattern] of requiredLabels) {
    if (!pattern.test(content)) failures.push(`missing or empty required field: ${label}`);
  }
  for (const [label, pattern] of requiredPhrases) {
    if (!pattern.test(content)) failures.push(`missing required packet content: ${label}`);
  }

  const token = content.match(/^Gate Token:\s*(.+)$/im);
  if (token && /\bn\/a\b/i.test(token[1])) {
    failures.push("Gate Token must be a concrete token for mutation gates, not n/a");
  }

  const commands = content.match(/^Exact Commands After Approval:\s*(.+)$/im);
  if (commands && /\bTBD\b|\bunknown\b/i.test(commands[1])) {
    failures.push("Exact Commands After Approval must not be TBD or unknown");
  }

  const rollback = content.match(/^Rollback Or Undo Evidence:\s*(.+)$/im);
  if (rollback && /\bTBD\b|\bunknown\b/i.test(rollback[1])) {
    failures.push("Rollback Or Undo Evidence must not be TBD or unknown");
  }

  const risks = content.match(/^Residual Risks:\s*(.+)$/im);
  if (risks && risks[1].trim().length < 4) {
    failures.push("Residual Risks must state 'none' or name concrete residual risk");
  }

  if (failures.length > 0) {
    console.log(`FAIL: ${filePath}`);
    for (const failure of failures) console.log(`- ${failure}`);
    return 1;
  }

  console.log(`PASS: ${filePath}`);
  console.log(`checked_fields=${requiredLabels.length}; checked_content_rules=${requiredPhrases.length}`);
  return 0;
}

if (process.argv.length < 3) usage(2);

if (process.argv[2] === "--help" || process.argv[2] === "-h") usage(0);
if (process.argv[2] === "--materiality-examples") {
  printMaterialityExamples();
  process.exit(0);
}

process.exit(lintPacket(process.argv[2]));
