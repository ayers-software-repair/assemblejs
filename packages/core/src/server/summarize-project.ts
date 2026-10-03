// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { ApiDefinition } from "../api/api-definition.js";
import { isStreamApi } from "../api/is-stream-api.js";
import type { AssemblyDefinition } from "../assembly/assembly-definition.js";
import type { ProjectSummary } from "../devtools/project-summary.js";
import type { PageDefinition } from "../page/page-definition.js";
import type { RemoteDefinition } from "../remote/remote-definition.js";

/** The project as devtools may read it, copied out of its declarations field by field. */
export function summarizeProject(project: {
  readonly mode: ProjectSummary["mode"];
  readonly version: string;
  readonly assemblies: readonly AssemblyDefinition[];
  readonly pages: readonly PageDefinition[];
  readonly apis: readonly ApiDefinition[];
  readonly remotes: readonly RemoteDefinition[];
}): ProjectSummary {
  return {
    mode: project.mode,
    version: project.version,
    assemblies: project.assemblies.map((assembly) => ({
      name: assembly.name,
      views: Object.entries(assembly.views).map(([name, view]) => ({
        name,
        renderer: view.renderer,
      })),
      mount: assembly.mount ?? "load",
      shadow: assembly.shadow === true,
    })),
    pages: project.pages.map((page) => ({ route: page.route, stream: page.stream })),
    apis: project.apis.map((api) => ({
      method: api.method ?? "GET",
      path: api.path,
      streams: isStreamApi(api),
    })),
    remotes: project.remotes.map((remote) => ({ origin: remote.origin })),
  };
}
