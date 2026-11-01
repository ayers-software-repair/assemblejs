// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { callProjectTool } from "./call-project-tool.js";
import { readProjectVersion } from "./read-project-version.js";

/** Explain one actual finding; observations are not atomic lesson or hydration proof. */
export async function explainProjectCheck(client, current) {
  const unavailable =
    "Check guidance could not be confirmed. Inspect the actual project diagnostics and ask again.";
  const short = (text) => (text.length > 240 ? text.slice(0, 237) + "..." : text);
  const bounded = (value, limit) =>
    typeof value === "string" && value.length > 0 && value.length <= limit;
  try {
    if (!current()) return "";
    const version = await readProjectVersion(client);
    if (!current()) return "";
    const checked = await callProjectTool(client, "check");
    if (!current()) return "";
    const findings = checked.result?.findings;
    if (
      !Array.isArray(findings) ||
      findings.length > 1000 ||
      checked.problems.length !== findings.length ||
      checked.ok !== (findings.length === 0) ||
      !findings.every(
        (finding) =>
          bounded(finding?.path, 10000) &&
          bounded(finding?.rule, 100) &&
          bounded(finding?.message, 10000) &&
          typeof finding?.fix === "string" &&
          finding.fix.length <= 10000,
      )
    )
      return unavailable;
    let text = `Project check passed at observed revision ${version}. Preview and lesson completion are not verified here.`;
    if (findings.length) {
      const finding = findings[0];
      let reason =
        "No authored explanation was confirmed for this rule. Keep its actual diagnostic.";
      try {
        const guidance = await callProjectTool(client, "explain", { id: finding.rule });
        if (!current()) return "";
        const rule = guidance.result;
        if (
          guidance.ok &&
          guidance.problems.length === 0 &&
          rule?.id === finding.rule &&
          ["rule", "because", "smell"].every((key) => bounded(rule[key], 10000))
        )
          reason = `Why: ${short(rule.because)}`;
      } catch {
        // The actual finding survives an unavailable or malformed explanation.
      }
      text = `Observed revision ${version}: ${findings.length} finding${findings.length === 1 ? "" : "s"}. First: ${short(finding.path)}: ${short(finding.message)} (${finding.rule}). Fix: ${short(finding.fix) || "No fix supplied."} ${reason}`;
    }
    if (!current()) return "";
    const after = await readProjectVersion(client);
    if (!current()) return "";
    if (after !== version)
      return "Saved source changed while reading check guidance. Ask again for the current project.";
    return text;
  } catch {
    return unavailable;
  }
}
