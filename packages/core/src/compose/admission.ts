// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * What asking whether a visitor may be shown a placement answers. A refusal carries an id only
 * where the check itself broke, which is a failure and is logged against that id. A visitor who
 * is simply not let in is no failure, and there is nothing to find.
 */
export type Admission =
  { readonly admitted: true } | { readonly admitted: false; readonly correlationId?: string };
