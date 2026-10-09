// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { AssemblyAssets } from "../assembly/assembly-assets.js";
import type { AssemblyRequest } from "../compose/assembly-request.js";
import type { AssemblyResponse } from "../compose/assembly-response.js";

/**
 * How a server reaches assemblies on other servers. One fetch per placement url, and the browser
 * files each remote assembly's manifest declared, learned once per version of its output.
 */
export interface RemoteTransport {
  fetch(url: string, request: AssemblyRequest): Promise<AssemblyResponse>;
  /**
   * The files to link for the assembly at a url, absolute, once its manifest has been read; a
   * read still in flight is waited for, within its own deadline.
   */
  assets(url: string): Promise<AssemblyAssets | undefined>;
}
