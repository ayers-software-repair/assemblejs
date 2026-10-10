// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { agentFiles } from "../agents/agent-files.js";
import { ownVersion } from "./own-version.js";
import { pageDocument } from "./page-document.js";

/**
 * The smallest project that runs. One assembly, one view, no framework the author did not ask
 * for, and a server file that never grows: adding an assembly adds a directory and nothing else.
 * Its manifest depends on the version of the command line that wrote it, so a project made by a
 * prerelease installs from the channel that made it. It is written for the agents that will
 * work in it too: what the project is and its rules, and its agent surface installed and
 * registered.
 */
export function projectFiles(name: string): Readonly<Record<string, string>> {
  const range = `^${ownVersion(import.meta.url)}`;
  return {
    "package.json": `${JSON.stringify(
      {
        name,
        private: true,
        type: "module",
        engines: { node: ">=22" },
        scripts: { dev: "assemblejs dev", build: "assemblejs build", start: "node dist/server.js" },
        dependencies: { "@assemblejs/core": range },
        devDependencies: { "@assemblejs/cli": range, "@assemblejs/mcp": range },
      },
      null,
      2,
    )}\n`,

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

    "src/assemblies/hello/hello.html": `<p>Hello from AssembleJS</p>\n`,

    "README.md": `# ${name}

    npm install
    npm run dev

A directory under \`src/assemblies\` is an assembly and a directory under \`src/pages\` is a page.
There is nothing to register: \`src/server.ts\` does not grow when you add either. Place an
assembly on a page with \`<assembly name="hello"></assembly>\`.

\`AGENTS.md\` tells a coding agent what this project is and the rules its code must satisfy.
\`.mcp.json\`, \`.cursor/mcp.json\` and \`.vscode/mcp.json\` register the project's own MCP server
for it, and \`npx assemblejs add agents\` brings all of them up to date after an upgrade. The
server lists four prompts, which Claude Code and VS Code show as commands: add an assembly,
place one, make a page, fix what \`check\` finds.
`,
    ...agentFiles(name).files,
  };
}
