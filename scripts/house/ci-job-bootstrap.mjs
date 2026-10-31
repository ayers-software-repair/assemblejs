// Copyright Ayers Electronics Inc. All rights reserved.
// GitHub's runner setup prefix precedes action and shell output. It proves bootstrap inputs only.
import { Buffer } from "node:buffer";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { promisify } from "node:util";
import { checkMainJobs, checkMainRun, validateMainTopology } from "./ci-main-topology.mjs";
import { equal } from "./ci-execution-inputs-schema.mjs";

const exec = promisify(execFile);
const sha = /^[0-9a-f]{40}$/;
const positive = (value) => Number.isSafeInteger(value) && value > 0;
const requireValue = (value, reason) => {
  if (!value) throw new Error(reason);
};
const names = (value) =>
  Array.isArray(value) &&
  value.every((name) => typeof name === "string" && name.length > 0 && name.length <= 200) &&
  new Set(value).size === value.length;

export async function readApi(path) {
  const { stdout } = await exec("gh", ["api", path, "--paginate", "--slurp"], {
    timeout: 20_000,
    maxBuffer: 16 * 1024 * 1024,
  });
  return JSON.parse(stdout);
}

export async function readJobLog(repository, jobId) {
  const { stdout } = await exec("gh", ["api", `repos/${repository}/actions/jobs/${jobId}/logs`], {
    timeout: 30_000,
    maxBuffer: 32 * 1024 * 1024,
  });
  return stdout;
}

function bootstrap(log, name) {
  requireValue(typeof log === "string" && Buffer.byteLength(log) <= 32 * 1024 * 1024, "Invalid job log");
  const raw = log.replace(/^\uFEFF/, "").split(/\r?\n/);
  const boundary = raw.findIndex((line) => /Z Complete job name: /.test(line));
  requireValue(boundary > 0 && boundary < 1000, "Missing runner setup boundary");
  const prefix = raw.slice(0, boundary + 1).map((line) => {
    const match = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{7}Z (.*)$/.exec(line);
    requireValue(match, "Invalid runner setup log line");
    return match[1];
  });
  requireValue(
    prefix.at(-1) === `Complete job name: ${name}` &&
      !prefix.some((line) => line.startsWith("##[group]Run ")) &&
      prefix.filter((line) => line === "Prepare all required actions").length === 1,
    "Setup boundary is not before user steps",
  );
  const runner = /^Current runner version: '([0-9]+\.[0-9]+\.[0-9]+)'$/.exec(prefix[0]);
  requireValue(runner, "Missing runner version");
  const group = (name) => {
    const starts = prefix.flatMap((line, index) => (line === `##[group]${name}` ? [index] : []));
    requireValue(starts.length === 1, `Missing or ambiguous ${name}`);
    const end = prefix.indexOf("##[endgroup]", starts[0]);
    requireValue(end > starts[0], `Incomplete ${name}`);
    return prefix.slice(starts[0] + 1, end);
  };
  const image = group("Runner Image");
  const field = (key) => {
    const values = image.filter((line) => line.startsWith(`${key}: `));
    requireValue(values.length === 1 && values[0].length > key.length + 2, `Missing or ambiguous image ${key}`);
    return values[0].slice(key.length + 2);
  };
  const operatingSystem = group("Operating System");
  requireValue(operatingSystem.length > 0 && operatingSystem.every(Boolean), "Missing operating system");
  const actions = prefix
    .filter((line) => line.startsWith("Download action "))
    .map((line) => {
      const match = /^Download action repository '([\w.-]+\/[\w.-]+@[^'\s]+)' \(SHA:([0-9a-f]{40})\)$/.exec(line);
      requireValue(match, "Unsupported action bootstrap");
      return { reference: match[1], commit: match[2] };
    })
    .sort((a, b) => a.reference.localeCompare(b.reference, "en"));
  requireValue(names(actions.map((action) => action.reference)), "Ambiguous action bootstrap");
  return {
    runner: runner[1],
    operatingSystem,
    image: {
      name: field("Image"),
      version: field("Version"),
      release: field("Image Release"),
    },
    actions,
    setupLogHash: createHash("sha256")
      .update(raw.slice(0, boundary + 1).join("\n") + "\n")
      .digest("hex"),
  };
}

