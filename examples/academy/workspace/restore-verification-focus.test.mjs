// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict";
import { test } from "node:test";
import { Window } from "happy-dom";
import { restoreVerificationFocus } from "./restore-verification-focus.js";

const fixture = () => {
  const window = new Window();
  const document = window.document;
  const button = document.createElement("button");
  const input = document.createElement("input");
  const diagnostics = document.createElement("details");
  diagnostics.append(document.createElement("summary"));
  document.body.append(button, input, diagnostics);
  return { window, document, button, input, diagnostics };
};
test("successful keyboard verification restores its initiating button", () => {
  const f = fixture();
  try {
    restoreVerificationFocus(f.document, f.button, f.diagnostics, true);
    assert.equal(f.document.activeElement === f.button, true);
  } finally {
    f.window.close();
  }
});
test("failed keyboard verification opens and focuses actual diagnostics", () => {
  const f = fixture();
  try {
    f.button.disabled = true;
    restoreVerificationFocus(f.document, f.button, f.diagnostics, true);
    assert.equal(f.diagnostics.open, true);
    assert.equal(f.document.activeElement === f.diagnostics.querySelector("summary"), true);
  } finally {
    f.window.close();
  }
});
test("programmatic checks and later user focus choices are not overridden", () => {
  const f = fixture();
  try {
    restoreVerificationFocus(f.document, f.button, f.diagnostics, false);
    assert.equal(f.document.activeElement === f.document.body, true);
    f.input.focus();
    restoreVerificationFocus(f.document, f.button, f.diagnostics, true);
    assert.equal(f.document.activeElement === f.input, true);
  } finally {
    f.window.close();
  }
});
