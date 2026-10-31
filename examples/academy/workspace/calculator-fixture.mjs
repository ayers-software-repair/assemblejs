// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { createHash } from "node:crypto";
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
      if (name === "plan_page_placement") {
        const path = "src/pages/product/product.html";
        const before = files.get(path);
        const anchor = '          <assembly name="buy-box"></assembly>';
        if (typeof before !== "string" || before.split(anchor).length !== 2)
          return answer(null, false, ["fixture placement refused"]);
        return answer({
          change: {
            path,
            before,
            after: before.replace(
              anchor,
              `${anchor}\n          <assembly name="price-calculator"></assembly>`,
            ),
          },
          placed: before.split('<assembly name="price-calculator"').length,
        });
      }
      if (name === "read_source_version")
        return answer({
          version: createHash("sha256")
            .update(JSON.stringify([...files].sort()))
            .digest("hex")
            .slice(0, 12),
        });
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
