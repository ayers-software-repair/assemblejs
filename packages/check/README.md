# @assemblejs/check

What reads an AssembleJS project and names what is wrong with it.

It holds the rules a project is held to, each with its reason and its fix; finds every problem
it can without building, in a view, a page, an api, the project's tokens and the files written
for its agents; reads a project's shape for a tool that asks; and weighs what each page of a
build sends a visitor against the project's budgets.

You do not install this yourself: `@assemblejs/cli` brings it, and its verbs are how it is run.

    assemblejs check
    assemblejs perf

See <https://assemblejs.com/>.

Apache-2.0. Copyright Ayers Electronics Inc.
