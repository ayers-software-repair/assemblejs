// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { callProjectTool } from "./call-project-tool.js";
import { createProjectFiles } from "./create-project-files.js";
import { readProjectVersion } from "./read-project-version.js";

/** Observe a placement failure and its recovery on two distinct saved revisions. */
export function createPlacementRecovery(document, client) {
  let failure;
  const path = "src/pages/product/product.html";
  const files = createProjectFiles(client);
  const rule = "a-placement-names-an-assembly";
  return async (signal) => {
    signal.throwIfAborted();
    const version = await readProjectVersion(client);
    signal.throwIfAborted();
    const result = await callProjectTool(client, "check");
    signal.throwIfAborted();
    const findings = result.result?.findings;
    if (
      !Array.isArray(findings) ||
      findings.length > 1000 ||
      findings.length !== result.problems.length ||
      result.ok !== (findings.length === 0) ||
      !findings.every(
        (item) =>
          typeof item?.path === "string" &&
          typeof item.rule === "string" &&
          typeof item.message === "string" &&
          typeof item.fix === "string",
      )
    )
      throw new Error("The check did not return valid project findings.");
    const source = await files.readFile(path);
    signal.throwIfAborted();
    const current = await readProjectVersion(client);
    signal.throwIfAborted();
    if (current !== version) throw new Error("Saved source changed during checking. Check again.");
    const template = document.createElement("template");
    template.innerHTML = source;
    const finding = findings.find(
      (item) =>
        item.path === path &&
        item.rule === rule &&
        item.message.endsWith('places "buy-box-missing", and there is no such assembly'),
    );
    if (finding && template.content.querySelector('assembly[name="buy-box-missing"]')) {
      failure = { version };
      return { kind: "finding", version, finding };
    }
    if (!result.ok) return { kind: "other-findings", version, findings };
    if (
      !failure ||
      failure.version === version ||
      !template.content.querySelector('assembly[name="buy-box"]')
    )
      return { kind: "no-observed-failure", version };
    return {
      kind: "recovered",
      lesson: "fix-placement",
      revision: 1,
      version,
      failedVersion: failure.version,
    };
  };
}
