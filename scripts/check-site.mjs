#!/usr/bin/env node
// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
//
// The site's two invariants, both of which are the kind of thing that is true on the day it is
// written and quietly false a month later.
//
//   1. The skin binds every role the shared kit consumes, and each binding satisfies the
//      contrast invariant that role carries. A role documented only by its name is settled by
//      whoever writes the first skin; the numbers are from platform/sitekit/ROLES.md.
//   2. Every page pages.json declares exists, every required page is among them, and no page
//      links to one that is not declared. A page advertised and missing is a 404 a visitor
//      finds before anyone else does.
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

// From platform/sitekit/ROLES.md. `null` means the role carries no contrast invariant, only the
// requirement that it is bound at all.
const ROLES = {
  "--surface": null,
  "--surface-panel": { against: "--surface", min: 1.05, max: 3.0 },
  "--border": null,
  "--ink": { against: "--surface", min: 4.5 },
  "--ink-muted": { against: "--surface", min: 4.5 },
  "--ink-dim": { against: "--surface", min: 4.5 },
  "--accent": { against: "--surface", min: 4.5 },
  "--accent-strong": null,
  "--accent-alt": null,
  "--accent-wash": { against: "--surface", min: 1.05, max: 3.0 },
  "--face-display": null,
  "--face-text": null,
  "--face-mono": null,
};

const channel = (value) => {
  const c = value / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

export function luminance(hex) {
  const raw = hex.replace("#", "");
  const full = raw.length === 3 ? [...raw].map((c) => c + c).join("") : raw;
  const [r, g, b] = [0, 2, 4].map((at) => Number.parseInt(full.slice(at, at + 2), 16));
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrast(one, two) {
  const [light, dark] = [luminance(one), luminance(two)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}

/** The roles a skin binds, resolving one level of var() so a role may bind to another role. */
export function readSkin(css) {
  const bound = new Map();
  for (const [, role, value] of css.matchAll(/(--[a-z-]+)\s*:\s*([^;]+);/g)) {
    bound.set(role, value.trim());
  }
  const resolved = new Map();
  for (const [role, value] of bound) {
    const reference = /^var\((--[a-z-]+)\)$/.exec(value);
    resolved.set(role, reference === null ? value : (bound.get(reference[1]) ?? value));
  }
  return resolved;
}

export function checkSkin(css) {
  const problems = [];
  const bound = readSkin(css);
  const surface = bound.get("--surface");

  for (const [role, invariant] of Object.entries(ROLES)) {
    const value = bound.get(role);
    if (value === undefined) {
      problems.push(`${role} is not bound; the kit consumes it and would render unstyled`);
      continue;
    }
    if (invariant === null) continue;
    if (surface === undefined || !surface.startsWith("#") || !value.startsWith("#")) {
      problems.push(`${role} carries a contrast invariant but is not a literal colour`);
      continue;
    }
    const ratio = contrast(value, surface);
    if (invariant.min !== undefined && ratio < invariant.min) {
      problems.push(
        `${role} is ${ratio.toFixed(2)}:1 against the surface, below the ${invariant.min}:1 it must hold`,
      );
    }
    if (invariant.max !== undefined && ratio > invariant.max) {
      problems.push(
        `${role} is ${ratio.toFixed(2)}:1 against the surface, above the ${invariant.max}:1 it must hold`,
      );
    }
  }
  return problems;
}

export function checkPages(siteRoot) {
  const problems = [];
  const manifestPath = join(siteRoot, "pages.json");
  if (!existsSync(manifestPath)) return [`${manifestPath} is missing`];
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

  const declared = new Set(manifest.pages.map((page) => page.file));
  for (const page of manifest.pages) {
    if (!existsSync(join(siteRoot, page.file))) {
      problems.push(`pages.json declares ${page.file}, which does not exist`);
    }
  }
  for (const required of manifest.required ?? []) {
    if (!declared.has(required)) problems.push(`${required} is required and is not declared`);
  }

  // A link to a page nobody declared is a 404 a visitor finds before anyone else does.
  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const path = join(dir, entry);
      if (statSync(path).isDirectory()) {
        if (entry !== "kit") walk(path);
        continue;
      }
      if (!path.endsWith(".html")) continue;
      const html = readFileSync(path, "utf8");
      for (const [, href] of html.matchAll(/href="([^"#:]+\.html)"/g)) {
        const target = href.startsWith("../")
          ? href.slice(3)
          : join(dir, href).slice(siteRoot.length + 1);
        if (!declared.has(target.replaceAll("\\", "/"))) {
          problems.push(`${path} links to "${href}", which pages.json does not declare`);
        }
      }
    }
  };
  walk(siteRoot);
  return problems;
}

const isEntryPoint = import.meta.url === pathToFileURL(process.argv[1] ?? "").href;
if (isEntryPoint) {
  if (process.argv[2] === "--self-test") {
    const bad = checkSkin(":root{--surface:#ffffff;--ink:#f0f0f0;}");
    if (!bad.some((p) => p.includes("--ink")) || !bad.some((p) => p.includes("not bound"))) {
      console.error("site gate self-test FAILED: it must catch unreadable ink and an unbound role");
      for (const p of bad) console.error(`  saw: ${p}`);
      process.exit(1);
    }
    console.log(
      `site gate self-test: red on unreadable ink and on ${bad.length - 1} unbound role(s), as required`,
    );
    process.exit(0);
  }

  if (!existsSync("site")) {
    console.log("site check: no site/ yet, nothing to check");
    process.exit(0);
  }
  const problems = [...checkSkin(readFileSync("site/skin.css", "utf8")), ...checkPages("site")];
  if (problems.length) {
    console.error(`site check failed, ${problems.length} problem(s):`);
    for (const p of problems) console.error(`  ${p}`);
    process.exit(1);
  }
  console.log("site check: clean (skin roles bound and readable, pages declared and present)");
}
