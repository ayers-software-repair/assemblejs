// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { createAcademyWorkspace } from "../../examples/academy/workspace/create-academy-workspace.js";
import { createAssemblyControls } from "../../examples/academy/workspace/create-assembly-controls.js";
import { createCalculatorControls } from "../../examples/academy/workspace/create-calculator-controls.js";
import { createProjectFiles } from "../../examples/academy/workspace/create-project-files.js";
import { createSourceEditor } from "../../examples/academy/workspace/create-source-editor.js";

const json = async (path, body) => {
  const response = await fetch(
    path,
    body === undefined
      ? {}
      : {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
  );
  const result = await response.json();
  if (!response.ok) throw new Error(result.error);
  return result;
};
const client = {
  callTool(request) {
    return json("/call-tool", request);
  },
};
const main = globalThis.document.querySelector("main");
if (globalThis.location.search === "?workspace") {
  const [recipe, project] = await Promise.all([
    json("/calculator-recipe"),
    json("/workspace-config"),
  ]);
  createAcademyWorkspace(main, client, recipe, project.paths, {
    origin: project.origin,
    async rebuild() {
      const result = await json("/preview", {});
      if (typeof result.url !== "string") throw new Error("missing actual preview URL");
      return result.url;
    },
    async stop() {
      const result = await json("/preview-stop", {});
      if (result.stopped !== true || result.active !== 0)
        throw new Error("preview shutdown not confirmed");
    },
  });
} else if (globalThis.location.search === "?calculator") {
  createCalculatorControls(main, client, await json("/calculator-recipe"));
  createSourceEditor(
    main,
    createProjectFiles(client),
    [
      "price-calculator.react.tsx",
      "price-calculator.css",
      "price-calculator.service.ts",
      "request-estimate.ts",
    ]
      .map((file) => "src/assemblies/price-calculator/" + file)
      .concat("src/pages/product/product.html"),
  );
} else if (globalThis.location.search === "?editor") {
  createSourceEditor(main, createProjectFiles(client), ["src/assemblies/hello/hello.html"]);
} else createAssemblyControls(main, client);
