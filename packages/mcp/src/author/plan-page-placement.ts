// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { placeAssembly } from "@asmjs/cli";
import type { PlacementPosition } from "@asmjs/cli";
import { findPlacements, SEGMENT } from "@asmjs/core";
import type { ProjectRoot } from "../root/project-root.js";
import type { ToolResult } from "../server/tool-result.js";
import { readSource } from "./read-source.js";

/** Plan a guarded page edit through the CLI parser without writing or requiring the new assembly yet. */
export function planPagePlacement(
  root: ProjectRoot,
  page: string,
  name: string,
  position: PlacementPosition,
): ToolResult {
  if (!SEGMENT.test(page) || !SEGMENT.test(name))
    return { ok: false, result: null, problems: ["use valid lowercase page and assembly names"] };
  const path = `src/pages/${page}/${page}.html`;
  if (path.length > 256)
    return { ok: false, result: null, problems: ["source paths are limited to 256 characters"] };
  const source = readSource(root, path);
  if (!source.ok) return source;
  const { contents: before } = source.result as { contents: string };
  const placed = placeAssembly(before, name, position, path);
  if ("problem" in placed) return { ok: false, result: null, problems: [placed.problem] };
  const neighbour =
    "after" in position ? position.after : "before" in position ? position.before : undefined;
  if (
    neighbour !== undefined &&
    findPlacements(before).filter((item) => item.name === neighbour).length !== 1
  )
    return {
      ok: false,
      result: null,
      problems: [
        "the neighbouring assembly must be placed exactly once; choose another neighbour or the start/end",
      ],
    };
  if (Buffer.byteLength(placed.template, "utf8") > 65536)
    return { ok: false, result: null, problems: ["planned source is limited to 65536 bytes"] };
  return {
    ok: true,
    result: { change: { path, before, after: placed.template }, placed: placed.placed },
    problems: [],
  };
}
