// Copyright Ayers Electronics Inc. All rights reserved.
import { Buffer } from "node:buffer";
import { equal, exactKeys, requireValue } from "./ci-execution-inputs.mjs";

const marker = "AYERS_EXECUTION_INPUTS_V2 ";
const identity = (step) =>
  exactKeys(step, ["name", "number"]) &&
  typeof step.name === "string" &&
  step.name.length > 0 &&
  step.name.length <= 200 &&
  Number.isSafeInteger(step.number) &&
  step.number > 1;

/** Slots retain a separate producer, plan and checks under one physical native job. */
export function witnessMeasurements(job) {
  if (!Object.hasOwn(job, "slots")) return [job];
  requireValue(
    exactKeys(job, ["name", "key", "actions", "checkouts", "role", "slots"]) &&
      job.role === "inputs" &&
      Array.isArray(job.slots) &&
      job.slots.length >= 2 &&
      job.slots.every(
        (slot) =>
          exactKeys(slot, ["name", "step", "plan", "checks"]) &&
          typeof slot.name === "string" &&
          /^[\w-]{1,80}$/.test(slot.name) &&
          identity(slot.step) &&
          Array.isArray(slot.checks) &&
          slot.checks.length > 0 &&
          slot.checks.every(identity),
      ),
    "Invalid registered witness slots",
  );
  const producers = job.slots.map((slot) => slot.step);
  const checks = job.slots.flatMap((slot) => slot.checks);
  const steps = [...producers, ...checks];
  requireValue(
    new Set(job.slots.map((slot) => slot.name)).size === job.slots.length &&
      new Set(steps.map((step) => step.name)).size === steps.length &&
      new Set(steps.map((step) => step.number)).size === steps.length &&
      producers.every((step, index) => index === 0 || step.number > producers[index - 1].number) &&
      checks.every((check) => producers.every((step) => check.number > step.number)),
    "Witness producers and checks overlap or run out of order",
  );
  const { slots, ...physical } = job;
  return slots.map((slot) => ({ ...physical, step: slot.step, plan: slot.plan, checks: slot.checks }));
}

/** Native windows must identify one immutable invocation and one record for every slot. */
export function readWitnessSlots(log, apiJob, job, producer) {
  witnessMeasurements(job);
  requireValue(typeof log === "string" && Buffer.byteLength(log) <= 32 * 1024 * 1024, "Invalid witness job log");
  const lines = log
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line, index) => {
      const match = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{7}Z) (.*)$/.exec(line);
      requireValue(match && Number.isFinite(Date.parse(match[1])), "Malformed witness log line");
      return { time: Date.parse(match[1]), text: match[2], index };
    });
  const actualStep = (expected) => {
    const matches = apiJob.steps?.filter((step) => step.name === expected.name || step.number === expected.number);
    requireValue(
      matches?.length === 1 &&
        matches[0].name === expected.name &&
        matches[0].number === expected.number &&
        matches[0].status === "completed" &&
        matches[0].conclusion === "success" &&
        Number.isFinite(Date.parse(matches[0].started_at)) &&
        Date.parse(matches[0].completed_at) >= Date.parse(matches[0].started_at),
      "Registered witness step is missing, ambiguous or unsuccessful",
    );
    return matches[0];
  };
  const windows = job.slots.map((slot) => {
    const step = actualStep(slot.step);
    return { slot, start: Date.parse(step.started_at), end: Date.parse(step.completed_at) + 1000 };
  });
  requireValue(
    windows.every((window, index) => index === 0 || window.start >= windows[index - 1].end),
    "Ambiguous native producer windows",
  );
  for (const slot of job.slots)
    for (const check of slot.checks)
      requireValue(
        Date.parse(actualStep(check).started_at) >= windows.at(-1).end,
        "Witness checks began before all producer windows ended",
      );
  const prefix = `##[group]Run ${producer.repository}/${producer.path}@`;
  const reference = `${prefix}${producer.commit}`;
  const records = lines.filter((line) => line.text.startsWith(marker));
  const invocations = lines.filter((line) => line.text.startsWith(prefix));
  requireValue(
    records.length === windows.length && invocations.length === windows.length,
    "Missing, extra or unregistered witness record or invocation",
  );
  const owners = (line) => windows.filter((window) => line.time >= window.start && line.time < window.end);
  requireValue(
    [...records, ...invocations].every((line) => owners(line).length === 1),
    "Witness output has no unique registered producer window",
  );
  return windows.map((window) => {
    const record = records.filter((line) => owners(line)[0] === window);
    const invocation = invocations.filter((line) => owners(line)[0] === window);
    requireValue(
      record.length === 1 &&
        invocation.length === 1 &&
        invocation[0].text === reference &&
        invocation[0].index < record[0].index &&
        invocation[0].time <= record[0].time,
      "Missing or ambiguous immutable slot invocation",
    );
    const encoded = record[0].text.slice(marker.length);
    requireValue(
      encoded.length <= 64 * 1024 && /^[A-Za-z0-9+/]+={0,2}$/.test(encoded),
      "Invalid witness record encoding",
    );
    const bytes = Buffer.from(encoded, "base64");
    const receipt = JSON.parse(bytes.toString("utf8"));
    requireValue(
      bytes.toString("base64") === encoded && equal(JSON.stringify(receipt), bytes.toString("utf8")),
      "Noncanonical witness record",
    );
    return { name: window.slot.name, receipt };
  });
}
