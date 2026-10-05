// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { encodeParams } from "./encode-params.js";
import { identity } from "./identity.js";

/**
 * Where a placement's content is held. The query is part of it, and so are the page's route
 * parameters: a different query, or a different parameter, is a different page. A placement
 * from another server is keyed by its url, never by the name the template gave it, because two
 * pages may place two different remote assemblies under one local name, and a shared key would
 * serve one page the other's.
 *
 * The headers the request carries are part of it too, as an HTTP cache varies on them: they are
 * only the ones a remote declared it reads, so an answer that differs by them is held once per
 * value, and one visitor's answer is never served to another who sent a different value.
 */
export function cacheKey(
  name: string,
  view: string,
  query: URLSearchParams,
  url?: string,
  headers: Readonly<Record<string, string>> = {},
  params: Readonly<Record<string, string>> = {},
): string {
  const byName = ([a]: [string, string], [b]: [string, string]): number =>
    a < b ? -1 : a > b ? 1 : 0;
  const search = new URLSearchParams([...query.entries()].sort(byName)).toString();
  const where = url ?? identity(name, view);
  const encoded = encodeParams(params);
  const at = encoded.length > 0 ? `${where};${encoded}` : where;
  const key = search.length > 0 ? `${at}?${search}` : at;
  const varied = Object.entries(headers).sort(byName);
  return varied.length > 0 ? `${key} ${JSON.stringify(varied)}` : key;
}
