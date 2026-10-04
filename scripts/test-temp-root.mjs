// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// A vitest global setup every package's suite runs under: the run gets a temporary directory of
// its own, every test's os.tmpdir() lands inside it, and it is removed when the run ends, pass or
// fail. A test makes the files it needs and never has to remember to remove them.
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export default function setup() {
  const root = mkdtempSync(join(tmpdir(), "assemblejs-test-"));
  process.env.TMPDIR = root;
  return () => rmSync(root, { recursive: true, force: true });
}
