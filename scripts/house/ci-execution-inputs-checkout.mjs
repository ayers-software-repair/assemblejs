// Copyright Ayers Electronics Inc. All rights reserved.
import { Buffer } from "node:buffer";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { lstat, mkdir, mkdtemp, readFile, readdir, readlink, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, relative, sep } from "node:path";
import process from "node:process";
import { promisify } from "node:util";
import { digest, requireValue, sha, within } from "./ci-execution-inputs-schema.mjs";
import { fileDigests, unchanged } from "./ci-execution-inputs-filesystem.mjs";

const exec = promisify(execFile);
const absent = async (path) => {
  try {
    await lstat(path);
    return false;
  } catch (error) {
    if (error.code === "ENOENT") return true;
    throw error;
  }
};
const text = (bytes) => {
  const value = bytes.toString("utf8");
  requireValue(Buffer.from(value).equals(bytes), "Unsupported non-UTF8 Git path or object");
  return value;
};

async function headOf(gitdir) {
  requireValue(
    (await lstat(join(gitdir, "HEAD"))).isFile() && (await realpath(join(gitdir, "HEAD"))) === join(gitdir, "HEAD"),
    "Unsupported checkout HEAD file",
  );
  const head = await readFile(join(gitdir, "HEAD"), "utf8");
  if (/^[0-9a-f]{40}\n?$/.test(head)) return head.trim();
  const ref = /^ref: (refs\/heads\/[A-Za-z0-9_./-]+)\n?$/.exec(head)?.[1];
  requireValue(
    ref &&
      ref.split("/").every((part) => part && !part.startsWith(".") && !part.endsWith(".") && !part.endsWith(".lock")) &&
      !ref.includes(".."),
    "Unsupported checkout HEAD",
  );
  const loose = join(gitdir, ref);
  if (!(await absent(loose))) {
    requireValue((await realpath(loose)) === loose && (await lstat(loose)).isFile(), "Unsupported symbolic Git ref");
    const value = await readFile(loose, "utf8");
    requireValue(/^[0-9a-f]{40}\n?$/.test(value), "Invalid checkout ref");
    return value.trim();
  }
  requireValue(
    (await realpath(join(gitdir, "packed-refs"))) === join(gitdir, "packed-refs"),
    "Unsupported packed refs",
  );
  const packed = (await readFile(join(gitdir, "packed-refs"), "utf8"))
    .split("\n")
    .filter((line) => line.endsWith(` ${ref}`));
  requireValue(packed.length === 1 && /^[0-9a-f]{40} refs\//.test(packed[0]), "Missing or ambiguous packed ref");
  return packed[0].slice(0, 40);
}

async function trackedWorktree(root, entries, coverage, checkoutRoots) {
  const tracked = new Map(entries),
    directories = new Set([""]),
    rows = [],
    snapshots = [],
    seen = new Set();
  for (const name of tracked.keys()) {
    let parent = dirname(name);
    while (parent !== ".") {
      directories.add(parent.split(sep).join("/"));
      parent = dirname(parent);
    }
  }
  const covered = coverage.filter((path) => within(root, path));
  const nested = checkoutRoots.filter((path) => path !== root && within(root, path));
  const visit = async (path) => {
    requireValue(rows.length < 200_000, "Checkout inventory exceeds file bound");
    const name = relative(root, path).split(sep).join("/");
    const before = await lstat(path, { bigint: true });
    snapshots.push([path, before]);
    const mode = Number(before.mode & 0o777n),
      expected = tracked.get(name);
    if (nested.includes(path)) {
      rows.push([name, "checkout", mode]);
      return;
    }
    if (expected) {
      seen.add(name);
      if (expected.mode === "120000") {
        requireValue(before.isSymbolicLink(), "Tracked symlink type differs");
        const target = await readlink(path, { encoding: "buffer" });
        const resolved = await realpath(path);
        requireValue(within(root, resolved), "Escaping tracked symlink");
        requireValue(
          !checkoutRoots.some((checkout) => within(join(checkout, ".git"), resolved)),
          "Tracked link resolves into excluded Git metadata",
        );
        const blob = createHash("sha1").update(`blob ${target.length}\0`).update(target).digest("hex");
        requireValue(blob === expected.blob, "Tracked symlink bytes differ from tree");
        rows.push([name, "link", mode, text(target), digest(target)]);
      } else {
        requireValue(before.isFile(), "Tracked file type differs");
        if (process.platform !== "win32")
          requireValue(Boolean(mode & 0o111) === (expected.mode === "100755"), "Tracked executable mode differs");
        const value = await fileDigests(path);
        requireValue(value.blob === expected.blob, "Tracked file bytes differ from tree");
        rows.push([name, "file", mode, value.digest]);
      }
      return;
    }
    const isCovered = covered.some((item) => within(item, path));
    requireValue(
      isCovered ||
        (before.isDirectory() && (directories.has(name) || [...covered, ...nested].some((item) => within(path, item)))),
      "Untracked checkout input lacks measured coverage",
    );
    if (isCovered && !directories.has(name)) {
      rows.push([name, "covered", mode]);
      return;
    }
    requireValue(before.isDirectory() && !before.isSymbolicLink(), "Unsupported checkout directory type");
    rows.push([name, "directory", mode]);
    for (const child of (await readdir(path)).sort()) {
      if (path === root && child === ".git") continue;
      await visit(join(path, child));
    }
  };
  await visit(root);
  requireValue(seen.size === tracked.size, "Missing tracked checkout input");
  for (const [path, before] of snapshots)
    requireValue(unchanged(before, await lstat(path, { bigint: true })), "Checkout input changed while measuring");
  return {
    digest: digest(JSON.stringify(rows)),
    entries: rows.length,
    tracked: tracked.size,
    modePolicy: process.platform === "win32" ? "windows-native-byte-exact" : "posix-executable-byte-exact",
  };
}

export async function checkout(path, git, coverage, checkoutRoots) {
  const root = await realpath(path),
    gitdir = join(root, ".git"),
    objects = join(gitdir, "objects");
  requireValue(
    (await lstat(gitdir)).isDirectory() &&
      (await realpath(gitdir)) === gitdir &&
      (await lstat(objects)).isDirectory() &&
      (await realpath(objects)) === objects &&
      (await absent(join(gitdir, "commondir"))) &&
      (await absent(join(objects, "info/alternates"))) &&
      (await absent(join(objects, "info/http-alternates"))) &&
      !(await readdir(join(objects, "pack"))).some((name) => name.endsWith(".promisor")),
    "Unsupported linked, alternate or partial object store",
  );
  const commit = await headOf(gitdir),
    view = await mkdtemp(join(tmpdir(), "ci-object-view-"));
  try {
    await mkdir(join(view, "objects"));
    await mkdir(join(view, "refs"));
    await writeFile(join(view, "HEAD"), commit + "\n");
    await writeFile(join(view, "config"), "[core]\nrepositoryformatversion = 0\nbare = true\n");
    const nullDevice = process.platform === "win32" ? "NUL" : "/dev/null";
    const env = {
      GIT_CONFIG_NOSYSTEM: "1",
      GIT_CONFIG_GLOBAL: nullDevice,
      GIT_CONFIG_SYSTEM: nullDevice,
      GIT_NO_REPLACE_OBJECTS: "1",
      GIT_NO_LAZY_FETCH: "1",
      GIT_OPTIONAL_LOCKS: "0",
      GIT_TERMINAL_PROMPT: "0",
      GIT_ATTR_NOSYSTEM: "1",
      GIT_OBJECT_DIRECTORY: objects,
      LC_ALL: "C",
      LANG: "C",
    };
    if (process.platform === "win32") env.SystemRoot = process.env.SystemRoot;
    const run = async (...args) =>
      (
        await exec(git, ["--no-pager", "--no-replace-objects", `--git-dir=${view}`, ...args], {
          timeout: 20_000,
          maxBuffer: 32 * 1024 * 1024,
          encoding: null,
          env,
        })
      ).stdout;
    const headers = text(await run("cat-file", "-p", commit))
      .split("\n\n", 1)[0]
      .split("\n");
    const tree = headers.find((line) => line.startsWith("tree "))?.slice(5);
    const parents = headers.filter((line) => line.startsWith("parent ")).map((line) => line.slice(7));
    requireValue(
      sha.test(commit) && sha.test(tree ?? "") && parents.every((value) => sha.test(value)),
      "Invalid checkout objects",
    );
    const listing = text(await run("ls-tree", "-rz", "--full-tree", tree));
    requireValue(listing.endsWith("\0"), "Missing tracked tree inventory");
    const entries = listing
      .slice(0, -1)
      .split("\0")
      .map((entry) => {
        const value = /^(100644|100755|120000) blob ([0-9a-f]{40})\t(.+)$/.exec(entry);
        requireValue(
          value &&
            value[3].length <= 4096 &&
            !/[\\\x00-\x1f:]/.test(value[3]) &&
            value[3].split("/").every((part) => part && part !== "." && part !== ".." && part.toLowerCase() !== ".git"),
          "Unsupported tracked tree entry",
        );
        return [value[3], { mode: value[1], blob: value[2] }];
      });
    requireValue(
      entries.length <= 200_000 && new Set(entries.map(([name]) => name)).size === entries.length,
      "Ambiguous tracked tree inventory",
    );
    const worktree = await trackedWorktree(root, entries, coverage, checkoutRoots);
    requireValue((await headOf(gitdir)) === commit, "Checkout HEAD changed while measuring");
    return { path: root, sha: commit, tree, parents, worktree };
  } finally {
    await rm(view, { recursive: true, force: true });
  }
}
