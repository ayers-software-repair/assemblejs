// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { MCP_REGISTRATIONS, registeredEntry } from "@assemblejs/check";

const [claude, , code] = MCP_REGISTRATIONS;
if (claude === undefined || code === undefined) throw new Error("no registrations");

describe("this project's agent surface, as a registration file holds it", () => {
  it("is the entry under its name, beside whatever other servers the file lists", () => {
    const source = JSON.stringify({
      mcpServers: { other: { command: "x" }, assemblejs: { command: "node", args: ["old.js"] } },
    });
    const read = registeredEntry(claude, source);
    expect(read.entry).toEqual({ command: "node", args: ["old.js"] });
    expect(Object.keys(read.file["mcpServers"] as object)).toEqual(["other", "assemblejs"]);
  });

  it("is read under the key that client lists its servers by", () => {
    const source = JSON.stringify({ servers: { assemblejs: { command: "node" } } });
    expect(registeredEntry(code, source).entry).toEqual({ command: "node" });
    expect(registeredEntry(claude, source).entry).toBeUndefined();
  });

  it("is nothing in a file that lists none, or whose servers are no object", () => {
    expect(registeredEntry(claude, "{}").entry).toBeUndefined();
    expect(registeredEntry(claude, '{ "mcpServers": null }').entry).toBeUndefined();
    expect(registeredEntry(claude, '{ "mcpServers": { "other": {} } }').entry).toBeUndefined();
  });

  // A comment is the commonest reason: an editor's settings file may hold one, and JSON may not.
  it("refuses a file that is not a JSON object, which could not be written back whole", () => {
    expect(() => registeredEntry(claude, "[]")).toThrow(/not a JSON object/);
    expect(() => registeredEntry(claude, "null")).toThrow(/not a JSON object/);
    expect(() => registeredEntry(claude, '{\n  // ours\n  "mcpServers": {}\n}')).toThrow();
  });

  // A byte order mark is no part of the JSON, and JSON.parse refuses it as if it were.
  it("is read through a byte order mark, which an editor may open a file with", () => {
    const source = `${String.fromCharCode(0xfeff)}{ "mcpServers": { "assemblejs": { "command": "node" } } }`;
    expect(registeredEntry(claude, source).entry).toEqual({ command: "node" });
  });
});
