// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/** Reload-only draft recovery never changes the project or rebases a draft onto changed source. */
export function createDraftRecovery(document, files) {
  const panel = document.createElement("section");
  panel.className = "academy-draft-recovery";
  panel.setAttribute("aria-label", "Draft recovery");
  const message = document.createElement("p");
  message.setAttribute("aria-live", "polite");
  const details = document.createElement("details");
  const summary = document.createElement("summary");
  summary.textContent = "Recovered draft";
  const recovered = document.createElement("textarea");
  recovered.readOnly = true;
  recovered.setAttribute("aria-label", "Recovered draft");
  const discard = document.createElement("button");
  discard.type = "button";
  discard.textContent = "Discard recovered draft";
  details.append(summary, recovered, discard);
  panel.append(message, details);
  const opened = new Set();
  const conflicts = new Map();
  const messages = new Map();
  let active;
  let disposed = false;
  const key = (path) =>
    "assemblejs-academy-draft:1:" +
    JSON.stringify([document.location.pathname, document.location.search, path]);
  const storage = () => document.defaultView.sessionStorage;
  const valid = (draft) =>
    draft !== null &&
    typeof draft === "object" &&
    Object.keys(draft).sort().join(",") === "base,text" &&
    [draft.base, draft.text].every(
      (value) => typeof value === "string" && new TextEncoder().encode(value).length <= 65536,
    );
  const render = () => {
    if (disposed) return;
    message.textContent = messages.get(active) ?? "";
    message.hidden = !message.textContent;
    const conflict = conflicts.get(active);
    details.hidden = !conflicts.has(active);
    recovered.hidden = !conflict || conflict.text === null;
    recovered.value = conflict?.text ?? "";
    details.open = !details.hidden;
    panel.hidden = message.hidden && details.hidden;
  };
  const unavailable = (path, error) => {
    const notice = `Draft recovery unavailable: ${String(error)}. Your buffer is kept.`;
    messages.set(path, notice);
    if (conflicts.has(path)) conflicts.get(path).notice = notice;
    render();
  };
  const changed = (path) => {
    if (disposed) return;
    try {
      const { base, text, dirty } = files.buffer(path);
      if (conflicts.has(path)) {
        messages.set(
          path,
          conflicts.get(path).notice + (dirty ? " New edits are kept only in memory." : ""),
        );
        render();
        return;
      }
      if (dirty) {
        if (!valid({ base, text })) throw new Error("drafts are limited to 65536 bytes per value");
        storage().setItem(key(path), JSON.stringify({ base, text }));
        messages.set(path, "Draft kept for reload in this tab. Save file to update the project.");
      } else {
        storage().removeItem(key(path));
        messages.delete(path);
      }
      render();
    } catch (error) {
      unavailable(path, error);
    }
  };
  discard.addEventListener("click", () => {
    if (disposed || !active || !conflicts.has(active)) return;
    try {
      storage().removeItem(key(active));
      conflicts.delete(active);
      messages.delete(active);
      changed(active);
    } catch (error) {
      unavailable(active, error);
    }
  });
  render();
  return {
    element: panel,
    open(path) {
      if (disposed) return;
      active = path;
      if (opened.has(path)) {
        render();
        return;
      }
      opened.add(path);
      let raw;
      try {
        raw = storage().getItem(key(path));
        if (raw !== null) {
          if (typeof raw !== "string" || raw.length > 800000)
            throw new Error("stored draft is too large or malformed");
          const draft = JSON.parse(raw);
          if (!valid(draft)) throw new Error("stored draft is malformed");
          const current = files.buffer(path);
          if (draft.text === current.base && !current.dirty) {
            storage().removeItem(key(path));
          } else if (draft.base !== current.base || current.dirty) {
            const notice = "Current source differs. The recovered draft was not restored.";
            conflicts.set(path, { text: draft.text, notice });
            messages.set(path, notice);
          } else {
            files.edit(path, draft.text);
            messages.set(path, "Recovered unsaved draft. Save file to update the project.");
          }
        }
        render();
      } catch (error) {
        conflicts.set(path, {
          text: typeof raw === "string" && raw.length <= 800000 ? raw : null,
        });
        unavailable(path, error);
      }
    },
    changed,
    destroy() {
      disposed = true;
      panel.remove();
    },
  };
}
