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

test("clearing selected proof preserves other lessons and the selected lesson", () => {
  const window = new Window();
  const { document, localStorage } = window;
  const guide = createLessonGuide(document.body);
  try {
    for (const lesson of ["explore-shop", "edit-content"])
      guide.recordProof({ lesson, revision: 1, version: "abcdef123456" });
    const select = document.querySelector("select");
    select.dispatchEvent(new window.Event("change"));
    document.querySelector("button").click();
    assert.match(document.body.textContent, /Saved proof cleared for this lesson/);
    assert.equal(localStorage.getItem("assemblejs.academy.lesson-proof.explore-shop"), null);
    assert.ok(localStorage.getItem("assemblejs.academy.lesson-proof.edit-content"));
    assert.equal(localStorage.getItem("assemblejs.academy.lesson-selection.v1"), "explore-shop");
  } finally {
    guide.destroy();
    window.close();
  }
});

test("opening a lesson removes its New label across reload without recording proof", () => {
  const window = new Window();
  const { document, localStorage } = window;
  let guide = createLessonGuide(document.body);
  try {
    const select = document.querySelector("select");
    const capstone = select.querySelector('option[value="capstone"]');
    assert.match(capstone.textContent, /\(New\)$/);
    select.value = "capstone";
    select.dispatchEvent(new window.Event("change"));
    assert.doesNotMatch(capstone.textContent, /\(New\)$/);
    guide.destroy();
    guide = createLessonGuide(document.body);
    assert.equal(document.querySelector("select").value, "capstone");
    assert.doesNotMatch(document.querySelector('option[value="capstone"]').textContent, /\(New\)$/);
    assert.equal(localStorage.getItem("assemblejs.academy.lesson-proof.capstone"), null);
  } finally {
    guide.destroy();
    window.close();
  }
});

test("readable saved visits remain visible when a new visit cannot be stored", () => {
  const window = new Window();
  const { document, localStorage } = window;
  const selection = "assemblejs.academy.lesson-selection.v1";
  const proof = "assemblejs.academy.lesson-proof.edit-content";
  localStorage.setItem(selection, "capstone");
  localStorage.setItem("assemblejs.academy.lesson-seen.v1.edit-content", "1");
  localStorage.setItem(proof, '{"schema":1,"revision":1,"version":"abcdef123456"}');
  const previous = localStorage.getItem(proof);
  Object.defineProperty(localStorage, "setItem", {
    value() {
      throw new Error("Storage quota exceeded");
    },
  });
  const guide = createLessonGuide(document.body);
  try {
    const select = document.querySelector("select");
    assert.equal(select.value, "capstone");
    assert.match(select.querySelector('option[value="capstone"]').textContent, /\(New\)$/);
    assert.doesNotMatch(
      select.querySelector('option[value="edit-content"]').textContent,
      /\(New\)$/,
    );
    assert.match(document.body.textContent, /Lesson visit could not be saved/);
    assert.equal(localStorage.getItem(selection), "capstone");
    assert.equal(localStorage.getItem(proof), previous);
  } finally {
    guide.destroy();
    window.close();
  }
});

test("only distinct checks for the active preview contribute to current progress", () => {
  const window = new Window();
  const { document } = window;
  let guide = createLessonGuide(document.body);
  const proof = { lesson: "explore-shop", revision: 1, version: "abcdef123456" };
  try {
    guide.setPreviewVersion(proof.version);
    guide.recordProof(proof);
    guide.recordProof(proof);
    guide.recordProof({ ...proof, lesson: "edit-content", version: "123456abcdef" });
    assert.match(document.body.textContent, /1 of 20 lessons verified/);
    guide.setPreviewVersion(undefined);
    assert.match(document.body.textContent, /0 of 20 lessons verified/);
    guide.destroy();
    guide = createLessonGuide(document.body);
    guide.setPreviewVersion(proof.version);
    assert.match(document.body.textContent, /0 of 20 lessons verified/);
  } finally {
    guide.destroy();
    window.close();
  }
});
