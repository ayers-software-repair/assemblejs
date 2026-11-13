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
    guide.recordProof({ lesson: "edit-content", revision: 1, version: "abcdef123456" });
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

test("the guide reports unsaved manual proof while another lesson is selected", () => {
  const window = new Window();
  const { document, localStorage } = window;
  const guide = createLessonGuide(document.body);
  const key = "assemblejs.academy.lesson-proof.edit-content";
  try {
    const select = document.querySelector("select");
    select.value = "capstone";
    select.dispatchEvent(new window.Event("change"));
    guide.recordProof({ lesson: "edit-content", revision: 1, version: "abcdef123456" });
    const previous = localStorage.getItem(key);
    assert.ok(previous);
    const setItem = localStorage.setItem;
    Object.defineProperty(localStorage, "setItem", {
      value(name, value) {
        if (name === key) throw new Error("Storage quota exceeded");
        setItem.call(localStorage, name, value);
      },
    });
    guide.recordProof({ lesson: "edit-content", revision: 1, version: "123456abcdef" });
    assert.match(document.body.textContent, /Verification passed but could not be saved/);
    assert.equal(localStorage.getItem(key), previous);
  } finally {
    guide.destroy();
    window.close();
  }
});

test("restored composition proof is historical and separate from manual edit proof", () => {
  const window = new Window();
  const { document, localStorage } = window;
  let guide = createLessonGuide(document.body);
  try {
    guide.recordProof({ lesson: "explore-shop", revision: 1, version: "abcdef123456" });
    guide.recordProof({ lesson: "capstone", revision: 1, version: "abcdef123456" });
    assert.equal(localStorage.getItem("assemblejs.academy.lesson-proof.capstone"), null);
    guide.destroy();
    guide = createLessonGuide(document.body);
    assert.match(document.body.textContent, /Previous verification saved/);
    assert.match(document.body.textContent, /Check the current project again/);
    const select = document.querySelector("select");
    select.value = "edit-content";
    select.dispatchEvent(new window.Event("change"));
    assert.doesNotMatch(document.body.textContent, /Previous verification saved/);
  } finally {
    guide.destroy();
    window.close();
  }
});

test("placement recovery is saved separately as historical evidence", () => {
  const window = new Window();
  const { document, localStorage } = window;
  let guide = createLessonGuide(document.body);
  try {
    guide.recordProof({ kind: "finding", version: "abcdef123456" });
    const key = "assemblejs.academy.lesson-proof.fix-placement";
    assert.equal(localStorage.getItem(key), null);
    guide.recordProof({
      kind: "recovered",
      lesson: "fix-placement",
      revision: 1,
      version: "123456abcdef",
    });
    guide.destroy();
    guide = createLessonGuide(document.body);
    const select = document.querySelector("select");
    select.value = "fix-placement";
    select.dispatchEvent(new window.Event("change"));
    assert.match(document.body.textContent, /Previous verification saved/);
    assert.match(document.body.textContent, /Check the current project again/);
  } finally {
    guide.destroy();
    window.close();
  }
});