/** Independent API evidence for every actual job. This is not checkout/tool or full execution proof. */
export async function readHostedJobBootstraps(options, dependencies = {}) {
  return readBootstraps(options, dependencies);
}

/** Only exact reviewed roles may remain unfinished or skipped in an active main attempt. */
export async function readHostedMainJobBootstraps({ topology, ...options }, dependencies = {}) {
  validateMainTopology(topology, options.requiredJobs);
  requireValue(options.eventName === "push" && !options.nonTestJobs?.length, "Invalid fresh-main request");
  return readBootstraps(options, dependencies, topology);
}

async function readBootstraps(
  { repository, workflow = "ci.yml", eventName, runId, attempt, headSha, requiredJobs, nonTestJobs = [] },
  { read = readApi, readLog = readJobLog } = {},
  topology,
) {
  requireValue(
    /^[\w.-]+\/[\w.-]+$/.test(repository ?? "") &&
      /^[\w.-]+\.yml$/.test(workflow) &&
      ["push", "pull_request"].includes(eventName) &&
      positive(runId) &&
      positive(attempt) &&
      sha.test(headSha ?? "") &&
      names(requiredJobs) &&
      requiredJobs.length &&
      names(nonTestJobs) &&
      !nonTestJobs.some((name) => requiredJobs.includes(name)),
    "Invalid bootstrap evidence request",
  );
  const root = `repos/${repository}/actions`;
  const get = async (path) => {
    const pages = await read(`${root}/${path}`);
    requireValue(
      Array.isArray(pages) && pages.length === 1 && pages[0] && !Array.isArray(pages[0]),
      "Invalid API object",
    );
    return pages[0];
  };
  const checkRun = (run) =>
    requireValue(
      run.id === runId &&
        run.run_attempt === attempt &&
        run.head_sha === headSha &&
        run.event === eventName &&
        run.path === `.github/workflows/${workflow}` &&
        run.head_repository?.full_name === repository &&
        (topology || (run.status === "completed" && run.conclusion === "success")),
      "Bootstrap run or attempt changed",
    );
  const initial = await get(`runs/${runId}`);
  checkRun(initial);
  if (topology) checkMainRun(initial);
  const exact = await get(`runs/${runId}/attempts/${attempt}`);
  checkRun(exact);
  if (topology) checkMainRun(exact);
  const pages = await read(`${root}/runs/${runId}/attempts/${attempt}/jobs?per_page=100`);
  requireValue(
    Array.isArray(pages) && pages.length && pages.every((page) => Array.isArray(page?.jobs)),
    "Invalid job pages",
  );
  const jobs = pages.flatMap((page) => page.jobs);
  requireValue(
    jobs.length &&
      pages.every((page) => page.total_count === jobs.length) &&
      names(jobs.map((job) => job.name)) &&
      new Set(jobs.map((job) => job.id)).size === jobs.length &&
      requiredJobs.every((name) => jobs.some((job) => job.name === name)) &&
      jobs.every(
        (job) =>
          positive(job.id) &&
          job.run_id === runId &&
          job.run_attempt === attempt &&
          job.head_sha === headSha &&
          (topology ||
            (job.status === "completed" &&
              (requiredJobs.includes(job.name)
                ? job.conclusion === "success"
                : nonTestJobs.includes(job.name) && job.conclusion === "skipped"))),
      ),
    "Incomplete or ambiguous bootstrap job inventory",
  );
  if (topology) checkMainJobs(jobs, requiredJobs, topology);
  const result = [];
  for (const job of jobs
    .filter((job) => requiredJobs.includes(job.name))
    .sort((a, b) => a.name.localeCompare(b.name, "en"))) {
    requireValue(
      job.runner_group_name === "GitHub Actions" &&
        job.runner_group_id === 0 &&
        positive(job.runner_id) &&
        job.runner_name === `GitHub Actions ${job.runner_id}` &&
        job.steps?.[0]?.name === "Set up job" &&
        job.steps[0].number === 1 &&
        job.steps[0].status === "completed" &&
        job.steps[0].conclusion === "success",
      "Job is not a successful GitHub-hosted runner setup",
    );
    result.push({
      jobId: job.id,
      name: job.name,
      ...bootstrap(await readLog(repository, job.id), job.name),
    });
  }
  const final = await get(`runs/${runId}`);
  checkRun(final);
  if (topology) {
    checkMainRun(final);
    requireValue(final.workflow_id === initial.workflow_id, "Fresh-main workflow changed");
    const finalPages = await read(`${root}/runs/${runId}/attempts/${attempt}/jobs?per_page=100`);
    requireValue(
      Array.isArray(finalPages) &&
        finalPages.length &&
        finalPages.every((page) => Array.isArray(page?.jobs) && page.total_count === jobs.length),
      "Fresh-main final inventory unavailable",
    );
    const ordered = (values) => [...values].sort((a, b) => a.id - b.id);
    requireValue(
      JSON.stringify(ordered(finalPages.flatMap((page) => page.jobs))) === JSON.stringify(ordered(jobs)),
      "Fresh-main jobs changed during verification",
    );
  }
  return {
    kind: "hosted-job-bootstrap-only",
    repository,
    workflow,
    runId,
    attempt,
    headSha,
    jobs: result,
    ...(topology ? { topology, jobInventory: jobs } : {}),
  };
}

