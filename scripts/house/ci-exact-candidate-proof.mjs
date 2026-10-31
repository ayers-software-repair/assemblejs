// Copyright Ayers Electronics Inc. All rights reserved.
// Original full PR execution proves only the identical promoted commit.
import { Buffer } from "node:buffer";
import { readApi, readHostedJobBootstraps, readJobLog, readOrchestrationControl } from "./ci-job-bootstrap.mjs";
import { readHostedExecutionInputs } from "./ci-execution-inputs-resolver.mjs";
import { readPullRequestProof } from "./ci-pr-proof.mjs";
import { validateOrchestrationControls } from "./ci-merge-inputs.mjs";
import { digest, equal, exactKeys, hash, requireValue, sha } from "./ci-execution-inputs.mjs";

const positive = (value) => Number.isSafeInteger(value) && value > 0;
const names = (items) =>
  Array.isArray(items) &&
  items.length > 0 &&
  items.every((name) => typeof name === "string" && name.length > 0 && name.length <= 200) &&
  new Set(items).size === items.length;
const single = (pages) => {
  requireValue(
    Array.isArray(pages) && pages.length === 1 && pages[0] && !Array.isArray(pages[0]),
    "Invalid API object",
  );
  return pages[0];
};
const inventory = (pages, field) => {
  requireValue(
    Array.isArray(pages) && pages.length && pages.every((page) => Array.isArray(page?.[field])),
    "Invalid API inventory",
  );
  const values = pages.flatMap((page) => page[field]);
  requireValue(
    pages.every((page) => page.total_count === values.length) &&
      values.every((item) => positive(item.id)) &&
      new Set(values.map((item) => item.id)).size === values.length,
    "Incomplete or ambiguous API inventory",
  );
  return values;
};

