# @asmjs/check

## 1.0.0-next.1

### Patch Changes

- Expand the package README with installation commands, a working example and links to the relevant guide.

## 1.0.0-next.0

### Minor Changes

- The checks are a package of their own. `@asmjs/check` is new: the rules a project is held to, every problem found in one without building it, a project's shape, what its pages weigh, and the text of the files written for a project's agents, which were part of `@asmjs/cli`. The command line depends on it and keeps its verbs, so `assemblejs check` and `assemblejs perf` are unchanged. A program that imported those names from `@asmjs/cli` imports them from `@asmjs/check`; the command line exports its verbs and what `new` writes, and no more.

### Patch Changes

- A new project's guide link and its agent instructions now name the documentation of the channel it was made from: `/next/` for a prerelease and the product's own address for a stable.
  The agent instructions open with the address of `llms.txt` and `llms-full.txt`, and every package's `homepage` is `https://assemblejs.com/`.
- A service can say the thing its page is for does not exist: `throw new NotFound()`, from `@asmjs/core`. The page then answers 404 with the project's not-found page, the page directory `src/pages/not-found`, which has no route of its own and is also what every address no route claims answers. A project without one answers those with the failure body, under a 404, as before; an address under `/assembly` or `/_assemblejs` always does. `check` names a not-found page that declares a route. An address with a trailing slash now answers as the one without it, `/products/` as `/products`, and access is decided of it the same way, so `/admin/` is guarded as `/admin` is.
- `perf` weighs what an assembly fetches as it mounts, and a page with a parameter in its route. It reported only what a page loads before anything mounts: 20.7 kB of script on a page whose React assembly then fetched 218 kB. It now shows two parts, the document, styles and scripts before anything mounts, and, for each assembly the browser mounts on the page that is this server's, its module with what that imports before it runs, each file once across the page, then a total. The module is found in the map the page's entry script holds. `budgets` takes `mount` and `total` beside `document`, `styles` and `scripts`. `addresses` in `assemblejs.config.ts` lists one example address for each page whose route has a parameter, keyed by the route as the page declares it, and `perf` weighs the page there and shows both; `check` asks for it with the rule `a-page-with-a-parameter-names-an-address`, and names an address its route does not answer and one for a route no page has. A page with a parameter and no address is still not weighed, and the line names the key to add. A project with such a page now needs the address, and one whose `total` or `mount` is budgeted is held to the truer figure.
- The build writes the project's TypeScript setup into `.assemblejs/`, so no file of a project's needs a line saying whose JSX it is. One project for each owner of JSX the assemblies have (React's, Preact's with `jsxImportSource: "preact"`, Solid's with `jsx: "preserve"` and `"solid-js"`), decided by the build's own definition of whose a file is: an assembly's directory is its renderer's, and a `.tsx` outside every assembly that names a framework is that framework's. The sources outside the assemblies are a project every other reads, the server file, the generated modules and the config are the application's, and `.assemblejs/tsconfig.json` is the solution. The registry is written as one module per owner, `assemblies.<owner>.ts`, which `assemblies.ts` spreads in, so the render calls on a view are checked against the view's own framework and an editor shows no error in a module no hand wrote. A new project is ready to type-check by default: `typescript` and `@types/node` are development dependencies, at the versions the command line was proven with, its root `tsconfig.json` names the written setup, and `npm run typecheck` builds and runs `tsc -b`. `check` names `@types/react` and `@types/react-dom` when a project has a React view and has not installed them (`a-react-view-needs-its-types`); the build needs no types and builds without them.

