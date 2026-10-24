# Reusable sprint tools

These are the extracted execution/evidence runner and draft-PR publishing pipeline from the
2026-10-22 sprint, adapted for explicit per-run configuration. Use this directory for subsequent
sprints; do not search old run folders or rebuild the tools. The cookbook links here in Appendix K.

## Start here — no network mutations

With Node **22.23.2** (the tested runtime), from the repository root:

```sh
node scripts/sprint-harness/examples/verify-self.mjs
```

This runs 20 real tests through the evidence runner, prints the separate process/capture results
and the path to retained evidence in a fresh temporary directory. Publishing is tested with an
in-memory fake service, never a real GitHub mutation. No npm install is needed. Use the exact
Node executable selected for your run; an untested runtime is not automatically qualified.

## The two pieces

| Tool set | Entry point | What it does |
|---|---|---|
| Execution evidence | evidence-runner.mjs; node-reporter.mjs | Runs pinned Node programs/tests with STOP/deadline bounds, records actual exit independently of log capture, checks exact test identities, refuses overwrite/source drift. |
| PR delivery | exporter.mjs; publication-scanner.mjs; publisher.mjs; publication-hook.mjs | Exports accepted commits without private working files, scans outgoing history, pushes one approved branch, reconciles uncertain results, verifies the exact draft PR. |

The example is also the smallest working runner integration. Replace its test paths, expected
names and input pins with your reviewed project plan. Do not derive general acceptance from a
string saying PASS. Node-test and intended-assertion-failure oracles are supported; the old
project-specific simulator was deliberately removed. A text oracle proves only its named text
condition, not that meaningful tests ran.

Runner CLI:

```text
node evidence-runner.mjs PLAN_FILE PLAN_SHA256 OUTPUT_DIRECTORY UNIQUE_LABEL
```

The plan includes run_id, generation, cwd, executable/hash, argv, absolute deadline, timeout,
STOP path, input path/hashes and oracle. See examples/verify-self.mjs for actual construction.
Keep plans/logs/results in private run storage, not this source directory or Git.

## Configure publication once per run

Publication has no default destination and cannot accidentally reuse yesterday's repository.
The controller writes a private policy JSON, hashes its exact bytes and supplies:

```text
SPRINT_HARNESS_POLICY = absolute policy file
SPRINT_HARNESS_POLICY_SHA256 = its SHA-256
SPRINT_HARNESS_NODE = the pinned Node executable, for the pre-push hook
```

The policy requires these fields:

| Field | Meaning |
|---|---|
| version | 1 |
| run_id, generation, publisher | Current run and sole publisher identity |
| repository, visibility | Exact GitHub owner/repository and public/private expectation |
| base_ref, branch_prefix | Target branch, and a run-owned prefix such as sprint/demo/ |
| deadline | Absolute run deadline |
| private_terms | Explicit array of additional strings forbidden in outgoing content; can be empty |
| node_path, node_sha256 | Exact current Node executable and hash |
| gh_path, gh_sha256 | Exact GitHub CLI executable and hash |

Set these only from the human-authorized run contract. A JSON file or a PASS fixture does not
grant permission to publish. Never copy synthetic acceptance gates from the tests into a real run.
Public security fixes still require the run's actual disclosure policy; this tool cannot adjudicate it.

`exportUnit` takes source, fresh destination, accepted unit, base commit and hooksPath.
`scanHistory` takes repo, base/head, exact acceptedCommits/allowedPaths, optional explicitly
reviewed baseline exceptions and destinationUrl. `publishUnit` takes manifest, unit, adapter and
stateFile. The example in tests/publication.test.mjs shows every field and the complete sequence.

The publication manifest binds policy_sha256, run/generation, repository/visibility, base_ref/base,
deadline/closeout_start, runtime lease file, STOP path, current tool hashes, acceptance gates and
units. Each unit binds id, branch, head/tree/commits, allowedPaths, export path and exact PR text
hashes. G-ALL accepts the candidate heads; G-QP accepts the current tool hashes. Obtain real
review/acceptance for the intended scope. Exports must have an executable pre-push hook and a
pinned `sprint-publication-policy.json` in their own Git directory; include policy_sha256 and
scanner_sha256 plus the scan's base/head/acceptedCommits/allowedPaths and branch.

The sealed manifest CLI is:

```text
node publisher.mjs MANIFEST_FILE MANIFEST_SHA256 UNIT_ID STATE_FILE
```

It opens **draft PRs only**. No merges, main-branch push, force push or tags. Restart with the same
state file: it reconciles possibly completed effects before trying again. Never delete uncertain
state to force a retry. Keep the publication settings in the environment for hook subprocesses.

## Scope and honest readiness

This extraction has local adaptation tests; original gate records do not automatically certify
new code or a new deployment. Runtime/access integration and independent acceptance are per-run.
The scanner is intentionally conservative about binary files, symlinks and private tool folders;
an unsupported file is a scoped publication issue, not a reason to stop unrelated fixes. Do not
weaken scanning to make a result green. Use explicit reviewed treatment or defer that publication.

Not included: the old project simulator, matrix adapter, session launcher, global STOP-on-missing-
lane policy, private run records, destinations or credentials. These are not needed to reuse the
two requested tool sets. Existing orchestration can call these APIs; this is not a new scheduler.

See PROVENANCE.md; the package is covered by this repository's Apache-2.0 license (../../LICENSE). Keep future changes small, retain the self-tests, and
add a regression for changed behavior. Document lessons promptly; do not delay cookbook notes
until a generic tool release is polished.
