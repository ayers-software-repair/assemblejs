#!/usr/bin/env node
// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { realIo } from "@asmjs/build";
import { createProject } from "@asmjs/create";

process.exitCode = createProject(process.argv.slice(2), realIo);
