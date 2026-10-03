# @assemblejs/devtools

Read-only devtools for an AssembleJS server in development.

    import { devtools } from "@assemblejs/devtools";

    const app = await createServer({ ...project, config, devtools: devtools() });

Open `/_assemblejs/devtools/` on the running server: the assemblies, pages, apis and remotes it
was built from, and the failures it logged most recently with their correlation ids. The same
reading is at `/_assemblejs/devtools/project.json`.

The server mounts devtools only in development; in production it mounts nothing of them, so a
project can hand them over unconditionally. Nothing under the devtools prefix accepts a write: a
server with a route there that answers anything but GET or HEAD refuses to boot.

See <https://ayers.repair/assemblejs/>.

Apache-2.0. Copyright Ayers Electronics Inc.
