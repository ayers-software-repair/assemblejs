#!/usr/bin/env node
// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// Starts the showcase: four servers, each a team's own project, each on its own port. The shop
// is the one to open. Build the four first, as README.md beside this says.
//
//   node start.mjs            start all four
//   node start.mjs shop       start the named ones only, to see a page with a team's server down
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";

const TEAMS = { shop: 4700, catalog: 4701, reviews: 4702, fulfilment: 4703 };
const origin = (team) => `http://127.0.0.1:${TEAMS[team]}`;
// What the shop reads from its environment: where the other teams are, and the key staff sign
// in with at /staff. No key is written anywhere: one from the environment is used, and where
// there is none a key is made for this run and said once, below.
const staffKey = process.env.STAFF_KEY ?? randomBytes(9).toString("base64url");
const environment = {
  CATALOG_ORIGIN: origin("catalog"),
  REVIEWS_ORIGIN: origin("reviews"),
  FULFILMENT_ORIGIN: origin("fulfilment"),
  STAFF_KEY: staffKey,
};

const wanted = process.argv.slice(2);
const started = [];
for (const team of Object.keys(TEAMS)) {
  if (wanted.length > 0 && !wanted.includes(team)) continue;
  const child = spawn(process.execPath, ["dist/server.js"], {
    cwd: fileURLToPath(new URL(`./${team}/`, import.meta.url)),
    env: { ...process.env, ...environment, ASSEMBLEJS_PORT: String(TEAMS[team]) },
    stdio: ["ignore", "inherit", "inherit"],
  });
  child.on("exit", (code) => console.log(`${team} stopped (${String(code)})`));
  started.push(child);
  console.log(`${team}: ${origin(team)}`);
}
if (process.env.STAFF_KEY === undefined && (wanted.length === 0 || wanted.includes("shop"))) {
  console.log(`the staff key for this run, for ${origin("shop")}/staff: ${staffKey}`);
}
const stop = () => {
  for (const child of started) child.kill();
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
