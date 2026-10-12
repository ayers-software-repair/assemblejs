// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { ENVELOPE_ELEMENT } from "../vocab/envelope-element.js";
import { OUTLINE_ATTRIBUTE } from "../vocab/outline-attribute.js";
import type { OutlineAccount } from "./outline-account.js";
import type { OutlinePlacement } from "./outline-placement.js";

const SOURCES: readonly string[] = ["local", "remote", "cache", "fallback", "deferred"];

/**
 * The account the server wrote of how this page was composed, or undefined where it wrote
 * none: the last block of its kind that stands outside every envelope.
 *
 * An envelope holds what an assembly sent, another server's included, and a block written
 * inside one is that assembly's word about the page and not the server's. So it is passed
 * over, and whatever is read is read as data: a row that is not a row is left out, and
 * nothing in it is ever run or written as markup.
 */
export function readAccount(page: Document): OutlineAccount | undefined {
  const blocks = [...page.querySelectorAll(`script[${OUTLINE_ATTRIBUTE}]`)].filter(
    (block) => block.closest(ENVELOPE_ELEMENT) === null,
  );
  let read: unknown;
  try {
    read = JSON.parse(blocks.at(-1)?.textContent ?? "");
  } catch {
    return undefined;
  }
  if (!isRecord(read)) return undefined;
  return {
    route: typeof read.route === "string" ? read.route : "",
    ms: typeof read.ms === "number" ? read.ms : 0,
    placements: rows(read.placements),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function rows(value: unknown): OutlinePlacement[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((one: unknown): OutlinePlacement[] => {
    if (!isRecord(one)) return [];
    const { id, name, view, source, ms, browser, refused } = one;
    if (typeof id !== "string" || typeof name !== "string" || typeof view !== "string") return [];
    if (typeof source !== "string" || !SOURCES.includes(source) || typeof ms !== "number") {
      return [];
    }
    const children = rows(one.children);
    return [
      {
        id,
        name,
        view,
        source: source as OutlinePlacement["source"],
        ms,
        ...(typeof browser === "boolean" ? { browser } : {}),
        ...(typeof refused === "number" ? { refused } : {}),
        ...(children.length === 0 ? {} : { children }),
      },
    ];
  });
}
