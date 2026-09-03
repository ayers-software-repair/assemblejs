// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { AuthConfig } from "./auth-config.js";
import { ConfigError } from "./config-error.js";
import type { Config } from "./config.js";
import type { Environment } from "./environment.js";
import type { Mode } from "./mode.js";

const MODES: readonly Mode[] = ["development", "production"];

/**
 * Configuration, read from the process environment once and validated before anything listens.
 *
 * Three rules, each of them the inverse of a defect the predecessor shipped:
 *
 *   - It reads the environment it is given, and nothing else. The predecessor read a bundler's
 *     compile-time constants, which are empty in the shipped run path, so every setting took its
 *     default forever and the controls keyed on them could never turn on.
 *   - A value that is present but unreadable REFUSES, and is never quietly replaced by the
 *     default. Only an absent variable takes a default, and only where a safe one exists.
 *   - Every security control is off unless it was turned on, and turning one on without its
 *     credential is a boot failure rather than a warning. There is no shipped password.
 */
export function readConfig(environment: Environment): Config {
  const problems: string[] = [];

  const mode = readMode(environment, problems);
  const host = environment["ASSEMBLEJS_HOST"] ?? "127.0.0.1";
  const port = readPort(environment, problems);
  const auth = readAuth(environment, problems);

  if (problems.length > 0) throw new ConfigError(problems);
  return { mode, host, port, auth };
}

function readMode(environment: Environment, problems: string[]): Mode {
  const raw = environment["ASSEMBLEJS_MODE"];
  // Unset is production: the safe one. A typo is not, because silently running a misspelled
  // mode as production is the same silence this whole function exists to remove.
  if (raw === undefined || raw === "") return "production";
  if ((MODES as readonly string[]).includes(raw)) return raw as Mode;
  problems.push(
    `ASSEMBLEJS_MODE is "${raw}", which is not one of ${MODES.join(" or ")}. Unset it for production.`,
  );
  return "production";
}

function readPort(environment: Environment, problems: string[]): number {
  const raw = environment["ASSEMBLEJS_PORT"];
  if (raw === undefined || raw === "") return 3000;
  // Number() would read "3000abc" as NaN but "" as 0 and " 12 " as 12; the explicit shape check
  // is what makes a malformed value a refusal rather than a surprise.
  if (!/^\d+$/.test(raw)) {
    problems.push(`ASSEMBLEJS_PORT is "${raw}", which is not a whole number.`);
    return 3000;
  }
  const port = Number(raw);
  if (port < 1 || port > 65535) {
    problems.push(`ASSEMBLEJS_PORT is ${port}, which is outside 1 to 65535.`);
    return 3000;
  }
  return port;
}

function readAuth(environment: Environment, problems: string[]): AuthConfig | undefined {
  const raw = environment["ASSEMBLEJS_AUTH"];
  if (raw === undefined || raw === "" || raw === "off") return undefined;
  if (raw !== "basic") {
    problems.push(`ASSEMBLEJS_AUTH is "${raw}", which is not "basic" or "off".`);
    return undefined;
  }

  const user = environment["ASSEMBLEJS_AUTH_USER"];
  const password = environment["ASSEMBLEJS_AUTH_PASSWORD"];
  // Turning a control on without its credential is a boot failure. Defaulting one here is how
  // a framework ends up shipping a password that every deployment shares.
  if (user === undefined || user === "") {
    problems.push("ASSEMBLEJS_AUTH is basic but ASSEMBLEJS_AUTH_USER is not set.");
  }
  if (password === undefined || password === "") {
    problems.push("ASSEMBLEJS_AUTH is basic but ASSEMBLEJS_AUTH_PASSWORD is not set.");
  }
  if (user === undefined || user === "" || password === undefined || password === "") {
    return undefined;
  }
  return { user, password };
}
