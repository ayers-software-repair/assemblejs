// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * What a service throws to say the thing its page is for does not exist:
 * `throw new NotFound()`. The page answers 404 with the project's not-found page, and the
 * message, when there is one, is for the server's log line and never for the visitor.
 */
export class NotFound extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "NotFound";
  }
}
