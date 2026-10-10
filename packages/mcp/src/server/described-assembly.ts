// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { AssemblyShape, Written } from "@assemblejs/cli";

/**
 * One assembly as an agent reads it: what it is made of, and each place it stands, with what
 * that place says of it. Where the whole project names the pages and assemblies that place it,
 * this says how each does.
 */
export interface DescribedAssembly extends Omit<AssemblyShape, "placedOn" | "placedIn"> {
  /** Each placement of it on a page: the page, its route, the view, and the page's policy for it. */
  readonly placedOn: readonly {
    readonly page: string;
    readonly route: string;
    readonly view: string;
    readonly policy: Written;
  }[];
  /** Each placement of it in another assembly's view, as far as that view's source says. */
  readonly placedIn: readonly { readonly assembly: string; readonly view: string }[];
}
