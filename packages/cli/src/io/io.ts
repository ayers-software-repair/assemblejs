// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Everything a command does to the world outside itself.
 *
 * Passed in rather than reached for, so a command is a function of its arguments and its io: a
 * test drives the real command instead of a rehearsal of it, and nothing writes to a developer's
 * disk to prove that it would have.
 */
export interface Io {
  write(path: string, contents: string): void;
  exists(path: string): boolean;
  log(line: string): void;
  error(line: string): void;
}
