// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { AssetWeight } from "./asset-weight.js";

/**
 * What one page sends a visitor before anything mounts: the document, the stylesheets it links,
 * and the module scripts it links. The chunks an assembly loads when it mounts are not in it.
 */
export interface PageWeight {
  readonly route: string;
  readonly document: AssetWeight;
  readonly styles: AssetWeight;
  readonly scripts: AssetWeight;
}
