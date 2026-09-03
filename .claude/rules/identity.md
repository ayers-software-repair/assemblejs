---
paths:
  - "**/*"
---

Before writing any file: none of the legacy names and no personal mail address (the exact
pattern is in scripts/identity-gate.sh and is not repeated here); no author line in source
files; publisher is Ayers Electronics on every metadata surface. Every packages/_/src/\**/_.ts
opens with the two-line copyright and SPDX header. CI enforces all of it; a red is a stop.
