#!/usr/bin/env node
// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { realIo } from "@asmjs/build";
import { run } from "./run/run.js";

process.exitCode = await run(process.argv.slice(2), realIo);
