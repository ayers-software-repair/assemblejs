// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

const CLIENT = /(^|\/)renderer-[a-z]+\/client$/;

/**
 * Whether an import names a renderer's browser entry, where a view's slot comes from:
 * `@assemblejs/renderer-react/client` and the like, whatever scope the package is published in.
 */
export function isRendererClient(specifier: string): boolean {
  return CLIENT.test(specifier);
}
