// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { ASSET_ROUTE_PREFIX } from "../vocab/asset-route-prefix.js";

/**
 * Every file under a built asset directory, keyed by the url it is served at.
 *
 * Listed once, at boot. Only a file that is in this map is ever served, so no request can name
 * its way out of the directory: there is no path joined from a url anywhere on the request side.
 * Each url is the file's path percent-encoded, as a browser sends it, and only regular files are
 * listed: a symbolic link could point anywhere.
 */
export function listAssets(directory: string): ReadonlyMap<string, string> {
  const files = new Map<string, string>();
  const walk = (at: string): void => {
    for (const entry of readdirSync(at, { withFileTypes: true })) {
      const path = join(at, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.isFile()) {
        const url = relative(directory, path).split(sep).join("/");
        files.set(`${ASSET_ROUTE_PREFIX}/${encodeURI(url)}`, path);
      }
    }
  };
  walk(directory);
  return files;
}
