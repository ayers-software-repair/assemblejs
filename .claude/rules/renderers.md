---
paths:
  - "packages/renderer-*/**"
---

Each framework renderer package carries exactly one real peer dependency, its framework, and
implements the renderer interface from @assemblejs/core. Never add a second framework's types or
runtime to a renderer package. renderer-templates is the only package that hosts several engines,
because none of them carries a framework peer dependency, and each engine is imported on first use.
