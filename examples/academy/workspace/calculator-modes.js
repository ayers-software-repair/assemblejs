// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { callProjectTool } from "./call-project-tool.js";
import { calculatorPlan } from "./calculator-plan.js";

/** Guided consent for actual Market changes; the client retains exact reviewed source. */
export class CalculatorModes {
  #mode = "plan";
  #pending;
  #busy = false;
  #phase = "Ask for a supported calculator change.";
  #result;
  #check;

  constructor(client, recipe, changed = () => {}) {
    this.client = client;
    this.recipe = Object.freeze({ ...recipe });
    this.changed = changed;
  }

  get state() {
    return Object.freeze({
      mode: this.#mode,
      pending: this.#pending,
      busy: this.#busy,
      phase: this.#phase,
      result: this.#result,
      check: this.#check,
    });
  }

  mode(value) {
    if (this.#busy) throw new Error("wait for the current operation");
    if (!["plan", "approval", "auto"].includes(value)) throw new Error("unknown authoring mode");
    this.#mode = value;
    this.changed(this.state);
  }

  async request(text) {
    return this.#run(async () => {
      this.#pending = undefined;
      this.#result = undefined;
      this.#check = undefined;
      this.#phase = "Reading current source and preparing a plan. No writes.";
      this.changed(this.state);
      this.#pending = await calculatorPlan(this.client, this.recipe, text);
      this.#phase = "Plan ready. No files written.";
      if (this.#mode === "auto") await this.#apply();
    });
  }

  async approve() {
    if (this.#mode !== "approval") throw new Error("approval is available only in Approval mode");
    return this.#run(() => this.#apply());
  }

  async reject() {
    return this.#run(async () => {
      if (!this.#pending) throw new Error("request a new plan first");
      this.#pending = undefined;
      this.#phase = "Proposal rejected. No files were written.";
    });
  }

  async #apply() {
    const pending = this.#pending;
    if (!pending) throw new Error("request and review a new plan first");
    // A lost or partial response consumes this permission; obtain fresh source before retrying.
    this.#pending = undefined;
    this.#check = undefined;
    this.#phase = "Applying the exact reviewed files and placement.";
    this.changed(this.state);
    this.#result = await callProjectTool(this.client, "apply_source_changes", {
      changes: pending.changes,
    });
    if (!this.#result.ok) {
      this.#phase =
        "Apply refused or incomplete. Inspect actual files and diagnostics, then plan again.";
      return;
    }
    const written = this.#result.result?.written;
    if (
      this.#result.problems.length ||
      !Array.isArray(written) ||
      written.length !== pending.changes.length ||
      written.some((path, index) => path !== pending.changes[index].path)
    )
      throw new Error("invalid write acknowledgement; inspect actual files before planning again");
    this.#phase = "Files applied; running the actual project check.";
    this.changed(this.state);
    this.#check = await callProjectTool(this.client, "check");
    if (
      this.#check.ok &&
      (!Array.isArray(this.#check.result?.findings) ||
        this.#check.result.findings.length ||
        this.#check.problems.length)
    )
      throw new Error("invalid successful check result");
    this.#phase = this.#check.ok
      ? "Files and placement applied; project check passed. Build and live preview still require verification."
      : "Files applied; project check did not pass. Inspect its actual diagnostics.";
  }

  async #run(operation) {
    if (this.#busy) throw new Error("wait for the current operation");
    this.#busy = true;
    this.changed(this.state);
    try {
      await operation();
    } catch (error) {
      this.#phase = `Guided change stopped: ${String(error)}. Inspect the project before retrying.`;
    } finally {
      this.#busy = false;
      this.changed(this.state);
    }
    return this.state;
  }
}
