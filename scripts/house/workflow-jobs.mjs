// Copyright Ayers Electronics Inc. All rights reserved.
// Reads a workflow's text the way a product's own workflow tests need it: each job's body by its
// id, every line where a workflow reads the platform pin or checks platform out itself, which only
// the platform-checkout action may do, and every way a workflow's jobs fall short of the rule that
// one failed job cancels the whole run.
import vm from "node:vm";

/** Each job's body under `jobs:`, keyed by its id, comment lines left out. */
export function jobsOf(text) {
  const jobs = new Map();
  let inJobs = false;
  let current = null;
  for (const line of text.split("\n")) {
    if (/^\s*#/.test(line)) continue;
    if (/^\S/.test(line)) {
      inJobs = line.startsWith("jobs:");
      current = null;
      continue;
    }
    const id = inJobs && line.match(/^ {2}([A-Za-z0-9_-]+):\s*$/);
    if (id) {
      current = id[1];
      jobs.set(current, []);
    } else if (current) {
      jobs.get(current).push(line);
    }
  }
  return new Map([...jobs].map(([id, lines]) => [id, lines.join("\n")]));
}

/** An inline or folded if at the given indentation, without its expression wrapper. */
export function conditionOf(body, indent = 4) {
  const lines = body.split("\n");
  const start = lines.findIndex((line) => line.startsWith(`${" ".repeat(indent)}if: `));
  if (start < 0) throw new Error("Missing workflow condition");
  let condition = lines[start].slice(indent + 4).trim();
  if (condition === ">-" || condition === ">") {
    const folded = [];
    for (const line of lines.slice(start + 1)) {
      if (!line.trim() || line.trimStart().startsWith("#")) continue;
      if (line.search(/\S/) <= indent) break;
      folded.push(line.trim());
    }
    condition = folded.join(" ");
  }
  if (condition.startsWith("${{")) {
    if (!condition.endsWith("}}")) throw new Error("Unclosed workflow expression");
    condition = condition.slice(3, -2).trim();
  }
  if (!condition) throw new Error("Empty workflow condition");
  return condition;
}

/** Evaluates boolean predicates with string/Boolean references, comparisons and status functions.
 * A dotted property name may contain hyphens, as GitHub's context syntax allows.
 * Unsupported expressions throw; missing fixture values throw only when their reference is reached. */
export function evaluateCondition(
  expression,
  context,
  { failure = false, cancelled = false, success = !failure && !cancelled } = {},
) {
  const token =
    /\s+|'[^'\\]*'|(?:success|failure|cancelled|always)\s*\(\s*\)|[A-Za-z_]\w*(?:\.[A-Za-z_][\w-]*|\['[A-Za-z0-9_-]+'\])*|&&|\|\||==|!=|[!()]/gy;
  const status = { success, failure, cancelled, always: true };
  if (Object.values(status).some((value) => typeof value !== "boolean"))
    throw new Error("Status fixtures must be Boolean");
  let code = "";
  let at = 0;
  let hasStatus = false;
  let expectsOperand = true;
  let depth = 0;
  while (at < expression.length) {
    token.lastIndex = at;
    const match = token.exec(expression);
    if (!match) throw new Error(`Unsupported workflow expression at ${at}`);
    const word = match[0];
    at = token.lastIndex;
    if (/^\s+$/.test(word)) continue;
    if (word === "!" || word === "(") {
      if (!expectsOperand) throw new Error(`Unsupported workflow expression at ${match.index}`);
      if (word === "(") depth++;
      code += word;
      continue;
    }
    if (word === ")") {
      if (expectsOperand || --depth < 0) throw new Error(`Unsupported workflow expression at ${match.index}`);
      code += word;
      continue;
    }
    if (["&&", "||", "==", "!="].includes(word)) {
      if (expectsOperand) throw new Error(`Unsupported workflow expression at ${match.index}`);
      expectsOperand = true;
      code += word;
      continue;
    }
    if (!expectsOperand) throw new Error(`Unsupported workflow expression at ${match.index}`);
    expectsOperand = false;
    if (word.startsWith("'")) {
      code += JSON.stringify(word.slice(1, -1).toLowerCase());
      continue;
    }
    if (word === "true" || word === "false") {
      code += word;
      continue;
    }
    if (word.endsWith(")")) {
      hasStatus = true;
      code += JSON.stringify(status[word.slice(0, word.indexOf("(")).trim()]);
      continue;
    }
    const keys = word.match(/[A-Za-z0-9_-]+/g);
    if (keys.some((key) => ["__proto__", "prototype", "constructor"].includes(key)))
      throw new Error(`Missing workflow fixture: ${word}`);
    let value = context;
    let fixtureError;
    for (const key of keys) {
      if (value === null || typeof value !== "object" || !Object.hasOwn(value, key)) {
        fixtureError = `Missing workflow fixture: ${word}`;
        break;
      }
      value = value[key];
    }
    if (!fixtureError && typeof value !== "string" && typeof value !== "boolean")
      fixtureError = `Unsupported fixture: ${word}`;
    code += fixtureError
      ? `(() => { throw new Error(${JSON.stringify(fixtureError)}); })()`
      : JSON.stringify(typeof value === "string" ? value.toLowerCase() : value);
  }
  if (expectsOperand || depth !== 0) throw new Error("Unsupported workflow expression");
  const result = vm.runInNewContext(`(${code})`, Object.create(null), { timeout: 100 });
  if (typeof result !== "boolean") throw new Error("Workflow condition must yield a Boolean");
  return (hasStatus || success) && result;
}

