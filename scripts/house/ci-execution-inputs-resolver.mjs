// Copyright Ayers Electronics Inc. All rights reserved.
// Only a reviewed workflow and immutable producer may turn a job log into measured input evidence.
import { Buffer } from "node:buffer";
import {
  readApi,
  readHostedJobBootstraps,
  readHostedMainJobBootstraps,
  readJobLog,
  readOrchestrationControl,
} from "./ci-job-bootstrap.mjs";
import { digest, equal, exactKeys, requireValue, sha, validateReceipt } from "./ci-execution-inputs.mjs";
import { validateExecutionPolicy, validateOrchestrationControls } from "./ci-merge-inputs.mjs";
import { readWitnessSlots } from "./ci-witness-slots.mjs";

const marker = "AYERS_EXECUTION_INPUTS_V2 ";
const single = (pages) => {
  requireValue(
    Array.isArray(pages) && pages.length === 1 && pages[0] && !Array.isArray(pages[0]),
    "Invalid API object",
  );
  return pages[0];
};

function receiptFromLog(log, job, producer) {
  const lines = log
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const match = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{7}Z) (.*)$/.exec(line);
      requireValue(match, "Malformed execution log line");
      return { time: Date.parse(match[1]), text: match[2] };
    });
  const records = lines.filter((line) => line.text.startsWith(marker));
  requireValue(records.length === 1, "Missing or ambiguous actual execution record");
  const record = records[0];
  requireValue(
    record.time >= Date.parse(job.started_at) && record.time < Date.parse(job.completed_at) + 1000,
    "Record is outside producer step",
  );
  const reference = `${producer.repository}/${producer.path}@${producer.commit}`;
  const start = lines.filter((line) => line.text === `##[group]Run ${reference}` && line.time <= record.time);
  requireValue(
    start.length === 1 && start[0].time >= Date.parse(job.started_at),
    "Missing immutable producer invocation",
  );
  const encoded = record.text.slice(marker.length);
  requireValue(
    encoded.length <= 64 * 1024 && /^[A-Za-z0-9+/]+={0,2}$/.test(encoded),
    "Invalid execution record encoding",
  );
  const bytes = Buffer.from(encoded, "base64");
  const receipt = JSON.parse(bytes.toString("utf8"));
  requireValue(
    bytes.toString("base64") === encoded && JSON.stringify(receipt) === bytes.toString("utf8"),
    "Noncanonical execution record",
  );
  return receipt;
}

/** Returns measurements only. It does not decide policy equivalence, fresh-main checks or reuse. */
export async function readHostedExecutionInputs(options, dependencies = {}) {
  return resolveExecutionInputs(options, dependencies, false);
}

/** Original-push and exact active-main measurements only; no equivalence or skip verdict. */
export async function readHostedMainExecutionInputs(options, dependencies = {}) {
  return resolveExecutionInputs(options, dependencies, true);
}

