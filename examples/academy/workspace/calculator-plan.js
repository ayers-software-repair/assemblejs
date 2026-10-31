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
    const path = "src/pages/product/product.html";
    const before = await read(path);
    if (before === null) throw new Error("The supplied product page is missing.");
    if (before.includes('name="price-calculator"'))
      throw new Error("The calculator is already placed; inspect the page before planning.");
    const originalPage = recipe?.["product.html"];
    const placement = '          <assembly name="price-calculator"></assembly>\n';
    if (
      typeof originalPage !== "string" ||
      originalPage.split(placement).length !== 2 ||
      before !== originalPage.replace(placement, "")
    )
      throw new Error(
        "The product page differs from the supplied starter. Inspect it or use your agent; guided placement will not guess.",
      );
    const anchor = /^([ \t]*)<assembly name="buy-box"><\/assembly>[ \t]*$/gm;
    const matches = [...before.matchAll(anchor)];
    if (matches.length !== 1)
      throw new Error(
        "Expected one buy-box placement in the supplied product page; inspect the page before planning.",
      );
    const after = before.replace(
      anchor,
      (line, indent) => `${line}\n${indent}<assembly name="price-calculator"></assembly>`,
    );
    changes.push({ path, before, after });
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
