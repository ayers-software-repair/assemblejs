// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { AssetWeight } from "./asset-weight.js";
import type { PageWeight } from "./page-weight.js";
import { weigh } from "./weigh.js";

const STYLESHEET = /<link rel="stylesheet" href="([^"]+)">/g;
const MODULE = /<script type="module" src="([^"]+)"><\/script>/g;

const sum = (weights: readonly AssetWeight[]): AssetWeight => ({
  bytes: weights.reduce((total, weight) => total + weight.bytes, 0),
  gzip: weights.reduce((total, weight) => total + weight.gzip, 0),
});

/** The url an attribute names, its entities read back as the browser reads them. */
const attribute = (value: string): string =>
  value
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&");

/**
 * Asks a running server for a page as a visitor's browser would, then for each stylesheet and
 * module script the page links, each once, and weighs what came back. Anything the server does
 * not answer with 200 is a failure, never a weight of nothing.
 */
export async function measurePage(origin: string, route: string): Promise<PageWeight> {
  const get = async (path: string): Promise<Uint8Array> => {
    const response = await fetch(new URL(path, origin));
    if (response.status !== 200) throw new Error(`${path} answered ${response.status}`);
    return new Uint8Array(await response.arrayBuffer());
  };
  const page = await get(route);
  const html = new TextDecoder().decode(page);
  const linked = async (pattern: RegExp): Promise<AssetWeight> => {
    const urls = new Set([...html.matchAll(pattern)].map((match) => attribute(match[1] ?? "")));
    return sum(await Promise.all([...urls].map(async (url) => weigh(await get(url)))));
  };
  return {
    route,
    document: weigh(page),
    styles: await linked(STYLESHEET),
    scripts: await linked(MODULE),
  };
}
