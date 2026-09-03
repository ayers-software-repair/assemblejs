// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/** One request for one assembly, whether it is answered in this process or over HTTP. */
export interface AssemblyRequest {
  readonly name: string;
  readonly view: string;
  /** Allocated by the parent, so the parent can address the result before it arrives. */
  readonly id: string;
  /** The page being composed. */
  readonly page: string;
  /** How many assemblies deep this request is. */
  readonly depth: number;
  /** Ancestor ids, innermost last. A target already on it is a cycle. */
  readonly path: readonly string[];
  readonly query: URLSearchParams;
  readonly headers: Readonly<Record<string, string>>;
  readonly signal: AbortSignal;
}
