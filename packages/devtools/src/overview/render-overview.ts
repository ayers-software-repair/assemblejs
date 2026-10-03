// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { DevtoolsView } from "@assemblejs/core";
import { DEVTOOLS_ROUTE_PREFIX, escapeText } from "@assemblejs/core";

/** A table of rows of text, each cell escaped, or a line saying there is nothing. */
const table = (head: readonly string[], rows: readonly (readonly string[])[], none: string) =>
  rows.length === 0
    ? `<p>${escapeText(none)}</p>`
    : `<table><tr>${head.map((cell) => `<th>${escapeText(cell)}</th>`).join("")}</tr>${rows
        .map((row) => `<tr>${row.map((cell) => `<td>${escapeText(cell)}</td>`).join("")}</tr>`)
        .join("")}</table>`;

/**
 * The devtools overview: what the server was built from and the failures it logged most recently,
 * as one document of escaped text. It reads the view and nothing else, and offers no control.
 */
export function renderOverview(view: DevtoolsView): string {
  const { project } = view;
  const failures = view.failures();
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>AssembleJS devtools</title>
<link rel="stylesheet" href="${DEVTOOLS_ROUTE_PREFIX}/devtools.css">
</head>
<body>
<h1>AssembleJS devtools</h1>
<p>${escapeText(`${project.mode}, version ${project.version}`)}. <a href="${DEVTOOLS_ROUTE_PREFIX}/project.json">project.json</a></p>
<h2>Assemblies</h2>
${table(
  ["name", "views", "mount", "shadow root"],
  project.assemblies.map((assembly) => [
    assembly.name,
    assembly.views.map((v) => `${v.name} (${v.renderer})`).join(", "),
    assembly.mount,
    assembly.shadow ? "yes" : "no",
  ]),
  "No assemblies.",
)}
<h2>Pages</h2>
${table(
  ["route", "stream"],
  project.pages.map((page) => [page.route, page.stream ?? ""]),
  "No pages.",
)}
<h2>Apis</h2>
${table(
  ["method", "path", "streams"],
  project.apis.map((api) => [api.method, api.path, api.streams ? "yes" : "no"]),
  "No apis.",
)}
<h2>Remotes</h2>
${table(
  ["origin"],
  project.remotes.map((remote) => [remote.origin]),
  "No remotes.",
)}
<h2>Recent failures</h2>
${
  failures.length === 0
    ? "<p>None since the server started.</p>"
    : `<table><tr><th>id</th><th>what happened</th></tr>${failures
        .map(
          (line) =>
            `<tr><td><code>${escapeText(line.correlationId)}</code></td><td><pre>${escapeText(line.stack ?? line.message)}</pre></td></tr>`,
        )
        .join("")}</table>`
}
</body>
</html>
`;
}
