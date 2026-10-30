// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
/* global document, location */
import sdk from "@stackblitz/sdk";

const status = document.querySelector("#status");
const result = document.querySelector("#result");
const edit = document.querySelector("#edit");
const stop = document.querySelector("#stop");
if (!status || !result || !edit || !stop) throw new Error("incomplete embed fixture");
let vm;
let latest = {};
let edited = false;
let failed = false;
const show = (phase) => {
  status.textContent = phase;
  result.textContent = JSON.stringify({ ...latest, edited });
};
const fail = (error) => {
  failed = true;
  latest = { ...latest, failure: String(error) };
  show("failed");
};

edit.addEventListener("click", async () => {
  try {
    edit.disabled = true;
    const path = "academy-sdk/src/assemblies/react-probe/react-probe.react.tsx";
    const files = await vm.getFsSnapshot();
    const before = files[path];
    if (typeof before !== "string" || !before.includes("<p>react-probe "))
      throw new Error("generated source is absent from SDK snapshot");
    const after = before.replace("<p>react-probe ", "<p>Edited SDK assembly ");
    await vm.applyFsDiff({ create: { [path]: after }, destroy: [] });
    const saved = await vm.getFsSnapshot();
    if (saved[path] !== after) throw new Error("SDK did not retain edited source");
    edited = true;
    show("ready");
  } catch (error) {
    fail(error);
  }
});
stop.addEventListener("click", async () => {
  try {
    stop.disabled = true;
    await vm.applyFsDiff({ create: { "probe-control.json": '{"action":"stop"}' }, destroy: [] });
  } catch (error) {
    fail(error);
  }
});

try {
  show("embedding");
  const script = await (await fetch("/project-probe.mjs")).text();
  vm = await sdk.embedProject(
    "embed",
    {
      title: "AssembleJS public SDK research",
      description: "Ephemeral compatibility proof; no saving or account.",
      template: "node",
      files: {
        "package.json": JSON.stringify({
          name: "assemblejs-sdk-research",
          private: true,
          type: "module",
          scripts: { start: "node project-probe.mjs" },
        }),
        "project-probe.mjs": script,
        "probe-result.json": '{"phase":"starting","records":[]}',
        "probe-control.json": '{"action":"run"}',
        "probe-parent.json": JSON.stringify({ origin: location.origin }),
      },
    },
    {
      startScript: "start",
      openFile: "project-probe.mjs",
      height: 700,
      showSidebar: true,
      clickToLoad: false,
      crossOriginIsolated: true,
    },
  );
  stop.disabled = false;
  const deadline = Date.now() + 300000;
  while (!failed && Date.now() < deadline) {
    const snapshot = await vm.getFsSnapshot();
    const raw = snapshot["probe-result.json"];
    if (typeof raw !== "string") throw new Error("SDK snapshot has no probe result");
    latest = { ...JSON.parse(raw), previewUrl: await vm.preview.getUrl() };
    show(latest.phase);
    if (latest.phase === "ready" && latest.previewUrl && !edited) edit.disabled = false;
    if (latest.phase === "failed" || latest.phase === "stopped") break;
    await new Promise((done) => setTimeout(done, 1000));
  }
  if (!failed && latest.phase !== "stopped" && latest.phase !== "failed")
    throw new Error("SDK evaluation deadline exceeded");
} catch (error) {
  fail(error);
}
