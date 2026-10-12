// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

// The flags that are given a value, and the switches, which are given none.
const VALUED = new Set(["cwd", "renderer"]);
const SWITCHES = new Set(["help", "version"]);
const SHORT: Readonly<Record<string, string>> = { "-h": "help", "-v": "version" };

/**
 * A command line's arguments, read: the words in order, and each flag with its value. A flag's
 * value is written after it, `--cwd shop`, or with it, `--cwd=shop`; a switch has none, so the
 * word after one is a word. What cannot be read is said, as `problem`, and nothing is guessed:
 * a flag nobody knows, a flag left without its value, a switch handed one. A flag kept in
 * silence would take the word after it for its value, and the command would run without both.
 */
export function readArguments(argv: readonly string[]): {
  readonly positional: readonly string[];
  readonly flags: ReadonlyMap<string, string>;
  readonly problem?: string;
} {
  const positional: string[] = [];
  const flags = new Map<string, string>();
  const refused = (problem: string) => ({ positional, flags, problem });
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index] as string;
    if (!argument.startsWith("-") || argument === "-") {
      positional.push(argument);
      continue;
    }
    if (!argument.startsWith("--")) {
      const name = SHORT[argument];
      if (name === undefined) return refused(`there is no flag ${argument}`);
      flags.set(name, "");
      continue;
    }
    const equals = argument.indexOf("=");
    const name = argument.slice(2, equals === -1 ? undefined : equals);
    if (SWITCHES.has(name)) {
      if (equals !== -1) return refused(`--${name} takes no value`);
      flags.set(name, "");
      continue;
    }
    if (!VALUED.has(name)) return refused(`there is no flag --${name}`);
    const next = argv[index + 1];
    const value = equals !== -1 ? argument.slice(equals + 1) : next;
    if (value === undefined || value === "" || (equals === -1 && value.startsWith("-"))) {
      return refused(`--${name} needs a value`);
    }
    flags.set(name, value);
    if (equals === -1) index += 1;
  }
  return { positional, flags };
}
