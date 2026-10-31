// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { expect, it, vi } from "vitest";
import { notifyAuthoring } from "../../src/server/notify-authoring.js";

it("refreshes after success and after a failed write attempt, returning the original result", () => {
  const server = { sendResourceListChanged: vi.fn() };
  const success = { ok: true, result: { written: ["cart.html"] }, problems: [] };
  const partial = {
    ok: false,
    result: { written: [], attempted: ["cart.html"] },
    problems: ["disk full"],
  };
  expect(notifyAuthoring(server, success)).toBe(success);
  expect(notifyAuthoring(server, partial)).toBe(partial);
  expect(server.sendResourceListChanged).toHaveBeenCalledTimes(2);
});

it("does not refresh for refusals that never attempted a project write", () => {
  const server = { sendResourceListChanged: vi.fn() };
  for (const result of [null, {}, { attempted: [] }, { attempted: "cart.html" }])
    notifyAuthoring(server, { ok: false, result, problems: ["refused"] });
  expect(server.sendResourceListChanged).not.toHaveBeenCalled();
});
