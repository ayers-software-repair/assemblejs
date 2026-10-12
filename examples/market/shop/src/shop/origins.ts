// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// Where the other teams' servers are. Known only where this server runs, so each is read from
// the environment, with the address the showcase starts it at when nothing says otherwise.
export const CATALOG = process.env["CATALOG_ORIGIN"] ?? "http://127.0.0.1:4701";
export const REVIEWS = process.env["REVIEWS_ORIGIN"] ?? "http://127.0.0.1:4702";
export const FULFILMENT = process.env["FULFILMENT_ORIGIN"] ?? "http://127.0.0.1:4703";

/** The address an assembly of another server is asked at. */
export const from = (origin: string, name: string): string => `${origin}/assembly/${name}/`;
