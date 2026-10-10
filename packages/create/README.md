# @assemblejs/create

Starts an AssembleJS project.

    npm create @assemblejs my-app
    cd my-app
    npm install
    npm run dev

It writes the smallest project that runs: one page placing one assembly, and no framework you
did not ask for. It never asks a question, so it behaves the same in a terminal and in a script.
For an AI agent that opens the project it writes an `AGENTS.md`, which says what the project is
and the rules its code must satisfy, and registers the project's own MCP server.
Add a second framework with `npx assemblejs add assembly cart --renderer svelte`.

See <https://ayers.repair/assemblejs/>.

Apache-2.0. Copyright Ayers Electronics Inc.
