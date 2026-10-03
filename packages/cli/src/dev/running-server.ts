// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/** A built server running in a child process, as `dev` holds it. */
export interface RunningServer {
  /** The url it is listening on, once it says so; undefined if it exited first. */
  readonly ready: Promise<string | undefined>;
  /** Stops it and resolves once the process has exited. */
  stop(): Promise<void>;
}
