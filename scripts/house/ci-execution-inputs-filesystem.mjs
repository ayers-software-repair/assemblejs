// Copyright Ayers Electronics Inc. All rights reserved.
import { createHash } from "node:crypto";
import { constants, createReadStream } from "node:fs";
import { access, lstat, readlink, realpath, readdir, stat } from "node:fs/promises";
import { delimiter, isAbsolute, join, relative, sep } from "node:path";
import process from "node:process";
import { digest, equal, requireValue, within } from "./ci-execution-inputs-schema.mjs";

export const unchanged = (a, b) =>
  a.dev === b.dev &&
  a.ino === b.ino &&
  a.size === b.size &&
  a.mode === b.mode &&
  a.mtimeNs === b.mtimeNs &&
  a.ctimeNs === b.ctimeNs;

export async function fileDigests(path) {
  const before = await stat(path, { bigint: true });
  requireValue(before.isFile(), "Expected regular input file");
  const value = createHash("sha256");
  const blob = createHash("sha1").update(`blob ${before.size}\0`);
  for await (const chunk of createReadStream(path)) {
    value.update(chunk);
    blob.update(chunk);
  }
  requireValue(unchanged(before, await stat(path, { bigint: true })), "Input changed while measuring");
  return { digest: value.digest("hex"), blob: blob.digest("hex") };
}
export const fileHash = async (path) => (await fileDigests(path)).digest;

/** Include relative paths, modes, symlink targets and every file byte; refuse escaping links. */
export async function measurePath(path) {
  const root = await realpath(path),
    rows = [],
    snapshots = [];
  let files = 0;
  const visit = async (current, ancestors) => {
    requireValue(++files <= 200_000, "Input tree exceeds file bound");
    const before = await lstat(current, { bigint: true });
    snapshots.push([current, before]);
    const name = relative(root, current).split(sep).join("/");
    if (before.isSymbolicLink()) {
      const target = await realpath(current);
      requireValue(within(root, target) && !ancestors.has(target), "Escaping or cyclic input link");
      rows.push([name, "link", await readlink(current)]);
    } else if (before.isDirectory()) {
      rows.push([name, "directory", Number(before.mode & 0o777n)]);
      const entries = (await readdir(current)).sort();
      for (const entry of entries) await visit(join(current, entry), new Set([...ancestors, current]));
      requireValue(equal(entries, (await readdir(current)).sort()), "Input directory changed while measuring");
    } else {
      requireValue(before.isFile(), "Unsupported input file type");
      rows.push([name, "file", Number(before.mode & 0o777n), await fileHash(current)]);
    }
    requireValue(unchanged(before, await lstat(current, { bigint: true })), "Input changed while measuring");
  };
  await visit(root, new Set());
  for (const [current, before] of snapshots)
    requireValue(unchanged(before, await lstat(current, { bigint: true })), "Input tree changed while measuring");
  return {
    path: root,
    digest: digest(JSON.stringify(rows)),
    entries: rows.length,
  };
}

export async function executable(command, env) {
  const extensions = process.platform === "win32" ? (env.PATHEXT ?? ".EXE;.CMD;.BAT").split(";") : [""];
  for (const directory of (env.PATH ?? "").split(delimiter).filter(Boolean)) {
    requireValue(isAbsolute(directory), "Relative executable search path");
    for (const suffix of extensions) {
      const candidate = join(directory, command + (command.toLowerCase().endsWith(suffix.toLowerCase()) ? "" : suffix));
      try {
        await access(candidate, process.platform === "win32" ? constants.F_OK : constants.X_OK);
        requireValue((await stat(candidate)).isFile(), "Tool is not a file");
        return await realpath(candidate);
      } catch (error) {
        if (!["ENOENT", "ENOTDIR", "EACCES"].includes(error.code)) throw error;
      }
    }
  }
  throw new Error(`Missing executable: ${command}`);
}
