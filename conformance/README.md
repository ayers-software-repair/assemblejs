# Conformance

The design tested from the outside, over HTTP alone, against real projects installed from the
packed tarballs.

    pnpm conformance              every fixture
    pnpm conformance rendering    one fixture, by name

Each directory under `fixtures/` with a `fixture.json` is a project: its files are laid over what
the starter writes, and `fixture.json` names the `@assemblejs` packages it installs. A renderer
brings the framework it needs at the one version that renderer is tested against, read from its
own package, so a fixture never pins a framework of its own. `harness/run.mjs` packs those
packages once, and for each fixture creates the project from the starter's tarball, installs
every package from its tarball (never through a workspace link), builds it with the command line
it installed, starts `dist/server.js` under plain node in production, and runs the fixture's
specs, `specs/<fixture>/*.spec.mjs`, with node's own test runner. A spec names the section of
DESIGN it holds the server to.

A run that passes removes its working directory; one that fails keeps it and says where, so the
projects can be read. It builds the workspace's packages, so two runs at once share their `dist`.
It needs the network for the third-party dependencies, and minutes, so it runs on demand rather
than inside `pnpm check`.

| fixture     | holds the server to                                                                   |
| ----------- | ------------------------------------------------------------------------------------- |
| `contract`  | DESIGN 2: the content, data and manifest endpoints, and the envelope                  |
| `rendering` | DESIGN 7, 9, 3.3 and 12: every renderer through the contract, on one page of them all |
