// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { PageAddresses } from "@asmjs/core";

/** The addresses a config declares, what is wrong with how they are written, and whether they are all. */
export interface DeclaredAddresses {
  readonly addresses: PageAddresses;
  readonly whole: boolean;
  readonly problems: readonly string[];
}
