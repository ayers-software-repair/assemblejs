// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { highlightSource } from "./highlight-source.js";
import { WorkspaceFiles } from "./workspace-files.js";

/** A code view over the supplied project's files; it does not start or simulate a runtime. */
export function createSourceEditor(container, project, paths) {
  const document = container.ownerDocument;
  const files = new WorkspaceFiles(project, paths);
  const element = (tag, text) => {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const panel = element("section");
  panel.className = "academy-code";
  panel.setAttribute("aria-label", "Project code");
  const tree = element("nav");
  tree.setAttribute("aria-label", "Project files");
  const tabs = element("nav");
  tabs.setAttribute("aria-label", "Open files");
  const heading = element("h2", "Choose a file");
  const label = element("label", "Source");
  const input = element("textarea");
  input.spellcheck = false;
  input.wrap = "off";
  input.setAttribute("aria-label", "Source code");
  const surface = element("div");
  surface.className = "academy-source-surface";
  label.append(surface);
  const formatted = element("pre");
  formatted.setAttribute("aria-hidden", "true");
  const code = element("code");
  formatted.append(code);
  surface.append(formatted, input);
  const syncScroll = () => {
    formatted.scrollTop = input.scrollTop;
    formatted.scrollLeft = input.scrollLeft;
  };
  input.addEventListener("scroll", syncScroll);
  input.addEventListener("keyup", (event) => {
    if (event.key === "Home" && input.selectionStart === 0 && input.selectionEnd === 0) {
      // Native Home can retain a positive scroll offset and clip the first source line.
      input.scrollTop = 0;
      input.scrollLeft = 0;
      syncScroll();
    }
  });
  const save = element("button", "Save file");
  save.type = "button";
  const reload = element("button", "Reload file");
  reload.type = "button";
  reload.disabled = true;
  const status = element("p", "Choose a file to edit.");
  status.setAttribute("role", "status");
  const buttons = new Map();
  let active;
  let opening = 0;
  let disposed = false;
  let reloading = false;
  const refresh = () => {
    if (!active || disposed) return;
    const buffer = files.buffer(active);
    // A pre does not paint the final empty line that a textarea retains.
    code.innerHTML = highlightSource(active, buffer.text) + "\n";
    save.disabled = reloading || !buffer.dirty;
    reload.disabled = reloading || buffer.dirty;
    for (const [path, button] of buttons) {
      button.textContent = path + (files.buffer(path).dirty ? " *" : "");
      button.setAttribute("aria-current", String(path === active));
    }
  };
  const open = async (path) => {
    const ticket = ++opening;
    try {
      await files.open(path);
      if (disposed || ticket !== opening) return;
      if (!buttons.has(path)) {
        const button = element("button", path);
        button.type = "button";
        button.addEventListener("click", () => void open(path));
        buttons.set(path, button);
        tabs.append(button);
      }
      active = path;
      heading.textContent = path;
      input.value = files.buffer(path).text;
      input.disabled = false;
      status.textContent = files.buffer(path).dirty ? "Unsaved changes." : "File loaded.";
      refresh();
    } catch (error) {
      if (!disposed && ticket === opening) status.textContent = String(error);
    }
  };
  for (const path of files.paths) {
    const button = element("button", path);
    button.type = "button";
    button.addEventListener("click", () => void open(path));
    tree.append(button);
  }
  input.disabled = true;
  save.disabled = true;
  input.addEventListener("input", () => {
    if (!active) return;
    files.edit(active, input.value);
    refresh();
    status.textContent = files.buffer(active).dirty ? "Unsaved changes." : "No changes.";
  });
  save.addEventListener("click", async () => {
    const path = active;
    if (!path) return;
    save.disabled = true;
    try {
      const result = await files.save(path);
      if (!disposed)
        status.textContent = result.dirty
          ? `Saved ${path}; newer edits remain unsaved.`
          : `Saved ${path}. Run checks to update the preview.`;
    } catch (error) {
      if (!disposed) status.textContent = `Not saved: ${String(error)}. Your buffer is kept.`;
    } finally {
      refresh();
    }
  });
  reload.addEventListener("click", async () => {
    const path = active;
    if (!path) return;
    reloading = true;
    refresh();
    try {
      const buffer = await files.reload(path);
      if (!disposed && active === path) {
        input.value = buffer.text;
        status.textContent = `Reloaded ${path} from the project. Run checks to verify it.`;
      }
    } catch (error) {
      if (!disposed && active === path) status.textContent = `Not reloaded: ${String(error)}.`;
    } finally {
      reloading = false;
      refresh();
    }
  });
  panel.append(tree, tabs, heading, label, save, reload, status);
  container.append(panel);
  return {
    open,
    files,
    destroy() {
      disposed = true;
      opening++;
      panel.remove();
    },
  };
}
