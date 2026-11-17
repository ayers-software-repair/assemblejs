// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/** Persist receipt-backed mode practice separately from source drafts and lesson verification. */
export function createPracticeProgress(window, status) {
  const key = "assemblejs.academy.practice.calculator-modes";
  const revision = 1;
  const read = (storage) => {
    const raw = storage.getItem(key);
    if (raw === null) return undefined;
    if (raw.length > 256) throw new Error("Invalid practice progress");
    const record = JSON.parse(raw);
    if (
      record?.schema !== 1 ||
      !Number.isSafeInteger(record.revision) ||
      record.revision < 1 ||
      record.revision > revision
    ) {
      throw new Error("Unsupported practice progress");
    }
    return record;
  };
  const saved = "Mode practice saved on this device. Lesson verification is still required.";
  const unavailable = "Mode practice progress could not be saved on this device.";
  try {
    const previous = read(window.localStorage);
    if (previous) {
      status.textContent =
        previous.revision === revision ? saved : "Mode practice saved for an earlier revision.";
    }
  } catch {
    status.textContent = unavailable;
  }
  return {
    record() {
      try {
        const storage = window.localStorage;
        read(storage);
        storage.setItem(key, JSON.stringify({ schema: 1, revision }));
        status.textContent = saved;
      } catch {
        status.textContent = unavailable;
      }
    },
  };
}
