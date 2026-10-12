// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { ContractTerm } from "./contract-term.js";

/**
 * The assembly contract as an agent reads it: the three endpoints, the headers each way, the
 * manifest's fields and the envelope, every name the one core's server writes it from. An agent
 * writing a remote assembly in another language reads this and needs nothing else.
 */
export interface DescribedContract {
  /** The version of the contract itself, bumped only by a breaking change to the endpoints. */
  readonly contract: number;
  /** The route prefix every assembly endpoint stands under. */
  readonly prefix: string;
  /** The view the content endpoint serves at the bare name. */
  readonly defaultView: string;
  readonly endpoints: readonly {
    readonly name: string;
    readonly method: "GET";
    readonly path: string;
    readonly answers: string;
    readonly refuses: string;
  }[];
  /** The composition headers a request may carry, each validated against its shape. */
  readonly requestHeaders: readonly (ContractTerm & { readonly shape: string })[];
  readonly responseHeaders: readonly ContractTerm[];
  /** The manifest's fields, every one named, nothing copied wholesale. */
  readonly manifest: readonly ContractTerm[];
  readonly envelope: {
    readonly element: string;
    readonly always: readonly ContractTerm[];
    readonly whenTheyApply: readonly ContractTerm[];
    readonly island: {
      readonly element: "script";
      readonly type: string;
      readonly attribute: string;
    };
    readonly fallback: ContractTerm;
    readonly directive: ContractTerm;
  };
}
