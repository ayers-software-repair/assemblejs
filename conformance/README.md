# Conformance

The design tested from the outside, over HTTP alone, against real projects installed from the
packed tarballs.

    pnpm conformance              every fixture
    pnpm conformance rendering    one fixture, by name

Each directory under `fixtures/` with a `fixture.json` is a fixture. One project's files sit at
its root; a fixture of several servers names them under `projects`, each in its own directory,
built and started in the order written, and may set ports aside under `ports` for a server a
spec runs itself. A project's `env` names an earlier project's origin or a set-aside port as
`{name}`, which is how a consumer is told where its producer is. `fixture.json` names the
`@assemblejs` packages each project installs; a renderer brings the framework it needs at the one
version that renderer is tested against, read from its own package, so a fixture never pins a
framework of its own.

`harness/run.mjs` packs those packages once, and for each project creates it from the starter's
tarball, installs every package from its tarball (never through a workspace link), builds it
with the command line it installed, and, once every project of the fixture is built, starts
each `dist/server.js` under plain node in production, keeping everything it writes in a log. It then runs the fixture's specs,
`specs/<fixture>/*.spec.mjs`, with node's own test runner. A spec reads the servers' origins, the
set-aside ports and the logs from its environment, and names the section of DESIGN it holds the
server to.

A run that passes removes its working directory; one that fails keeps it and says where, so the
projects and their logs can be read. A signal to the harness stops every server it started. It builds the workspace's packages, so two runs at once share their `dist`.
It needs the network for the third-party dependencies, and minutes, so it runs on demand rather
than inside `pnpm check`.

| fixture     | holds the server to                                                                       |
| ----------- | ----------------------------------------------------------------------------------------- |
| `contract`  | DESIGN 2: the content, data and manifest endpoints, and the envelope                      |
| `rendering` | DESIGN 7, 9, 3.3, 3.5 and 12: every renderer through the contract, on pages of them       |
| `remote`    | DESIGN 3.1 to 3.3, 3.6, 5.1 and 10: a page composed across two servers, and a hostile one |
