// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { ownVersion } from "./own-version.js";

/**
 * The smallest project that runs. One assembly, one view, no framework the author did not ask
 * for, and a server file that never grows: adding an assembly adds a directory and nothing else.
 * Its manifest depends on the version of the command line that wrote it, so a project made by a
 * prerelease installs from the channel that made it.
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
        devDependencies: { "@assemblejs/cli": range },
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

    "src/pages/home/home.html": `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${name}</title>
  </head>
  <body>
    <assembly name="hello"></assembly>
  </body>
</html>
`,

    "src/assemblies/hello/hello.html": `<p>Hello from AssembleJS</p>\n`,

    "README.md": `# ${name}

    npm install
    npm run dev

A directory under \`src/assemblies\` is an assembly and a directory under \`src/pages\` is a page.
There is nothing to register: \`src/server.ts\` does not grow when you add either. Place an
assembly on a page with \`<assembly name="hello"></assembly>\`.
`,
  };
}
