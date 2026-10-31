// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/** Keep the initiating keyboard location, without overriding a later focus choice. */
export function restoreVerificationFocus(document, button, diagnostics, startedFocused) {
  if (
    !startedFocused ||
    (document.activeElement !== document.body && document.activeElement !== button)
  )
    return;
  if (button.disabled) {
    diagnostics.open = true;
    diagnostics.querySelector("summary").focus();
  } else button.focus();
}
