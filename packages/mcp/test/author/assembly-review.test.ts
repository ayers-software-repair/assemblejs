// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import * as fs from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { RENDERERS } from "@asmjs/build";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AssemblyReview, resolveRoot } from "@asmjs/mcp";

vi.mock("node:fs", async (importOriginal) => ({
  ...(await importOriginal<typeof fs>()),
}));

let dir = "";
let review: AssemblyReview;
beforeEach(() => {
  dir = fs.mkdtempSync(join(tmpdir(), "assembly-review-"));
  review = new AssemblyReview(resolveRoot(dir));
});
afterEach(() => {
  vi.restoreAllMocks();
  fs.rmSync(dir, { recursive: true, force: true });
});
const proposed = (name = "cart", renderer = "html") => {
  const result = review.plan(name, renderer);
  expect(result.ok).toBe(true);
  if (!result.result) throw new Error("expected a proposal");
  return result.result;
};

describe("one exact assembly proposal", () => {
  it.each(RENDERERS)(
    "applies the retained %s files once without replacing anything",
    (renderer) => {
      const plan = proposed("cart", renderer);
      expect(fs.existsSync(join(dir, "src"))).toBe(false);
      expect(review.apply(plan.id)).toMatchObject({ ok: true, result: { tag: plan.tag } });
      expect(plan.changes.length).toBeGreaterThan(0);
      for (const change of plan.changes) {
        expect(change.before).toBeNull();
        expect(fs.readFileSync(join(dir, change.path), "utf8")).toBe(change.after);
      }
      expect(review.apply(plan.id).ok).toBe(false);
    },
  );

  it("keeps the retained proposal immutable even to an in-process caller", () => {
    const plan = proposed();
    expect(Object.isFrozen(plan)).toBe(true);
    expect(Object.isFrozen(plan.changes)).toBe(true);
    expect(Object.isFrozen(plan.changes[0])).toBe(true);
    expect(() => Object.assign(plan.changes[0] ?? {}, { after: "different" })).toThrow();
    expect(review.apply(plan.id).ok).toBe(true);
    expect(fs.readFileSync(join(dir, "src/assemblies/cart/cart.html"), "utf8")).toBe(
      "<p>cart</p>\n",
    );
  });

  it("discards without creating any source directory and cannot apply a rejected id", () => {
    const plan = proposed();
    expect(review.discard(plan.id)).toMatchObject({ ok: true, result: { written: [] } });
    expect(review.apply(plan.id).ok).toBe(false);
    expect(fs.readdirSync(dir)).toEqual([]);
  });

  it("replaces a pending review only when a new valid plan was produced", () => {
    const first = proposed();
    expect(review.plan("../escape", "html").ok).toBe(false);
    expect(review.plan("basket", "unknown").ok).toBe(false);
    expect(review.discard("invented").ok).toBe(false);
    expect(review.apply("invented").ok).toBe(false);
    const revised = proposed("basket");
    expect(revised.id).not.toBe(first.id);
    expect(review.apply(first.id).ok).toBe(false);
    expect(review.apply(revised.id).ok).toBe(true);
    expect(fs.existsSync(join(dir, "src/assemblies/cart"))).toBe(false);
  });

  it("keeps a valid plan after an invalid replacement attempt", () => {
    const first = proposed();
    expect(review.plan("bad name", "html").ok).toBe(false);
    expect(review.apply(first.id).ok).toBe(true);
  });

  it("does not accept a proposal from another session on the same project", () => {
    const first = proposed();
    expect(new AssemblyReview(resolveRoot(dir)).apply(first.id).ok).toBe(false);
    expect(fs.readdirSync(dir)).toEqual([]);
  });
});

describe("outside work between planning and application", () => {
  it("keeps a newly occupied assembly and consumes the stale proposal", () => {
    const plan = proposed();
    const target = join(dir, "src/assemblies/cart");
    fs.mkdirSync(target, { recursive: true });
    fs.writeFileSync(join(target, "notes.txt"), "manual work");
    expect(review.apply(plan.id)).toMatchObject({
      ok: false,
      problems: [expect.stringContaining("changed")],
    });
    expect(fs.readdirSync(target)).toEqual(["notes.txt"]);
    fs.rmSync(target, { recursive: true });
    expect(review.apply(plan.id).ok).toBe(false);
  });

  it("refuses an existing dangling link while planning", () => {
    fs.mkdirSync(join(dir, "src/assemblies"), { recursive: true });
    fs.symlinkSync(join(dir, "missing"), join(dir, "src/assemblies/cart"));
    expect(review.plan("cart", "html").ok).toBe(false);
    expect(fs.existsSync(join(dir, "missing"))).toBe(false);
  });

  it("rechecks root confinement when a parent is redirected after planning", () => {
    const plan = proposed();
    const outside = fs.mkdtempSync(join(tmpdir(), "assembly-outside-"));
    try {
      fs.mkdirSync(join(dir, "src"));
      fs.symlinkSync(outside, join(dir, "src/assemblies"));
      expect(() => review.apply(plan.id)).toThrow();
      expect(fs.readdirSync(outside)).toEqual([]);
      expect(review.apply(plan.id).ok).toBe(false);
    } finally {
      fs.rmSync(outside, { recursive: true, force: true });
    }
  });

  it("claims the absent directory exclusively if another writer gets there after validation", () => {
    const plan = proposed();
    const target = join(dir, "src/assemblies/cart");
    const mkdir = fs.mkdirSync;
    vi.spyOn(fs, "mkdirSync").mockImplementation((path, options) => {
      if (path === target) mkdir(target);
      return mkdir(path, options);
    });
    expect(review.apply(plan.id).ok).toBe(false);
    expect(fs.readdirSync(target)).toEqual([]);
  });

  it("reports a write failure, removes only its empty directory and requires a new review", () => {
    const plan = proposed();
    vi.spyOn(fs, "writeFileSync").mockImplementation(() => {
      throw new Error("disk refused write");
    });
    expect(review.apply(plan.id)).toMatchObject({
      ok: false,
      result: { written: [] },
      problems: [expect.stringContaining("disk refused write")],
    });
    expect(fs.existsSync(join(dir, "src/assemblies/cart"))).toBe(false);
    expect(review.apply(plan.id).ok).toBe(false);
  });

  it("reports an attempted file left incomplete by a failed write without deleting it", () => {
    const plan = proposed();
    const write = fs.writeFileSync;
    vi.spyOn(fs, "writeFileSync").mockImplementation((path) => {
      write(path, "<p>partial");
      throw new Error("disk full after partial write");
    });
    expect(review.apply(plan.id)).toMatchObject({
      ok: false,
      result: { written: [], attempted: ["src/assemblies/cart/cart.html"] },
      next: [expect.stringContaining("attempted files")],
    });
    expect(fs.readFileSync(join(dir, "src/assemblies/cart/cart.html"), "utf8")).toBe("<p>partial");
    expect(review.apply(plan.id).ok).toBe(false);
  });

  it("does not overwrite or recursively clean another writer's competing file", () => {
    const plan = proposed();
    const write = fs.writeFileSync;
    vi.spyOn(fs, "writeFileSync").mockImplementation((path, data, options) => {
      write(path, "competing work");
      return write(path, data, options);
    });
    expect(review.apply(plan.id)).toMatchObject({ ok: false, result: { written: [] } });
    expect(fs.readFileSync(join(dir, "src/assemblies/cart/cart.html"), "utf8")).toBe(
      "competing work",
    );
  });
});
