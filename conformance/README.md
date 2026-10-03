# Conformance

The assembly contract (DESIGN 2) tested from the outside, over HTTP alone, against a real project
installed from the packed tarballs.

    pnpm conformance

`harness/run.mjs` packs the packages, creates a project from the starter's tarball, lays a
fixture's files over it, installs every `@assemblejs` package from its tarball (never through a
workspace link), builds it with the command line it installed, starts `dist/server.js` under
plain node in production, and runs every `specs/*.spec.mjs` against it with node's own test
runner. A spec names the section of DESIGN it holds the server to.

It needs the network for the third-party dependencies, and minutes, so it runs on demand rather
than inside `pnpm check`.
