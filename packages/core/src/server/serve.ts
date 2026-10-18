// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { ConfigError } from "../config/config-error.js";
import type { Config } from "../config/config.js";
import { describeConfig } from "../config/describe-config.js";
import { readConfig } from "../config/read-config.js";
import type { App } from "./app.js";
import { BootError } from "./boot-error.js";
import { createServer } from "./create-server.js";
import type { ServeOptions } from "./serve-options.js";

/**
 * Starts a project: reads the configuration from the process environment, builds the server,
 * listens, and says where. A refusal at any of those steps is printed to standard error as its
 * sentences, one to a line, and the process ends with exit code 1. Anything else is a bug and
 * is thrown as one.
 *
 * Use `createServer` instead when a program wants the `App`: a test, or a server embedded in
 * another process.
 */
export async function serve(project: ServeOptions): Promise<void> {
  let config: Config;
  try {
    config = readConfig(process.env);
  } catch (error) {
    return refuse(refusalOf(error));
  }

  let app: App;
  try {
    app = await createServer({ ...project, config });
  } catch (error) {
    return refuse(refusalOf(error));
  }

  let url: string;
  try {
    ({ url } = await app.listen());
  } catch (error) {
    await app.close();
    return refuse([cannotListen(config, error)]);
  }

  for (const line of describeConfig(config)) process.stdout.write(`${line}\n`);
  process.stdout.write(`listening ${url}\n`);
}

/** The sentences a refusal carries; anything that is not one is not ours to print. */
function refusalOf(error: unknown): readonly string[] {
  if (error instanceof ConfigError || error instanceof BootError) return error.problems;
  throw error;
}

function cannotListen(config: Config, error: unknown): string {
  const where = `${config.host}:${config.port}`;
  if ((error as NodeJS.ErrnoException).code === "EADDRINUSE") {
    return `cannot listen on ${where}: something is already listening there.`;
  }
  const cause = error instanceof Error ? error.message : String(error);
  return `cannot listen on ${where}: ${cause}`;
}

// Sets the exit code and returns rather than calling process.exit, so what was written is
// flushed: Node ends the process on its own once nothing is pending.
function refuse(problems: readonly string[]): void {
  for (const problem of problems) process.stderr.write(`${problem}\n`);
  process.exitCode = 1;
}
