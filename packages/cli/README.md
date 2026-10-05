# @assemblejs/cli

The AssembleJS command line.

    assemblejs new my-app
    assemblejs add assembly cart
    assemblejs dev       build, run, and rebuild on every change
    assemblejs build     dist/server.js and its browser files
    assemblejs check     every problem found without building, each with its fix
    assemblejs perf      build, then weigh what each page sends a visitor, against its budgets
    assemblejs deploy    build, then write deploy/: dist and its dependencies

A directory under `src/assemblies/` is an assembly. There is nothing to register: the command
generates the typed module the built server imports, and you never open it.

See <https://ayers.repair/assemblejs/>.

Apache-2.0. Copyright Ayers Electronics Inc.
