// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { Config } from "./config.js";

/**
 * The resolved configuration, for the startup banner, so an operator can see what the server
 * actually read rather than what they believe they set.
 *
 * The password is never a line here. A banner that echoes a secret puts it in every log,
 * every terminal scrollback and every screen recording of a deploy.
 */
export function describeConfig(config: Config): readonly string[] {
  return [
    `mode  ${config.mode}`,
    `host  ${config.host}`,
    `port  ${config.port}`,
    `auth  ${config.auth === undefined ? "off" : `basic, user ${config.auth.user}`}`,
  ];
}
