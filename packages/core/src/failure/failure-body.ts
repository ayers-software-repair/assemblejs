// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * What a failed request answers with. The id and nothing else.
 *
 * There is no message field on purpose. A body that carries an exception's message hands out
 * the stack frame, the query, the file path or the credential that happened to be in it, and it
 * does so to whoever asked, including whoever was probing.
 */
export interface FailureBody {
  readonly error: {
    readonly correlationId: string;
  };
}
