# @asmjs/check

Checks project structure, views, pages, APIs, design tokens, agent files, and page budgets.

The CLI includes this package. Findings identify the relevant rule and a suggested fix. Checks and performance budgets use the project configuration.

## Usage

In an AssembleJS project, install the CLI if it is not already present:

```sh
npm install --save-dev @asmjs/cli
```

Inspect the project without building:

```sh
npx assemblejs check
```

Build and check page payload budgets:

```sh
npx assemblejs perf
```

Node.js 22 or newer. For custom tooling, the package exports its implementation as ESM with TypeScript declarations.

## Documentation

[AssembleJS documentation](https://assemblejs.com/docs/) · [Source](https://github.com/ayers-software-repair/assemblejs)

Apache-2.0. Copyright Ayers Electronics Inc. See the distributed LICENSE and NOTICE files.
