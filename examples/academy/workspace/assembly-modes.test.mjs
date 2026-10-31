// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict";
import { test } from "node:test";
import { AssemblyModes } from "./assembly-modes.js";

const answer = (value) => ({ content: [{ type: "text", text: JSON.stringify(value) }] });
const fixture = () => {
  const calls = [];
  let id = 0;
  let path;
  const client = {
    async callTool(request) {
      calls.push(request);
      if (request.name === "plan_assembly") {
        path = `src/assemblies/${request.arguments.name}/view.html`;
        return answer({
          ok: true,
          problems: [],
          result: {
            id: `plan-${++id}`,
            changes: [
              {
                path,
                before: null,
                after: "<p>Planned</p>",
              },
            ],
          },
        });
      }
      return answer({
        ok: true,
        problems: [],
        result:
          request.name === "check"
            ? { findings: [] }
            : request.name === "discard_assembly_plan"
              ? { discarded: request.arguments.id, written: [] }
              : { written: [path] },
      });
    },
  };
  return { client, calls, modes: new AssemblyModes(client) };
};

test("Plan requests exact changes without apply/check; changing to Auto does not apply them", async () => {
  const { modes, calls } = fixture();
  await modes.propose("note", "html");
  assert.deepEqual(
    calls.map((call) => call.name),
    ["plan_assembly"],
  );
  modes.mode("auto");
  assert.equal(modes.state.pending.id, "plan-1");
  assert.equal(calls.length, 1);
  await assert.rejects(modes.approve(), /Approval mode/);
  assert.equal(calls.length, 1);
});

test("Approval rejects then revises and applies only the latest retained id, then checks", async () => {
  const { modes, calls } = fixture();
  modes.mode("approval");
  await modes.propose("first", "html");
  await modes.reject();
  assert.equal(modes.state.pending, undefined);
  await modes.propose("revised", "react");
  const exact = modes.state.pending;
  assert.equal(Object.isFrozen(exact.changes[0]), true);
  await modes.approve();
  assert.deepEqual(
    calls.map((call) => call.name),
    ["plan_assembly", "discard_assembly_plan", "plan_assembly", "apply_assembly_plan", "check"],
  );
  assert.deepEqual(calls[3].arguments, { id: exact.id });
  assert.match(modes.state.phase, /check passed/);
  assert.equal(modes.state.pending, undefined);
  await modes.approve();
  assert.equal(calls.length, 5);
});

test("Auto creates its own new proposal and uses apply/check in order", async () => {
  const { modes, calls } = fixture();
  await modes.propose("old", "html");
  modes.mode("auto");
  await modes.propose("new", "html");
  assert.deepEqual(
    calls.map((call) => call.name),
    ["plan_assembly", "plan_assembly", "apply_assembly_plan", "check"],
  );
  assert.deepEqual(calls[2].arguments, { id: "plan-2" });
});

test("a failed check is retained as failure after files were applied", async () => {
  const { modes, client } = fixture();
  const call = client.callTool;
  client.callTool = async (request) =>
    request.name === "check"
      ? answer({
          ok: false,
          problems: ["missing placement"],
          result: { findings: ["missing placement"] },
        })
      : call(request);
  modes.mode("auto");
  await modes.propose("note", "html");
  assert.equal(modes.state.check.ok, false);
  assert.match(modes.state.phase, /Files applied; project check did not pass/);
});

test("a refused or partial apply never checks, retries or conceals attempted files", async () => {
  const { modes, calls, client } = fixture();
  const call = client.callTool;
  client.callTool = async (request) => {
    if (request.name !== "apply_assembly_plan") return call(request);
    calls.push(request);
    return answer({
      ok: false,
      result: { written: [], attempted: ["partial.html"] },
      problems: ["disk full"],
    });
  };
  modes.mode("auto");
  await modes.propose("note", "html");
  assert.deepEqual(modes.state.result.result.attempted, ["partial.html"]);
  assert.deepEqual(
    calls.map((call) => call.name),
    ["plan_assembly", "apply_assembly_plan"],
  );
  assert.equal(modes.state.check, undefined);
  assert.equal(modes.state.pending, undefined);
});

test("invalid/failed planning never applies or destroys the previous review", async () => {
  const { modes, client } = fixture();
  await modes.propose("old", "html");
  const pending = modes.state.pending;
  client.callTool = async () => answer({ ok: false, result: null, problems: ["invalid name"] });
  await modes.propose("invalid", "html");
  assert.equal(modes.state.pending, pending);
  client.callTool = async () =>
    answer({ ok: true, result: { id: "bad", changes: [{}] }, problems: [] });
  modes.mode("auto");
  await modes.propose("bad", "html");
  assert.equal(modes.state.pending, pending);
  assert.match(modes.state.phase, /invalid assembly proposal/);
});

test("in-flight operations block mode changes and duplicate writes", async () => {
  const { modes, client } = fixture();
  const call = client.callTool;
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  client.callTool = async (request) => {
    await gate;
    return call(request);
  };
  const pending = modes.propose("note", "html");
  assert.equal(modes.state.busy, true);
  assert.throws(() => modes.mode("auto"), /wait/);
  await assert.rejects(modes.propose("other", "html"), /wait/);
  release();
  await pending;
  assert.equal(modes.state.busy, false);
});

test("an ambiguous apply response consumes local permission and keeps the actual stage", async () => {
  const { modes, client, calls } = fixture();
  const call = client.callTool;
  client.callTool = async (request) => {
    if (request.name === "apply_assembly_plan") {
      calls.push(request);
      throw new Error("connection lost");
    }
    return call(request);
  };
  modes.mode("approval");
  await modes.propose("note", "html");
  await modes.approve();
  assert.equal(modes.state.pending, undefined);
  assert.match(modes.state.phase, /Applying.*connection lost/);
  await modes.approve();
  assert.equal(calls.filter((call) => call.name === "apply_assembly_plan").length, 1);
});

test("malformed apply and check successes cannot claim a verified result", async () => {
  for (const tool of ["apply_assembly_plan", "check"]) {
    for (const result of [
      null,
      {},
      { written: ["wrong-file"] },
      { findings: ["unexpected problem"] },
    ]) {
      const { modes, client, calls } = fixture();
      const call = client.callTool;
      client.callTool = async (request) => {
        if (request.name === tool) {
          calls.push(request);
          return answer({ ok: true, result, problems: [] });
        }
        return call(request);
      };
      modes.mode("auto");
      await modes.propose("note", "html");
      assert.match(modes.state.phase, /invalid .* (acknowledgement|result)/);
      assert.doesNotMatch(modes.state.phase, /check passed/);
      assert.equal(modes.state.pending, undefined);
      if (tool === "apply_assembly_plan")
        assert.equal(
          calls.some((call) => call.name === "check"),
          false,
        );
    }
  }
});

test("a malformed discard acknowledgement cannot claim rejection", async () => {
  const { modes, client } = fixture();
  await modes.propose("note", "html");
  client.callTool = async () => answer({ ok: true, result: null, problems: [] });
  await modes.reject();
  assert.match(modes.state.phase, /invalid discard acknowledgement/);
  assert.doesNotMatch(modes.state.phase, /Proposal rejected/);
});
