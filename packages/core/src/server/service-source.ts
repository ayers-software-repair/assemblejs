// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/** How a service is named when a schema problem has to say who declared a field. */
export function serviceSource(name: string): string {
  return `service "${name}"`;
}
