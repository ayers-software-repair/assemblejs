// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import * as fs from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { writeSourceChange } from "../../src/author/write-source-change.js";
import { resolveRoot } from "../../src/root/resolve-root.js";

vi.mock("node:fs", async (original) => ({ ...(await original<typeof fs>()) }));
let dir = "";
beforeEach(() => {
  dir = fs.mkdtempSync(join(tmpdir(), "write-source-"));
  fs.mkdirSync(join(dir, "src"));
});
afterEach(() => {
  vi.restoreAllMocks();
  fs.rmSync(dir, { recursive: true, force: true });
});

it("creates an absent file exclusively and replaces exact existing bytes with permissions kept", () => {
  const root = resolveRoot(dir);
  const path = "src/new/view.ts";
  writeSourceChange(root, { path, before: null, after: "first" });
  const file = join(dir, path);
  fs.chmodSync(file, 0o600);
  writeSourceChange(root, { path, before: "first", after: "second\n" });
  expect(fs.readFileSync(file, "utf8")).toBe("second\n");
  expect(fs.statSync(file).mode & 0o777).toBe(0o600);
  expect(fs.readdirSync(join(dir, "src/new"))).toEqual(["view.ts"]);
});

it("preserves occupied additions and a changed replacement", () => {
  const path = "src/view.ts";
  fs.writeFileSync(join(dir, path), "outside");
  for (const before of [null, "old"])
    expect(() => writeSourceChange(resolveRoot(dir), { path, before, after: "replace" })).toThrow();
  expect(fs.readFileSync(join(dir, path), "utf8")).toBe("outside");
});

it("removes its partial temporary file and keeps the original on a failed prepared write", () => {
  const path = "src/view.ts";
  const file = join(dir, path);
  fs.writeFileSync(file, "original");
  fs.chmodSync(file, 0o600);
  vi.spyOn(fs, "writeFileSync").mockImplementation((descriptor) => {
    if (typeof descriptor !== "number") throw new Error("expected a claimed descriptor");
    expect(fs.fstatSync(descriptor).mode & 0o777 & ~0o600).toBe(0);
    fs.writeSync(descriptor, "partial");
    throw new Error("disk full after partial write");
  });
  expect(() =>
    writeSourceChange(resolveRoot(dir), { path, before: "original", after: "updated" }),
  ).toThrow("disk full");
  expect(fs.readFileSync(file, "utf8")).toBe("original");
  expect(fs.readdirSync(join(dir, "src"))).toEqual(["view.ts"]);
});

it("keeps an outside edit made while preparing a replacement", () => {
  const path = "src/view.ts";
  const file = join(dir, path);
  fs.writeFileSync(file, "original");
  const write = fs.writeFileSync;
  vi.spyOn(fs, "writeFileSync").mockImplementation((...args) => {
    write(...args);
    write(file, "outside");
  });
  expect(() =>
    writeSourceChange(resolveRoot(dir), { path, before: "original", after: "updated" }),
  ).toThrow("changed before replacement");
  expect(fs.readFileSync(file, "utf8")).toBe("outside");
  expect(fs.readdirSync(join(dir, "src"))).toEqual(["view.ts"]);
});

it("keeps the original and removes its temporary file after a rename failure", () => {
  const path = "src/view.ts";
  fs.writeFileSync(join(dir, path), "original");
  vi.spyOn(fs, "renameSync").mockImplementation(() => {
    throw new Error("rename refused");
  });
  expect(() =>
    writeSourceChange(resolveRoot(dir), { path, before: "original", after: "updated" }),
  ).toThrow("rename refused");
  expect(fs.readFileSync(join(dir, path), "utf8")).toBe("original");
  expect(fs.readdirSync(join(dir, "src"))).toEqual(["view.ts"]);
});

it("does not remove a competing temporary path it failed to claim", () => {
  const path = "src/view.ts";
  fs.writeFileSync(join(dir, path), "original");
  const open = fs.openSync;
  let competing = "";
  vi.spyOn(fs, "openSync").mockImplementation((file, flags, mode) => {
    if (flags === "wx" && typeof file === "string" && file.endsWith(".tmp")) {
      competing = file;
      fs.writeFileSync(file, "competing content");
    }
    return open(file, flags, mode);
  });
  expect(() =>
    writeSourceChange(resolveRoot(dir), { path, before: "original", after: "updated" }),
  ).toThrow();
  expect(fs.readFileSync(competing, "utf8")).toBe("competing content");
  expect(fs.readFileSync(join(dir, path), "utf8")).toBe("original");
});

it("refuses a non-regular claimed descriptor before writing source bytes", () => {
  vi.spyOn(fs, "fstatSync").mockReturnValue(fs.statSync(dir));
  const write = vi.spyOn(fs, "writeFileSync");
  const close = vi.spyOn(fs, "closeSync");
  expect(() =>
    writeSourceChange(resolveRoot(dir), {
      path: "src/new.ts",
      before: null,
      after: "not written",
    }),
  ).toThrow("regular file");
  expect(write).not.toHaveBeenCalled();
  expect(close).toHaveBeenCalledOnce();
  expect(fs.readFileSync(join(dir, "src/new.ts"), "utf8")).toBe("");
});
