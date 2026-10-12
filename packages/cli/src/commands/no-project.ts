// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * What `add` says where it was pointed at a directory that is no project, one with no
 * `package.json`: it writes nothing there. A mistyped `--cwd` otherwise made the directory and
 * reported that it had added to it.
 */
export function noProject(at: string): string {
  return `there is no project at ${at}: run this in a project's directory, or name one with --cwd`;
}
