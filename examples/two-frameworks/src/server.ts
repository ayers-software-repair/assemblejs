// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { createServer, describeConfig, readConfig } from "@assemblejs/core";
import { devtools } from "@assemblejs/devtools";
import project from "../.assemblejs/project.js";

const config = readConfig(process.env);
// Devtools are mounted in development only; in production the server ignores them.
const app = await createServer({ ...project, config, devtools: devtools() });
const { url } = await app.listen();
for (const line of describeConfig(config)) console.log(line);
console.log(`listening ${url}`);
