// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { findPackage } from "../../packages/build/dist/index.js";

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
  const starter = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  const market = JSON.parse(readFileSync(join(shop, "package.json"), "utf8"));
  const manifest = {
    ...starter,
    ...market,
    dependencies: { ...starter.dependencies, ...market.dependencies },
    devDependencies: { ...starter.devDependencies, ...market.devDependencies },
  };
  writeFileSync(join(root, "package.json"), JSON.stringify(manifest, null, 2) + "\n");
  for (const name of Object.keys({ ...manifest.dependencies, ...manifest.devDependencies })) {
    const installed = name.startsWith("@asmjs/")
      ? join(process.cwd(), "packages", name.slice(7))
      : (findPackage(realpathSync(shop), name) ?? findPackage(realpathSync("packages/mcp"), name));
    if (installed === undefined || !existsSync(join(installed, "package.json")))
      throw new Error(`fixture dependency is not installed: ${name}`);
    const target = join(root, "node_modules", name);
    mkdirSync(dirname(target), { recursive: true });
    symlinkSync(realpathSync(installed), target, "dir");
  }
  rmSync(join(root, "src/assemblies/price-calculator"), { recursive: true });
  const page = join(root, "src/pages/product/product.html");
  const before = readFileSync(page, "utf8");
  const placement = '          <assembly name="price-calculator"></assembly>\n';
  if (before.split(placement).length !== 2)
    throw new Error("expected the canonical calculator placement");
  writeFileSync(page, before.replace(placement, ""));
  return recipe;
}
