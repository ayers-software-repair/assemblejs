// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { setImmediate } from "node:timers/promises";
import { Window } from "happy-dom";
import { calculatorFixture } from "./calculator-fixture.mjs";
import { createAcademyWorkspace } from "./create-academy-workspace.js";

export async function academyWorkspaceFixture(clientOf = (f) => f.client) {
  const f = calculatorFixture();
  const window = new Window({
    url: "https://academy.example/",
    settings: { navigation: { disableChildFrameNavigation: true } },
  });
  const document = window.document;
  const calls = [];
  const runtime = {
    origin: "https://preview.example",
    async rebuild() {
      calls.push("build");
      return "https://preview.example/p/kb-guji-250";
    },
    async inspect(values) {
      calls.push("inspect");
      return {
        url: "https://preview.example/p/kb-guji-250",
        html:
          '<assembly-root data-name="price-calculator"><section aria-label="Order estimate"><h2>Order estimate</h2><div aria-label="Quantity presets">' +
          values
            .map(
              (value) =>
                `<button type="button">${value} ${value === 1 ? "item" : "items"}</button>`,
            )
            .join("") +
          "</div></section></assembly-root>",
        quotes: values.map((quantity) => ({
          quantity,
          status: 200,
          body: {
            lines: [{ sku: "kb-guji-250", quantity, cents: 1600 }],
            cents: quantity * 1600,
            problems: [],
          },
        })),
      };
    },
    async stop() {
      calls.push("stop");
    },
  };
  const paths = [...f.files.keys()];
  const view = createAcademyWorkspace(document.body, clientOf(f), f.recipe, paths, runtime);
  await setImmediate();
  return {
    ...f,
    window,
    document,
    view,
    runtime,
    runtimeCalls: calls,
    close() {
      view.destroy();
      window.close();
    },
  };
}
