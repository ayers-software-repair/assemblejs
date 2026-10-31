// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { act } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import PriceCalculator from "../src/assemblies/price-calculator/price-calculator.react.js";

let host: HTMLDivElement;
let root: Root;
const data = {
  found: true,
  sku: "coffee",
  name: "Coffee",
  cents: 1200,
  left: 14,
  grind: "Whole bean",
};
beforeEach(async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  await act(async () => {
    root.render(<PriceCalculator data={data} />);
  });
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
});
const button = (name: string): HTMLButtonElement => {
  const found = [...host.querySelectorAll("button")].find((node) => node.textContent === name);
  if (!found) throw new Error(`missing button ${name}`);
  return found;
};
const quote = (quantity: number) =>
  new Response(
    JSON.stringify({
      lines: [{ sku: "coffee", quantity, cents: 1200 }],
      cents: 1200 * quantity,
      problems: [],
    }),
  );

it("cancels a superseded request and ignores its late result", async () => {
  const pending: Array<{ signal: AbortSignal; resolve: (response: Response) => void }> = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(
      (_url: string, options: RequestInit) =>
        new Promise<Response>((resolve) => {
          pending.push({ signal: options.signal as AbortSignal, resolve });
        }),
    ),
  );
  await act(async () => button("1 item").click());
  await act(async () => button("3 items").click());
  expect(pending).toHaveLength(2);
  expect(pending[0]?.signal.aborted).toBe(true);
  await act(async () => {
    pending[1]?.resolve(quote(3));
  });
  expect(host.textContent).toContain("Estimate for 3: $36.00");
  await act(async () => {
    pending[0]?.resolve(quote(1));
  });
  expect(host.textContent).toContain("Estimate for 3: $36.00");
  expect(host.textContent).not.toContain("Estimate for 1");
});

it("aborts outstanding quote work when its assembly unmounts", async () => {
  let signal: AbortSignal | undefined;
  let finish: ((response: Response) => void) | undefined;
  vi.stubGlobal(
    "fetch",
    vi.fn(
      (_url: string, options: RequestInit) =>
        new Promise<Response>((resolve) => {
          signal = options.signal as AbortSignal;
          finish = resolve;
        }),
    ),
  );
  await act(async () => button("1 item").click());
  await act(async () => root.unmount());
  expect(signal?.aborted).toBe(true);
  await act(async () => {
    finish?.(quote(1));
  });
  expect(host.textContent).toBe("");
});
