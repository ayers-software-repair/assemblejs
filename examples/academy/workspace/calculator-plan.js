// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { callProjectTool } from "./call-project-tool.js";
import { calculatorShape } from "./calculator-shape.js";
import { calculatorRequest } from "./calculator-request.js";
import { calculatorTitle } from "./calculator-title.js";

/** Prepare exact Market source changes without writing; recipe strings come from its real files. */
export async function calculatorPlan(client, recipe, text) {
  const request = calculatorRequest(text);
  const directory = "src/assemblies/price-calculator/";
  const view = directory + "price-calculator.react.tsx";
  const read = async (path) => {
    const answer = await callProjectTool(client, "read_source", { path });
    if (!answer.ok) {
      if (answer.result?.path === path && answer.result.missing === true) return null;
      throw new Error(JSON.stringify(answer));
    }
    if (
      answer.problems.length ||
      answer.result?.path !== path ||
      typeof answer.result.contents !== "string"
    )
      throw new Error("invalid source read acknowledgement");
    return answer.result.contents;
  };
  const changes = [];
  if (request.action === "add") {
    for (const path of [
      "src/api/quote.api.ts",
      "src/assemblies/buy-box/buy-box.service.ts",
      "src/shop/offer.ts",
      "src/browser/basket.ts",
    ])
      if ((await read(path)) === null)
        throw new Error(`This guided feature needs the supplied Market project: missing ${path}`);
    for (const file of [
      "price-calculator.react.tsx",
      "price-calculator.css",
      "price-calculator.service.ts",
      "request-estimate.ts",
    ]) {
      const path = directory + file;
      if ((await read(path)) !== null)
        throw new Error(
          `Calculator source already exists: ${path}. Review it or request a supported customization.`,
        );
      if (typeof recipe?.[file] !== "string" || recipe[file] === "")
        throw new Error(`missing authored recipe: ${file}`);
      const after =
        file === "price-calculator.react.tsx" && request.title
          ? calculatorTitle(recipe[file], request.title)
          : recipe[file];
      changes.push({ path, before: null, after });
    }
    const placement = await callProjectTool(client, "plan_page_placement", {
      page: "product",
      name: "price-calculator",
      position: { after: "buy-box" },
    });
    if (!placement.ok || placement.problems.length) throw new Error(JSON.stringify(placement));
    const change = placement.result?.change;
    if (
      !Number.isInteger(placement.result?.placed) ||
      placement.result.placed < 1 ||
      change?.path !== "src/pages/product/product.html" ||
      typeof change.before !== "string" ||
      typeof change.after !== "string" ||
      change.before === change.after
    )
      throw new Error("invalid page placement plan acknowledgement");
    if (placement.result.placed !== 1)
      throw new Error("The calculator is already placed; inspect the page before planning.");
    changes.push({ path: change.path, before: change.before, after: change.after });
  } else {
    const before = await read(view);
    if (before === null) throw new Error("Add the calculator before customizing it.");
    calculatorShape(before, recipe?.["price-calculator.react.tsx"]);
    let after;
    if (request.action === "title") {
      after = calculatorTitle(before, request.title);
    } else {
      const presets = /\{\[\d+(?:, ?\d+)*\]\.map\(\(value\) => \(/g;
      if ([...before.matchAll(presets)].length !== 1)
        throw new Error(
          "The calculator presets have changed shape; inspect the source or use your connected agent.",
        );
      after = before.replace(presets, () => `{[${request.values.join(", ")}].map((value) => (`);
    }
    if (after === before)
      throw new Error("The calculator already matches this request. No changes proposed.");
    changes.push({ path: view, before, after });
  }
  return Object.freeze({
    request: text.trim(),
    explanation:
      request.action === "add"
        ? "React matches the buy-box. Reuse its service and /api/quote; place the calculator beside it."
        : "Change the supported setting; preserve the authored body and trailing manual comments.",
    changes: Object.freeze(changes.map((change) => Object.freeze(change))),
  });
}
