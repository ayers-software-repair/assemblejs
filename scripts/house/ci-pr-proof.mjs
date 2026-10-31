// Copyright Ayers Electronics Inc. All rights reserved.
// Immutable PR candidate data accompanies independently authenticated native execution inputs.
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const exec = promisify(execFile);
const SHA = /^[0-9a-f]{40}$/;
const positive = (value) => Number.isSafeInteger(value) && value > 0;
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const requireValue = (value, reason) => {
  if (!value) throw new Error(reason);
};

/** Bind an artifact to one tested merge candidate; native measurements supply execution evidence. */
export function createPullRequestProof({ repository, workflow, event, checkout, runId, attempt }) {
  const pr = event?.pull_request;
  requireValue(
    event?.repository?.full_name === repository &&
      pr?.head?.repo?.full_name === repository &&
      pr?.base?.repo?.full_name === repository &&
      pr?.base?.ref === "main" &&
      positive(pr.number),
    "Untrusted PR context",
  );
  requireValue(
    /^[\w.-]+\/[\w.-]+$/.test(repository) && /^[\w.-]+\.yml$/.test(workflow),
    "Invalid repository or workflow",
  );
  requireValue(
    SHA.test(pr.head.sha) &&
      SHA.test(pr.base.sha) &&
      SHA.test(checkout?.sha) &&
      SHA.test(checkout?.tree) &&
      same(checkout.parents, [pr.base.sha, pr.head.sha]),
    "Checkout is not the tested PR merge candidate",
  );
  requireValue(positive(runId) && positive(attempt), "Missing execution identity");
  return {
    schema: 2,
    repository,
    workflow,
    pullRequest: pr.number,
    head: pr.head.sha,
    base: pr.base.sha,
    candidate: checkout.sha,
    tree: checkout.tree,
    runId,
    attempt,
  };
}

// Artifacts carry data only. No archive entry is extracted or executed, and expansion is bounded.
export async function readPullRequestProof(repository, artifact) {
  requireValue(
    /^[\w.-]+\/[\w.-]+$/.test(repository) &&
      positive(artifact?.id) &&
      /^sha256:[0-9a-f]{64}$/.test(artifact.digest ?? ""),
    "Invalid artifact address",
  );
  const work = await mkdtemp(join(tmpdir(), "ci-proof-"));
  try {
    const { stdout } = await exec("gh", ["api", `repos/${repository}/actions/artifacts/${artifact.id}/zip`], {
      encoding: null,
      timeout: 20_000,
      maxBuffer: 128 * 1024,
    });
    requireValue(
      `sha256:${createHash("sha256").update(stdout).digest("hex")}` === artifact.digest,
      "Artifact bytes changed",
    );
    const archive = join(work, "proof.zip");
    await writeFile(archive, stdout, { mode: 0o600 });
    const listed = await exec("unzip", ["-Z1", archive], { encoding: "utf8", timeout: 5_000, maxBuffer: 1024 });
    requireValue(listed.stdout === "proof.json\n", "Unexpected proof archive entries");
    const result = await exec("unzip", ["-p", archive, "proof.json"], {
      encoding: "utf8",
      timeout: 5_000,
      maxBuffer: 32 * 1024,
    });
    const proof = JSON.parse(result.stdout);
    requireValue(JSON.stringify(proof) + "\n" === result.stdout, "Noncanonical or duplicate proof fields");
    return proof;
  } finally {
    await rm(work, { recursive: true, force: true });
  }
}
