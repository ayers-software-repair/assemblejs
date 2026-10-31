// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import hljs from "highlight.js/lib/core";
import css from "highlight.js/lib/languages/css";
import json from "highlight.js/lib/languages/json";
import markdown from "highlight.js/lib/languages/markdown";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";

hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("css", css);
hljs.registerLanguage("json", json);
hljs.registerLanguage("markdown", markdown);

/** Highlight text, never existing markup; the returned spans contain escaped source. */
export function highlightSource(path, text) {
  const extension = path.split(".").at(-1);
  const language = /^(?:[cm]?[jt]sx?)$/.test(extension)
    ? "typescript"
    : ["html", "vue", "svelte", "ejs", "hbs", "njk"].includes(extension)
      ? "xml"
      : extension === "md"
        ? "markdown"
        : ["css", "json"].includes(extension)
          ? extension
          : "plaintext";
  if (language === "plaintext")
    return text.replace(
      /[&<>"']/g,
      (value) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[value],
    );
  return hljs.highlight(text, { language, ignoreIllegals: true }).value;
}
