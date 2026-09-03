// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/** Why a request's composition headers were refused. Named, so the answer can say which. */
export interface HeaderProblem {
  readonly header: string;
  readonly detail: string;
}
