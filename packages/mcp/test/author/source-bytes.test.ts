// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import * as fs from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { sourceBytes } from "../../src/author/source-bytes.js";

vi.mock("node:fs", async (original) => ({ ...(await original<typeof fs>()) }));
let dir = "";
beforeEach(() => {
  dir = fs.mkdtempSync(join(tmpdir(), "source-bytes-"));
});
afterEach(() => {
  vi.restoreAllMocks();
  fs.rmSync(dir, { recursive: true, force: true });
});

it.each(["", "Café 茶", "x".repeat(65536)])("reads exact bounded source bytes", (contents) => {
  const file = join(dir, "file.ts");
  fs.writeFileSync(file, contents);
  expect(sourceBytes(file)).toEqual(Buffer.from(contents));
});

it("refuses oversized source before reading and always closes the descriptor", () => {
  const file = join(dir, "large.ts");
  fs.writeFileSync(file, "x".repeat(65537));
  const close = vi.spyOn(fs, "closeSync");
  const read = vi.spyOn(fs, "readSync");
  expect(() => sourceBytes(file)).toThrow("65536");
  expect(read).not.toHaveBeenCalled();
  expect(close).toHaveBeenCalledOnce();
});

it("bounds bytes even when the file is larger than its earlier stat snapshot", () => {
  const file = join(dir, "growing.ts");
  const small = join(dir, "snapshot.ts");
  fs.writeFileSync(file, "x".repeat(65537));
  fs.writeFileSync(small, "x");
  vi.spyOn(fs, "fstatSync").mockReturnValue(fs.statSync(small));
  const read = vi.spyOn(fs, "readSync");
  expect(() => sourceBytes(file)).toThrow("65536");
  expect(read).toHaveBeenCalledWith(expect.any(Number), expect.any(Buffer), 0, 65537, 0);
  expect(read).toHaveBeenCalledOnce();
});
