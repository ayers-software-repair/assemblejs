---
"@assemblejs/cli": patch
---

The modules the build generates type-check. A project that ran TypeScript over itself was failed by two things in `.assemblejs/` that it did not write. The registry read `mount` and `shadow` off every framework view, and most views export neither, which is an error to the compiler though it is undefined when the module runs: they are read through one typed reader now, so one that is missing is undefined and one that is there is still held to the type an assembly's definition gives. And the generated modules import templates and Svelte and Vue components, which the compiler has no declaration for: each such import follows a comment that has the compiler pass over it, and a line that has a linter pass over the comment. A new project with TypeScript and Node's types installed type-checks after its first build.
