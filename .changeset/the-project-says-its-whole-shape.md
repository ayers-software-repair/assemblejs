---
"@assemblejs/cli": minor
"@assemblejs/mcp": minor
---

`assemblejs://project` answers a project's whole shape: every page with its route, what it places and the policy it declares; every assembly with its files, what its view places and where it is placed; every api's route; and what the config declares. `assemblejs://assembly/<name>` answers one assembly with every placement of it, and each assembly is listed as a resource of its own. All of it is read from the sources and nothing is run: a value a source computes reads `(computed)`, and what a file that cannot be read would have said reads `(unread)`. The command line exports the reader, `readShape`. An assembly in the project's answer has `client` and `browserHalf` where it had `hasClient`.
