// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { callProjectTool } from "./call-project-tool.js";
import { createCalculatorControls } from "./create-calculator-controls.js";
import { createModeWalkthrough } from "./create-mode-walkthrough.js";
import { createProjectFiles } from "./create-project-files.js";
import { createSourceEditor } from "./create-source-editor.js";
import { projectToolResult } from "./project-tool-result.js";
import { readProjectVersion } from "./read-project-version.js";
import { verifyCalculator } from "./verify-calculator.js";

/** One supplied project: source and authored guidance beside a genuine completed-build URL. */
export function createAcademyWorkspace(container, client, recipe, paths, runtime) {
  const document = container.ownerDocument;
  const parent = new URL(document.URL);
  const allowed = new URL(runtime.origin);
  if (
    !["http:", "https:"].includes(allowed.protocol) ||
    allowed.username ||
    allowed.password ||
    allowed.href !== allowed.origin + "/" ||
    allowed.origin === parent.origin ||
    (parent.protocol === "https:" && allowed.protocol !== "https:")
  )
    throw new Error("preview requires a distinct, pinned HTTP(S) origin without credentials");
  if (typeof runtime.rebuild !== "function" || typeof runtime.stop !== "function")
    throw new Error("provide an actual project runtime with rebuild and stop");
  const product = "src/pages/product/product.html";
  if (!Array.isArray(paths) || !paths.includes(product))
    throw new Error("provide the supplied Market source paths");
  const node = (tag, text) => {
    const element = document.createElement(tag);
    if (text !== undefined) element.textContent = text;
    return element;
  };
  const root = node("section");
  root.className = "academy-workspace";
  root.setAttribute("aria-label", "Academy workspace");
  const header = node("header");
  const heading = node("div");
  heading.append(
    node("h1", "AssembleJS Academy"),
    node("p", "Build the supplied Market project. Preview uses saved files."),
  );
  const actions = node("div");
  const build = node("button", "Check & preview");
  const stop = node("button", "Stop preview");
  const verify = node("button", "Verify calculator");
  build.type = stop.type = verify.type = "button";
  actions.append(build, stop, verify);
  header.append(heading, actions);
  const status = node("p", "Check and preview to start the application.");
  status.setAttribute("role", "status");
  status.setAttribute("aria-label", "Workspace status");
  const layout = node("div");
  layout.className = "academy-workspace-layout";
  const guide = node("fieldset");
  guide.setAttribute("aria-label", "Guided editing controls");
  const code = node("fieldset");
  code.setAttribute("aria-label", "Source editing controls");
  const preview = node("section");
  preview.className = "academy-application-preview";
  preview.setAttribute("aria-label", "Application preview");
  const empty = node("p", "Build the saved project to view it here.");
  preview.append(node("h2", "Application"), empty);
  const frame = node("iframe");
  frame.title = "Application preview";
  frame.referrerPolicy = "no-referrer";
  frame.setAttribute("sandbox", "allow-scripts allow-same-origin allow-forms");
  const diagnostics = node("details");
  const output = node("pre");
  diagnostics.append(node("summary", "Build diagnostics"), output);
  let pending = 0;
  let busy = false;
  let touched = false;
  let disposed = false;
  let editor;
  let previewState;
  let verificationController;
  const sync = () => {
    if (disposed) return;
    build.disabled = busy || pending > 0;
    verify.disabled = busy || pending > 0 || !previewState || typeof runtime.inspect !== "function";
    stop.disabled = busy || pending > 0 || !touched;
    guide.disabled = code.disabled = busy;
  };
  const clear = (message) => {
    previewState = undefined;
    frame.remove();
    empty.hidden = false;
    status.textContent = message;
  };
  const observed = {
    async callTool(request) {
      const writing = request.name === "apply_source_changes";
      if (writing && busy) throw new Error("wait for the preview operation before changing source");
      pending++;
      sync();
      if (writing && !disposed) clear("Source change requested. Check and preview again.");
      try {
        const reply = await client.callTool(request);
        if (writing && editor && !disposed && Array.isArray(request.arguments?.changes)) {
          const proposed = new Set(request.arguments.changes.map((change) => change.path));
          try {
            const answer = projectToolResult(reply);
            if (
              Array.isArray(answer.result?.written) &&
              answer.result.written.every((path) => typeof path === "string" && proposed.has(path))
            )
              editor.addPaths(answer.result.written);
          } catch (error) {
            status.textContent =
              "Source acknowledgement needs inspection. Refresh the project connection.";
            output.textContent = String(error);
          }
          for (const path of new Set(request.arguments.changes.map((change) => change.path))) {
            let buffer;
            try {
              buffer = editor.files.buffer(path);
            } catch {
              continue;
            }
            if (!buffer.dirty) await editor.reload(path);
          }
        }
        return reply;
      } finally {
        pending--;
        sync();
      }
    },
  };
  const practice = createModeWalkthrough(guide);
  const tutor = createCalculatorControls(guide, observed, recipe, (state) =>
    practice.update(state),
  );
  editor = createSourceEditor(code, createProjectFiles(observed), paths);
  const refresh = async () => {
    if (disposed || busy || pending)
      return { ok: false, error: "wait for the current project operation" };
    busy = true;
    sync();
    clear("Checking saved project files.");
    try {
      const version = await readProjectVersion(observed);
      if (disposed) return { ok: false, error: "workspace closed" };
      // shortcut: observations miss edit-and-revert races; use snapshots for atomic proof.
      const unchanged = async () => {
        if ((await readProjectVersion(observed)) !== version)
          throw new Error(
            "Project source changed during checking or building. Check and preview again.",
          );
      };
      const check = await callProjectTool(observed, "check");
      output.textContent = JSON.stringify({ version, check }, null, 2);
      if (
        !check.ok ||
        check.problems.length ||
        !Array.isArray(check.result?.findings) ||
        check.result.findings.length
      ) {
        if (!disposed)
          status.textContent = "Project check refused. Inspect its actual diagnostics.";
        return { ok: false, check };
      }
      if (disposed) return { ok: false, error: "workspace closed" };
      await unchanged();
      if (disposed) return { ok: false, error: "workspace closed" };
      touched = true;
      status.textContent = "Building the saved project.";
      const candidate = await runtime.rebuild();
      const url = new URL(candidate);
      if (
        typeof candidate !== "string" ||
        url.origin !== allowed.origin ||
        url.username ||
        url.password
      )
        throw new Error("runtime returned a URL outside the pinned preview origin");
      if (disposed) return { ok: false, error: "workspace closed" };
      await unchanged();
      if (disposed) return { ok: false, error: "workspace closed" };
      previewState = Object.freeze({ url: url.href, version });
      frame.src = url.href;
      empty.hidden = true;
      preview.insertBefore(frame, diagnostics);
      status.textContent = "Build completed. Preview requested; check the application.";
      return { ok: true, url: url.href, version };
    } catch (error) {
      if (!disposed) {
        status.textContent = "Preview could not start. Inspect the build diagnostics.";
        output.textContent += `\n${String(error)}`;
      }
      return { ok: false, error: String(error) };
    } finally {
      busy = false;
      sync();
    }
  };
  const checkCalculator = async () => {
    if (disposed || busy || pending)
      return { ok: false, error: "wait for the current project operation" };
    busy = true;
    verificationController = new AbortController();
    sync();
    status.textContent = "Checking saved calculator output and quote responses.";
    try {
      const evidence = await verifyCalculator(
        document,
        observed,
        recipe,
        runtime,
        previewState,
        verificationController.signal,
      );
      if (disposed) return { ok: false, error: "workspace closed" };
      output.textContent = JSON.stringify(evidence, null, 2);
      status.textContent = `Saved calculator output and quotes verified for revision ${evidence.version}. Try the quantity buttons.`;
      return { ok: true, evidence };
    } catch (error) {
      if (!disposed) {
        clear("Calculator check failed. Inspect its diagnostics, then check and preview again.");
        output.textContent = String(error);
      }
      return { ok: false, error: String(error) };
    } finally {
      verificationController = undefined;
      busy = false;
      sync();
    }
  };
  const stopPreview = async () => {
    if (disposed || busy || pending)
      return { ok: false, error: "wait for the current project operation" };
    busy = true;
    sync();
    clear("Stopping the preview.");
    try {
      await runtime.stop();
      touched = false;
      if (!disposed) status.textContent = "Preview stopped. Your source is kept.";
      return { ok: true };
    } catch (error) {
      if (!disposed) {
        status.textContent = "Preview stop failed. Inspect the runtime.";
        output.textContent += `\n${String(error)}`;
      }
      return { ok: false, error: String(error) };
    } finally {
      busy = false;
      sync();
    }
  };
  build.addEventListener("click", () => void refresh());
  stop.addEventListener("click", () => void stopPreview());
  verify.addEventListener("click", () => void checkCalculator());
  preview.append(diagnostics);
  layout.append(guide, code, preview);
  root.append(header, status, layout);
  container.append(root);
  sync();
  void editor.open(product);
  return {
    editor,
    tutor,
    refresh,
    verify: checkCalculator,
    stop: stopPreview,
    destroy() {
      disposed = true;
      verificationController?.abort();
      practice.destroy();
      tutor.destroy();
      editor.destroy();
      root.remove();
    },
  };
}
