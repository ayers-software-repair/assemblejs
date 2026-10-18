// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Another server this one may compose assemblies from: its exact origin, the request headers it
 * is given, and whether it is trusted with the page's query. Nothing is forwarded unless named
 * here, per remote, per key: forwarding a credential to another company's server is a decision,
 * never a default, and so is handing it what a visitor typed into the address.
 */
export interface RemoteDefinition {
  /** `https://checkout.example.com`: scheme, host and port, nothing else. Matched exactly. */
  readonly origin: string;
  /** Lower-case request header names this remote receives from the visitor's request. */
  readonly forward?: readonly string[];
  /**
   * Whether the page's query reaches this remote with each placement, as it reaches this
   * server's own services (DESIGN 5.1). Off unless declared: a remote not named trusted is
   * given the route parameters and the declared headers, and nothing the visitor typed.
   */
  readonly trusted?: boolean;
  /**
   * Whether this remote's browser runtime joins the page's one event bus (DESIGN 3.6). Off unless
   * declared, as `forward` and `trusted` are: a remote not named is on a bus of its own.
   */
  readonly events?: boolean;
}
