// Copyright Ayers Electronics Inc. All rights reserved.
// Measurements come from the job filesystem, never from declared versions or receipt hashes.
import { realpath } from "node:fs/promises";
import { isAbsolute, resolve } from "node:path";
import process from "node:process";
import { checkout } from "./ci-execution-inputs-checkout.mjs";
import { executable, fileHash, measurePath } from "./ci-execution-inputs-filesystem.mjs";
import { digest, equal, requireValue, validatePlan, validateReceipt, within } from "./ci-execution-inputs-schema.mjs";

export {
  digest,
  equal,
  exactKeys,
  hash,
  requireValue,
  sha,
  validatePlan,
  validateReceipt,
} from "./ci-execution-inputs-schema.mjs";
export { measurePath } from "./ci-execution-inputs-filesystem.mjs";

/** The pinned action calls this immediately before checks, after trusted setup has finished. */
export async function recordExecutionInputs(plan, context, { workspace, env = process.env } = {}) {
  validatePlan(plan);
  requireValue(isAbsolute(workspace ?? ""), "Missing execution workspace");
  const pathOf = (value) => resolve(workspace, value);
  const git = await executable("git", env);
  requireValue(
    plan.tools.some((item) => item.command === "git"),
    "Git measurement is required",
  );
  const coverage = await Promise.all(
    [...plan.tools.map((item) => item.root), ...plan.inputs.map((item) => item.path)].map((path) =>
      realpath(pathOf(path)),
    ),
  );
  const checkoutRoots = await Promise.all(plan.checkouts.map((item) => realpath(pathOf(item.path))));
  requireValue(new Set(checkoutRoots).size === checkoutRoots.length, "Duplicate checkout roots");
  const checkouts = [];
  for (const item of plan.checkouts)
    checkouts.push({
      name: item.name,
      ...(await checkout(pathOf(item.path), git, coverage, checkoutRoots)),
    });
  const tools = [];
  for (const item of plan.tools) {
    const path = await executable(item.command, env),
      root = await realpath(pathOf(item.root));
    requireValue(within(root, path), "Resolved executable is outside its measured closure");
    tools.push({
      name: item.name,
      command: item.command,
      executable: path,
      executableHash: await fileHash(path),
      closure: await measurePath(root),
    });
  }
  const inputs = [];
  for (const item of plan.inputs) inputs.push({ name: item.name, ...(await measurePath(pathOf(item.path))) });
  const environment = plan.environment.map((name) => {
    requireValue(Object.hasOwn(env, name), `Missing configuration: ${name}`);
    return { name, value: env[name] };
  });
  for (let index = 0; index < plan.checkouts.length; index++)
    requireValue(
      equal(checkouts[index], {
        name: plan.checkouts[index].name,
        ...(await checkout(pathOf(plan.checkouts[index].path), git, coverage, checkoutRoots)),
      }),
      "Checkout changed during measurement",
    );
  const receipt = {
    schema: 2,
    context,
    planHash: digest(JSON.stringify(plan)),
    runtime: {
      executable: await realpath(process.execPath),
      executableHash: await fileHash(process.execPath),
    },
    checkouts,
    tools,
    inputs,
    environment,
  };
  validateReceipt(receipt, plan);
  requireValue(
    checkouts.find((item) => item.name === "source").sha === context.testedSha,
    "Measured checkout differs from execution source",
  );
  return receipt;
}
