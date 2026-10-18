// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { ServerOptions } from "./server-options.js";

/** What `serve` is handed: the project, and anything else a server is built from but the config. */
export type ServeOptions = Omit<ServerOptions, "config">;
