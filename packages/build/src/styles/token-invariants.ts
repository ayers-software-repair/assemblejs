// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * What must be true of the colour roles, whatever binds them, in each scheme (DESIGN 10): text
 * against the grounds it is set on reads at 4.5:1 or more (WCAG 2.2, 1.4.3, level AA), and
 * what identifies a control against its ground at 3:1 or more (1.4.11, level AA). The numbers
 * are WCAG's, not ours.
 */
export const TOKEN_INVARIANTS: readonly {
  readonly role: string;
  readonly ground: string;
  readonly least: number;
  readonly because: string;
}[] = [
  ...["--ink", "--ink-muted"].flatMap((role) =>
    ["--surface", "--surface-panel", "--accent-wash"].map((ground) => ({
      role,
      ground,
      least: 4.5,
      because: "text needs 4.5:1 (WCAG 2.2, 1.4.3)",
    })),
  ),
  ...["--accent", "--accent-strong", "--accent-alt"].flatMap((role) =>
    ["--surface", "--surface-panel"].map((ground) => ({
      role,
      ground,
      least: 3,
      because: "what identifies a control needs 3:1 (WCAG 2.2, 1.4.11)",
    })),
  ),
];
