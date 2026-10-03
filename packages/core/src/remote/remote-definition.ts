// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Another server this one may compose assemblies from: its exact origin, and the request headers
 * it is given. Nothing is forwarded unless named here, per remote, per key: forwarding a
 * credential to another company's server is a decision, never a default.
 */
export interface RemoteDefinition {
  /** `https://checkout.example.com`: scheme, host and port, nothing else. Matched exactly. */
  readonly origin: string;
  /** Lower-case request header names this remote receives from the visitor's request. */
  readonly forward?: readonly string[];
}
