#!/usr/bin/env node
"use strict";

const fs = require("fs");

function usage(exitCode) {
  const out = exitCode === 0 ? console.log : console.error;
  out(`Usage:
  node identity-direct-send-compat.js \\
    --nonce NONCE \\
    --receiver-file PATH \\
    --ledger PATH \\
    --sender EXPECTED_SENDER \\
    --sid EXPECTED_SESSION_ID \\
    --target EXPECTED_TARGET`);
  process.exit(exitCode);
}

function requireArg(args, name) {
  const index = args.indexOf(name);
  if (index === -1 || !args[index + 1]) {
    console.error(`missing required argument: ${name}`);
    usage(2);
  }
  return args[index + 1];
}

function readFile(path, label) {
  try {
    return fs.readFileSync(path, "utf8");
  } catch (error) {
    console.error(`FAIL: cannot read ${label}: ${error.message}`);
    process.exit(2);
  }
}

function stripEscapes(text) {
  return text.replace(/\x1b/g, "");
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes("-h") || args.includes("--help")) usage(0);

  const nonce = requireArg(args, "--nonce");
  const receiverFile = requireArg(args, "--receiver-file");
  const ledgerPath = requireArg(args, "--ledger");
  const sender = requireArg(args, "--sender");
  const sid = requireArg(args, "--sid");
  const target = requireArg(args, "--target");

  const receiver = stripEscapes(readFile(receiverFile, "receiver file"));
  const ledger = readFile(ledgerPath, "ledger");

  const failures = [];
  const receiverChecks = [
    [`receiver contains nonce ${nonce}`, receiver.includes(nonce)],
    [`receiver contains sender=${sender}`, receiver.includes(`sender=${sender}`)],
    [`receiver contains sid=${sid}`, receiver.includes(`sid=${sid}`)],
  ];

  const ledgerChecks = [
    [`ledger contains nonce ${nonce}`, ledger.includes(nonce)],
    [`ledger contains sender=${sender}`, ledger.includes(`sender=${sender}`)],
    [`ledger contains sid=${sid}`, ledger.includes(`sid=${sid}`)],
    [`ledger contains target=${target}`, ledger.includes(`target=${target}`)],
  ];

  for (const [label, passed] of [...receiverChecks, ...ledgerChecks]) {
    if (!passed) failures.push(label);
  }

  if (/\bsender=(operator|relay|unknown)\b/.test(receiver)) {
    failures.push("receiver identity is generic");
  }
  if (new RegExp(`\\[ID [^\\n]*sender=(operator|relay|unknown)[^\\n]*target=${target.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(ledger)) {
    failures.push("ledger identity is generic for target");
  }

  if (failures.length > 0) {
    console.log("DIRECT_SEND_COMPAT: FAIL");
    for (const failure of failures) console.log(`- ${failure}`);
    process.exit(1);
  }

  console.log("DIRECT_SEND_COMPAT: PASS");
  console.log(`nonce=${nonce}`);
  console.log(`sender=${sender}`);
  console.log(`sid=${sid}`);
  console.log(`target=${target}`);
  console.log("receiver_visibility=pass");
  console.log("ledger_stamp=pass");
  console.log("generic_identity=not_detected");
}

main();