/** The 1-based lines of a workflow that read src/Tray/go.mod or name the platform repository. */
export function inlinedCheckouts(text) {
  const found = [];
  text.split("\n").forEach((line, i) => {
    if (/^\s*#/.test(line)) return;
    if (line.includes("src/Tray/go.mod") || /repository:\s*ayers-software-repair\/platform\b/.test(line)) {
      found.push(i + 1);
    }
  });
  return found;
}

/**
 * Each way a workflow breaks the rule that one failed job cancels the whole run, through a
 * stop-after-<job> job of its own that calls platform's cancel-failed-run.yml at a tag (a local copy
 * does not count): a job with no such partner, a
 * partner that fires on anything but its job's failure, cancellation access given to a job that
 * builds, and anything that lets a run go on past a failure.
 */
export function stopJobFaults(text) {
  const faults = [];
  if (/fail-fast: false|continue-on-error: true/.test(text)) faults.push("a job is allowed to go on past a failure");
  const jobs = jobsOf(text);
  for (const [job, body] of jobs) {
    if (/^ {4}if:.*always\(\)/m.test(body)) faults.push(`${job} runs through a cancelled run`);
    if (job.startsWith("stop-after-")) continue;
    if (/actions: write/.test(body)) faults.push(`${job} builds and may cancel runs`);
    const stop = jobs.get(`stop-after-${job}`);
    if (!stop) {
      faults.push(`${job} has no stop-after-${job}`);
      continue;
    }
    if (!stop.includes(`needs: ${job}\n`)) faults.push(`stop-after-${job} does not wait on ${job}`);
    const cancel =
      /uses: ayers-software-repair\/platform\/\.github\/workflows\/cancel-failed-run\.yml@v\d+\.\d+\.\d+$/m;
    if (!cancel.test(stop)) faults.push(`stop-after-${job} does not call platform's cancel-failed-run.yml`);
    if (!/permissions:\n {6}actions: write/.test(stop)) faults.push(`stop-after-${job} cannot cancel the run`);
    const condition = stop.match(/if: \$\{\{ (.*) \}\}/)?.[1].replace(`needs.${job}.result`, "result");
    if (!condition) {
      faults.push(`stop-after-${job} has no condition`);
      continue;
    }
    for (const result of ["success", "skipped", "cancelled", "failure"]) {
      for (const cancelled of [false, true]) {
        const fires = vm.runInNewContext(condition, { result, failure: () => true, cancelled: () => cancelled });
        if (fires !== (result === "failure" && !cancelled))
          faults.push(
            `stop-after-${job} is wrong when ${job} is ${result}${cancelled ? " and the run is cancelled" : ""}`,
          );
      }
    }
  }
  return faults;
}
