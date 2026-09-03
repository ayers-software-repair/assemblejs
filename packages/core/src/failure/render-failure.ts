// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { FailureBody } from "./failure-body.js";

/** The body for a failed request, built from the id alone. */
export function renderFailure(correlationId: string): FailureBody {
  return { error: { correlationId } };
}
