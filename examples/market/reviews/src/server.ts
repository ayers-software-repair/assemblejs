// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { serve } from "@asmjs/core";
import project from "../.assemblejs/project.js";

await serve(project);
