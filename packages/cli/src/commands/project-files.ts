// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * The smallest project that runs. One assembly, one view, no framework the author did not ask
 * for, and a server file that never grows: adding an assembly adds a directory and nothing else.
 */
export function projectFiles(name: string): Readonly<Record<string, string>> {
  return {
    "package.json": `${JSON.stringify(
      {
        name,
        private: true,
        type: "module",
        engines: { node: ">=22" },
        scripts: { dev: "assemblejs dev", build: "assemblejs build", start: "node dist/server.js" },
        dependencies: { "@assemblejs/core": "^1.0.0" },
        devDependencies: { "@assemblejs/cli": "^1.0.0" },
      },
      null,
      2,
    )}\n`,

    ".gitignore": ["node_modules/", "dist/", ".assemblejs/", ""].join("\n"),

    "src/server.ts": `import { createServer, readConfig, describeConfig } from "@assemblejs/core";
import { assemblies } from "../.assemblejs/assemblies.js";

const config = readConfig(process.env);
const app = await createServer({ config, assemblies });
const { url } = await app.listen();
for (const line of describeConfig(config)) console.log(line);
console.log(\`listening \${url}\`);
`,

    "src/assemblies/hello/hello.html": `<p>Hello from AssembleJS</p>\n`,

    "README.md": `# ${name}

    pnpm install
    pnpm dev

A directory under \`src/assemblies\` is an assembly. There is nothing to register: \`src/server.ts\`
does not grow when you add one.
`,
  };
}
