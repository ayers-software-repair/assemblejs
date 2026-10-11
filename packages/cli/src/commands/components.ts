// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * The components a new project starts with: the elements HTML already has, each a class and the
 * tokens, with its focus ring and its states, in one stylesheet every page links after the
 * tokens (DESIGN 10). A value in it is a token or a plain length; no colour is written here.
 */
export const COMPONENTS = `/* The project's components: the elements HTML already has, each a class and the tokens, with
   its focus ring and its states. Every kind of view writes HTML, so every one of them can use
   these; what makes each usable is the browser's own. Values come from src/tokens.css alone. */

.button,
button {
  display: inline-block;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--accent);
  border-radius: var(--corner);
  background: var(--accent);
  color: var(--surface);
  font: inherit;
  font-size: var(--text-2);
  line-height: 1.2;
  text-decoration: none;
  cursor: pointer;
}
.button:hover,
button:hover {
  background: var(--accent-strong);
  border-color: var(--accent-strong);
}
.button:disabled,
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

a {
  color: var(--accent);
}
a:hover {
  color: var(--accent-strong);
}

.field {
  display: grid;
  gap: var(--space-1);
  margin-block: var(--space-3);
}
.field label {
  font-size: var(--text-1);
  color: var(--ink-muted);
}
.field input,
.field select,
.field textarea {
  font: inherit;
  padding: var(--space-2);
  border: 1px solid var(--border);
  border-radius: var(--corner);
  background: var(--surface);
  color: var(--ink);
}
.field [aria-invalid="true"] {
  border-color: var(--accent-alt);
}

.list {
  padding-left: var(--space-4);
}
.list li {
  margin-block: var(--space-1);
}

.table {
  width: 100%;
  border-collapse: collapse;
}
.table th,
.table td {
  padding: var(--space-2);
  text-align: left;
  border-bottom: 1px solid var(--border);
}
.table th {
  font-size: var(--text-1);
  color: var(--ink-muted);
}

.notice {
  padding: var(--space-3);
  border: 1px solid var(--border);
  border-left: 4px solid var(--accent);
  border-radius: var(--corner);
  background: var(--surface-panel);
  color: var(--ink);
}
.notice--strong {
  border-left-color: var(--accent-alt);
}

dialog {
  max-width: 36rem;
  padding: var(--space-4);
  border: 1px solid var(--border);
  border-radius: var(--corner);
  background: var(--surface);
  color: var(--ink);
}
dialog::backdrop {
  background: var(--ink);
  opacity: 0.5;
}
`;