/** No tree equivalence, new test environment or promotion aggregate supplies execution proof. */
export async function findExactCandidateProof(options, dependencies = {}) {
  const read = dependencies.read ?? readApi;
  const readLog = dependencies.readLog ?? readJobLog;
  const readEvidence = dependencies.readEvidence ?? readPullRequestProof;
  const now = dependencies.now ?? Date.now;
  try {
    const { repository, sourceSha, requiredJobs, nonTestJobs, originalPolicy, contextPolicy, expected } = JSON.parse(
      JSON.stringify(options),
    );
    requireValue(
      exactKeys(options, [
        "repository",
        "sourceSha",
        "requiredJobs",
        "nonTestJobs",
        "originalPolicy",
        "contextPolicy",
        ...(Object.hasOwn(options, "expected") ? ["expected"] : []),
      ]) &&
        /^[\w.-]+\/[\w.-]+$/.test(repository ?? "") &&
        sha.test(sourceSha ?? "") &&
        names(requiredJobs) &&
        Array.isArray(nonTestJobs) &&
        (!nonTestJobs.length || names(nonTestJobs)) &&
        nonTestJobs.every((name) => /^stop-after-[\w-]+ \/ cancel$/.test(name)) &&
        !requiredJobs.some((name) => nonTestJobs.includes(name)) &&
        exactKeys(originalPolicy, ["workflowHash", "jobs", "controls"]) &&
        hash.test(originalPolicy.workflowHash ?? "") &&
        equal(originalPolicy.jobs?.map((job) => job.name).sort(), [...requiredJobs].sort()) &&
        contextPolicy?.jobs?.length === 1 &&
        contextPolicy.jobs[0].name === "main-context",
      "Invalid exact candidate proof request",
    );
    const get = async (path) => single(await read(`repos/${repository}/${path}`));
    const source = await get(`git/commits/${sourceSha}`);
    const parents = source.parents?.map((parent) => parent.sha);
    requireValue(
      source.sha === sourceSha &&
        sha.test(source.tree?.sha) &&
        parents?.length === 2 &&
        parents.every((id) => sha.test(id)),
      "Source is not a merge commit",
    );
    const [base, head] = parents;
    const linked = (await read(`repos/${repository}/commits/${sourceSha}/pulls?per_page=100`))
      .flat()
      .filter(
        (pr) =>
          pr.merged_at &&
          pr.merge_commit_sha === sourceSha &&
          pr.base?.ref === "main" &&
          pr.base?.repo?.full_name === repository &&
          pr.head?.repo?.full_name === repository,
      );
    requireValue(linked.length === 1 && positive(linked[0].number), "No unique merged PR for source");
    const pr = await get(`pulls/${linked[0].number}`);
    requireValue(
      pr.number === linked[0].number &&
        pr.merged === true &&
        pr.merge_commit_sha === sourceSha &&
        pr.base?.ref === "main" &&
        pr.base?.sha === base &&
        pr.head?.sha === head &&
        pr.base?.repo?.full_name === repository &&
        pr.head?.repo?.full_name === repository,
      "Authoritative merged PR differs from the candidate",
    );
    const registered = async (workflow) => {
      const value = await get(`actions/workflows/${workflow}`);
      requireValue(
        positive(value.id) && value.path === `.github/workflows/${workflow}` && value.state === "active",
        "Unregistered workflow",
      );
      return value;
    };
    const ci = await registered("ci.yml"),
      contextWorkflow = await registered("ci-context.yml");
    const latest = async (workflow, ref, event) => {
      const runs = inventory(
        await read(
          `repos/${repository}/actions/workflows/${workflow.path.split("/").at(-1)}/runs?head_sha=${ref}&event=${event}&per_page=100`,
        ),
        "workflow_runs",
      );
      const selected = runs
        .filter(
          (run) =>
            run.head_sha === ref &&
            run.event === event &&
            run.workflow_id === workflow.id &&
            run.path === workflow.path &&
            run.head_repository?.full_name === repository,
        )
        .sort((a, b) => b.id - a.id)[0];
      requireValue(
        selected &&
          selected.status === "completed" &&
          selected.conclusion === "success" &&
          positive(selected.run_attempt),
        "Latest native workflow is not successful",
      );
      return selected;
    };
    const selected = await latest(ci, head, "pull_request");
    const context = (run) =>
      run.id === selected.id &&
      run.run_attempt === selected.run_attempt &&
      run.head_sha === head &&
      run.head_branch === pr.head.ref &&
      run.event === "pull_request" &&
      run.workflow_id === ci.id &&
      run.path === ci.path &&
      run.head_repository?.full_name === repository &&
      run.status === "completed" &&
      run.conclusion === "success" &&
      Array.isArray(run.pull_requests) &&
      (!run.pull_requests.length ||
        run.pull_requests.some(
          (item) => item.number === pr.number && item.head?.sha === head && item.base?.sha === base,
        ));
    const run = await get(`actions/runs/${selected.id}`);
    requireValue(
      context(run) && context(await get(`actions/runs/${run.id}/attempts/${run.run_attempt}`)),
      "Original PR attempt differs",
    );
    const workflow = await get(`contents/${ci.path}?ref=${sourceSha}`);
    requireValue(
      workflow.type === "file" &&
        workflow.path === ci.path &&
        workflow.encoding === "base64" &&
        Number.isSafeInteger(workflow.size) &&
        workflow.size > 0 &&
        workflow.size <= 256 * 1024 &&
        typeof workflow.content === "string",
      "Original workflow bytes unavailable",
    );
    const bytes = Buffer.from(workflow.content.replace(/\n/g, ""), "base64");
    requireValue(
      bytes.length === workflow.size && digest(bytes) === originalPolicy.workflowHash,
      "Original workflow policy changed",
    );
    const controls = validateOrchestrationControls(originalPolicy, requiredJobs, nonTestJobs, bytes);
    const producers = controls.filter((control) => control.kind === "candidate-producer");
    requireValue(producers.length === 1, "Missing unique original candidate producer");
    const originalJobs = [...requiredJobs, ...controls.map((control) => control.name)];
    const logs = new Map();
    const native = await readHostedJobBootstraps(
      {
        repository,
        workflow: "ci.yml",
        eventName: "pull_request",
        runId: run.id,
        attempt: run.run_attempt,
        headSha: head,
        requiredJobs: originalJobs,
        nonTestJobs,
      },
      {
        read,
        readLog: async (repo, id) => {
          const log = await readLog(repo, id);
          logs.set(id, log);
          return log;
        },
      },
    );
    const jobs = inventory(
      await read(`repos/${repository}/actions/runs/${run.id}/attempts/${run.run_attempt}/jobs?per_page=100`),
      "jobs",
    );
    requireValue(
      equal(jobs.map((job) => job.name).sort(), [...originalJobs, ...nonTestJobs].sort()) &&
        jobs.every(
          (job) =>
            job.run_id === run.id &&
            job.run_attempt === run.run_attempt &&
            job.head_sha === head &&
            job.status === "completed" &&
            job.conclusion === (originalJobs.includes(job.name) ? "success" : "skipped"),
        ),
      "Original job inventory changed",
    );
    const controlEvidence = controls.map((control) => {
      const job = jobs.find((job) => job.name === control.name);
      return readOrchestrationControl(
        control,
        native.jobs.find((job) => job.name === control.name),
        job,
        jobs,
        logs.get(job.id),
        run.run_attempt,
        repository,
        run.id,
      );
    });
    const artifacts = inventory(
      await read(`repos/${repository}/actions/runs/${run.id}/artifacts?per_page=100`),
      "artifacts",
    ).filter((artifact) => artifact.name === `ci-proof-${run.run_attempt}`);
    requireValue(artifacts.length === 1, "Missing unique candidate artifact");
    const artifact = artifacts[0];
    const validArtifact = () =>
      artifact.expired === false &&
      Date.parse(artifact.expires_at) > now() &&
      Number.isSafeInteger(artifact.size_in_bytes) &&
      artifact.size_in_bytes > 0 &&
      artifact.size_in_bytes <= 128 * 1024 &&
      /^sha256:[0-9a-f]{64}$/.test(artifact.digest ?? "") &&
      artifact.workflow_run?.id === run.id &&
      artifact.workflow_run?.head_sha === head;
    requireValue(
      validArtifact() &&
        Object.entries(controlEvidence.find((item) => item.kind === "candidate-producer").artifact).every(
          ([key, value]) => artifact[key] === value,
        ),
      "Artifact is not the registered original native upload",
    );
    const proof = await readEvidence(repository, artifact);
    requireValue(
      exactKeys(proof, [
        "schema",
        "repository",
        "workflow",
        "pullRequest",
        "head",
        "base",
        "candidate",
        "tree",
        "runId",
        "attempt",
      ]) &&
        proof.schema === 2 &&
        proof.repository === repository &&
        proof.workflow === "ci.yml" &&
        proof.pullRequest === pr.number &&
        proof.head === head &&
        proof.base === base &&
        proof.candidate === sourceSha &&
        proof.tree === source.tree.sha &&
        proof.runId === run.id &&
        proof.attempt === run.run_attempt,
      "Original execution did not test this exact commit",
    );
    const contextRun = await latest(contextWorkflow, sourceSha, "push");
    requireValue(contextRun.head_branch === "main", "Context is not from main");
    const contextOptions = {
      repository,
      workflow: "ci-context.yml",
      eventName: "push",
      runId: contextRun.id,
      attempt: contextRun.run_attempt,
      headSha: sourceSha,
      requiredJobs: ["main-context"],
      nonTestJobs: [],
      testedCheckout: { sha: sourceSha, tree: source.tree.sha, parents },
      policy: contextPolicy,
    };
    const promotion = await readHostedExecutionInputs(contextOptions, { read, readLog });
    requireValue(
      equal(promotion.event, {
        name: "push",
        repository,
        ref: "refs/heads/main",
        before: base,
        after: sourceSha,
        forced: false,
        deleted: false,
      }),
      "Original main push did not promote the unchanged candidate",
    );
    const originalLogs = native.jobs.map(({ jobId, name }) => ({ jobId, name, sha256: digest(logs.get(jobId)) }));
    const identity = {
      sourceSha,
      tree: source.tree.sha,
      base,
      head,
      pullRequest: pr.number,
      runId: run.id,
      attempt: run.run_attempt,
      artifact,
      native,
      originalLogs,
      controls: controlEvidence,
      mainContext: promotion.identity,
      policyHash: digest(JSON.stringify({ requiredJobs, nonTestJobs, originalPolicy, contextPolicy })),
    };
    requireValue(!expected || equal(expected, identity), "Selected original execution changed");
    await readHostedExecutionInputs({ ...contextOptions, expected: promotion.identity }, { read, readLog });
    const refreshed = inventory(
      await read(`repos/${repository}/actions/runs/${run.id}/artifacts?per_page=100`),
      "artifacts",
    );
    requireValue(
      equal(
        refreshed.filter((item) => item.name === artifact.name),
        [artifact],
      ) &&
        validArtifact() &&
        equal(await readEvidence(repository, artifact), proof) &&
        equal(await get(`pulls/${pr.number}`), pr) &&
        context(await get(`actions/runs/${run.id}`)) &&
        equal(await latest(ci, head, "pull_request"), selected) &&
        equal(await latest(contextWorkflow, sourceSha, "push"), contextRun),
      "Original proof or promotion changed during verification",
    );
    const currentJobs = inventory(
      await read(`repos/${repository}/actions/runs/${run.id}/attempts/${run.run_attempt}/jobs?per_page=100`),
      "jobs",
    );
    requireValue(equal(currentJobs, jobs), "Original attempt jobs changed during verification");
    return { kind: "exact-candidate-original-execution", run, sourceSha, testedSha: sourceSha, identity };
  } catch (error) {
    return { reason: `Exact candidate proof unavailable; run full CI (${error.message})` };
  }
}
