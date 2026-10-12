// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { viewModules } from "@assemblejs/cli";

const tree = (files: Record<string, string>): string => {
  const root = mkdtempSync(join(tmpdir(), "view-modules-"));
  for (const [path, contents] of Object.entries(files)) {
    mkdirSync(join(root, path, ".."), { recursive: true });
    writeFileSync(join(root, path), contents);
  }
  return root;
};

describe("a view's file and the modules it is split into", () => {
  it("are the view, then every module it imports by a relative path, each once", () => {
    const root = tree({
      "shell/shell.react.tsx":
        'import { Panel } from "./panel.js";\nimport { Row } from "./parts/row";\nimport { useState } from "react";\nexport default () => <Panel><Row /></Panel>;',
      "shell/panel.tsx": 'import { Row } from "./parts/row";\nexport const Panel = () => <Row />;',
      "shell/parts/row.tsx": 'export { Cell as Row } from "../../shared/index.js";',
      "shared/index.ts": 'import "./shell-loop.js";\nexport const Cell = () => null;',
      "shared/shell-loop.ts": 'import "../shell/shell.react.js";',
    });
    const at = (path: string) => join(root, path);
    // The `.js` an import writes is the TypeScript beside it; a loop ends where it began.
    expect(viewModules(root, at("shell/shell.react.tsx"))).toEqual({
      modules: [
        at("shell/shell.react.tsx"),
        at("shell/panel.tsx"),
        at("shell/parts/row.tsx"),
        at("shared/index.ts"),
        at("shared/shell-loop.ts"),
      ],
      outside: [],
    });
  });

  it("follow a component into another component, in Svelte and in Vue", () => {
    const root = tree({
      "board/board.svelte":
        '<script lang="ts">\n  import Row from "./Row.svelte";\n</script>\n<Row />',
      "board/Row.svelte": "<p>row</p>",
      "card/card.vue":
        '<script setup lang="ts">\nimport Row from "./Row.vue";\n</script>\n<template><Row /></template>',
      "card/Row.vue": "<template><p>row</p></template>",
    });
    expect(viewModules(root, join(root, "board/board.svelte")).modules).toHaveLength(2);
    expect(viewModules(root, join(root, "card/card.vue")).modules).toEqual([
      join(root, "card/card.vue"),
      join(root, "card/Row.vue"),
    ]);
  });

  it("leave out what is not the project's to read, and answer nothing for no view", () => {
    const root = tree({
      "shell/shell.react.tsx":
        'import "./shell.css";\nimport data from "./data.json";\nimport { x } from "./gone.js";\nexport default () => null;',
      "shell/shell.css": "p {}",
      "shell/data.json": "{}",
    });
    expect(viewModules(root, join(root, "shell/shell.react.tsx"))).toEqual({
      modules: [join(root, "shell/shell.react.tsx")],
      outside: [],
    });
    expect(viewModules(root, join(root, "shell/nowhere.tsx")).modules).toEqual([]);
  });

  // The project is `app`, beside a directory that is not part of it.
  it("do not follow an import that climbs out of the project, and answer it as written", () => {
    const tmp = tree({
      "app/shell/shell.react.tsx":
        'import { Row } from "../../outside/row.js";\nimport { Panel } from "./panel.js";\nimport { Again } from "../../outside/row.js";\nexport default () => <Panel><Row /><Again /></Panel>;',
      "app/shell/panel.tsx": "export const Panel = () => null;",
      "outside/row.tsx": "export const Row = () => null;",
    });
    const app = join(tmp, "app");
    expect(viewModules(app, join(app, "shell/shell.react.tsx"))).toEqual({
      modules: [join(app, "shell/shell.react.tsx"), join(app, "shell/panel.tsx")],
      outside: ["../../outside/row.js"],
    });
  });

  it("do not follow an import of a link that leads out, and follow one that stays inside", () => {
    const tmp = tree({
      "app/shell/shell.react.tsx":
        'import { Row } from "./row.js";\nimport { Cell } from "./cell.js";\nexport default () => <Row><Cell /></Row>;',
      "app/shared/cell.tsx": "export const Cell = () => null;",
      "outside/row.tsx": "export const Row = () => null;",
    });
    const app = join(tmp, "app");
    symlinkSync(join(tmp, "outside/row.tsx"), join(app, "shell/row.tsx"));
    symlinkSync("../shared/cell.tsx", join(app, "shell/cell.tsx"));
    expect(viewModules(app, join(app, "shell/shell.react.tsx"))).toEqual({
      modules: [join(app, "shell/shell.react.tsx"), join(app, "shell/cell.tsx")],
      outside: ["./row.js"],
    });
  });

  it("answer no module for a view that itself leads out of the project", () => {
    const tmp = tree({ "outside/shell.react.tsx": "export default () => null;" });
    const app = join(tmp, "app");
    mkdirSync(join(app, "shell"), { recursive: true });
    symlinkSync(join(tmp, "outside/shell.react.tsx"), join(app, "shell/shell.react.tsx"));
    expect(viewModules(app, join(app, "shell/shell.react.tsx"))).toEqual({
      modules: [],
      outside: [],
    });
  });
});
