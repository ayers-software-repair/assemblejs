// Copyright Ayers Electronics Inc. All rights reserved.
// Mapping changes orchestration identities only; measured execution inputs must remain identical.
import { digest, equal, exactKeys, hash, requireValue, sha, validatePlan } from "./ci-execution-inputs.mjs";
import { validateMainTopology } from "./ci-main-topology.mjs";
import { witnessMeasurements } from "./ci-witness-slots.mjs";

const action = /^[\w.-]+\/[\w.-]+@[0-9a-f]{40}$/;
const positive = (value) => Number.isSafeInteger(value) && value > 0;
const names = (value) =>
  Array.isArray(value) &&
  value.every((name) => typeof name === "string" && name.length > 0 && name.length <= 200) &&
  new Set(value).size === value.length;

export function validateMergePolicy(policy, requiredJobs) {
  requireValue(
    exactKeys(policy, ["pullRequest", "main", "mapping"]) &&
      Array.isArray(policy.pullRequest?.jobs) &&
      Array.isArray(policy.main?.jobs) &&
      equal(policy.pullRequest.jobs.map((job) => job.name).sort(), [...requiredJobs].sort()) &&
      Array.isArray(policy.mapping) &&
      policy.mapping.length === requiredJobs.length &&
      policy.mapping.every(
        (item) =>
          exactKeys(item, [
            "pullRequestJob",
            "mainJob",
            "sourceIdentity",
            ...(Object.hasOwn(item, "mainSlot") ? ["mainSlot"] : []),
          ]) &&
          requiredJobs.includes(item.pullRequestJob) &&
          policy.main.jobs.some(
            (job) =>
              job.name === item.mainJob &&
              (Object.hasOwn(job, "slots")
                ? job.slots.some((slot) => slot.name === item.mainSlot)
                : !Object.hasOwn(item, "mainSlot")),
          ) &&
          item.sourceIdentity === "same-tree-worktree",
      ) &&
      new Set(policy.mapping.map((item) => item.pullRequestJob)).size === requiredJobs.length &&
      new Set(policy.mapping.map((item) => JSON.stringify([item.mainJob, item.mainSlot ?? null]))).size ===
        requiredJobs.length &&
      policy.main.jobs.every(
        (job) =>
          !Object.hasOwn(job, "slots") ||
          job.slots.every((slot) =>
            policy.mapping.some((item) => item.mainJob === job.name && item.mainSlot === slot.name),
          ),
      ) &&
      Array.isArray(policy.main.topology?.reusedJobs) &&
      policy.main.topology.reusedJobs.every((name) => requiredJobs.includes(name)),
    "Missing complete immutable PR-to-main input mapping",
  );
  if (Object.hasOwn(policy.pullRequest, "controls")) validateOrchestrationControls(policy.pullRequest, requiredJobs);
  requireValue(
    policy.pullRequest.workflowHash === policy.main.workflowHash &&
      equal(policy.pullRequest.producer, policy.main.producer),
    "Workflow or producer configuration differs",
  );
  for (const item of policy.mapping) {
    const original = policy.pullRequest.jobs.find((job) => job.name === item.pullRequestJob);
    const physical = policy.main.jobs.find((job) => job.name === item.mainJob);
    const fresh = Object.hasOwn(physical, "slots")
      ? { ...physical, ...physical.slots.find((slot) => slot.name === item.mainSlot) }
      : physical;
    for (const field of ["plan", "checkouts", "actions"])
      requireValue(equal(original[field], fresh[field]), `Mapped ${field} configuration differs`);
  }
}

export function compareExecutionInputs(policy, original, main) {
  requireValue(
    original.kind === "hosted-actual-bootstrap-inputs" &&
      main.kind === "hosted-actual-main-inputs" &&
      original.workflowHash === main.workflowHash &&
      equal(original.producer, main.producer),
    "Native execution workflow or producer differs",
  );
  for (const mapping of policy.mapping) {
    const before = original.jobs.filter((job) => job.name === mapping.pullRequestJob);
    const after = main.jobs.filter((job) => job.name === mapping.mainJob);
    requireValue(before.length === 1 && after.length === 1, "Mapped native witness is missing or ambiguous");
    const left = before[0],
      right = after[0];
    for (const field of ["runner", "operatingSystem", "image", "actions"])
      requireValue(equal(left[field], right[field]), `Actual ${field} inputs differ`);
    // Native resolvers bind event/run/job context independently; only source commit/parents may differ.
    const measured = (receipt) => {
      const { context, checkouts, ...inputs } = receipt;
      requireValue(context, "Missing native execution context");
      return {
        ...inputs,
        checkouts: checkouts.map((checkout) => {
          if (checkout.name !== "source") return checkout;
          const { sha, parents, ...treeAndWorktree } = checkout;
          requireValue(sha && parents, "Missing native source identity");
          return treeAndWorktree;
        }),
      };
    };
    const receipts = Object.hasOwn(mapping, "mainSlot")
      ? right.slots?.filter((slot) => slot.name === mapping.mainSlot)
      : [{ receipt: right.receipt }];
    requireValue(receipts?.length === 1, "Mapped native slot is missing or ambiguous");
    requireValue(
      equal(measured(left.receipt), measured(receipts[0].receipt)),
      "Actual measured execution inputs differ",
    );
  }
}

