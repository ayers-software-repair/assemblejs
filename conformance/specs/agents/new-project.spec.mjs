// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// DESIGN 13.7, in a project exactly as `npm create` wrote it: an agent that opens it is told what
// it is by the files the starter wrote, and builds in it through the server those files
// register. Nothing here reads the framework: the project's own files, the MCP client its agent
// surface was installed with, the command line it installed, and HTTP. The tests run in the
// order written, each on the project as the one before it left it.
import assert from "node:assert/strict";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { agentIn, calling, named, resourceOf } from "../agent.mjs";
import { originOf, rootOf, started } from "../http.mjs";

const root = rootOf("written");
const { read, told, name, installed, startedFrom, run } = agentIn(root);

// How each client starts a server, by its own documentation and, for the directory Claude Code
// starts one in, by what was observed (DECISIONS 2026-10-10).
const CLIENTS = [
  // Claude Code: where the session is, with the project's root named in the environment.
  [".mcp.json", "mcpServers", root, { CLAUDE_PROJECT_DIR: root }],
  // Cursor and VS Code fill their workspace folder into the arguments; no directory is promised.
  [".cursor/mcp.json", "mcpServers", tmpdir(), {}],
  [".vscode/mcp.json", "servers", tmpdir(), {}],
];

test("the starter writes the instructions and the file that brings them to Claude Code", () => {
  assert.match(told, /^# app\n\n<!-- assemblejs:instructions\. /);
  assert.match(told, /\n<!-- \/assemblejs:instructions -->\n$/);
  assert.equal(name, "assemblejs");
  assert.equal(read("CLAUDE.md"), "@AGENTS.md\n");
});

test("the project installs the server it registers, beside the command line", () => {
  const manifest = JSON.parse(read("package.json"));
  assert.deepEqual(Object.keys(manifest.devDependencies), ["@assemblejs/cli", "@assemblejs/mcp"]);
  assert.deepEqual(Object.keys(manifest.dependencies), ["@assemblejs/core"]);
});

for (const [file, servers, cwd, env] of CLIENTS) {
  test(`${file} starts the project's own server, on this project`, async () => {
    assert.ok(told.includes(`\`${file}\``), `AGENTS.md names ${file}`);
    const client = await startedFrom(file, servers, cwd, env);
    try {
      assert.deepEqual(client.getServerVersion(), {
        name,
        version: installed("./package.json").version,
      });
      const project = await resourceOf(client, "assemblejs://project");
      assert.equal(realpathSync(project.root), realpathSync(root));
      assert.deepEqual(
        project.assemblies.map((assembly) => assembly.name),
        ["hello"],
      );
    } finally {
      await client.close();
    }
  });
}

test("an agent adds an assembly, places it and composes the page, through that server alone", async () => {
  const client = await startedFrom(...CLIENTS[0]);
  const call = calling(client);
  try {
    // What AGENTS.md told it to use is what the server has, and the rules are the server's own.
    const tools = (await client.listTools()).tools.map((tool) => tool.name);
    for (const tool of [
      "add_assembly",
      "place_assembly",
      "render_assembly",
      "compose_page",
      "check",
      "explain",
    ]) {
      assert.ok(told.includes(`\`${tool}\``), `AGENTS.md names ${tool}`);
      assert.ok(tools.includes(tool), `the server has ${tool}`);
    }
    // Each rule's sentence as the server gives it, which AGENTS.md marks up with code spans.
    const rules = await resourceOf(client, "assemblejs://rules");
    assert.ok(rules.length > 20);
    const unmarked = told.replaceAll("`", "");
    for (const rule of rules) {
      assert.ok(unmarked.includes(`- ${rule.id}: ${rule.rule}\n`), `AGENTS.md carries ${rule.id}`);
    }

    const added = await call("add_assembly", { name: "greeting", renderer: "html" });
    assert.equal(added.ok, true, JSON.stringify(added.problems));
    assert.deepEqual(added.result.written, ["src/assemblies/greeting/greeting.html"]);

    // The page is one the starter wrote; its name is its directory, as AGENTS.md says.
    const [page] = readdirSync(join(root, "src", "pages"));
    const placed = await call("place_assembly", { page, name: "greeting" });
    assert.equal(placed.ok, true, JSON.stringify(placed.problems));

    const rendered = await call("render_assembly", { name: "greeting" });
    assert.equal(rendered.ok, true, JSON.stringify(rendered.problems));

    const composed = await call("compose_page", {
      template: read(`src/pages/${page}/${page}.html`),
    });
    assert.equal(composed.ok, true, JSON.stringify(composed.problems));
    assert.deepEqual(
      composed.result.diagnostics.map((diagnostic) => diagnostic.name),
      ["hello", "greeting"],
    );
    assert.deepEqual(named(composed.result.html), [
      ["hello", "<p>Hello from AssembleJS</p>"],
      ["greeting", "<p>greeting</p>"],
    ]);

    assert.deepEqual(await call("check"), { ok: true, result: { findings: [] }, problems: [] });
    const why = await call("explain", { id: "agent-instructions-are-current" });
    assert.match(why.result.because, /An agent reads AGENTS\.md before anything else/);
  } finally {
    await client.close();
  }
});

// DESIGN 13.3: what an agent reads, from the server the project installed, on the project as
// the test before left it. Read from the sources: nothing has been built since the agent wrote.
test("the server tells the agent the project's whole shape, and one assembly of it", async () => {
  const client = await startedFrom(...CLIENTS[0]);
  try {
    for (const uri of [
      "assemblejs://project",
      "assemblejs://assembly/<name>",
      "assemblejs://rules",
    ]) {
      assert.ok(told.includes(`\`${uri}\``), `AGENTS.md names ${uri}`);
    }
    const [page] = readdirSync(join(root, "src", "pages"));
    const project = await resourceOf(client, "assemblejs://project");
    assert.deepEqual(project.pages, [
      {
        name: page,
        route: "/",
        template: `src/pages/${page}/${page}.html`,
        places: [
          { name: "hello", view: "default" },
          { name: "greeting", view: "default" },
        ],
        policy: {},
        stream: null,
      },
    ]);
    assert.deepEqual(
      project.assemblies.map((assembly) => [assembly.name, assembly.renderer, assembly.placedOn]),
      [
        ["greeting", "html", [page]],
        ["hello", "html", [page]],
      ],
    );
    assert.deepEqual(project.apis, []);
    assert.deepEqual(project.settings.remotes, []);
    assert.deepEqual(project.problems, []);

    // Each assembly is a resource of its own, listed beside the fixed ones, the one the agent
    // added a moment ago among them.
    assert.deepEqual(
      (await client.listResources()).resources.map((resource) => resource.uri),
      [
        "assemblejs://project",
        "assemblejs://rules",
        "assemblejs://assembly/greeting",
        "assemblejs://assembly/hello",
      ],
    );
    const greeting = await resourceOf(client, "assemblejs://assembly/greeting");
    assert.equal(greeting.view, "src/assemblies/greeting/greeting.html");
    assert.deepEqual(greeting.placedOn, [{ page, route: "/", view: "default", policy: {} }]);
    assert.deepEqual(greeting.placedIn, []);
    // An assembly the project has not is the protocol's "resource not found", by its code.
    await assert.rejects(
      client.readResource({ uri: "assemblejs://assembly/missing" }),
      (error) => error.code === -32002,
    );
  } finally {
    await client.close();
  }
});

// DESIGN 13.6: nothing outside the root is read. A link out of the project, put into the
// project as the agent left it and taken out again: neither the server's check, nor its shape,
// nor the command line's check says a word of what the link leads to.
test("a link that leads out of the project is a finding, and is never read", async () => {
  const outside = mkdtempSync(join(tmpdir(), "conformance-outside-"));
  writeFileSync(join(outside, "secret.api.ts"), 'export default { path: "SECRET-NO-SLASH" };');
  mkdirSync(join(root, "src", "api"));
  symlinkSync(join(outside, "secret.api.ts"), join(root, "src", "api", "leak.api.ts"));
  const client = await startedFrom(...CLIENTS[0]);
  try {
    const call = calling(client);
    const checked = await call("check");
    assert.equal(checked.ok, false);
    assert.deepEqual(
      checked.problems.map((problem) => [problem.path, problem.rule]),
      [["src/api/leak.api.ts", "a-project-stays-inside-its-root"]],
    );
    const project = await resourceOf(client, "assemblejs://project");
    assert.deepEqual(project.apis, [
      { file: "src/api/leak.api.ts", path: "(unread)", method: "(unread)", streams: "(unread)" },
    ]);
    assert.deepEqual(
      project.problems.map((problem) => [problem.path, problem.rule]),
      [["src/api/leak.api.ts", "a-project-stays-inside-its-root"]],
    );
    const refused = run("check");
    assert.equal(refused.status, 1, refused.stdout);
    assert.match(
      refused.stderr,
      /^src\/api\/leak\.api\.ts: leak\.api\.ts leads out of the project/m,
    );
    assert.ok(!JSON.stringify([checked, project, refused.stderr]).includes("SECRET"));
    const why = await call("explain", { id: "a-project-stays-inside-its-root" });
    assert.match(why.result.because, /an agent is shown what they read/);
    assert.ok(told.includes("- `a-project-stays-inside-its-root`: "), "AGENTS.md carries the rule");
  } finally {
    await client.close();
    rmSync(join(root, "src", "api"), { recursive: true, force: true });
    rmSync(outside, { recursive: true, force: true });
  }
});

test("the page the agent composed is the page the project's build serves", async () => {
  // The server the harness started was built from the project as the starter wrote it.
  assert.deepEqual(named(await (await fetch(new URL("/", originOf("written")))).text()), [
    ["hello", "<p>Hello from AssembleJS</p>"],
  ]);
  const built = run("build");
  assert.equal(built.status, 0, built.stderr);
  const server = await started(root, { ASSEMBLEJS_MODE: "production" });
  try {
    assert.ok(server.origin, server.output());
    assert.deepEqual(named(await (await fetch(new URL("/", server.origin))).text()), [
      ["hello", "<p>Hello from AssembleJS</p>"],
      ["greeting", "<p>greeting</p>"],
    ]);
  } finally {
    await server.stop();
  }
});

test("check refuses instructions edited by hand, and add agents puts back what it writes", () => {
  const ours = "\n## Ours\n\nDeploys go out on Fridays.\n";
  writeFileSync(
    join(root, "AGENTS.md"),
    `${told.replace("## The rules", "## The rules, loosely")}${ours}`,
  );
  const refused = run("check");
  assert.equal(refused.status, 1, refused.stdout);
  assert.match(
    refused.stderr,
    /^AGENTS\.md: the agent instructions are not the ones this version of assemblejs writes \(agent-instructions-are-current\): run assemblejs add agents, /m,
  );
  assert.match(refused.stderr, /^1 problem\(s\)$/m);

  const rewritten = run("add", "agents");
  assert.equal(rewritten.status, 0, rewritten.stderr);
  assert.equal(rewritten.stdout.trim(), "wrote AGENTS.md");
  // Its own part is back as the starter wrote it, and what the project added is kept.
  assert.equal(read("AGENTS.md"), `${told}${ours}`);
  assert.match(run("check").stdout, /no problems/);
});

test("check refuses a CLAUDE.md that hides the instructions from Claude Code", () => {
  writeFileSync(join(root, "CLAUDE.md"), "Use plan mode for changes under src/pages.\n");
  const refused = run("check");
  assert.equal(refused.status, 1, refused.stdout);
  assert.match(
    refused.stderr,
    /^CLAUDE\.md: Claude Code reads this file in place of AGENTS\.md, and it does not bring AGENTS\.md in with @AGENTS\.md \(agent-instructions-are-current\)/m,
  );
  assert.equal(run("add", "agents").stdout.trim(), "wrote CLAUDE.md");
  assert.equal(read("CLAUDE.md"), "@AGENTS.md\n\nUse plan mode for changes under src/pages.\n");
  assert.equal(run("check").status, 0);
});

// Each surface runs its own command line: the project's, and the one the server is built on.
// Where they are not the same version, neither can call the other's instructions current.
test("the command line and the server name one problem when they were not released together", async () => {
  const manifest = join(root, "node_modules", "@assemblejs", "mcp", "package.json");
  const original = readFileSync(manifest, "utf8");
  const drifted = JSON.parse(original);
  const beside = installed("@assemblejs/cli/package.json").version;
  drifted.dependencies["@assemblejs/cli"] = "0.0.1";
  writeFileSync(manifest, JSON.stringify(drifted));
  const message = `the @assemblejs/mcp this project installs is built on @assemblejs/cli 0.0.1, and the project installs ${beside}: each writes and checks its own agent instructions`;
  try {
    const refused = run("check");
    assert.equal(refused.status, 1, refused.stdout);
    assert.ok(refused.stderr.includes(`package.json: ${message} (agent-instructions-are-current)`));
    assert.match(refused.stderr, /^1 problem\(s\)$/m);

    const client = await startedFrom(...CLIENTS[0]);
    try {
      const answer = await client.callTool({ name: "check", arguments: {} });
      const checked = JSON.parse(answer.content[0].text);
      assert.equal(checked.ok, false);
      assert.deepEqual(
        checked.problems.map((problem) => [problem.path, problem.message]),
        [["package.json", message]],
      );
    } finally {
      await client.close();
    }
  } finally {
    writeFileSync(manifest, original);
  }
  assert.equal(run("check").status, 0);
});
