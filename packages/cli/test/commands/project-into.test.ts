// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { agentFiles } from "@asmjs/check";
import { describe, expect, it } from "vitest";
import { projectFiles, projectInto } from "@asmjs/cli";

/** What a directory holds, as the two questions asked of it: a file's text, and anything there. */
const holding = (files: Readonly<Record<string, string | null>>) =>
  [
    (path: string): string | undefined => files[path] ?? undefined,
    (path: string): boolean =>
      Object.keys(files).some((held) => held === path || held.startsWith(`${path}/`)),
  ] as const;
const into = (files: Readonly<Record<string, string | null>>, manager = "npm") =>
  projectInto("shop", manager, ...holding(files));

describe("the files that make a project in a directory", () => {
  it("are the starter's, where the directory holds nothing", () => {
    expect(into({})).toEqual({ files: projectFiles("shop") });
    expect(into({}, "pnpm")).toEqual({ files: projectFiles("shop", "pnpm") });
  });

  it("leave alone what the starter does not write", () => {
    expect(into({ LICENSE: "Ours.", ".git/HEAD": "ref", ".editorconfig": "root = true" })).toEqual({
      files: projectFiles("shop"),
    });
  });

  it("keep a README that is there, as its author wrote it", () => {
    const made = into({ "README.md": "# Ours\n" });
    const { "README.md": _starters, ...rest } = projectFiles("shop");
    expect(made).toEqual({ files: rest });
  });

  it("add to a .gitignore the entries of the starter's it lacks, in its own line ending", () => {
    const files = (theirs: string): string | undefined => {
      const made = into({ ".gitignore": theirs });
      return "files" in made ? made.files[".gitignore"] : undefined;
    };
    expect(files("node_modules\n.env\n")).toBe(
      "node_modules\n.env\ndist/\n.assemblejs/\ndeploy/\n",
    );
    // A file that does not end its last line is given the ending it uses.
    expect(files("/dist\r\n.env")).toBe(
      "/dist\r\n.env\r\nnode_modules/\r\n.assemblejs/\r\ndeploy/\r\n",
    );
    expect(files("")).toBe("node_modules/\ndist/\n.assemblejs/\ndeploy/\n");
    // One that holds them all already, however each is written, is not written again.
    expect(files("/node_modules\ndist\n.assemblejs/\n  deploy/  \n")).toBeUndefined();
  });

  it("bring up to date what the directory carries for its agents, as add agents does", () => {
    const theirs = { "AGENTS.md": "# Ours\n", "CLAUDE.md": "@AGENTS.md\n" };
    const made = into(theirs);
    const agents = agentFiles("shop", (path) => theirs[path as keyof typeof theirs]).files;
    expect("files" in made && made.files["AGENTS.md"]).toBe(agents["AGENTS.md"]);
    expect("files" in made && Object.hasOwn(made.files, "CLAUDE.md")).toBe(false);
  });

  it("are none, where the directory holds a file the starter would write over", () => {
    expect(into({ "package.json": "{}" })).toEqual({ taken: ["package.json"] });
    expect(into({ "package.json": "{}", "src/server.ts": "", "README.md": "# Ours" })).toEqual({
      taken: ["package.json", "src/server.ts"],
    });
    // Anything under src is the author's, though the starter writes no file of that name.
    expect(into({ "src/notes.txt": "ours" })).toEqual({ taken: ["src/"] });
  });

  it("are none, where something that is no file to read stands where a kept one goes", () => {
    expect(into({ "README.md": null })).toEqual({ taken: ["README.md"] });
    expect(into({ ".gitignore": null })).toEqual({ taken: [".gitignore"] });
    expect(into({ "AGENTS.md": null })).toEqual({ taken: ["AGENTS.md"] });
  });

  it("are none, where a registration cannot be read", () => {
    expect(into({ ".vscode/mcp.json": "{ // ours\n}" })).toEqual({
      unreadable: [".vscode/mcp.json"],
    });
  });
});
