#!/usr/bin/env node
// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { realIo } from "@assemblejs/cli";
import { createProject } from "./create/create-project.js";

process.exitCode = createProject(process.argv.slice(2), realIo);
