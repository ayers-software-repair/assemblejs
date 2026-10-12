// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { basename, isAbsolute, join, resolve } from "node:path";
import type { Io } from "@assemblejs/build";
import { isDirectory } from "@assemblejs/build";
import { suggestName } from "@assemblejs/build";
import { isOccupied } from "@assemblejs/build";
import { outsideProblems } from "@assemblejs/build";
import { cannotRegister } from "@assemblejs/check";
import { textIn } from "@assemblejs/check";
import { projectInto } from "./project-into.js";
import { PROJECT_NAME } from "./project-name.js";

/**
 * The `new` command: writes the starter into a directory, named for it, and answers the
 * command's exit code. The directory is made where there is none, and `.` is the one the
 * command works in. One that is there already takes the project unless it holds something the
 * starter would write over, which is named and left as it is; what it may hold is
 * `projectInto`'s to say. A name that a file holds, or a link to nothing, is refused as no
 * directory. Nothing is written through a link that leads out of the directory.
 */
export function newProject(directory: string | undefined, cwd: string, io: Io): number {
  if (directory === undefined || directory === "") {
    io.error("new needs a directory: assemblejs new my-app");
    return 2;
  }
  // An absolute directory is where it says; any other is beneath where the command works.
  const root = isAbsolute(directory) ? directory : join(cwd, directory);
  const name = basename(resolve(root));
  if (!PROJECT_NAME.test(name)) {
    io.error(
      `"${name}" cannot name a package; lower case with hyphens: try ${suggestName(name, "my-app")}`,
    );
    return 2;
  }
  // A file of that name, or a link to nothing, holds the place a directory would be made in.
  if (isOccupied(root) && !isDirectory(root)) {
    io.error(`${directory} is there and is not a directory: name another, or move it aside`);
    return 1;
  }
  const manager = (process.env["npm_config_user_agent"] ?? "npm").split("/")[0] ?? "npm";
  const made = projectInto(name, manager, textIn(root), (path) => isOccupied(join(root, path)));
  if ("taken" in made) {
    io.error(
      `${directory} already holds ${made.taken.join(", ")}: a project is made where the starter writes over nothing`,
    );
    return 1;
  }
  if ("unreadable" in made) {
    for (const path of made.unreadable) {
      io.error(`${cannotRegister(path)}: correct it or remove it, then run this again`);
    }
    return 1;
  }
  const leading = outsideProblems(
    root,
    Object.keys(made.files).map((path) => join(root, path)),
  );
  if (leading.length > 0) {
    for (const problem of leading) io.error(`${problem.message}: ${problem.fix}`);
    return 1;
  }
  for (const [path, contents] of Object.entries(made.files)) {
    io.write(join(root, path), contents);
    io.log(`wrote ${join(directory, path)}`);
  }
  const elsewhere = resolve(root) === resolve(cwd) ? "" : `  cd ${directory}\n`;
  io.log(`\n${elsewhere}  ${manager} install\n  ${manager} run dev`);
  return 0;
}
