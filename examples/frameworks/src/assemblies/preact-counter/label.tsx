// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

// A component with no framework in its name: it compiles as Preact because its assembly is one.
export function Label({ count }: { readonly count: number }) {
  return <>preact {count}</>;
}
