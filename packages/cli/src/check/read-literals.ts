// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { transformSync } from "esbuild";
import type { LiteralValue } from "./literal-value.js";

// What can stand before a `{` that opens an object literal rather than a block.
const BEFORE_OBJECT = /(?:[(,:=[?]|\breturn|\bdefault)\s*$/;

/**
 * Every object literal at the outside of a TypeScript module, read without running any of it.
 * The source is first compiled to plain JavaScript, which drops its types and comments, so a
 * remote named in a comment is not a remote. Inside an object, a key's literal value is kept and
 * anything computed is null.
 */
export function readLiterals(source: string): readonly LiteralValue[] {
  const code = transformSync(source, { loader: "ts", format: "esm" }).code;
  const found: LiteralValue[] = [];
  let i = 0;
  const space = (): void => {
    while (i < code.length && /\s/.test(code.charAt(i))) i += 1;
  };
  const string = (): string | null => {
    const quote = code.charAt(i);
    let text = "";
    let computed = false;
    i += 1;
    while (i < code.length && code.charAt(i) !== quote) {
      if (code.charAt(i) === "\\") {
        text += code.charAt(i + 1);
        i += 2;
        continue;
      }
      if (quote === "`" && code.startsWith("${", i)) {
        computed = true;
        skipBalanced("{", "}", i + 1);
        continue;
      }
      text += code.charAt(i);
      i += 1;
    }
    i += 1;
    return computed ? null : text;
  };
  // Moves past a bracketed run that starts at `from`, strings inside it included.
  const skipBalanced = (open: string, close: string, from: number): void => {
    let depth = 0;
    i = from;
    while (i < code.length) {
      const char = code.charAt(i);
      if (char === '"' || char === "'" || char === "`") {
        string();
        continue;
      }
      if (char === open) depth += 1;
      if (char === close) depth -= 1;
      i += 1;
      if (depth === 0) return;
    }
  };
  // Moves to the end of a value this does not read: the next `,` or closing bracket at its depth.
  const skipValue = (): void => {
    let depth = 0;
    while (i < code.length) {
      const char = code.charAt(i);
      if (char === '"' || char === "'" || char === "`") {
        string();
        continue;
      }
      if ("([{".includes(char)) depth += 1;
      if (")]}".includes(char)) {
        if (depth === 0) return;
        depth -= 1;
      }
      if (char === "," && depth === 0) return;
      i += 1;
    }
  };
  const value = (): LiteralValue => {
    space();
    const char = code.charAt(i);
    if (char === '"' || char === "'" || char === "`") {
      const text = string();
      space();
      if (!",}]".includes(code.charAt(i))) {
        skipValue();
        return null;
      }
      return text;
    }
    if (char === "{") return object();
    if (char === "[") return array();
    skipValue();
    return null;
  };
  const array = (): LiteralValue => {
    const items: LiteralValue[] = [];
    i += 1;
    for (;;) {
      space();
      if (code.charAt(i) === "]" || i >= code.length) break;
      items.push(value());
      space();
      if (code.charAt(i) === ",") i += 1;
    }
    i += 1;
    return items;
  };
  const object = (): LiteralValue => {
    const entries: Record<string, LiteralValue> = {};
    i += 1;
    for (;;) {
      space();
      if (code.charAt(i) === "}" || i >= code.length) break;
      let key: string | null = null;
      const char = code.charAt(i);
      if (char === '"' || char === "'") key = string();
      else if (/[A-Za-z_$]/.test(char)) {
        const name = /^[A-Za-z_$][\w$]*/.exec(code.slice(i))?.[0] ?? "";
        key = name;
        i += name.length;
      }
      space();
      if (key !== null && code.charAt(i) === ":") {
        i += 1;
        entries[key] = value();
      } else {
        // A spread, a computed key, a shorthand or a method: there, but not read.
        skipValue();
      }
      space();
      if (code.charAt(i) === ",") i += 1;
    }
    i += 1;
    return entries;
  };

  while (i < code.length) {
    const char = code.charAt(i);
    if (char === '"' || char === "'" || char === "`") {
      string();
      continue;
    }
    if (char === "{" && BEFORE_OBJECT.test(code.slice(Math.max(0, i - 12), i))) {
      found.push(object());
      continue;
    }
    i += 1;
  }
  return found;
}
