// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/** Whether a path is one a route answers: its segments, and a value for each parameter. */
export function addressMatches(route: string, address: string): boolean {
  // The query and fragment are not the path. A backslash, which a browser reads as a slash, is
  // never one: it could lead to another host.
  const wanted = route.split("/");
  const given = (address.split(/[?#]/)[0] ?? "").split("/");
  return (
    !address.includes("\\") &&
    wanted.length === given.length &&
    wanted.every((segment, index) =>
      segment.startsWith(":") ? (given[index] ?? "") !== "" : segment === given[index],
    )
  );
}
