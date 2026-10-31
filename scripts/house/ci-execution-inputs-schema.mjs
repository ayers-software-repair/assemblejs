// Copyright Ayers Electronics Inc. All rights reserved.
import { createHash } from "node:crypto";
import { isAbsolute, relative, sep } from "node:path";

export const sha = /^[0-9a-f]{40}$/;
export const hash = /^[0-9a-f]{64}$/;
export const requireValue = (value, reason) => {
  if (!value) throw new Error(reason);
};
export const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
export const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
export const exactKeys = (value, keys) =>
  value && typeof value === "object" && !Array.isArray(value) && equal(Object.keys(value).sort(), [...keys].sort());
const named = (items) =>
  Array.isArray(items) &&
  items.length <= 100 &&
  items.every((item) => /^[A-Za-z0-9_.-]{1,100}$/.test(item?.name ?? "")) &&
  new Set(items.map((item) => item.name)).size === items.length;
const location = (path) =>
  typeof path === "string" && path.length > 0 && path.length <= 4096 && !/[\x00-\x1f]/.test(path);

export function validatePlan(plan) {
  requireValue(
    exactKeys(plan, ["checkouts", "tools", "inputs", "environment"]) &&
      [plan.checkouts, plan.tools, plan.inputs].every(named) &&
      plan.checkouts.length >= 2 &&
      plan.tools.length > 0 &&
      plan.inputs.length > 0 &&
      plan.checkouts.some((item) => item.name === "source") &&
      plan.checkouts.some((item) => item.name === "platform") &&
      plan.checkouts.every((item) => exactKeys(item, ["name", "path"]) && location(item.path)) &&
      plan.tools.every(
        (item) =>
          exactKeys(item, ["name", "command", "root"]) &&
          /^[A-Za-z0-9_.+-]+$/.test(item.command) &&
          location(item.root),
      ) &&
      plan.inputs.every((item) => exactKeys(item, ["name", "path"]) && location(item.path)) &&
      Array.isArray(plan.environment) &&
      plan.environment.length <= 100 &&
      plan.environment.every((name) => /^[A-Z][A-Z0-9_]*$/.test(name)) &&
      new Set(plan.environment).size === plan.environment.length,
    "Incomplete execution input plan",
  );
  return plan;
}

export const within = (root, path) => {
  const rel = relative(root, path);
  return rel === "" || (!isAbsolute(rel) && rel !== ".." && !rel.startsWith(`..${sep}`));
};
export function validateExecutionEvent(event, repository, testedSha) {
  requireValue(
    /^[\w.-]+\/[\w.-]+$/.test(repository ?? "") && sha.test(testedSha ?? "") && event?.repository === repository,
    "Execution event repository or source differs",
  );
  if (event.name === "push") {
    requireValue(
      exactKeys(event, ["name", "repository", "ref", "before", "after", "forced", "deleted"]) &&
        /^refs\/heads\/[^\s\x00-\x1f]+$/.test(event.ref ?? "") &&
        sha.test(event.before ?? "") &&
        event.before !== "0".repeat(40) &&
        event.after === testedSha &&
        typeof event.forced === "boolean" &&
        typeof event.deleted === "boolean",
      "Invalid original push event",
    );
  } else {
    requireValue(
      exactKeys(event, ["name", "repository", "number", "base", "head"]) &&
        event.name === "pull_request" &&
        Number.isSafeInteger(event.number) &&
        event.number > 0 &&
        sha.test(event.base ?? "") &&
        sha.test(event.head ?? ""),
      "Invalid original PR event",
    );
  }
  return event;
}

export function validateReceipt(receipt, plan) {
  validatePlan(plan);
  const identity = receipt?.context;
  requireValue(
    exactKeys(receipt, ["schema", "context", "planHash", "runtime", "checkouts", "tools", "inputs", "environment"]) &&
      receipt.schema === 2 &&
      receipt.planHash === digest(JSON.stringify(plan)) &&
      exactKeys(identity, [
        "repository",
        "workflow",
        "runId",
        "attempt",
        "job",
        "jobName",
        "testedSha",
        "workflowSha",
        "event",
      ]) &&
      /^[\w.-]+\/[\w.-]+$/.test(identity.repository ?? "") &&
      /^[\w.-]+\.yml$/.test(identity.workflow ?? "") &&
      Number.isSafeInteger(identity.runId) &&
      identity.runId > 0 &&
      Number.isSafeInteger(identity.attempt) &&
      identity.attempt > 0 &&
      /^[\w-]+$/.test(identity.job ?? "") &&
      typeof identity.jobName === "string" &&
      identity.jobName.length > 0 &&
      sha.test(identity.testedSha ?? "") &&
      sha.test(identity.workflowSha ?? "") &&
      exactKeys(receipt.runtime, ["executable", "executableHash"]) &&
      location(receipt.runtime.executable) &&
      hash.test(receipt.runtime.executableHash),
    "Invalid execution receipt identity",
  );
  validateExecutionEvent(identity.event, identity.repository, identity.testedSha);
  const inventory = (actual, expected) =>
    named(actual) &&
    equal(
      actual.map((item) => item.name),
      expected.map((item) => item.name),
    );
  const measurement = (item) =>
    location(item.path) &&
    isAbsolute(item.path) &&
    hash.test(item.digest ?? "") &&
    Number.isSafeInteger(item.entries) &&
    item.entries > 0 &&
    item.entries <= 200_000;
  requireValue(
    inventory(receipt.checkouts, plan.checkouts) &&
      receipt.checkouts.every(
        (item) =>
          exactKeys(item, ["name", "path", "sha", "tree", "parents", "worktree"]) &&
          location(item.path) &&
          isAbsolute(item.path) &&
          sha.test(item.sha ?? "") &&
          sha.test(item.tree ?? "") &&
          Array.isArray(item.parents) &&
          item.parents.every((parent) => sha.test(parent)) &&
          exactKeys(item.worktree, ["digest", "entries", "tracked", "modePolicy"]) &&
          hash.test(item.worktree.digest ?? "") &&
          Number.isSafeInteger(item.worktree.entries) &&
          item.worktree.entries > 0 &&
          item.worktree.entries <= 200_000 &&
          Number.isSafeInteger(item.worktree.tracked) &&
          item.worktree.tracked > 0 &&
          item.worktree.tracked <= item.worktree.entries &&
          ["windows-native-byte-exact", "posix-executable-byte-exact"].includes(item.worktree.modePolicy),
      ) &&
      inventory(receipt.tools, plan.tools) &&
      receipt.tools.every(
        (item, index) =>
          exactKeys(item, ["name", "command", "executable", "executableHash", "closure"]) &&
          item.command === plan.tools[index].command &&
          location(item.executable) &&
          isAbsolute(item.executable) &&
          hash.test(item.executableHash ?? "") &&
          exactKeys(item.closure, ["path", "digest", "entries"]) &&
          measurement(item.closure) &&
          within(item.closure.path, item.executable),
      ) &&
      inventory(receipt.inputs, plan.inputs) &&
      receipt.inputs.every((item) => exactKeys(item, ["name", "path", "digest", "entries"]) && measurement(item)) &&
      Array.isArray(receipt.environment) &&
      equal(
        receipt.environment.map((item) => item.name),
        plan.environment,
      ) &&
      receipt.environment.every((item) => exactKeys(item, ["name", "value"]) && typeof item.value === "string"),
    "Incomplete actual execution input inventory",
  );
  return receipt;
}
