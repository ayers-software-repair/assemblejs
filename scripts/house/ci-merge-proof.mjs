// Copyright Ayers Electronics Inc. All rights reserved.
// Reuse requires authoritative merge evidence and revalidated native measurements on both runs.
import { readPullRequestProof } from "./ci-pr-proof.mjs";
import { readHostedExecutionInputs, readHostedMainExecutionInputs } from "./ci-execution-inputs-resolver.mjs";
import { compareExecutionInputs, validateMergePolicy } from "./ci-merge-inputs.mjs";
import { digest, equal as same, exactKeys, requireValue, sha as SHA } from "./ci-execution-inputs.mjs";

const positive = (value) => Number.isSafeInteger(value) && value > 0;
const single = (pages) => {
  requireValue(
    Array.isArray(pages) && pages.length === 1 && pages[0] && !Array.isArray(pages[0]),
    "Invalid API object",
  );
  return pages[0];
};
const names = (value) =>
  Array.isArray(value) &&
  value.every((name) => typeof name === "string" && name.length > 0 && name.length <= 200) &&
  new Set(value).size === value.length;

/** API errors, incomplete attempts and unsupported merge modes always select full hosted CI. */
export async function findMergeProof(
  options,
  { read, readLog, fullFailures, readEvidence = readPullRequestProof, now = Date.now },
) {
  try {
    const {
      repository,
      mainSha,
      workflow = "ci.yml",
      requiredJobs: suppliedRequiredJobs,
      nonTestJobs: suppliedNonTestJobs = [],
      mainRunId,
      mainAttempt,
      policy: suppliedPolicy,
      expected,
    } = options;
    const requiredJobs = Array.isArray(suppliedRequiredJobs) ? [...suppliedRequiredJobs] : suppliedRequiredJobs;
    const nonTestJobs = Array.isArray(suppliedNonTestJobs) ? [...suppliedNonTestJobs] : suppliedNonTestJobs;
    requireValue(
      exactKeys(options, [
        "repository",
        "mainSha",
        "requiredJobs",
        "mainRunId",
        "mainAttempt",
        "policy",
        ...["workflow", "nonTestJobs", "expected"].filter((key) => Object.hasOwn(options, key)),
      ]) &&
        /^[\w.-]+\/[\w.-]+$/.test(repository ?? "") &&
        SHA.test(mainSha ?? "") &&
        /^[\w.-]+\.yml$/.test(workflow) &&
        positive(mainRunId) &&
        positive(mainAttempt) &&
        names(requiredJobs) &&
        requiredJobs.length &&
        names(nonTestJobs) &&
        !nonTestJobs.some((name) => requiredJobs.includes(name)),
      "Invalid native merge acceptance request",
    );
    const policy = JSON.parse(JSON.stringify(suppliedPolicy ?? null));
    validateMergePolicy(policy, requiredJobs);
    const originalSuccessJobs = [...requiredJobs, ...(policy.pullRequest.controls ?? []).map((job) => job.name)];
    const get = async (path) => single(await read(`repos/${repository}/${path}`));
    const merged = await get(`git/commits/${mainSha}`);
    requireValue(merged.sha === mainSha && SHA.test(merged.tree?.sha), "Main commit is unavailable");
    const mainOptions = {
      repository,
      workflow,
      eventName: "push",
      runId: mainRunId,
      attempt: mainAttempt,
      headSha: mainSha,
      nonTestJobs: [],
      policy: policy.main,
      requiredJobs: policy.main.jobs.map((job) => job.name),
      testedCheckout: { sha: mainSha, tree: merged.tree.sha, parents: merged.parents?.map((parent) => parent.sha) },
    };
    const nativeDependencies = { read, readLog };
    const main = await readHostedMainExecutionInputs(mainOptions, nativeDependencies);
    const event = main.event;
    const prs = (await read(`repos/${repository}/commits/${mainSha}/pulls?per_page=100`))
      .flat()
      .filter(
        (pr) =>
          pr.merged_at &&
          pr.merge_commit_sha === mainSha &&
          pr.base?.ref === "main" &&
          pr.head?.repo?.full_name === repository &&
          pr.base?.repo?.full_name === repository,
      );
    requireValue(prs.length === 1 && positive(prs[0].number), "No unique merged PR for main");
    const pr = await get(`pulls/${prs[0].number}`);
    requireValue(
      pr.number === prs[0].number &&
        pr.merged === true &&
        pr.merge_commit_sha === mainSha &&
        pr.base?.ref === "main" &&
        pr.head?.repo?.full_name === repository &&
        pr.base?.repo?.full_name === repository &&
        SHA.test(pr.head?.sha) &&
        pr.base.sha === event.before,
      "Merged PR context changed",
    );
    const head = pr.head.sha,
      base = event.before;
    if (mainSha === head) {
      const pages = await read(`repos/${repository}/compare/${base}...${head}?per_page=1`);
      requireValue(
        Array.isArray(pages) &&
          pages.length > 0 &&
          pages.every(
            (page) =>
              page &&
              typeof page === "object" &&
              !Array.isArray(page) &&
              page.status === "ahead" &&
              page.merge_base_commit?.sha === base,
          ),
        "Main did not fast-forward its tested base",
      );
    } else {
      requireValue(
        same(
          merged.parents?.map((parent) => parent.sha),
          [base, head],
        ),
        "Merge mode needs full CI",
      );
    }
    const registered = await get(`actions/workflows/${workflow}`);
    requireValue(
      positive(registered.id) && registered.path === `.github/workflows/${workflow}` && registered.state === "active",
      "Workflow is unavailable",
    );
    const context = (run) =>
      run.head_sha === head &&
      run.event === "pull_request" &&
      run.workflow_id === registered.id &&
      run.path === registered.path &&
      run.head_repository?.full_name === repository &&
      run.head_branch === pr.head.ref &&
      Array.isArray(run.pull_requests) &&
      (!run.pull_requests.length ||
        run.pull_requests.some(
          (item) => item.number === pr.number && item.head?.sha === head && item.base?.sha === base,
        ));
    const latest = async () => {
      const pages = await read(
        `repos/${repository}/actions/workflows/${workflow}/runs?head_sha=${head}&event=pull_request&per_page=100`,
      );
      const runs = pages.flatMap((page) => page.workflow_runs);
      requireValue(
        pages.length > 0 &&
          pages.every((page) => page.total_count === runs.length) &&
          runs.every((run) => positive(run.id)) &&
          new Set(runs.map((run) => run.id)).size === runs.length,
        "Incomplete workflow run list",
      );
      // A new failed/pending candidate must not be hidden by an older green run or base.
      const selected = runs
        .filter(
          (run) =>
            run.head_sha === head &&
            run.event === "pull_request" &&
            run.workflow_id === registered.id &&
            run.path === registered.path &&
            run.head_repository?.full_name === repository,
        )
        .sort((a, b) => b.id - a.id)[0];
      requireValue(selected && context(selected), "Latest candidate context differs");
      return selected;
    };
    const selected = await latest();
    const run = await get(`actions/runs/${selected.id}`);
    requireValue(
      context(run) && positive(run.run_attempt) && run.status === "completed" && run.conclusion === "success",
      "Latest PR run is not successful",
    );
    const attempt = run.run_attempt;
    const exact = await get(`actions/runs/${run.id}/attempts/${attempt}`);
    requireValue(
      context(exact) &&
        exact.id === run.id &&
        exact.run_attempt === attempt &&
        exact.status === "completed" &&
        exact.conclusion === "success",
      "Attempt is incomplete",
    );
    const jobPages = await read(`repos/${repository}/actions/runs/${run.id}/attempts/${attempt}/jobs?per_page=100`);
    const jobs = jobPages.flatMap((page) => page.jobs);
    requireValue(
      jobPages[0]?.total_count === jobs.length &&
        jobs.length &&
        names(jobs.map((job) => job.name)) &&
        jobs.every((job) => job.run_id === run.id && job.head_sha === head),
      "Missing or ambiguous attempt jobs",
    );
    requireValue(
      jobs.every((job) => job.conclusion !== "skipped" || nonTestJobs.includes(job.name)),
      "Unexpected skipped job",
    );
    requireValue(
      fullFailures(
        jobs.filter(
          (job) => !(job.status === "completed" && job.conclusion === "skipped" && nonTestJobs.includes(job.name)),
        ),
        originalSuccessJobs,
      ).length === 0,
      "Required PR checks did not pass",
    );
    const artifactPages = await read(`repos/${repository}/actions/runs/${run.id}/artifacts?per_page=100`);
    const allArtifacts = artifactPages.flatMap((page) => page.artifacts);
    requireValue(artifactPages[0]?.total_count === allArtifacts.length, "Incomplete artifact list");
    const artifacts = allArtifacts.filter((artifact) => artifact.name === `ci-proof-${attempt}`);
    requireValue(artifacts.length === 1, "Missing or ambiguous proof artifact");
    const artifact = artifacts[0];
    requireValue(
      positive(artifact.id) &&
        artifact.expired === false &&
        Date.parse(artifact.expires_at) > now() &&
        Number.isSafeInteger(artifact.size_in_bytes) &&
        artifact.size_in_bytes > 0 &&
        artifact.size_in_bytes <= 128 * 1024 &&
        /^sha256:[0-9a-f]{64}$/.test(artifact.digest ?? "") &&
        artifact.workflow_run?.id === run.id &&
        artifact.workflow_run?.head_sha === head,
      "Untrusted artifact identity",
    );
    const proof = await readEvidence(repository, artifact);
    requireValue(
      proof &&
        Object.keys(proof).length === 10 &&
        proof.schema === 2 &&
        proof.repository === repository &&
        proof.workflow === workflow &&
        proof.pullRequest === pr.number &&
        proof.head === head &&
        proof.base === base &&
        SHA.test(proof.candidate ?? "") &&
        proof.tree === merged.tree.sha &&
        proof.runId === run.id &&
        proof.attempt === attempt,
      "Proof does not match current source and execution inputs",
    );
    const candidate = await get(`git/commits/${proof.candidate}`);
    requireValue(
      candidate.sha === proof.candidate &&
        candidate.tree?.sha === merged.tree.sha &&
        same(
          candidate.parents?.map((parent) => parent.sha),
          [base, head],
        ),
      "Proof is not the tested merge candidate",
    );
    const prOptions = {
      repository,
      workflow,
      eventName: "pull_request",
      runId: run.id,
      attempt,
      headSha: head,
      requiredJobs,
      nonTestJobs,
      policy: policy.pullRequest,
      testedCheckout: { sha: candidate.sha, tree: candidate.tree.sha, parents: [base, head] },
    };
    const original = await readHostedExecutionInputs(prOptions, nativeDependencies);
    requireValue(
      same(original.event, {
        name: "pull_request",
        repository,
        number: pr.number,
        base,
        head,
      }),
      "Original PR event differs from the authoritative merged PR",
    );
    if (policy.pullRequest.controls) {
      const producer = original.controls.filter((control) => control.kind === "candidate-producer");
      requireValue(
        producer.length === 1 && Object.entries(producer[0].artifact).every(([key, value]) => artifact[key] === value),
        "Proof artifact was not uploaded by its registered original candidate producer",
      );
    }
    compareExecutionInputs(policy, original, main);
    const identity = {
      runId: run.id,
      attempt,
      testedSha: candidate.sha,
      tree: merged.tree.sha,
      policyHash: digest(JSON.stringify({ policy, requiredJobs, nonTestJobs })),
      original: original.identity,
      main: main.identity,
      artifact,
    };
    requireValue(!expected || same(expected, identity), "Selected proof changed during aggregation");
    const revalidatedOriginal = await readHostedExecutionInputs(
      { ...prOptions, expected: original.identity },
      nativeDependencies,
    );
    const revalidatedMain = await readHostedMainExecutionInputs(
      { ...mainOptions, expected: main.identity },
      nativeDependencies,
    );
    compareExecutionInputs(policy, revalidatedOriginal, revalidatedMain);
    const refreshed = await read(`repos/${repository}/actions/runs/${run.id}/artifacts?per_page=100`);
    const refreshedArtifacts = refreshed.flatMap((page) => page.artifacts);
    requireValue(
      refreshed.length > 0 &&
        refreshed.every((page) => page.total_count === refreshedArtifacts.length) &&
        same(
          refreshedArtifacts.filter((item) => item.name === artifact.name),
          [artifact],
        ) &&
        Date.parse(artifact.expires_at) > now() &&
        same(await readEvidence(repository, artifact), proof),
      "PR artifact changed during aggregation",
    );
    const current = await get(`actions/runs/${run.id}`);
    requireValue(
      current.id === run.id &&
        context(current) &&
        current.run_attempt === attempt &&
        current.status === "completed" &&
        current.conclusion === "success" &&
        (await latest()).id === run.id,
      "PR proof changed during verification",
    );
    requireValue(same(await get(`pulls/${pr.number}`), pr), "Merged PR changed during aggregation");
    return { kind: "merged-pull-request-reuse", run, sourceSha: mainSha, testedSha: candidate.sha, identity };
  } catch (error) {
    return { reason: `Merged PR proof unavailable; run full CI (${error.message})` };
  }
}
