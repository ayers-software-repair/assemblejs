// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { createProjectFiles } from "./create-project-files.js";
import { readProjectVersion } from "./read-project-version.js";

/** Verify the authored manual edit against the saved source and the served Market product. */
export async function verifyManualEdit(document, client, preview, readPage, signal) {
  signal.throwIfAborted();
  const unchanged = async () => {
    const version = await readProjectVersion(client);
    signal.throwIfAborted();
    if (version !== preview.version) {
      throw new Error("Saved source no longer matches the preview. Check & preview again.");
    }
  };
  await unchanged();
  signal.throwIfAborted();
  const path = "src/assemblies/buy-box/buy-box.react.tsx";
  const source = await createProjectFiles(client).readFile(path);
  signal.throwIfAborted();
  if (!/>\s*Add to bag\s*<\/button>/.test(source)) {
    throw new Error("Save the Add to bag label in the buy-box source before checking.");
  }
  const page = await readPage(preview.url, signal);
  signal.throwIfAborted();
  if (page?.url !== preview.url || typeof page.html !== "string" || page.html.length > 524288) {
    throw new Error("The response does not identify the current product preview.");
  }
  const view = document.createElement("template");
  view.innerHTML = page.html;
  const assemblies = view.content.querySelectorAll('assembly-root[data-name="buy-box"]');
  if (assemblies.length !== 1 || assemblies[0].hasAttribute("data-failed"))
    throw new Error("The served product does not contain one working buy-box assembly.");
  const buttons = assemblies[0].querySelectorAll("aside.buy button");
  if (buttons.length !== 1 || buttons[0].textContent.trim() !== "Add to bag") {
    throw new Error("The served buy box does not show Add to bag.");
  }
  await unchanged();
  signal.throwIfAborted();
  return { lesson: "edit-content", revision: 1, version: preview.version, path };
}
