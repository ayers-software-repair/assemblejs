---
"@assemblejs/cli": patch
---

`dev` and `build` are fixed for projects of any size. A build is made whole beside `dist` and replaces it only once it has succeeded, so a failed build leaves the last one as it was and the server `dev` runs loses none of its files while the next build is made; a build removes only its own files from `.assemblejs`, so `dev`'s record of its server outlives one. `dev` folds every change made during a build into one build after it, where it queued a whole build for each, and does not start a build the sources moved under. And the build no longer asks about every relative import inside a package: a project with one Svelte view built in seventeen seconds and builds in four.
