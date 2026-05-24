#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const secretName =
  "(?:[A-Z0-9_]*(?:SECRET|TOKEN|PASSWORD|PASS|API_?KEY|PRIVATE_?KEY|CREDENTIAL|DATABASE_URL|AUTH)[A-Z0-9_]*)";
const shellSecretRef = "(?:\\$\\{?\\s*" + secretName + "\\s*\\}?|%[A-Z0-9_]*" + secretName + "[A-Z0-9_]*%)";
const shellCommandSubstitution = "(?:\\$\\([^)]{1,240}\\)|`[^`]{1,240}`)";
const headerFlag = "(?:-[H]|--header)";
const authHeaderName = "(?:Authori" + "zation)";
const tokenScheme = "(?:Bear" + "er|token|Basic)";
const apiHeaderName = "(?:X-API-Key|X-Auth-Token|Api-Key|Authentication)";

const rules = [
  {
    id: "js-print-env-secret",
    description: "JavaScript output call appears to print a secret-shaped environment variable",
    pattern: new RegExp(
      "(?:console\\s*\\.\\s*(?:log|error|warn)|process\\s*\\.\\s*stdout\\s*\\.\\s*write)\\s*\\([^\\n]*(?:process\\s*\\.\\s*env\\s*\\.\\s*" +
        secretName +
        "|process\\s*\\.\\s*env\\s*\\[\\s*['\"]" +
        secretName +
        "['\"]\\s*\\])"
    ),
  },
  {
    id: "shell-print-env-secret",
    description: "Shell output command appears to print a secret-shaped environment variable",
    pattern: new RegExp(
      "\\b(?:echo|printf|printenv)\\b[^\\n]*(?:\\$\\{?\\s*" + secretName + "\\s*\\}?|\\b" + secretName + "\\b)"
    ),
  },
  {
    id: "secret-in-argv",
    description: "Command-line argument appears to carry a secret value instead of a reference or stdin/file descriptor",
    pattern: new RegExp(
      "(?:--(?:password|token|secret|api[-_]?key|credential)(?:=|\\s+)\\S+|\\b(?:password|token|secret|api[-_]?key)=\\$?\\{?\\w+\\}?)",
      "i"
    ),
  },
  {
    id: "auth-header-secret-in-argv",
    description: "Header argument appears to carry auth material through argv instead of a reference, stdin, or file descriptor",
    pattern: new RegExp(
      headerFlag +
        "\\s+(?:['\"][^'\"]*)?(?:" +
        authHeaderName +
        "\\s*:\\s*" +
        tokenScheme +
        "\\s+(?:" +
        shellSecretRef +
        "|" +
        shellCommandSubstitution +
        "|[A-Za-z0-9._-]{16,})|" +
        apiHeaderName +
        "\\s*:\\s*(?:(?:" +
        tokenScheme +
        ")\\s+)?(?:" +
        shellSecretRef +
        "|" +
        shellCommandSubstitution +
        "|[A-Za-z0-9._-]{12,}))",
      "i"
    ),
  },
  {
    id: "token-issuance-command",
    description: "Command appears to print, mint, create, issue, or refresh an access token",
    pattern: new RegExp(
      "\\b(?:" +
        ["print", "create", "issue", "mint", "refresh"].map((verb) => `${verb}-token`).join("|") +
        "|print-access-" +
        "token)\\b",
      "i"
    ),
  },
  {
    id: "raw-bearer-token",
    description: "Bearer token-shaped literal appears in text",
    pattern: /\bBearer\s+[A-Za-z0-9._-]{16,}\b/,
  },
  {
    id: "raw-secret-assignment",
    description: "Secret-shaped variable appears to be assigned a literal value",
    pattern: new RegExp(
      "\\b" +
        secretName +
        "\\s*=\\s*(?!(?:env:|ref:|op://|sm://|file:|fd:|stdin|REDACTED|<redacted>|\\$\\{|\\$\\w+|example|placeholder|none|null|n/a)\\b)[\"']?[^\\s\"'`]+",
    ),
  },
];

function usage(exitCode) {
  const out = exitCode === 0 ? console.log : console.error;
  out(`Usage:
  node ${path.basename(process.argv[1])} <file> [file...]
  node ${path.basename(process.argv[1])} --examples

This local checker reads only the files passed on argv. It does not read
environment variable values, secret stores, cloud services, 1Password, Secret
Manager, GCP, Cloudflare, or credential files.

It is a conservative line-pattern guard for process helpers, not a semantic
data-flow proof system.`);
  process.exit(exitCode);
}

function examples() {
  console.log("Non-argv credential handling examples:");
  console.log("- Prefer references in evidence and packets: env:NAME, op://vault/item/field, sm://project/name/version, file:/local/path, fd:3, or stdin.");
  console.log("- Helpers that need a credential must accept a reference flag such as --credential-ref env:NAME, then resolve it inside the local process without printing the value.");
  console.log("- Shell helpers should read secret material from stdin or a file descriptor supplied by the caller, never from a value-bearing argv flag.");
  console.log("- Readiness failures are preflight blockers: emit 4C0_PREFLIGHT_BLOCKER with the missing reference and owner action, or escalate to TRUE_DAZZA/controller if rotation, issuance, or secret access is required.");
  console.log("- Logs and evidence may name the reference path only; they must never include the resolved value.");
}

function lintFile(filePath) {
  let content;
  try {
    content = fs.readFileSync(filePath, "utf8");
  } catch (error) {
    return [{ file: filePath, line: 0, rule: "read-error", reason: error.message, text: "" }];
  }

  const findings = [];
  const lines = content.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    for (const rule of rules) {
      if (rule.pattern.test(line)) {
        findings.push({
          file: filePath,
          line: index + 1,
          rule: rule.id,
          reason: rule.description,
        });
      }
    }
  }
  return findings;
}

function main(argv) {
  if (argv.length === 0 || argv.includes("--help") || argv.includes("-h")) usage(argv.length === 0 ? 2 : 0);
  if (argv.length === 1 && argv[0] === "--examples") {
    examples();
    return 0;
  }

  const files = argv.filter((arg) => !arg.startsWith("--"));
  if (files.length === 0) usage(2);

  const findings = files.flatMap(lintFile);
  if (findings.length > 0) {
    console.log("CREDENTIAL_HYGIENE_LINT: FAIL");
    for (const finding of findings) {
      console.log(`${finding.file}:${finding.line}: ${finding.rule}: ${finding.reason}`);
    }
    return 1;
  }

  console.log("CREDENTIAL_HYGIENE_LINT: PASS");
  console.log(`files_checked=${files.length}; rules_checked=${rules.length}`);
  console.log("secret_value_reads: 0; secret_store_accesses: 0; token_issue_actions: 0");
  return 0;
}

process.exit(main(process.argv.slice(2)));
