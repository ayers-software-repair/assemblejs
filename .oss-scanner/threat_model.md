# Threat model

AssembleJS is a server-composed micro-frontend framework. The design is in `docs/DESIGN.md`, and
section 5 (Trust) is the part most findings should be measured against. The disclosure policy is
`SECURITY.md`.

## What this project does and where untrusted input enters

A project is made of assemblies: pieces of a page, each written in one UI framework (React, Vue,
Svelte, Preact, Solid, Lit, a web component or a plain template). A server composes pages from
them. It also composes assemblies that live on other servers (remote assemblies), and it hydrates
them in the browser. Besides assemblies a project has pages (routes), services (server functions
that return an assembly's data), apis (routes that serve data) and an events wiring (how
assemblies talk in the browser, including one server-sent-events stream per page). A command line
(`assemblejs`) scaffolds, builds, checks and deploys projects, and an MCP server
(`@asmjs/mcp`) gives an AI agent the same abilities over stdio.

The code of a project's own assemblies, services, apis, pages and config is written by the project
author and is trusted. The following is not trusted:

- **HTTP requests to a built server (`node dist/server.js`)**: the path, route parameters, query
  string, headers, cookies and bodies, reaching pages, `/assembly/<name>/*` fragment routes,
  `/api/*` routes, the `/_assemblejs/*` reserved prefix and the streams.
- **Remote assembly responses**: a remote is a third party. Its HTML is composed into the page and
  its manifest and api answers are read by the composer.
- **The relay**: `/_assemblejs/remote/<origin, percent-encoded>/api/...` makes outbound calls for
  the browser, so the origin and path come from a visitor.
- **Values a view writes raw**: a value written with a template engine's raw form is markup, and a
  directive inside it places an assembly. A value from a visitor is only safe written escaped
  (DESIGN 7).
- **Command line arguments**: project and assembly names, paths and flags.
- **Files of the project a reader opens**: `check` and the MCP tools read a project's files, and
  those may include links or imports that lead outside the project's root (DESIGN 5.5, 13.6).
- **Prompts and arguments an agent passes to the MCP tools.**
- **Files the scaffold writes into a new project**: they must not weaken the project's controls.

## Components that matter most / least

Most, in order:

1. `packages/core`: the server, the composer, the trust boundaries (auth, remotes allowlist,
   relay, content-security policy, encoding, the island projection) and the browser runtime under
   `packages/core/src/client`.
2. `packages/cli` and `packages/create`: argument handling, project name and path handling, and
   the files written into a generated project.
3. `packages/mcp` and `packages/check`: read and write files under a project root; their promise
   is that nothing outside the root is read, listed or followed, and that no tool runs a shell
   command, publishes, deploys or touches a remote.
4. `packages/renderer-*` (`react`, `preact`, `vue`, `solid`, `svelte`, `lit`, `templates`): they
   turn a view and its data into markup on the server, so output encoding is theirs.
5. `packages/build`: bundles a project into `dist/` and the generated server.

Least: `packages/devtools` (development only, answers only the machine's loopback, read-only), and
the repository's own tooling in `scripts/` and `conformance/harness/`.

Out of scope as targets: `examples/` (demonstration projects), `site/` and `site-source/` (the
static documentation site), `browser/` (browser proof tests), `docs/` and third-party
dependencies. A defect in a dependency with no reachable path through AssembleJS belongs upstream.

## How to exercise it

- Everything is installed and built in the image. Unit tests are vitest, offline: `pnpm -r test`,
  or `pnpm --filter @asmjs/core test` for one package.
- A live server for a reproducer: the examples are workspace projects with their dependencies
  installed. Build one with `pnpm --filter "@asmjs/example-market-*" build`, then
  `node examples/market/start.mjs` starts four servers that compose each other's assemblies over
  HTTP on ports 4700 to 4703 (see `examples/market/README.md`). `examples/html/server.mjs` is the
  smallest server the contract allows. `ASSEMBLEJS_HOST` and `ASSEMBLEJS_PORT` set the address.
- The command line is `packages/cli/dist/bin.js` (alias `assemblejs`), and the MCP server is
  `packages/mcp/dist/bin.js`, started over stdio with a project root as its one argument.
- `conformance/` tests the design over HTTP from packed tarballs, but it needs the network to
  install third-party dependencies, so it cannot run in the audit. Its `specs/trust/` and
  `fixtures/trust/` show what each trust rule is held to.

## How you rate severity

Critical:

- Remote code execution or arbitrary file read or write on the server, reachable by a request to
  a built server.
- Authentication or the `publicRoutes` decision bypassed, so a guarded assembly, page, api or
  fragment is served to a visitor who should be refused.
- A path through the MCP server or `check` that reads or writes outside the project root, or
  runs a shell command.

High:

- A remote assembly affecting the page beyond its own markup (running script in the page's
  origin, reading what it was not forwarded, or joining the page's event bus without
  `events: true`).
- Server-side request forgery: reaching an origin not in `remotes`, following a redirect, or
  reaching a loopback, link-local or private address that was not itself declared, through the
  composer or the relay.
- Cookies, `authorization` or other request headers forwarded to a remote that did not declare
  them, or any remote response header reaching a visitor.
- Cross-site scripting through a value the framework renders: attribute, text or the JSON
  island (`<`, U+2028, U+2029) not encoded for its position, or a renderer that writes a
  visitor's value unescaped. Also a visitor's value that places an assembly while written
  escaped.
- Data leaking into the page's island beyond `{ id, name, view, renderer, data, deferred }`, or
  the server's internal context, headers or cookies reaching the browser.
- Command line or scaffold flaws that write outside the target directory, or that generate a
  project with a weakened control (for example a default credential, or a control that defaults
  open). Controls are meant to default closed with no default credential.

Medium:

- Missing or weaker hardening headers than DESIGN 5 states (content-security policy, same-origin
  CORS, `x-content-type-options: nosniff` on relayed answers).
- Information disclosure of failure detail (what a placement threw, or its logged id) to a
  visitor, where DESIGN 12 says it stays in the log.
- A devtools route answering a request that is not from loopback, or accepting a method other
  than `GET` or `HEAD`.

Low or informational:

- Hardening suggestions with no demonstrated effect.

Not a finding:

- Denial of service without an amplification factor, and resource exhaustion of a self-hosted
  server (SECURITY.md). A request that makes the server do far more work than it sent (for
  example unbounded placements from one request, past the caps in DESIGN 3.4) is amplification
  and does count.
- Anything that needs the project author to write unsafe code in their own assemblies, services,
  apis or config, including writing a visitor's value raw into a view (DESIGN 7 says that places
  assemblies and must be escaped).
- Vulnerabilities in a user's own assemblies or services.
- Behaviour that only exists in development mode (`assemblejs dev`) and is not reachable from a
  built server.

## How reports and patches should look

- Name the package, the file and function, and the route or command a reproducer sends.
- Show a reproducer that a built server or the command line answers, with the exact request or
  arguments. Prefer a failing unit test in the package's `test/` directory.
- A patch should fix the one shared place all callers route through, keep every encoder and trust
  decision in the single place DESIGN names for it, and add the test that failed first.

## Anything to leave alone

- Do not report `eslint`, `knip` or formatting findings, or issues in `examples/`, `site/` and
  `docs/`.
- Do not report that the project has no user store, login page or session: it ships none by
  design, and authentication is one seam the project supplies (DESIGN 5.2).
- Do not report remote assemblies being fetched from allowlisted origins: that is the feature.
  Report only reach beyond the allowlist or beyond the markup.
- Do not report `Apache-2.0` notices, copyright lines or package metadata.
