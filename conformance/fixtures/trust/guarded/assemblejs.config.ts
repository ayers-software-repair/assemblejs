// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineConfig } from "@assemblejs/core";

// The credentials are where the server runs (ASSEMBLEJS_AUTH, in the environment); what needs
// none is a decision about the project, so it is declared here: one route exactly, one prefix
// of pages, and the two boards' addresses and the shelf's, so that each is open wherever it is
// shown. The badge and the ledger are not, so an open page that places either stands it empty
// for a guest.
export default defineConfig({
  publicRoutes: [
    "/api/open",
    "/public/*",
    "/assembly/board/*",
    "/assembly/pinboard/*",
    "/assembly/shelf/*",
  ],
});
