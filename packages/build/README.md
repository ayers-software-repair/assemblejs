# @asmjs/build

Discovers assemblies, pages, and APIs; generates their typed modules; and bundles server and browser output.

The CLI includes this package. Applications normally use the commands below; direct consumers can use its project-discovery and build exports.

## Usage

In an AssembleJS project, install the CLI if it is not already present:

```sh
npm install --save-dev @asmjs/cli
```

Build the application:

```sh
npx assemblejs build
```

Serve and rebuild on file changes:

```sh
npx assemblejs dev
```

Node.js 22 or newer. For custom tooling, the package exports its implementation as ESM with TypeScript declarations.

## Documentation

[AssembleJS documentation](https://assemblejs.com/docs/) · [Source](https://github.com/ayers-software-repair/assemblejs)

Apache-2.0. Copyright Ayers Electronics Inc. See the distributed LICENSE and NOTICE files.
