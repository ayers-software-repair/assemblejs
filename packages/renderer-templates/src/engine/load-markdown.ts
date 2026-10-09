// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { TemplateCompiler } from "./template-compiler.js";

/**
 * Markdown, rendered by markdown-it. A Markdown view is the author's prose: it reads no data and
 * places no children, and HTML written inside it is shown as text, as an `.html` view is the
 * place for markup.
 */
export async function loadMarkdown(): Promise<TemplateCompiler> {
  const { default: MarkdownIt } = await import("markdown-it");
  const markdown = new MarkdownIt({ html: false });
  return (source) => {
    const html = markdown.render(source);
    return () => html;
  };
}
