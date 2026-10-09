// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/** The media type a content-type header names, lower case and without its parameters. */
export function mediaType(header: string | null): string {
  return (header ?? "").split(";")[0]?.trim().toLowerCase() ?? "";
}
