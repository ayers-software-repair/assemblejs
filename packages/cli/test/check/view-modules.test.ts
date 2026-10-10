// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
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
    expect(viewModules(at("shell/shell.react.tsx"))).toEqual([
      at("shell/shell.react.tsx"),
      at("shell/panel.tsx"),
      at("shell/parts/row.tsx"),
      at("shared/index.ts"),
      at("shared/shell-loop.ts"),
    ]);
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
    expect(viewModules(join(root, "board/board.svelte"))).toHaveLength(2);
    expect(viewModules(join(root, "card/card.vue"))).toEqual([
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
    expect(viewModules(join(root, "shell/shell.react.tsx"))).toEqual([
      join(root, "shell/shell.react.tsx"),
    ]);
    expect(viewModules(join(root, "shell/nowhere.tsx"))).toEqual([]);
  });
});
