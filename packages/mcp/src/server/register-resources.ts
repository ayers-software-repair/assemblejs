// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { discoverAssemblies } from "@assemblejs/build";
import { COMPUTED, RULES, UNREAD } from "@assemblejs/check";
import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpError } from "@modelcontextprotocol/sdk/types.js";
import type { ProjectRoot } from "../root/project-root.js";
import { describeAssembly } from "./describe-assembly.js";
import { describeContract } from "./describe-contract.js";
import { describeProject } from "./describe-project.js";
import { RESOURCE_NOT_FOUND } from "./resource-not-found.js";

const PROJECT = "assemblejs://project";
const RULES_URI = "assemblejs://rules";
const CONTRACT_URI = "assemblejs://contract";
const ASSEMBLY = "assemblejs://assembly/";
const TYPE = "application/json";

const answer = (uri: string, value: unknown) => ({
  contents: [{ uri, mimeType: TYPE, text: JSON.stringify(value, null, 2) }],
});

/**
 * What an agent reads: the project's whole shape, one assembly of it, the rules, and the
 * contract. The shape and each assembly are read from the project's sources when they are asked
 * for, and nothing of the project's is run; the rules and the contract are the framework's own.
 *
 * The assemblies are one resource each, listed with the fixed ones, because a client that
 * shows a person what can be read lists resources and not every client expands a template.
 * The rules are the command line's own, the same for every project.
 */
export function registerResources(server: McpServer, root: ProjectRoot): void {
  // The names alone, from the one directory they are read from. Listing opens nothing else of
  // the project, and nothing it could meet there takes the list down with it: a client that
  // lists on connecting would be left with nothing, the fixed resources included. Where the
  // assemblies lead out of the project, discovery lists none.
  const names = (): readonly string[] => {
    try {
      return discoverAssemblies(root.path).assemblies.map((assembly) => assembly.name);
    } catch {
      return [];
    }
  };

  server.registerResource(
    "project",
    PROJECT,
    {
      title: "This project",
      description: `Every page, assembly and api, what the config declares, and how they are wired: what each page and each view places, under what policy, and where each assembly is placed. Read from the sources, so it needs no build. A value a source computes reads "${COMPUTED}", and what a file that cannot be read would have said reads "${UNREAD}". One read, so an agent does not spend its first turns asking what exists.`,
      mimeType: TYPE,
    },
    () => answer(PROJECT, describeProject(root)),
  );

  server.registerResource(
    "assembly",
    new ResourceTemplate(`${ASSEMBLY}{name}`, {
      list: () => ({
        resources: names().map((name) => ({
          uri: `${ASSEMBLY}${name}`,
          name: `assembly/${name}`,
          title: `The assembly ${name}`,
        })),
      }),
      complete: { name: (value) => names().filter((name) => name.startsWith(value)) },
    }),
    {
      title: "One assembly",
      description:
        "One assembly by its name: its files, its renderer, what its view places, and every placement of it, on a page with that page's policy for it or in another assembly's view. Read from the sources.",
      mimeType: TYPE,
    },
    (uri, variables) => {
      const name = variables["name"];
      const found = typeof name === "string" ? describeAssembly(root, name) : undefined;
      if (found === undefined) {
        throw new McpError(RESOURCE_NOT_FOUND, "Resource not found", { uri: uri.href });
      }
      return answer(uri.href, found);
    },
  );

  server.registerResource(
    "rules",
    RULES_URI,
    {
      title: "The rules real code must satisfy",
      description:
        "Each with the reason it exists and what it looks like when broken. An agent that knows only a rule complies; one that knows why can tell when it is looking at the situation the rule was written for.",
      mimeType: TYPE,
    },
    () => answer(RULES_URI, RULES),
  );

  server.registerResource(
    "contract",
    CONTRACT_URI,
    {
      title: "The assembly contract",
      description:
        "The three endpoints every assembly answers at, the headers each way with their shapes, the manifest's fields and the envelope with its attributes, every name the one the server writes. An agent writing a remote assembly in another language reads this and needs nothing else.",
      mimeType: TYPE,
    },
    () => answer(CONTRACT_URI, describeContract()),
  );
}
