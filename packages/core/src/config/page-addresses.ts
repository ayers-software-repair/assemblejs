// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * For each page whose route has a parameter, one example address at which `perf` weighs it,
 * keyed by the route as the page declares it: `{ "/product/:sku": "/product/kettle-1" }`.
 * `check` asks for one for each such page. Nothing on the server reads them.
 */
export type PageAddresses = Readonly<Record<string, string>>;
