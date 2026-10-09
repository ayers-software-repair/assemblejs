// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { AccessRequest } from "./access-request.js";

/**
 * The product's own check, for anything basic credentials cannot express: a session, a token, a
 * header a gateway sets. It answers whether the request may proceed and nothing else; the
 * framework ships no user store, no login page and no session.
 */
export type Authenticate = (request: AccessRequest) => boolean | Promise<boolean>;