async function resolveExecutionInputs(options, { read = readApi, readLog = readJobLog } = {}, main) {
  const { policy: suppliedPolicy, testedCheckout, expected, ...request } = options;
  const policy = JSON.parse(JSON.stringify(suppliedPolicy ?? null));
  validateExecutionPolicy(policy, request.requiredJobs, main);
  const controls = Object.hasOwn(policy, "controls")
    ? validateOrchestrationControls(policy, request.requiredJobs, request.nonTestJobs)
    : [];
  requireValue(!controls.length || request.eventName === "pull_request", "Controls require original PR execution");
  requireValue(
    !main || (request.eventName === "push" && !request.nonTestJobs?.length),
    "Invalid main measurement request",
  );
  requireValue(
    exactKeys(testedCheckout, ["sha", "tree", "parents"]) &&
      sha.test(testedCheckout.sha ?? "") &&
      sha.test(testedCheckout.tree ?? "") &&
      Array.isArray(testedCheckout.parents) &&
      testedCheckout.parents.every((value) => sha.test(value)) &&
      (request.eventName === "pull_request"
        ? testedCheckout.parents.length === 2 && testedCheckout.parents[1] === request.headSha
        : request.eventName === "push" && testedCheckout.sha === request.headSha),
    "Missing independently resolved tested source identity",
  );
  const get = async (path) => single(await read(`repos/${request.repository}/${path}`));
  const registered = await get(`actions/workflows/${request.workflow ?? "ci.yml"}`);
  requireValue(
    Number.isSafeInteger(registered.id) &&
      registered.id > 0 &&
      registered.state === "active" &&
      registered.path === `.github/workflows/${request.workflow ?? "ci.yml"}`,
    "Unregistered execution workflow",
  );
  const initial = await get(`actions/runs/${request.runId}`);
  requireValue(initial.workflow_id === registered.id, "Wrong execution workflow registration");
  const workflow = await get(`contents/${registered.path}?ref=${testedCheckout.sha}`);
  requireValue(
    workflow.type === "file" &&
      workflow.path === registered.path &&
      workflow.encoding === "base64" &&
      Number.isSafeInteger(workflow.size) &&
      workflow.size > 0 &&
      workflow.size <= 256 * 1024 &&
      typeof workflow.content === "string",
    "Missing tested workflow source",
  );
  const workflowBytes = Buffer.from(workflow.content.replace(/\n/g, ""), "base64");
  requireValue(
    workflowBytes.length === workflow.size && digest(workflowBytes) === policy.workflowHash,
    "Untrusted execution workflow bytes",
  );
  if (controls.length) validateOrchestrationControls(policy, request.requiredJobs, request.nonTestJobs, workflowBytes);
  const logs = new Map(),
    apiJobs = new Map();
  const readBootstraps = main ? readHostedMainJobBootstraps : readHostedJobBootstraps;
  const bootstrap = await readBootstraps(
    {
      ...request,
      requiredJobs: [...request.requiredJobs, ...controls.map((job) => job.name)],
      ...(main ? { topology: policy.topology } : {}),
    },
    {
      read: async (path) => {
        const pages = await read(path);
        if (path.endsWith("/jobs?per_page=100"))
          for (const page of pages) for (const job of page.jobs) apiJobs.set(job.id, job);
        return pages;
      },
      readLog: async (repository, id) => {
        const log = await readLog(repository, id);
        logs.set(id, log);
        return log;
      },
    },
  );
  if (controls.length)
    requireValue(
      equal(
        [...apiJobs.values()].map((job) => job.name).sort(),
        [...request.requiredJobs, ...controls.map((job) => job.name), ...(request.nonTestJobs ?? [])].sort(),
      ),
      "Incomplete original measured, control or cancellation inventory",
    );
  const checkCommit = async (repository, measured) => {
    const object = single(await read(`repos/${repository}/git/commits/${measured.sha}`));
    requireValue(
      object.sha === measured.sha &&
        object.tree?.sha === measured.tree &&
        equal(
          object.parents?.map((parent) => parent.sha),
          measured.parents,
        ),
      "Measured checkout Git objects differ",
    );
  };
  await checkCommit(request.repository, testedCheckout);
  const jobs = [],
    controlEvidence = [];
  let originalEvent;
  for (const native of bootstrap.jobs) {
    const control = controls.find((job) => job.name === native.name);
    if (control) {
      controlEvidence.push(
        readOrchestrationControl(
          control,
          native,
          apiJobs.get(native.jobId),
          [...apiJobs.values()],
          logs.get(native.jobId),
          request.attempt,
          request.repository,
          request.runId,
        ),
      );
      continue;
    }
    const expected = policy.jobs.find((job) => job.name === native.name);
    requireValue(
      equal(native.actions.map((item) => item.reference).sort(), [...expected.actions].sort()) &&
        native.actions.every((item) => item.reference.endsWith(`@${item.commit}`)),
      "Mutable or unexpected action implementation",
    );
    const apiJob = apiJobs.get(native.jobId);
    const slotted = Object.hasOwn(expected, "slots");
    const measurements = slotted
      ? readWitnessSlots(logs.get(native.jobId), apiJob, expected, policy.producer)
      : [{ receipt: undefined }];
    const slots = [];
    for (const measurement of measurements) {
      const registered = slotted ? expected.slots.find((slot) => slot.name === measurement.name) : expected;
      const steps = apiJob.steps?.filter((step) => step.name === registered.step.name);
      requireValue(
        steps?.length === 1 &&
          steps[0].number === registered.step.number &&
          steps[0].status === "completed" &&
          steps[0].conclusion === "success" &&
          Number.isFinite(Date.parse(steps[0].started_at)) &&
          Number.isFinite(Date.parse(steps[0].completed_at)),
        "Producer step did not execute exactly once",
      );
      if (main) {
        for (const check of registered.checks) {
          const actual = apiJob.steps.filter((step) => step.name === check.name);
          requireValue(
            actual.length === 1 &&
              actual[0].number === check.number &&
              actual[0].status === "completed" &&
              actual[0].conclusion === "success" &&
              Date.parse(actual[0].started_at) >= Date.parse(steps[0].completed_at) &&
              Date.parse(actual[0].completed_at) >= Date.parse(actual[0].started_at),
            "Required fresh-main check did not execute after measurement",
          );
        }
      }
      const receipt = validateReceipt(
        slotted ? measurement.receipt : receiptFromLog(logs.get(native.jobId), steps[0], policy.producer),
        registered.plan,
      );
      const event = receipt.context.event;
      requireValue(
        event.name === request.eventName &&
          (event.name === "pull_request"
            ? event.head === request.headSha && event.base === testedCheckout.parents[0]
            : event.ref === `refs/heads/${initial.head_branch}` && event.after === request.headSha) &&
          (!originalEvent || equal(event, originalEvent)),
        "Original execution event lineage differs",
      );
      originalEvent = event;
      requireValue(
        equal(receipt.context, {
          repository: request.repository,
          workflow: request.workflow ?? "ci.yml",
          runId: request.runId,
          attempt: request.attempt,
          job: expected.key,
          jobName: native.name,
          testedSha: testedCheckout.sha,
          workflowSha: testedCheckout.sha,
          event,
        }),
        "Actual execution record has foreign lineage",
      );
      const source = receipt.checkouts.find((item) => item.name === "source");
      requireValue(
        expected.checkouts.find((item) => item.name === "source").repository === request.repository &&
          equal({ sha: source.sha, tree: source.tree, parents: source.parents }, testedCheckout),
        "Job tested another checkout",
      );
      for (const measured of receipt.checkouts) {
        await checkCommit(expected.checkouts.find((item) => item.name === measured.name).repository, measured);
      }
      if (slotted) slots.push({ name: measurement.name, receipt });
      else jobs.push({ ...native, receipt });
    }
    if (slotted) jobs.push({ ...native, slots });
  }
  if (main) {
    requireValue(
      originalEvent?.name === "push" &&
        originalEvent.ref === "refs/heads/main" &&
        originalEvent.forced === false &&
        originalEvent.deleted === false,
      "Original event is not an ordinary main push",
    );
    const compared = await read(
      `repos/${request.repository}/compare/${originalEvent.before}...${originalEvent.after}?per_page=1`,
    );
    requireValue(
      Array.isArray(compared) &&
        compared.length > 0 &&
        compared.every(
          (page) =>
            page &&
            typeof page === "object" &&
            !Array.isArray(page) &&
            page.status === "ahead" &&
            page.merge_base_commit?.sha === originalEvent.before,
        ),
      "Original push did not advance its recorded base",
    );
  }
  const inventory = bootstrap.jobInventory ?? [...apiJobs.values()];
  const pages = await read(
    `repos/${request.repository}/actions/runs/${request.runId}/attempts/${request.attempt}/jobs?per_page=100`,
  );
  const ordered = (values) => [...values].sort((a, b) => a.id - b.id);
  requireValue(
    Array.isArray(pages) &&
      pages.length &&
      pages.every((page) => Array.isArray(page?.jobs) && page.total_count === inventory.length) &&
      equal(ordered(pages.flatMap((page) => page.jobs)), ordered(inventory)),
    "Execution jobs changed after measurement resolution",
  );
  const final = await get(`actions/runs/${request.runId}`);
  for (const key of [
    "id",
    "workflow_id",
    "run_attempt",
    "head_sha",
    "head_branch",
    "event",
    "path",
    "status",
    "conclusion",
  ])
    requireValue(final[key] === initial[key], "Execution run changed while resolving measurements");
  requireValue(final.head_repository?.full_name === request.repository, "Execution repository changed");
  const result = {
    kind: main ? "hosted-actual-main-inputs" : "hosted-actual-bootstrap-inputs",
    repository: request.repository,
    workflow: request.workflow ?? "ci.yml",
    runId: request.runId,
    attempt: request.attempt,
    headSha: request.headSha,
    testedCheckout,
    workflowHash: policy.workflowHash,
    producer: policy.producer,
    event: originalEvent,
    jobs,
    ...(controls.length ? { controls: controlEvidence } : {}),
    jobInventory: inventory,
    ...(main ? { topology: policy.topology } : {}),
  };
  const identity = { policyHash: digest(JSON.stringify(policy)), measurementsHash: digest(JSON.stringify(result)) };
  requireValue(!expected || equal(expected, identity), "Execution evidence changed during aggregation");
  return { ...result, identity };
}
