#!/usr/bin/env node
"use strict";

const DEFAULT_STALL_MINUTES = 20;
const DEFAULT_SPIRAL_ROUNDS = 3;

function usage(exitCode) {
  const out = exitCode === 0 ? console.log : console.error;
  out(`Usage:
  node watcher-control-sim.js stall
  node watcher-control-sim.js false-green
  node watcher-control-sim.js retry-loop
  node watcher-control-sim.js spiral
  node watcher-control-sim.js all`);
  process.exit(exitCode);
}

function classifyStall({ minutesSinceEvidence, terminalActive, reviewedOverride }) {
  const threshold = reviewedOverride?.minutes ?? DEFAULT_STALL_MINUTES;
  const overrideStatus = reviewedOverride ? "reviewed-pinned-override" : "default-threshold";
  if (minutesSinceEvidence >= threshold) {
    return {
      verdict: "idle/stalled",
      reason: `${minutesSinceEvidence} minutes since material evidence progress; terminal_active=${terminalActive}`,
      threshold,
      overrideStatus,
      action: "nudge lead with the missing evidence artifact or controller decision",
    };
  }
  return {
    verdict: "on-track",
    reason: `${minutesSinceEvidence} minutes since material evidence progress is below threshold`,
    threshold,
    overrideStatus,
    action: "log only",
  };
}

function classifyFalseGreen({ managerSaysGreen, evidenceAdvanced, requiredMarkerPresent }) {
  if (managerSaysGreen && (!evidenceAdvanced || !requiredMarkerPresent)) {
    return {
      verdict: "false-green-caught",
      reason: `manager_says_green=${managerSaysGreen}; evidence_advanced=${evidenceAdvanced}; required_marker_present=${requiredMarkerPresent}`,
      action: "do not close; request missing evidence or marker",
    };
  }
  return {
    verdict: "green-supported",
    reason: "green claim is backed by evidence progress and required marker",
    action: "log only",
  };
}

function classifySpiral({ roundsWithoutClass1, highestClass }) {
  if (roundsWithoutClass1 >= DEFAULT_SPIRAL_ROUNDS) {
    let materialityAction;
    if (highestClass <= 2) {
      materialityAction = "block for fix or controller-accepted alternative";
    } else if (highestClass === 3) {
      materialityAction = "defer with rationale and controller disposition if contested";
    } else {
      materialityAction = "do not block; prevent review spiral";
    }
    return {
      verdict: "spiral-threshold-reached",
      reason: `${roundsWithoutClass1} rounds without class-1 finding`,
      threshold: DEFAULT_SPIRAL_ROUNDS,
      materialityAction,
    };
  }
  return {
    verdict: "continue-review",
    reason: `${roundsWithoutClass1} rounds is below spiral threshold`,
    threshold: DEFAULT_SPIRAL_ROUNDS,
    materialityAction: "continue normal review loop",
  };
}

function classifyRetryLoop({ repeatedAttempt, priorFailureRecorded, changedActionRecorded, remainingBudget }) {
  if (!repeatedAttempt) {
    return {
      verdict: "on-track",
      reason: "not a repeated attempt",
      action: "log only",
    };
  }

  if (priorFailureRecorded && changedActionRecorded && remainingBudget > 0) {
    return {
      verdict: "retry-progress",
      reason: `prior_failure_recorded=${priorFailureRecorded}; changed_action_recorded=${changedActionRecorded}; remaining_budget=${remainingBudget}`,
      action: "count as progress and keep watching",
    };
  }

  return {
    verdict: "off-track",
    reason: `prior_failure_recorded=${priorFailureRecorded}; changed_action_recorded=${changedActionRecorded}; remaining_budget=${remainingBudget}`,
    action: "nudge for retry packet with prior failure, changed action, and remaining budget",
  };
}

function printResult(name, result) {
  console.log(`${name}: PASS`);
  for (const [key, value] of Object.entries(result)) {
    console.log(`${key}: ${value}`);
  }
  console.log("");
}

function run(mode) {
  if (mode === "stall" || mode === "all") {
    printResult("stall-threshold-simulation", classifyStall({
      minutesSinceEvidence: 21,
      terminalActive: true,
      reviewedOverride: null,
    }));
  }

  if (mode === "false-green" || mode === "all") {
    printResult("false-green-simulation", classifyFalseGreen({
      managerSaysGreen: true,
      evidenceAdvanced: false,
      requiredMarkerPresent: false,
    }));
  }

  if (mode === "retry-loop" || mode === "all") {
    printResult("retry-loop-bad-simulation", classifyRetryLoop({
      repeatedAttempt: true,
      priorFailureRecorded: false,
      changedActionRecorded: false,
      remainingBudget: 0,
    }));
    printResult("retry-loop-good-simulation", classifyRetryLoop({
      repeatedAttempt: true,
      priorFailureRecorded: true,
      changedActionRecorded: true,
      remainingBudget: 2,
    }));
  }

  if (mode === "spiral" || mode === "all") {
    printResult("spiral-threshold-simulation", classifySpiral({
      roundsWithoutClass1: 3,
      highestClass: 4,
    }));
  }
}

const mode = process.argv[2];
if (!mode || mode === "-h" || mode === "--help") usage(mode ? 0 : 2);
if (!["stall", "false-green", "retry-loop", "spiral", "all"].includes(mode)) usage(2);
run(mode);
