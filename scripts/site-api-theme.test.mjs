// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { posix } from "node:path";
import { test } from "node:test";
import { JSX } from "typedoc";
import { contrast } from "./check-site.mjs";
import { load } from "./site-api-theme.mjs";
import { renderLinks, sharedLinksMatch } from "./site-links.mjs";

test("TypeDoc keeps the real product header and active navigation at every reference depth", () => {
  const hooks = new Map();
  load({ renderer: { hooks: { on: (name, hook) => hooks.set(name, hook) }, on() {} } });
  const manifest = JSON.parse(readFileSync(new URL("../site/pages.json", import.meta.url), "utf8"));
  for (const file of ["index.html", "classes/Assembly.html"]) {
    const html = JSX.renderElement(
      hooks.get("body.begin")({
        page: { url: file },
        relativeURL: (path) => posix.relative(posix.dirname(file), path),
      }),
    );
    const icon = JSX.renderElement(
      hooks.get("head.end")({
        relativeURL: (path) => posix.relative(posix.dirname(file), path),
      }),
    );
    assert.ok(html.includes("mark-bc2a8e621dba.png"));
    assert.ok(icon.includes("mark-bc2a8e621dba.png"));
    assert.doesNotMatch(html + icon, /(?:mark|favicon)\.svg/);
    assert.match(html, /<header class="product-header">/);
    assert.doesNotMatch(html, /undefined/);
    assert.ok(
      sharedLinksMatch(
        html,
        renderLinks(manifest, { file: `docs/api/${file}` }),
        `docs/api/${file}`,
      ),
    );
    assert.match(html, /href="#tsd-content"/);
  }
});

test("fixed product API surfaces keep readable TypeDoc foregrounds in light preference", () => {
  const vendor = readFileSync(
    new URL("../node_modules/typedoc/static/style.css", import.meta.url),
    "utf8",
  );
  const values = new Map(
    [...vendor.matchAll(/(--(?:light|dark)-[a-z-]+):\s*([^;]+);/g)].map((match) => [
      match[1],
      match[2].trim(),
    ]),
  );
  for (const name of [...values.keys()].filter((name) => name.startsWith("--light-"))) {
    values.set(name.replace("--light-", "--"), `var(${name})`);
  }
  for (const file of ["skin.css", "api-theme.css"]) {
    const css = readFileSync(new URL("../site/" + file, import.meta.url), "utf8");
    for (const match of css.matchAll(/(--[a-z-]+):\s*([^;]+);/g))
      values.set(match[1], match[2].trim());
  }
  const resolve = (name) => {
    const value = values.get(name);
    assert.ok(value, "unbound " + name);
    const linked = /^var\(\s*(--[a-z-]+)\s*\)$/.exec(value);
    return linked ? resolve(linked[1]) : value;
  };
  const tokens = [...values.keys()].filter((name) => name.startsWith("--color-ts-"));
  assert.ok(tokens.length >= 20);
  for (const background of ["--surface", "--surface-panel"]) {
    assert.ok(
      contrast(resolve("--color-icon-text"), resolve(background)) >= 3,
      "icon contrast on " + background,
    );
    for (const name of [
      ...tokens,
      "--color-warning-text",
      "--color-comment-tag-text",
      "--color-document",
      "--color-alert-note",
      "--color-alert-tip",
      "--color-alert-important",
      "--color-alert-warning",
      "--color-alert-caution",
    ]) {
      assert.ok(
        contrast(resolve(name), resolve(background)) >= 4.5,
        name + " contrast on " + background,
      );
    }
  }
});
