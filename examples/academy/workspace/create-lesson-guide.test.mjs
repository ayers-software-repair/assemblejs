// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict";
import { test } from "node:test";
import { Window } from "happy-dom";
import { createLessonGuide } from "./create-lesson-guide.js";

test("the shared guide exposes each distinct lesson and its required evidence", () => {
  const window = new Window();
  const { document } = window;
  const guide = createLessonGuide(document.body);
  try {
    const select = document.querySelector("select");
    const ids = Array.from(select.options, (option) => option.value);
    assert.equal(ids.length, 20);
    assert.equal(new Set(ids).size, 20);
    assert.match(document.body.textContent, /Open a product/);
    select.value = "capstone";
    select.dispatchEvent(new window.Event("change"));
    assert.match(document.body.textContent, /Run the final checks/);
    assert.match(document.body.textContent, /Required evidence: All required core/);
    assert.equal(document.querySelector("details").open, false);
    guide.recordManualEdit({ lesson: "edit-content", revision: 1, version: "abcdef123456" });
    guide.destroy();
    const reopened = createLessonGuide(document.body);
    assert.equal(document.querySelector("select").value, "capstone");
    assert.match(document.body.textContent, /Run the final checks/);
    const restored = document.querySelector("select");
    restored.value = "edit-content";
    restored.dispatchEvent(new window.Event("change"));
    assert.match(document.body.textContent, /Previous verification saved/);
    assert.match(document.body.textContent, /Check the current project again/);
    reopened.destroy();
  } finally {
    guide.destroy();
    window.close();
  }
});