export function readOrchestrationControl(control, native, apiJob, inventory, log, attempt, repository, runId) {
  let previous;
  const checks = control.checks.map((check) => {
    const actual = apiJob.steps?.filter((step) => step.name === check.name);
    const step = actual?.[0];
    requireValue(
      actual?.length === 1 &&
        step.number === check.number &&
        step.status === "completed" &&
        step.conclusion === "success" &&
        Number.isFinite(Date.parse(step.started_at)) &&
        Date.parse(step.completed_at) >= Date.parse(step.started_at) &&
        (!previous || Date.parse(step.started_at) >= Date.parse(previous.completed_at)),
      "Required orchestration check did not execute successfully",
    );
    previous = step;
    return step;
  });
  requireValue(
    equal(native.actions.map((item) => item.reference).sort(), [...control.actions].sort()) &&
      native.actions.every((item) => item.reference.endsWith(`@${item.commit}`)) &&
      control.needs.every((name) =>
        inventory.some((job) => job.name === name && job.status === "completed" && job.conclusion === "success"),
      ),
    "Orchestration actions or native dependencies differ",
  );
  let artifact;
  if (control.kind === "candidate-producer") {
    const upload = checks.at(-1);
    const lines = log
      .split(/\r?\n/)
      .flatMap((line) => {
        const match = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{7}Z) (.*)$/.exec(line);
        return match ? [{ time: Date.parse(match[1]), text: match[2] }] : [];
      })
      .filter(
        (line) => line.time >= Date.parse(upload.started_at) && line.time < Date.parse(upload.completed_at) + 1000,
      );
    const invocation = lines.filter((line) => line.text.startsWith("##[group]Run actions/upload-artifact@"));
    const digests = lines.filter((line) => line.text.startsWith("SHA256 digest of uploaded artifact"));
    const uploads = lines.filter(
      (line) => line.text.startsWith("Artifact ") && line.text.includes(" has been successfully uploaded!"),
    );
    const urls = lines.filter((line) => line.text.startsWith("Artifact download URL: "));
    const match =
      /^Artifact ([\w.-]+) has been successfully uploaded! Final size is ([0-9]+) bytes\. Artifact ID is ([0-9]+)$/.exec(
        uploads[0]?.text ?? "",
      );
    requireValue(
      invocation.length === 1 &&
        invocation[0].text === `##[group]Run ${control.uploadAction}` &&
        digests.length === 1 &&
        /^SHA256 digest of uploaded artifact is [0-9a-f]{64}$/.test(digests[0].text) &&
        uploads.length === 1 &&
        match &&
        match[1] === `ci-proof-${attempt}` &&
        positive(Number(match[2])) &&
        positive(Number(match[3])) &&
        digests[0].time >= invocation[0].time &&
        uploads[0].time >= digests[0].time &&
        urls.length === 1 &&
        urls[0].time >= uploads[0].time &&
        urls[0].text ===
          `Artifact download URL: https://github.com/${repository}/actions/runs/${runId}/artifacts/${match[3]}`,
      "Candidate artifact is not the registered native upload",
    );
    artifact = {
      id: Number(match[3]),
      name: match[1],
      size_in_bytes: Number(match[2]),
      digest: `sha256:${digests[0].text.slice(-64)}`,
    };
  }
  return {
    ...native,
    key: control.key,
    kind: control.kind,
    checks,
    needs: control.needs,
    ...(artifact ? { artifact } : {}),
  };
}