/** Controls are reviewed workflow jobs with native checks, never measured execution witnesses. */
export function validateOrchestrationControls(policy, requiredJobs, nonTestJobs = [], workflowBytes) {
  const controls = policy.controls ?? [];
  const all = [...policy.jobs, ...controls];
  requireValue(
    Array.isArray(controls) &&
      controls.length > 0 &&
      names(all.map((job) => job.name)) &&
      !controls.some((job) => nonTestJobs.includes(job.name)) &&
      controls.filter((job) => job.kind === "candidate-producer").length === 1,
    "Missing exact orchestration control inventory",
  );
  for (const control of controls) {
    const candidate = control.kind === "candidate-producer";
    requireValue(
      exactKeys(control, [
        "name",
        "key",
        "kind",
        "workflowJobHash",
        "needs",
        "checks",
        "actions",
        ...(candidate ? ["uploadAction"] : []),
      ]) &&
        ["candidate-producer", "aggregate"].includes(control.kind) &&
        /^[\w-]+$/.test(control.key ?? "") &&
        control.name === control.key &&
        !policy.jobs.some((job) => job.key === control.key) &&
        hash.test(control.workflowJobHash ?? "") &&
        names(control.needs) &&
        !control.needs.includes(control.name) &&
        control.needs.every((name) => all.some((job) => job.name === name)) &&
        (candidate || control.needs.length > 0) &&
        Array.isArray(control.checks) &&
        control.checks.length >= (candidate ? 2 : 1) &&
        control.checks.every(
          (step, index) =>
            exactKeys(step, ["name", "number"]) &&
            names([step.name]) &&
            positive(step.number) &&
            step.number > (control.checks[index - 1]?.number ?? 1),
        ) &&
        names(control.checks.map((step) => step.name)) &&
        Array.isArray(control.actions) &&
        names(control.actions) &&
        control.actions.every((item) => /^[\w.-]+\/[\w.-]+@[0-9a-f]{40}$/.test(item)) &&
        (!candidate ||
          (/^actions\/upload-artifact@[0-9a-f]{40}$/.test(control.uploadAction ?? "") &&
            control.actions.includes(control.uploadAction))),
      "Invalid reviewed orchestration control",
    );
    if (workflowBytes) {
      const source = workflowBytes.toString("utf8");
      const section = source.indexOf("\njobs:\n");
      const jobs = [...source.matchAll(/^  ([\w-]+):[ \t]*$/gm)].filter((match) => match.index > section);
      const index = jobs.findIndex((match) => match[1] === control.key);
      requireValue(
        section >= 0 && index >= 0 && jobs.filter((match) => match[1] === control.key).length === 1,
        "Control workflow key is unavailable",
      );
      const code = source.slice(jobs[index].index, jobs[index + 1]?.index ?? source.length);
      const fields = code.split("\n");
      const content = fields.slice(1).filter((line) => line.trim() && !/^\s*#/.test(line));
      requireValue(
        content.length > 0 &&
          content[0].search(/\S/) === 4 &&
          content.every((line) => line.search(/\S/) > 4 || /^    [\w-]+:(?:[ \t]|$)/.test(line)),
        "Unsupported control workflow layout",
      );
      const explicitNames = fields.filter((line) => line.startsWith("    name:"));
      requireValue(
        digest(code) === control.workflowJobHash &&
          !/^    (strategy|uses):/m.test(code) &&
          (explicitNames.length === 0 ||
            (explicitNames.length === 1 && explicitNames[0] === `    name: ${control.name}`)),
        "Control workflow implementation differs",
      );
      const starts = fields.flatMap((line, index) => (line.startsWith("    needs:") ? [index] : []));
      requireValue(starts.length <= 1, "Duplicate control dependency field");
      let raw = "";
      if (starts.length) {
        const start = starts[0];
        raw = fields[start].slice("    needs:".length);
        for (let i = start + 1; i < fields.length && /^ {6,}\S/.test(fields[i]); i++) raw += fields[i].trim();
      }
      raw = raw.replace(/\s/g, "");
      requireValue(
        (!starts.length || raw.length > 0) &&
          (raw === "" || /^[\w-]+$/.test(raw) || /^\[(?:[\w-]+,)*[\w-]*\]$/.test(raw)),
        "Unsupported control dependency syntax",
      );
      const keys = raw ? (raw.startsWith("[") ? raw.slice(1, -1).split(",").filter(Boolean) : [raw]) : [];
      requireValue(
        names(keys) &&
          keys.every((key) => all.some((job) => job.key === key)) &&
          equal(
            all
              .filter((job) => keys.includes(job.key))
              .map((job) => job.name)
              .sort(),
            [...control.needs].sort(),
          ),
        "Control dependencies omit or change workflow jobs or matrix legs",
      );
    }
  }
  const visit = (name, visiting = []) => {
    requireValue(!visiting.includes(name), "Cyclic orchestration controls");
    const control = controls.find((job) => job.name === name);
    return new Set([
      name,
      ...(control?.needs.flatMap((dependency) => [...visit(dependency, [...visiting, name])]) ?? []),
    ]);
  };
  requireValue(
    controls.some((control) => [...visit(control.name)].length === requiredJobs.length + controls.length),
    "No control covers the complete original attempt",
  );
  return controls;
}

export function validateExecutionPolicy(policy, requiredJobs, main) {
  requireValue(
    exactKeys(policy, [
      "workflowHash",
      "producer",
      "jobs",
      ...(main ? ["topology"] : Object.hasOwn(policy ?? {}, "controls") ? ["controls"] : []),
    ]) &&
      hash.test(policy.workflowHash ?? "") &&
      exactKeys(policy.producer, ["repository", "commit", "path"]) &&
      /^[\w.-]+\/[\w.-]+$/.test(policy.producer.repository ?? "") &&
      sha.test(policy.producer.commit ?? "") &&
      policy.producer.path === "codestyle/ci/actions/execution-inputs" &&
      Array.isArray(policy.jobs) &&
      equal(policy.jobs.map((job) => job.name).sort(), [...requiredJobs].sort()),
    "Missing trusted execution producer policy",
  );
  if (main) {
    validateMainTopology(policy.topology, requiredJobs);
    requireValue(
      policy.jobs.some((job) => job.role === "identity") && policy.jobs.some((job) => job.role === "style"),
      "Fresh-main policy requires named identity and style checks",
    );
  }
  for (const physical of policy.jobs) {
    requireValue(main || !Object.hasOwn(physical, "slots"), "Slots require fresh main execution");
    for (const job of witnessMeasurements(physical)) {
      requireValue(
        exactKeys(job, ["name", "key", "step", "actions", "checkouts", "plan", ...(main ? ["role", "checks"] : [])]) &&
          (!main ||
            (["identity", "style", "inputs"].includes(job.role) &&
              Array.isArray(job.checks) &&
              job.checks.length > 0 &&
              job.checks.every(
                (step) =>
                  exactKeys(step, ["name", "number"]) &&
                  typeof step.name === "string" &&
                  step.name.length > 0 &&
                  step.name.length <= 200 &&
                  Number.isSafeInteger(step.number) &&
                  step.number > job.step?.number,
              ) &&
              new Set(job.checks.map((step) => step.name)).size === job.checks.length &&
              new Set(job.checks.map((step) => step.number)).size === job.checks.length)) &&
          /^[\w-]+$/.test(job.key ?? "") &&
          exactKeys(job.step, ["name", "number"]) &&
          typeof job.step.name === "string" &&
          job.step.name.length > 0 &&
          Number.isSafeInteger(job.step.number) &&
          job.step.number > 1 &&
          Array.isArray(job.actions) &&
          job.actions.length > 0 &&
          job.actions.every((item) => action.test(item)) &&
          new Set(job.actions).size === job.actions.length &&
          job.actions.includes(`${policy.producer.repository}@${policy.producer.commit}`),
        "Invalid per-job immutable producer policy",
      );
      validatePlan(job.plan);
      requireValue(
        Array.isArray(job.checkouts) &&
          equal(
            job.checkouts.map((item) => item.name),
            job.plan.checkouts.map((item) => item.name),
          ) &&
          job.checkouts.every(
            (item) => exactKeys(item, ["name", "repository"]) && /^[\w.-]+\/[\w.-]+$/.test(item.repository ?? ""),
          ) &&
          job.checkouts.find((item) => item.name === "platform").repository === policy.producer.repository,
        "Incomplete checkout repository policy",
      );
    }
  }
}
