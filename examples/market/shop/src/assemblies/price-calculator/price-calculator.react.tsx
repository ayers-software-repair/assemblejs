// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { AssemblyProps } from "@asmjs/renderer-react";
import { useEffect, useRef, useState } from "react";
import { price } from "../../browser/basket.js";
import type { Offer } from "../../shop/offer.js";
import { requestEstimate } from "./request-estimate.js";

/** A quote is read from the shop's api; changing quantity never changes stock or the basket. */
export default function PriceCalculator({ data }: AssemblyProps<Offer>) {
  const [quantity, setQuantity] = useState("1");
  const [estimate, setEstimate] = useState<Awaited<ReturnType<typeof requestEstimate>>>();
  const [phase, setPhase] = useState<"idle" | "loading" | "ready" | "failed">("idle");
  const [problem, setProblem] = useState("");
  const active = useRef<AbortController | undefined>(undefined);
  useEffect(() => () => active.current?.abort(), []);

  const request = async (value: number): Promise<void> => {
    active.current?.abort();
    const controller = new AbortController();
    active.current = controller;
    setEstimate(undefined);
    setProblem("");
    if (!Number.isInteger(value) || value < 1 || value > 99) {
      setProblem("Choose a whole quantity from 1 to 99.");
      setPhase("failed");
      return;
    }
    setPhase("loading");
    try {
      const result = await requestEstimate(data.sku, value, data.grind, controller.signal);
      if (controller.signal.aborted || active.current !== controller) return;
      setEstimate(result);
      setPhase("ready");
    } catch (error) {
      if (controller.signal.aborted || active.current !== controller) return;
      setProblem(error instanceof Error ? error.message : String(error));
      setPhase("failed");
    }
  };
  const edit = (value: string): void => {
    active.current?.abort();
    setQuantity(value);
    setEstimate(undefined);
    setProblem("");
    setPhase("idle");
  };
  if (!data.found)
    return <p className="notice">An estimate is unavailable while the catalog is not answering.</p>;
  return (
    <section className="estimate" aria-label="Order estimate">
      <h2>Order estimate</h2>
      <p>Compare quantities before you add to your basket. Prices come from the shop.</p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void request(Number(quantity));
        }}
      >
        <label className="field">
          <span>Quantity to estimate</span>
          <input
            type="number"
            min={1}
            max={99}
            step={1}
            required
            value={quantity}
            onChange={(event) => edit(event.currentTarget.value)}
          />
        </label>
        <div className="estimate-presets" role="group" aria-label="Quantity presets">
          {[1, 3, 6].map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={quantity === String(value)}
              onClick={() => {
                setQuantity(String(value));
                void request(value);
              }}
            >
              {value} {value === 1 ? "item" : "items"}
            </button>
          ))}
        </div>
        <button type="submit">Get estimate</button>
      </form>
      <div className="estimate-result" role="status" aria-live="polite" aria-atomic="true">
        {phase === "idle" && <p>Choose a quantity to get a current estimate.</p>}
        {phase === "loading" && <p>Getting a price from the shop.</p>}
        {phase === "ready" && estimate && (
          <p>
            Estimate for {estimate.quantity}: <strong>{price(estimate.cents)}</strong>
          </p>
        )}
      </div>
      {problem !== "" && <p role="alert">{problem} Try again with Get estimate.</p>}
      {estimate?.problems.map((message) => (
        <p className="notice" key={message} role="alert">
          {message}
        </p>
      ))}
      <p className="estimate-note">An estimate does not reserve stock or include delivery.</p>
    </section>
  );
}
