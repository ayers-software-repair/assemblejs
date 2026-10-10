---
"@assemblejs/cli": patch
---

The instructions a project is written with say that a view writes its data escaped, and why it matters here: a value written with a raw form is markup, and an `<assembly>` directive in it is placed like one the view wrote. What `check` accepts and refuses of a project's code is unchanged. The instructions' words changed, so `check` asks a project written before this to run `assemblejs add agents`.
