// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { academyLessons } from "./academy-lessons.js";

/** Present the shared lessons and the evidence each check must produce. */
export function createLessonGuide(container) {
  const document = container.ownerDocument;
  const panel = document.createElement("section");
  panel.setAttribute("aria-label", "Academy lessons");
  const availability = document.createElement("p");
  availability.textContent =
    "This guide shows the full lesson path. Project exercises and verification are available where the connected runtime supports them.";
  const key = "assemblejs.academy.lesson-selection.v1";
  const proof = document.createElement("p");
  proof.setAttribute("role", "status");
  const verifiedLessons = new Set(["edit-content", "explore-shop", "fix-placement"]);
  const proofKey = (lesson) => "assemblejs.academy.lesson-proof." + lesson.id;
  const readProof = (storage, lesson) => {
    const raw = storage.getItem(proofKey(lesson));
    if (raw === null) return undefined;
    if (raw.length > 256) throw new Error("Invalid verification record");
    const record = JSON.parse(raw);
    if (
      record?.schema !== 1 ||
      !Number.isSafeInteger(record.revision) ||
      record.revision < 1 ||
      record.revision > lesson.revision ||
      typeof record.version !== "string" ||
      !/^[a-f0-9]{12}$/.test(record.version)
    )
      throw new Error("Unsupported verification record");
    return record;
  };
  const currentProofs = new Map();
  const progress = document.createElement("p");
  progress.setAttribute("role", "status");
  let previewVersion;
  const renderProgress = () => {
    const count = academyLessons.filter(
      (lesson) => previewVersion && currentProofs.get(lesson.id) === previewVersion,
    ).length;
    progress.textContent = `${count} of ${academyLessons.length} lessons verified for this preview.`;
  };
  const reset = document.createElement("button");
  reset.type = "button";
  reset.textContent = "Clear saved proof for this lesson";
  const status = document.createElement("p");
  status.setAttribute("role", "status");
  const label = document.createElement("label");
  label.textContent = "Lesson";
  const select = document.createElement("select");
  const seenKey = (id) => "assemblejs.academy.lesson-seen.v1." + id;
  const updateSeenLabels = () => {
    const storage = document.defaultView.localStorage;
    for (const [index, lesson] of academyLessons.entries()) {
      select.options[index].textContent =
        storage.getItem(seenKey(lesson.id)) === "1" ? lesson.title : lesson.title + " (New)";
    }
  };
  for (const lesson of academyLessons) {
    const option = document.createElement("option");
    option.value = lesson.id;
    option.textContent = lesson.title;
    select.append(option);
  }
  label.append(select);
  const task = document.createElement("p");
  const details = document.createElement("details");
  const summary = document.createElement("summary");
  summary.textContent = "Hint and required evidence";
  const hint = document.createElement("p");
  const evidence = document.createElement("p");
  details.append(summary, hint, evidence);
  const render = () => {
    const lesson = academyLessons.find(({ id }) => id === select.value) ?? academyLessons[0];
    task.textContent = lesson.task;
    hint.textContent = lesson.hint;
    evidence.textContent = "Required evidence: " + lesson.evidence;
    details.open = false;
    proof.textContent = "";
    reset.hidden = !verifiedLessons.has(lesson.id);
    if (verifiedLessons.has(lesson.id)) {
      try {
        const prior = readProof(document.defaultView.localStorage, lesson);
        if (prior) {
          proof.textContent =
            prior.revision === lesson.revision
              ? "Previous verification saved. Check the current project again to confirm it."
              : "Previous verification was for an earlier lesson revision.";
        }
      } catch {
        proof.textContent = "Saved verification could not be read on this device.";
      }
    }
  };
  try {
    const selected = document.defaultView.localStorage.getItem(key);
    if (academyLessons.some(({ id }) => id === selected)) select.value = selected;
  } catch {
    status.textContent = "Lesson selection could not be restored on this device.";
  }
  const markSelectedSeen = () => {
    try {
      if (academyLessons.some(({ id }) => id === select.value)) {
        const storage = document.defaultView.localStorage;
        storage.setItem(seenKey(select.value), "1");
        status.textContent = "";
      }
    } catch {
      status.textContent = "Lesson visit could not be saved on this device.";
    }
    try {
      updateSeenLabels();
    } catch {
      if (!status.textContent)
        status.textContent = "Saved lesson visits could not be read on this device.";
    }
  };
  select.addEventListener("change", () => {
    render();
    try {
      if (academyLessons.some(({ id }) => id === select.value))
        document.defaultView.localStorage.setItem(key, select.value);
    } catch {
      markSelectedSeen();
      status.textContent = "Lesson selection could not be saved on this device.";
      return;
    }
    markSelectedSeen();
  });
  reset.addEventListener("click", () => {
    const lesson = academyLessons.find(({ id }) => id === select.value);
    if (!lesson || !verifiedLessons.has(lesson.id)) return;
    try {
      document.defaultView.localStorage.removeItem(proofKey(lesson));
      currentProofs.delete(lesson.id);
      renderProgress();
      proof.textContent = "Saved proof cleared for this lesson.";
    } catch {
      proof.textContent = "Saved proof could not be cleared on this device.";
    }
  });
  panel.append(availability, label, task, details, proof, reset, progress, status);
  container.append(panel);
  render();
  markSelectedSeen();
  renderProgress();
  return {
    setPreviewVersion(version) {
      if (version !== previewVersion) currentProofs.clear();
      previewVersion = version;
      renderProgress();
    },
    recordProof(evidence) {
      const lesson = academyLessons.find(({ id }) => id === evidence.lesson);
      if (
        !lesson ||
        !verifiedLessons.has(lesson.id) ||
        evidence.revision !== lesson.revision ||
        typeof evidence.version !== "string" ||
        !/^[a-f0-9]{12}$/.test(evidence.version)
      )
        return;
      if (evidence.version === previewVersion) {
        currentProofs.set(lesson.id, evidence.version);
        renderProgress();
      }
      try {
        const storage = document.defaultView.localStorage;
        readProof(storage, lesson);
        storage.setItem(
          proofKey(lesson),
          JSON.stringify({
            schema: 1,
            revision: evidence.revision,
            version: evidence.version,
          }),
        );
        if (select.value === lesson.id)
          proof.textContent =
            "Previous verification saved. Check the current project again to confirm it.";
      } catch {
        proof.textContent = "Verification passed but could not be saved on this device.";
      }
    },
    destroy: () => panel.remove(),
  };
}
