// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * The tokens file a new project starts with: the estate's roles, three scales and two colour
 * schemes, each value a placeholder that passes its contrast, for the author to change in one
 * place (DESIGN 10). Every assembly's stylesheet reads these names.
 */
export const TOKENS = `/* The project's tokens: the roles every assembly's stylesheet reads, declared once at :root and
   inherited everywhere, a shadow root included. Change the values here and nowhere else; the
   names stay. The values a new project starts with are placeholders that pass their contrast. */
:root {
  --surface: #fbfaf7;
  --surface-panel: #efece4;
  --border: #ddd7c9;
  --ink: #17150f;
  --ink-muted: #57513f;
  --accent: #0b5d4e;
  --accent-strong: #073e34;
  --accent-alt: #a4400f;
  --accent-wash: #e8f0ed;
  --face-display: "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif;
  --face-text: system-ui, -apple-system, "Segoe UI", Arial, sans-serif;
  --face-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 1rem;
  --space-4: 2rem;
  --text-1: 0.875rem;
  --text-2: 1rem;
  --text-3: 1.25rem;
  --text-4: 1.75rem;
  --corner: 0.375rem;
}

@media (prefers-color-scheme: dark) {
  :root {
    --surface: #17150f;
    --surface-panel: #221f17;
    --border: #3a3628;
    --ink: #fbfaf7;
    --ink-muted: #c9c2b0;
    --accent: #7fd1bd;
    --accent-strong: #a8e3d4;
    --accent-alt: #f0a06c;
    --accent-wash: #1f2a27;
  }
}
`;
