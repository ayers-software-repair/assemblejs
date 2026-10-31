// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { readFileSync } from "node:fs";

/** Source-only fixture uses canonical Market text; hosted acceptance supplies the actual MCP. */
export function calculatorFixture() {
  const read = (path) =>
    readFileSync(new URL(`../../market/shop/src/${path}`, import.meta.url), "utf8");
  const directory = "src/assemblies/price-calculator/";
  const recipe = Object.fromEntries(
    [
      "price-calculator.react.tsx",
      "price-calculator.css",
      "price-calculator.service.ts",
      "request-estimate.ts",
    ].map((file) => [file, read(`assemblies/price-calculator/${file}`)]),
  );
  recipe["product.html"] = read("pages/product/product.html");
  const page = read("pages/product/product.html").replace(
    '          <assembly name="price-calculator"></assembly>\n',
    "",
  );
  const files = new Map([["src/pages/product/product.html", page]]);
  for (const path of [
    "api/quote.api.ts",
    "assemblies/buy-box/buy-box.service.ts",
    "shop/offer.ts",
    "browser/basket.ts",
  ])
    files.set("src/" + path, read(path));
  const calls = [];
  const answer = (result, ok = true, problems = []) => ({
    content: [{ type: "text", text: JSON.stringify({ ok, result, problems }) }],
  });
  const client = {
    async callTool(request) {
      calls.push(request);
      const { name, arguments: args } = request;
      if (name === "read_source")
        return files.has(args.path)
          ? answer({ path: args.path, contents: files.get(args.path) })
          : answer({ path: args.path, missing: true }, false, ["ENOENT"]);
      if (name === "apply_source_changes") {
        if (args.changes.some((change) => (files.get(change.path) ?? null) !== change.before))
          return answer({ written: [], attempted: [] }, false, ["source changed since review"]);
        for (const change of args.changes) files.set(change.path, change.after);
        return answer({ written: args.changes.map((change) => change.path) });
      }
      if (name === "check") return answer({ findings: [] });
      throw new Error("unexpected tool");
    },
  };
  return { recipe, files, page, directory, calls, client, answer };
}
