// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/** Compare served settings and actual quote replies without activating the returned markup. */
export function calculatorEvidence(document, evidence, settings) {
  if (
    typeof evidence?.html !== "string" ||
    evidence.html.length === 0 ||
    new TextEncoder().encode(evidence.html).length > 524288
  )
    throw new Error("Calculator output is missing or exceeds 512 KiB.");
  // Template contents stay detached and inert; never adopt returned nodes into the workspace.
  const template = document.createElement("template");
  template.innerHTML = evidence.html;
  const roots = template.content.querySelectorAll('assembly-root[data-name="price-calculator"]');
  if (roots.length !== 1 || roots[0].hasAttribute("data-failed"))
    throw new Error("Expected one successfully served calculator assembly.");
  const sections = roots[0].querySelectorAll("section[aria-label]");
  const headings = roots[0].querySelectorAll("h2");
  if (
    sections.length !== 1 ||
    headings.length !== 1 ||
    sections[0].getAttribute("aria-label") !== settings.label ||
    headings[0].textContent !== settings.heading
  )
    throw new Error("Served calculator title does not match saved source.");
  const groups = roots[0].querySelectorAll('[aria-label="Quantity presets"]');
  const buttons =
    groups.length === 1 ? [...groups[0].querySelectorAll('button[type="button"]')] : [];
  if (
    buttons.length !== settings.values.length ||
    buttons.some(
      (button, index) =>
        button.textContent.trim() !==
        `${settings.values[index]} ${settings.values[index] === 1 ? "item" : "items"}`,
    )
  )
    throw new Error("Served calculator presets do not match saved source.");
  if (!Array.isArray(evidence.quotes) || evidence.quotes.length !== settings.values.length)
    throw new Error("Quote evidence is incomplete.");
  const quotes = evidence.quotes.map((entry, index) => {
    const quantity = settings.values[index];
    const body = entry?.body;
    const line = body?.lines?.[0];
    if (
      entry?.quantity !== quantity ||
      entry.status !== 200 ||
      !Array.isArray(body?.lines) ||
      body.lines.length !== 1 ||
      line?.sku !== "kb-guji-250" ||
      line.quantity !== quantity ||
      !Number.isSafeInteger(line.cents) ||
      line.cents < 0 ||
      !Number.isSafeInteger(body.cents) ||
      body.cents < 0 ||
      body.cents !== line.cents * quantity ||
      !Array.isArray(body.problems) ||
      body.problems.some((problem) => typeof problem !== "string")
    )
      throw new Error(
        `Quote evidence for quantity ${quantity} is invalid or failed: ${JSON.stringify(entry)}`,
      );
    return { quantity, cents: body.cents, problems: [...body.problems] };
  });
  return { title: settings.heading, values: [...settings.values], quotes };
}
