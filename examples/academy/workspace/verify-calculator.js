// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { calculatorEvidence } from "./calculator-evidence.js";
import { calculatorPresets } from "./calculator-presets.js";
import { calculatorShape } from "./calculator-shape.js";
import { calculatorTitleParts } from "./calculator-title-parts.js";
import { createProjectFiles } from "./create-project-files.js";
import { readProjectVersion } from "./read-project-version.js";

/** Verify current saved settings against actual served output; no build, write or inferred hydration. */
export async function verifyCalculator(document, client, recipe, runtime, preview, signal) {
  if (!preview || typeof runtime.inspect !== "function")
    throw new Error(
      "Check & preview first with a runtime that can inspect actual calculator output.",
    );
  // shortcut: observations miss edit-and-revert races; require snapshots for atomic proof.
  const unchanged = async () => {
    signal.throwIfAborted();
    const version = await readProjectVersion(client);
    signal.throwIfAborted();
    if (version !== preview.version)
      throw new Error("Saved source no longer matches this preview. Check & preview again.");
  };
  await unchanged();
  signal.throwIfAborted();
  const source = await createProjectFiles(client).readFile(
    "src/assemblies/price-calculator/price-calculator.react.tsx",
  );
  signal.throwIfAborted();
  calculatorShape(source, recipe["price-calculator.react.tsx"]);
  const titles = calculatorTitleParts(source);
  const values = Object.freeze([...calculatorPresets(source).values]);
  const evidence = await runtime.inspect(values, signal);
  signal.throwIfAborted();
  if (evidence?.url !== preview.url)
    throw new Error("Calculator evidence does not identify the actual preview URL.");
  await unchanged();
  signal.throwIfAborted();
  return {
    version: preview.version,
    ...calculatorEvidence(document, evidence, {
      label: titles.label.value,
      heading: titles.heading.value,
      values,
    }),
  };
}
