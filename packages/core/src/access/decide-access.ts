// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { AccessPolicy } from "./access-policy.js";
import type { AccessRequest } from "./access-request.js";
import { isPublicRoute } from "./is-public-route.js";
import { matchesBasic } from "./matches-basic.js";

/**
 * Whether a request may proceed. THE one place this is decided: the server calls it once, in
 * the first hook every request passes, before routing, parsing or rendering, so there is no
 * second path that can disagree with it. A public route proceeds; with no control on, everything
 * does; otherwise the product's check decides, or the basic credentials do.
 *
 * A check that throws is a refusal, never an admission: a broken gate is a closed gate. What it
 * threw is handed to `failed`, for the caller to log against the id the visitor is told; a
 * refusal that nothing threw for is not a failure and is handed to nothing.
 */
export async function decideAccess(
  request: AccessRequest,
  policy: AccessPolicy,
  failed: (error: unknown) => void = () => undefined,
): Promise<boolean> {
  if (isPublicRoute(request.path, policy.publicRoutes)) return true;
  if (policy.authenticate !== undefined) {
    try {
      return (await policy.authenticate(request)) === true;
    } catch (error) {
      failed(error);
      return false;
    }
  }
  if (policy.basic !== undefined)
    return matchesBasic(request.headers["authorization"], policy.basic);
  return true;
}
