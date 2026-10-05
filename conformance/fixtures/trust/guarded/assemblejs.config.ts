// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineConfig } from "@assemblejs/core";

// The credentials are where the server runs (ASSEMBLEJS_AUTH, in the environment); what needs
// none is a decision about the project, so it is declared here: one route exactly, one prefix.
export default defineConfig({ publicRoutes: ["/api/open", "/public/*"] });
