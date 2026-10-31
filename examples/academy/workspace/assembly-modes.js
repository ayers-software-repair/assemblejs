// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { callProjectTool } from "./call-project-tool.js";

/** Client consent over the real shared authoring tools; changing mode never applies a plan. */
export class AssemblyModes {
  #mode = "plan";
  #pending;
  #busy = false;
  #phase = "Choose a mode and plan an assembly.";
  #result;
  #check;

  constructor(client, changed = () => {}) {
    this.client = client;
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

  async propose(name, renderer) {
    return this.#run(async () => {
      this.#check = undefined;
      this.#phase = "Planning without writing files.";
      this.changed(this.state);
      const answer = await callProjectTool(this.client, "plan_assembly", { name, renderer });
      this.#result = answer;
      if (!answer.ok) {
        this.#phase = "Plan refused; existing files are unchanged.";
        return;
      }
      const proposal = answer.result;
      if (
        typeof proposal?.id !== "string" ||
        proposal.id === "" ||
        !Array.isArray(proposal.changes) ||
        proposal.changes.length === 0 ||
        proposal.changes.some(
          (change) =>
            typeof change?.path !== "string" ||
            change.before !== null ||
            typeof change.after !== "string",
        )
      )
        throw new Error("invalid assembly proposal; no apply was requested");
      this.#pending = Object.freeze({
        id: proposal.id,
        changes: Object.freeze(
          proposal.changes.map((change) =>
            Object.freeze({
              path: change.path,
              before: change.before,
              after: change.after,
            }),
          ),
        ),
      });
      this.#phase = "Plan ready. No files written; the assembly is not placed on a page.";
      if (this.#mode === "auto") await this.#apply();
    });
  }

  async approve() {
    if (this.#mode !== "approval") throw new Error("approval is available only in Approval mode");
    return this.#run(() => this.#apply());
  }

  async reject() {
    return this.#run(async () => {
      const pending = this.#pending;
      if (!pending) throw new Error("request a new plan first");
      this.#pending = undefined;
      this.#phase = "Discarding this proposal without writing files.";
      this.changed(this.state);
      const answer = await callProjectTool(this.client, "discard_assembly_plan", {
        id: pending.id,
      });
      this.#result = answer;
      if (
        answer.ok &&
        (answer.result?.discarded !== pending.id ||
          !Array.isArray(answer.result.written) ||
          answer.result.written.length !== 0)
      )
        throw new Error("invalid discard acknowledgement");
      this.#phase = answer.ok
        ? "Proposal rejected. No files were written."
        : "Discard refused; request a new plan.";
    });
  }

  async #apply() {
    const pending = this.#pending;
    if (!pending) throw new Error("request and review a new plan first");
    // Consume locally before dispatch: a lost response is not permission to retry a write.
    this.#pending = undefined;
    this.#check = undefined;
    this.#phase = "Applying the exact retained proposal.";
    this.changed(this.state);
    const answer = await callProjectTool(this.client, "apply_assembly_plan", { id: pending.id });
    this.#result = answer;
    if (!answer.ok) {
      this.#phase = "Apply refused or incomplete. Inspect the result and files, then plan again.";
      return;
    }
    const written = answer.result?.written;
    if (
      !Array.isArray(written) ||
      written.length !== pending.changes.length ||
      written.some((path, index) => path !== pending.changes[index].path)
    )
      throw new Error("invalid apply acknowledgement; inspect the actual files");
    this.#phase = "Files applied; running the project check.";
    this.changed(this.state);
    this.#check = await callProjectTool(this.client, "check");
    if (
      this.#check.ok &&
      (!Array.isArray(this.#check.result?.findings) ||
        this.#check.result.findings.length !== 0 ||
        this.#check.problems.length !== 0)
    )
      throw new Error("invalid successful check result");
    this.#phase = this.#check.ok
      ? "Files applied; project check passed. Placement, build and preview still need verification."
      : "Files applied; project check did not pass. Inspect its actual diagnostics.";
  }

  async #run(operation) {
    if (this.#busy) throw new Error("wait for the current operation");
    this.#busy = true;
    this.changed(this.state);
    try {
      await operation();
    } catch (error) {
      this.#phase += ` Failed: ${String(error)}. Inspect the project before trying again.`;
    } finally {
      this.#busy = false;
      this.changed(this.state);
    }
    return this.state;
  }
}
