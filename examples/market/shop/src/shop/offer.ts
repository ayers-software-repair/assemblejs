// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
/** Server-supplied product and stock information shared by the shop's product controls. */
export type Offer = {
  found: boolean;
  sku: string;
  name: string;
  cents: number;
  left: number;
  grind: string;
};
