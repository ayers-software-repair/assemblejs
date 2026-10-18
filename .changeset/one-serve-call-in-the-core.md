---
"@assemblejs/core": patch
"@assemblejs/cli": patch
---

`serve(project)` reads the configuration, starts the server and says where it listens. A server that refuses to start, because of a setting in the environment, a project it will not build or an address it cannot listen on, now prints its reason as plain sentences, one for each problem, and the process exits 1, where it printed a stack. A new project's server file is the import and one call.
