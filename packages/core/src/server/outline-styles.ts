// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * The stylesheet a page's outline is drawn with, linked inside the outline's own root: it
 * styles nothing on the page, and nothing the page styles reaches it.
 *
 * The outline is drawn over any page, so it reads no token of the project's and sets its own
 * colours: white words on each, at 4.9:1 or more by WCAG 2.2's definition of contrast, and a
 * white line on both sides of a frame so it shows on a dark ground as on a light one. Each
 * colour is one answer, and every box says in words what its colour says.
 */
export const OUTLINE_STYLES = `:host {
  all: initial;
  position: fixed;
  inset: 0;
  z-index: 2147483647;
  overflow: hidden;
  pointer-events: none;
  font: 12px/1.35 ui-sans-serif, system-ui, sans-serif;
  color: #f9fafb;
}
[hidden] {
  display: none !important;
}
[data-tone="local"] {
  --tone: #1d4ed8;
}
[data-tone="remote"] {
  --tone: #7e22ce;
}
[data-tone="cache"] {
  --tone: #0f766e;
}
[data-tone="fallback"] {
  --tone: #b91c1c;
}
[data-tone="deferred"] {
  --tone: #a16207;
}
[data-tone="inner"] {
  --tone: #374151;
}
.frame {
  position: absolute;
  top: 0;
  left: 0;
  box-sizing: border-box;
  border: 2px solid var(--tone);
  border-radius: 3px;
  box-shadow:
    0 0 0 1px #ffffff,
    inset 0 0 0 1px #ffffff;
}
.note {
  position: absolute;
  top: 0;
  left: 0;
  max-width: min(24rem, 100vw);
  pointer-events: auto;
}
.chip {
  display: flex;
  gap: 0.5em;
  align-items: baseline;
  margin: 0;
  padding: 1px 6px;
  border: 0;
  border-radius: 3px 3px 0 0;
  background: var(--tone);
  color: #ffffff;
  font: inherit;
  white-space: nowrap;
  cursor: pointer;
}
.chip b {
  font-weight: 600;
}
.chip:focus-visible,
.switch:focus-visible {
  outline: 2px solid #111827;
  box-shadow: 0 0 0 4px #ffffff;
}
.card {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 2px 10px;
  margin: 0;
  padding: 6px 8px;
  border: 2px solid var(--tone);
  border-radius: 0 3px 3px 3px;
  box-shadow: 0 0 0 1px #ffffff;
  background: #111827;
}
.card dt {
  color: #d1d5db;
}
.card dd {
  margin: 0;
  overflow-wrap: anywhere;
}
.bar {
  position: absolute;
  right: 12px;
  bottom: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px 8px;
  align-items: center;
  justify-content: flex-end;
  max-width: calc(100vw - 24px);
  padding: 4px;
  border-radius: 6px;
  background: #111827;
  box-shadow: 0 0 0 1px #ffffff;
  pointer-events: auto;
}
.sum {
  padding-left: 6px;
}
.key {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.key li {
  padding: 1px 6px;
  border-radius: 3px;
  background: var(--tone);
  color: #ffffff;
}
.switch {
  margin: 0;
  padding: 4px 10px;
  border: 1px solid #f9fafb;
  border-radius: 4px;
  background: transparent;
  color: inherit;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}
.switch[aria-pressed="true"] {
  background: #f9fafb;
  color: #111827;
}
@media print {
  :host {
    display: none;
  }
}
`;
