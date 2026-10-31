// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { cpSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/** Hosted fixture only: copy real Market source and remove the exact feature being taught. */
export function createCalculatorProject(root) {
  const calculatorFiles = [
    "price-calculator.react.tsx",
    "price-calculator.css",
    "price-calculator.service.ts",
    "request-estimate.ts",
  ];
  const shop = "examples/market/shop";
  const recipe = Object.fromEntries(
    calculatorFiles.map((file) => [
      file,
      readFileSync(join(shop, "src/assemblies/price-calculator", file), "utf8"),
    ]),
  );
  rmSync(join(root, "src"), { recursive: true });
  cpSync(join(shop, "src"), join(root, "src"), { recursive: true });
  cpSync(join(shop, "assemblejs.config.ts"), join(root, "assemblejs.config.ts"));
  cpSync(join(shop, "package.json"), join(root, "package.json"));
  symlinkSync(realpathSync(join(shop, "node_modules")), join(root, "node_modules"), "dir");
  rmSync(join(root, "src/assemblies/price-calculator"), { recursive: true });
  const page = join(root, "src/pages/product/product.html");
  const before = readFileSync(page, "utf8");
  recipe["product.html"] = before;
  const placement = '          <assembly name="price-calculator"></assembly>\n';
  if (before.split(placement).length !== 2)
    throw new Error("expected the canonical calculator placement");
  writeFileSync(page, before.replace(placement, ""));
  return recipe;
}
