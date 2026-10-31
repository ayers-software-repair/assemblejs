// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { randomUUID } from "node:crypto";
import { mkdirSync, rmdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { DeadLinkError, isOccupied, rendererProblems } from "@asmjs/build";
import { planAssembly } from "@asmjs/cli";
import type { ProjectRoot } from "../root/project-root.js";
import { withinRoot } from "../root/within-root.js";
import type { ToolResult } from "../server/tool-result.js";
import type { AssemblyProposal } from "./assembly-proposal.js";

/** One pending review per session. Planning and discarding never write project files. */
export class AssemblyReview {
  #pending: AssemblyProposal | undefined;

  constructor(private readonly root: ProjectRoot) {}

  plan(name: string, renderer: string): ToolResult & { readonly result: AssemblyProposal | null } {
    const judged = planAssembly(name, renderer, false);
    if ("problem" in judged) return { ok: false, result: null, problems: [judged.problem] };
    let taken = true;
    try {
      taken = isOccupied(withinRoot(this.root, "src", "assemblies", name));
    } catch (error) {
      if (!(error instanceof DeadLinkError)) throw error;
    }
    const plan = planAssembly(name, renderer, taken);
    if ("problem" in plan) return { ok: false, result: null, problems: [plan.problem] };
    for (const path of Object.keys(plan.files)) withinRoot(this.root, path);
    const proposal = Object.freeze({
      id: randomUUID(),
      name,
      renderer,
      tag: plan.tag,
      changes: Object.freeze(
        Object.entries(plan.files).map(([path, after]) =>
          Object.freeze({ path, before: null, after }),
        ),
      ),
    });
    this.#pending = proposal;
    return {
      ok: true,
      result: proposal,
      problems: [],
      next: [
        "review changes, then apply_assembly_plan with this id, or discard_assembly_plan to reject",
        "a new valid plan replaces this session's previous pending plan; no files have been written",
      ],
    };
  }

  discard(id: string): ToolResult {
    if (this.#pending?.id !== id) return this.missing();
    this.#pending = undefined;
    return { ok: true, result: { discarded: id, written: [] }, problems: [] };
  }

  apply(id: string): ToolResult {
    const plan = this.#pending;
    if (plan?.id !== id) return this.missing();
    // A failed application also consumes its review: retry only after seeing a fresh proposal.
    this.#pending = undefined;
    const directory = withinRoot(this.root, "src", "assemblies", plan.name);
    if (isOccupied(directory)) return this.conflict();
    const files = plan.changes.map((change) => ({
      ...change,
      absolute: withinRoot(this.root, change.path),
    }));
    const next = [
      ...rendererProblems(
        this.root.path,
        plan.name,
        plan.renderer,
        plan.changes[0]?.path ?? "",
      ).map((problem) => `${problem.fix}: ${problem.message}`),
      `place it with place_assembly, or by writing ${plan.tag} into a page template`,
    ];
    mkdirSync(dirname(directory), { recursive: true });
    try {
      // Claim the absent assembly directory exclusively before writing the retained content.
      mkdirSync(directory);
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "EEXIST")
        return this.conflict();
      throw error;
    }
    const written: string[] = [];
    const attempted: string[] = [];
    try {
      for (const file of files) {
        attempted.push(file.path);
        writeFileSync(file.absolute, file.after, { encoding: "utf8", flag: "wx" });
        written.push(file.path);
      }
    } catch (error) {
      if (written.length === 0) {
        try {
          rmdirSync(directory);
        } catch {
          // Keep any content another writer put there; never recursively remove this directory.
        }
      }
      return {
        ok: false,
        result: { written, attempted },
        problems: [`could not finish writing the assembly: ${String(error)}`],
        next: [
          "inspect attempted files for partial content and request a new plan; no existing files were replaced",
        ],
      };
    }
    return { ok: true, result: { written, tag: plan.tag }, problems: [], next };
  }

  private missing(): ToolResult {
    return {
      ok: false,
      result: null,
      problems: ["no pending assembly plan has this id; request and review a new plan"],
    };
  }

  private conflict(): ToolResult {
    return {
      ok: false,
      result: null,
      problems: ["the assembly target changed after planning; existing work was kept"],
      next: ["inspect the existing assembly, then request and review a new plan"],
    };
  }
}
