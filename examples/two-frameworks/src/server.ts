// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { serve } from "@asmjs/core";
import { devtools } from "@asmjs/devtools";
import project from "../.assemblejs/project.js";

// Devtools are mounted in development only; in production the server ignores them.
await serve({ ...project, devtools: devtools() });
