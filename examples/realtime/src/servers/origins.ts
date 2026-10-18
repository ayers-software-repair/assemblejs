// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// The two other servers this one places assemblies from. Known only where this server runs, so
// each is read from the environment, with an address nothing listens at when nothing says
// otherwise.
export const ADMITTED = process.env["ADMITTED_ORIGIN"] ?? "http://127.0.0.1:4801";
export const OTHER = process.env["OTHER_ORIGIN"] ?? "http://127.0.0.1:4802";

/** The address an assembly of another server is asked at. */
export const from = (origin: string, name: string): string => `${origin}/assembly/${name}/`;
