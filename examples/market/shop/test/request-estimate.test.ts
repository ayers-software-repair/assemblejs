// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { afterEach, describe, expect, it, vi } from "vitest";
import { requestEstimate } from "../src/assemblies/price-calculator/request-estimate.js";

const signal = new AbortController().signal;
const valid = () => ({
  lines: [{ sku: "coffee", quantity: 3, cents: 1200 }],
  cents: 3600,
  problems: [],
});
afterEach(() => vi.unstubAllGlobals());
const answer = (body: unknown, status = 200) => {
  const fetch = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    }),
  );
  vi.stubGlobal("fetch", fetch);
  return fetch;
};

describe("the calculator's actual quote boundary", () => {
  it("sends only sku, quantity and note, and returns the server's total", async () => {
    const fetch = answer(valid());
    expect(await requestEstimate("coffee", 3, "Whole bean", signal)).toEqual({
      quantity: 3,
      cents: 3600,
      problems: [],
    });
    expect(fetch).toHaveBeenCalledWith("/api/quote", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ lines: [{ sku: "coffee", quantity: 3, note: "Whole bean" }] }),
      signal,
    });
  });

  it("keeps stock warnings without inventing a successful reservation", async () => {
    answer({ ...valid(), problems: ["Only 2 of this coffee left"] });
    expect(await requestEstimate("coffee", 3, "", signal)).toMatchObject({
      problems: ["Only 2 of this coffee left"],
    });
  });

  it("keeps a valid server refusal as the diagnostic when no product can be priced", async () => {
    answer({ lines: [], cents: 0, problems: ["coffee is not something we sell"] });
    await expect(requestEstimate("coffee", 3, "", signal)).rejects.toThrow(
      "coffee is not something we sell",
    );
  });

  it.each([
    null,
    {},
    { ...valid(), cents: -1 },
    { ...valid(), cents: 3600.5 },
    { ...valid(), cents: 1 },
    { ...valid(), lines: [] },
    { ...valid(), lines: [...valid().lines, ...valid().lines] },
    { ...valid(), lines: [{ sku: "tea", quantity: 3, cents: 1200 }] },
    { ...valid(), lines: [{ sku: "coffee", quantity: 2, cents: 1200 }] },
    { ...valid(), lines: [{ sku: "coffee", quantity: 3, cents: -1200 }] },
    { ...valid(), lines: [{ sku: "coffee", quantity: 3, cents: 1200.5 }] },
    { ...valid(), problems: [false] },
  ])("refuses malformed or mismatched response %#", async (body) => {
    answer(body);
    await expect(requestEstimate("coffee", 3, "", signal)).rejects.toThrow("invalid estimate");
  });

  it("preserves failed HTTP status and malformed JSON errors", async () => {
    answer({ message: "offline" }, 503);
    await expect(requestEstimate("coffee", 3, "", signal)).rejects.toThrow("503");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("not JSON")));
    await expect(requestEstimate("coffee", 3, "", signal)).rejects.toThrow();
  });

  it("propagates network rejection without fabricating a price", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network unavailable")));
    await expect(requestEstimate("coffee", 3, "", signal)).rejects.toThrow("network unavailable");
  });
});
