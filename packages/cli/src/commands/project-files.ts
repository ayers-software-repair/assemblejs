// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { agentFiles } from "@assemblejs/check";
import { MCP_REGISTRATIONS } from "@assemblejs/check";
import { COMPONENTS } from "./components.js";
import { ownPin } from "./own-pin.js";
import { ownVersion } from "./own-version.js";
import { pageDocument } from "./page-document.js";
import { PNPM_SETTINGS } from "./pnpm-settings.js";
import { TOKENS } from "./tokens.js";

/**
 * The smallest project that runs. One assembly, one view, no framework the author did not ask
 * for, and a server file that never grows: adding an assembly adds a directory and nothing else.
 * Its manifest depends on the version of the command line that wrote it, so a project made by a
 * prerelease installs from the channel that made it. It is written for the agents that will
 * work in it too: what the project is and its rules, and its agent surface installed and
 * registered. It is ready to type-check by default: TypeScript and Node's types are installed,
 * at the versions this release was proven with, and the root `tsconfig.json` names the setup
 * the build writes into `.assemblejs/`, so no file of the project's carries a line about its
 * framework. One made by pnpm carries pnpm's ruling on the one install script among its
 * dependencies, without which pnpm fails its first install.
 */
export function projectFiles(name: string, manager = "npm"): Readonly<Record<string, string>> {
  const range = `^${ownVersion(import.meta.url)}`;
  const tool = (pin: string): string => `^${ownPin(import.meta.url, pin)}`;
  // The README names each registration the project is written with, as the instructions do.
  const registered = MCP_REGISTRATIONS.map((registration) => `\`${registration.path}\``);
  return {
    "package.json": `${JSON.stringify(
      {
        name,
        private: true,
        type: "module",
        engines: { node: ">=22" },
        scripts: {
          dev: "assemblejs dev",
          build: "assemblejs build",
          start: "node dist/server.js",
          typecheck: "assemblejs build && tsc -b",
        },
        dependencies: { "@assemblejs/core": range },
        devDependencies: {
          "@assemblejs/cli": range,
          "@assemblejs/mcp": range,
          "@types/node": tool("@types/node"),
          typescript: tool("typescript"),
        },
      },
      null,
      2,
    )}\n`,

    "tsconfig.json": `${JSON.stringify({ files: [], references: [{ path: "./.assemblejs" }] }, null, 2)}\n`,

    ".gitignore": ["node_modules/", "dist/", ".assemblejs/", "deploy/", ""].join("\n"),

    "src/server.ts": `import { createServer, describeConfig, readConfig } from "@assemblejs/core";
import project from "../.assemblejs/project.js";

const config = readConfig(process.env);
const app = await createServer({ ...project, config });
const { url } = await app.listen();
for (const line of describeConfig(config)) console.log(line);
console.log(\`listening \${url}\`);
`,

    "src/pages/home/home.html": pageDocument(name, ["hello"]),

    "src/assemblies/hello/hello.html": `<section class="notice"><p>Hello from AssembleJS</p><a class="button" href="https://www.assemblejs.com/next/docs/tutorial.html">Read the guide</a></section>\n`,

    "src/tokens.css": TOKENS,

    "src/components.css": COMPONENTS,

    "README.md": `# ${name}

    npm install
    npm run dev

A directory under \`src/assemblies\` is an assembly and a directory under \`src/pages\` is a page.
There is nothing to register: \`src/server.ts\` does not grow when you add either. Place an
assembly on a page with \`<assembly name="hello"></assembly>\`.

\`npm run typecheck\` builds and type-checks the project. The build writes the TypeScript setup
into \`.assemblejs/\`, one project for each framework's JSX, so no file names its framework.

\`AGENTS.md\` tells a coding agent what this project is and the rules its code must satisfy.
${registered.slice(0, -1).join(", ")} and ${registered.at(-1) ?? ""} register the project's own MCP server
for it, and \`npx assemblejs add agents\` brings all of them up to date after an upgrade. The
server lists four prompts, which Claude Code and VS Code show as commands: add an assembly,
place one, make a page, fix what \`check\` finds.
`,
    ...agentFiles(name).files,
    ...(manager === "pnpm" ? { "pnpm-workspace.yaml": PNPM_SETTINGS } : {}),
  };
}
