// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineConfig } from "@assemblejs/core";

// The product's own check, for what basic credentials cannot express: here a header a gateway
// would set. One value breaks the check on purpose, so a spec can see that a broken gate is a
// closed one. The policy is the project's own, replacing the default whole.
export default defineConfig({
  authenticate: (request) => {
    const team = request.headers["x-team"];
    if (team === "boom") throw new Error("the check broke");
    return team === "shop";
  },
  publicRoutes: ["/api/open"],
  contentSecurityPolicy: "default-src 'self'; script-src 'self' https://cdn.example.com",
});
