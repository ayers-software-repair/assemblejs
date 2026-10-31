// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/** UI paths are confined relative names; the real provider still enforces filesystem access. */
export function isWorkspacePath(path) {
  return (
    typeof path === "string" &&
    !path.includes("\\") &&
    !path.includes("\0") &&
    !/^[a-z]:/i.test(path) &&
    !path.split("/").some((part) => ["", ".", ".."].includes(part))
  );
}
