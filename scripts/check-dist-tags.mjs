#!/usr/bin/env node
// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { publicPackages } from "./first-publish.mjs";

const registry = "--registry=https://registry.npmjs.org";
const number = "(?:0|[1-9]\\d*)";
const base = `${number}\\.${number}\\.${number}`;
const build = "(?:\\+[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*)?";
const stablePattern = new RegExp(`^(${base})${build}$`);
const nextPattern = new RegExp(`^(${base})-next\\.(${number})${build}$`);

function greatest(versions, pattern, preferred) {
  let best;
  let parts;
  for (const version of versions) {
    const match = pattern.exec(version);
    if (!match) continue;
    const candidate = [...match[1].split("."), ...match.slice(2)].map(BigInt);
    const different = parts?.findIndex((part, index) => part !== candidate[index]);
    if (
      !parts ||
      (different >= 0 && candidate[different] > parts[different]) ||
      (different === -1 && version === preferred)
    ) {
      best = version;
      parts = candidate;
    }
  }
  return best;
}

/** Only this product's canonical stable and next releases select its installation tags. */
export function tagPolicy(metadata) {
  const { tags, versions } = metadata ?? {};
  if (
    !tags ||
    typeof tags !== "object" ||
    Array.isArray(tags) ||
    !Array.isArray(versions) ||
    versions.length === 0 ||
    versions.some((v) => typeof v !== "string" || v.length > 200) ||
    Object.values(tags).some((v) => typeof v !== "string" || !versions.includes(v))
  )
    throw new Error("malformed registry versions or dist-tags");
  const stable = greatest(versions, stablePattern, tags.latest);
  const next = greatest(versions, nextPattern, tags.next);
  if (!stable && !next) throw new Error("no published stable or next release");
  const expected = { latest: stable ?? next };
  if (next) expected.next = next;
  return {
    stable,
    expected,
    problems: Object.entries(expected)
      .filter(([tag, version]) => tags[tag] !== version)
      .map(([tag, version]) => ({ tag, version, actual: tags[tag] })),
  };
}

const npmRun = (args) =>
  spawnSync("npm", args, {
    encoding: "utf8",
    timeout: 30_000,
    maxBuffer: 1024 * 1024,
  });

function readMetadata(name, run) {
  const read = (field) => {
    const result = run(["view", name, field, "--json", "--prefer-online", registry]);
    let body;
    try {
      body = JSON.parse(result.stdout);
    } catch {
      /* Fixed error below. */
    }
    if (result.status !== 0 || body === undefined) {
      const missing = body?.error?.code === "E404" ? "; E404 is not publication permission" : "";
      throw new Error(`npm view ${name} ${field} failed or returned invalid JSON${missing}`);
    }
    return body;
  };
  return { tags: read("dist-tags"), versions: read("versions") };
}

function supportsOidcTags(run) {
  const result = run(["--version"]);
  const match = /^(\d+)\.(\d+)\.(\d+)\s*$/.exec(result.stdout ?? "");
  if (result.status !== 0 || !match) return false;
  const [major, minor] = match.slice(1).map(Number);
  return (major === 11 && minor >= 21) || (major === 12 && minor >= 2) || major > 12;
}

function recovery(name, policy) {
  if (policy?.problems.length) {
    return policy.problems
      .map(({ tag, version }) => `operator: npm dist-tag add ${name}@${version} ${tag} ${registry}`)
      .join("; ");
  }
  return `inspect current state before any further write: npm view ${name} dist-tags versions --json --prefer-online ${registry}`;
}

/** Read-only by default; the release caller alone opts into pre-stable latest repair. */
export function checkDistTags({ packages, run = npmRun, repair = false, say = console.log }) {
  if (packages.length === 0) throw new Error("no public packages to check");
  const failures = [];
  for (const { name, version: published } of packages) {
    if (!/^(@[a-z0-9-]+\/)?[a-z0-9][a-z0-9._-]*$/.test(name)) {
      throw new Error("invalid local public package name");
    }
    try {
      let metadata = readMetadata(name, run);
      let policy = tagPolicy(metadata);
      if (repair && !metadata.versions.includes(published)) {
        throw new Error("the tagged local version is not published; refusing repair");
      }
      for (const problem of policy.problems) {
        const args = ["dist-tag", "add", `${name}@${problem.version}`, problem.tag, registry];
        const command = `npm ${args.join(" ")}`;
        if (
          !repair ||
          policy.stable ||
          problem.tag !== "latest" ||
          metadata.tags.next !== policy.expected.next
        ) {
          failures.push(`${name}: ${problem.tag} must be ${problem.version}; operator: ${command}`);
          continue;
        }
        if (!supportsOidcTags(run)) {
          failures.push(`${name}: OIDC dist-tags need npm 11.21+/12.2+; operator: ${command}`);
          continue;
        }
        // Re-observe before writing so a newly visible stable release prevents prerelease repair.
        metadata = readMetadata(name, run);
        policy = tagPolicy(metadata);
        if (
          policy.stable ||
          policy.expected.latest !== problem.version ||
          metadata.tags.next !== problem.version
        ) {
          failures.push(`${name}: registry changed before repair; ${recovery(name, policy)}`);
          continue;
        }
        const result = run(args);
        let after;
        try {
          after = tagPolicy(readMetadata(name, run));
        } catch {
          failures.push(`${name}: repair readback failed; ${recovery(name)}`);
          continue;
        }
        if (result.status !== 0) {
          failures.push(
            `${name}: dist-tag repair failed; verify OIDC Allow npm dist-tag; ${recovery(name, after)}`,
          );
          continue;
        }
        if (after.problems.length > 0 || after.expected.latest !== problem.version) {
          failures.push(`${name}: repair readback failed; ${recovery(name, after)}`);
          continue;
        }
        say(`${name}: latest repair read back at ${problem.version}`);
      }
      if (policy.problems.length === 0) say(`${name}: dist-tags match published releases`);
    } catch (error) {
      failures.push(`${name}: ${error.message}`);
    }
  }
  if (failures.length > 0) throw new Error(failures.join("\n"));
  say("dist-tags: every public package passes");
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const args = process.argv.slice(2);
  if (args.length === 1 && args[0] === "--self-test") {
    const result = spawnSync(
      process.execPath,
      ["--test", "scripts/check-dist-tags.test.mjs", "scripts/check-dist-tags-recovery.test.mjs"],
      {
        stdio: "inherit",
      },
    );
    process.exitCode = result.status ?? 1;
  } else {
    try {
      const repair = args.length === 1 && args[0] === "--repair-prerelease";
      if (args.length && !repair)
        throw new Error("use --self-test, --repair-prerelease or no arguments");
      if (
        repair &&
        (process.env.GITHUB_ACTIONS !== "true" ||
          process.env.GITHUB_WORKFLOW !== "release" ||
          !/^refs\/tags\/v\d+\.\d+\.\d+(?:-next\.\d+)?$/.test(process.env.GITHUB_REF ?? ""))
      ) {
        throw new Error("prerelease repair runs only in the authorized tagged release workflow");
      }
      checkDistTags({ packages: publicPackages(), repair });
    } catch (error) {
      console.error(error.message);
      process.exitCode = 1;
    }
  }
}
