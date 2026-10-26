# @asmjs/build

What turns an AssembleJS project into a server and its browser files.

It finds a project's assemblies, pages and apis by the directories they are in, generates the
typed modules the built server and the browser import, and bundles both. It refuses a project
it cannot build before it bundles, with every reason and its fix. `dev` is the same build, run
again on every change.

You do not install this yourself: `@asmjs/cli` brings it, and its verbs are how it is run.

    assemblejs build
    assemblejs dev

See <https://assemblejs.com/>.

Apache-2.0. Copyright Ayers Electronics Inc.
