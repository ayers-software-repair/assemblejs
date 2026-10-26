// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { folded } from "@asmjs/build";

const gate = (): { open: () => void; passed: Promise<void> } => {
  let open = (): void => undefined;
  const passed = new Promise<void>((resolve) => (open = resolve));
  return { open, passed };
};

describe("runs asked for while one is under way", () => {
  it("are one run after it, however many were asked for, and each asker waits for it", async () => {
    const gates = [gate(), gate()];
    const began: number[] = [];
    const runs = folded(async () => {
      began.push(began.length);
      await gates[began.length - 1]?.passed;
    });
    const first = runs.again();
    const during = [runs.again(), runs.again(), runs.again()];
    expect(began).toEqual([0]);
    let answered = false;
    void Promise.all(during).then(() => (answered = true));
    gates[0]?.open();
    await new Promise((resolve) => setTimeout(resolve, 20));
    // Three requests during the first run are the second run, and nobody is answered before it.
    expect(began).toEqual([0, 1]);
    expect(answered).toBe(false);
    gates[1]?.open();
    await Promise.all([first, ...during]);
    expect(began).toEqual([0, 1]);
    // Asked for once all is quiet, it runs again at once.
    await runs.again();
    expect(began).toEqual([0, 1, 2]);
  });

  it("tells the running step that it has been asked for again since it began", async () => {
    const held = gate();
    const seen: boolean[] = [];
    const runs = folded(async (stale) => {
      seen.push(stale());
      if (seen.length === 1) {
        await held.passed;
        seen.push(stale());
      }
    });
    const first = runs.again();
    void runs.again();
    held.open();
    await first;
    // Fresh when it began, stale by its end; the run that followed began fresh.
    expect(seen).toEqual([false, true, false]);
  });

  it("ends the runs on a step that throws, tells the askers, and can be asked again", async () => {
    let calls = 0;
    const runs = folded(async () => {
      calls += 1;
      if (calls === 1) throw new Error("the disk is full");
    });
    await expect(runs.again()).rejects.toThrow("the disk is full");
    await runs.settled();
    await runs.again();
    expect(calls).toBe(2);
  });

  it("can be waited on without asking for a run", async () => {
    const held = gate();
    let calls = 0;
    const runs = folded(async () => {
      calls += 1;
      await held.passed;
    });
    await runs.settled();
    expect(calls).toBe(0);
    void runs.again();
    let quiet = false;
    void runs.settled().then(() => (quiet = true));
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(quiet).toBe(false);
    held.open();
    await runs.settled();
    expect(calls).toBe(1);
  });
});
