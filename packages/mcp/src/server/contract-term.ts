// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/** One named thing of the contract and what it means, for an agent writing to it. */
export interface ContractTerm {
  readonly name: string;
  readonly meaning: string;
}
