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
  const proofKey = "assemblejs.academy.lesson-proof.edit-content";
  const manualLesson = academyLessons.find(({ id }) => id === "edit-content");
  const readProof = (storage) => {
    const raw = storage.getItem(proofKey);
    if (raw === null) return undefined;
    if (raw.length > 256) throw new Error("Invalid verification record");
    const record = JSON.parse(raw);
    if (
      record?.schema !== 1 ||
      !Number.isSafeInteger(record.revision) ||
      record.revision < 1 ||
      record.revision > manualLesson.revision ||
      typeof record.version !== "string" ||
      !/^[a-f0-9]{12}$/.test(record.version)
    )
      throw new Error("Unsupported verification record");
    return record;
  };
  const status = document.createElement("p");
  status.setAttribute("role", "status");
  const label = document.createElement("label");
  label.textContent = "Lesson";
  const select = document.createElement("select");
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
    if (lesson.id === "edit-content") {
      try {
        const prior = readProof(document.defaultView.localStorage);
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
  select.addEventListener("change", () => {
    render();
    try {
      if (academyLessons.some(({ id }) => id === select.value)) {
        document.defaultView.localStorage.setItem(key, select.value);
        status.textContent = "";
      }
    } catch {
      status.textContent = "Lesson selection could not be saved on this device.";
    }
  });
  panel.append(availability, label, task, details, proof, status);
  container.append(panel);
  render();
  return {
    recordManualEdit(evidence) {
      if (
        evidence.lesson !== manualLesson.id ||
        evidence.revision !== manualLesson.revision ||
        typeof evidence.version !== "string" ||
        !/^[a-f0-9]{12}$/.test(evidence.version)
      )
        return;
      try {
        const storage = document.defaultView.localStorage;
        readProof(storage);
        storage.setItem(
          proofKey,
          JSON.stringify({
            schema: 1,
            revision: evidence.revision,
            version: evidence.version,
          }),
        );
        if (select.value === "edit-content")
          proof.textContent =
            "Previous verification saved. Check the current project again to confirm it.";
      } catch {
        if (select.value === "edit-content")
          proof.textContent = "Verification passed but could not be saved on this device.";
      }
    },
    destroy: () => panel.remove(),
  };
}
