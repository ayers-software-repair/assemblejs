// Copyright Ayers Electronics Inc. All rights reserved.
//
// Conventional Commits, the node half: commitlint's config-conventional brought to the one rule
// codestyle/scripts/check-conventional.sh states in its header. A repo with node points its own
// commitlint.config at this file; the repos without node call the script. assemblejs runs every
// fixture through both and holds the two to one verdict.
//
// What differs from commitlint's defaults, each to match the script:
//   - only a message git itself writes is left unjudged: a merge, a revert or a reapply in git's
//     own quoted form, and an autosquash marker. commitlint's wider defaults (any "Revert ...", a
//     bare version, other tools' merge lines) are off.
//   - an empty scope, feat(): or feat( ):, is refused.
//   - the length of the lines after the header is read the script's way, in place of commitlint's
//     body and footer rules: a line that begins with # is a comment, git's scissors line ends the
//     message, and a line holding a URL may run long.
const MAX = 100;
const SCISSORS = "# ------------------------ >8 ------------------------";
const GIT_OWN =
  /^(Merge (branch(es)?|tags?|commits?|remote-tracking branch(es)?|pull request) .+|(Revert|Reapply) ".+"|(fixup|squash|amend)! .+)$/;

/** The lines after the header that are part of the message: none from the scissors line on, and no comment. */
function linesAfterHeader(raw) {
  const rest = (raw ?? "").split(/\r?\n/).slice(1);
  const end = rest.indexOf(SCISSORS);
  return (end < 0 ? rest : rest.slice(0, end)).filter((line) => !line.startsWith("#"));
}

export default {
  extends: ["@commitlint/config-conventional"],
  defaultIgnores: false,
  ignores: [(message) => GIT_OWN.test(message.split(/\r?\n/, 1)[0])],
  plugins: [
    {
      rules: {
        "scope-not-blank": ({ header }) => [!/^\w+\(\s*\)/.test(header ?? ""), "scope must not be empty parentheses"],
        "line-max-length": ({ raw }) => [
          linesAfterHeader(raw).every((line) => line.length <= MAX || /https?:\/\/\S+/.test(line)),
          `a line after the header must not be longer than ${MAX} characters unless it holds a URL`,
        ],
      },
    },
  ],
  rules: {
    "header-max-length": [2, "always", MAX],
    "body-max-line-length": [0],
    "footer-max-line-length": [0],
    "line-max-length": [2, "always"],
    "scope-not-blank": [2, "always"],
  },
};
