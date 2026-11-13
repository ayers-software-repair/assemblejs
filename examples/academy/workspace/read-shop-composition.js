// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { readProjectVersion } from "./read-project-version.js";

/** Identify the two lesson assemblies from the served composition at the observed revision. */
export async function readShopComposition(document, client, preview, readPage, signal) {
  const checkRevision = async () => {
    signal.throwIfAborted();
    const version = await readProjectVersion(client);
    signal.throwIfAborted();
    if (version !== preview.version)
      throw new Error("Saved source changed. Check & preview again.");
  };
  await checkRevision();
  const page = await readPage(preview.url, signal);
  if (page?.url !== preview.url || typeof page.html !== "string" || page.html.length > 524288)
    throw new Error("The response does not identify the current product preview.");
  const template = document.createElement("template");
  template.innerHTML = page.html;
  const assemblies = [];
  for (const name of ["buy-box", "product-detail"]) {
    const [assembly, duplicate] = template.content.querySelectorAll(
      `assembly-root[data-name="${name}"]`,
    );
    if (!assembly || duplicate || assembly.hasAttribute("data-failed"))
      throw new Error(`The preview does not contain one working ${name} assembly.`);
    const origin = assembly.getAttribute("data-remote");
    if (name === "buy-box" ? origin !== null : !origin)
      throw new Error(`The preview has unexpected composition for ${name}.`);
    assemblies.push({ name, origin });
  }
  const buyBox = template.content.querySelector('assembly-root[data-name="buy-box"]');
  const calculator = template.content.querySelectorAll(
    'assembly-root[data-name="price-calculator"]',
  );
  const calculatorBesideBuyBox =
    calculator.length === 1 &&
    buyBox.nextElementSibling === calculator[0] &&
    !calculator[0].hasAttribute("data-failed") &&
    !calculator[0].hasAttribute("data-remote") &&
    Boolean(calculator[0].querySelector("section[aria-label] h2")?.textContent.trim()) &&
    Boolean(
      calculator[0]
        .querySelector('[aria-label="Quantity presets"] button[type="button"]')
        ?.textContent.trim(),
    );
  await checkRevision();
  return {
    calculatorBesideBuyBox,
    lesson: "explore-shop",
    revision: 1,
    version: preview.version,
    assemblies,
  };
}
