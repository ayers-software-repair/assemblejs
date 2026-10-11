import { defineConfig } from "@assemblejs/core";

// The bounds on composition, set where the project's policy is: one level deep, and two
// placements a request, so the page below shows each bound refusing.
export default defineConfig({ limits: { depth: 1, placements: 2 } });
