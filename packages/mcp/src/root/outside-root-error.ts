// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/** Thrown when a tool is asked to touch something outside the one project it is scoped to. */
export class OutsideRootError extends Error {
  readonly attempted: string;
  readonly root: string;

  constructor(attempted: string, root: string) {
    super(`"${attempted}" is outside the project root ${root}`);
    this.name = "OutsideRootError";
    this.attempted = attempted;
    this.root = root;
  }
}
