// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { boundedOperation } from "./bounded-operation.js";

export async function runBuiltPreview(runtime, root, records, report, frame, stop) {
  if (!stop) throw new Error("missing preview stop control");
  const controller = new AbortController();
  const ready = runtime.once("server-ready", { signal: controller.signal });
  let server;
  let detach;
  let removeStop;
  try {
    server = await boundedOperation(
      runtime.spawn("node", ["dist/server.js"], {
        cwd: root,
        env: { ASSEMBLEJS_PORT: "3210" },
      }),
      "preview spawn",
    );
    const record = { program: "built preview server", output: "", exit: null };
    records.push(record);
    let phase = "starting preview";
    const reading = server.output.pipeTo(
      new WritableStream({
        write(chunk) {
          record.output = (record.output + chunk).slice(-16000);
          report(phase);
        },
      }),
    );
    const exited = Promise.all([server.exit, reading]).then(([code]) => code);
    const unexpectedExit = exited.then((code) => {
      throw new Error(`preview exited before readiness: ${code}`);
    });
    const [port, url] = await boundedOperation(
      Promise.race([ready, unexpectedExit]),
      "preview ready",
      30000,
    );
    if (port !== 3210 || url !== runtime.previewUrl(port))
      throw new Error("unexpected preview address");
    records.push({ previewUrl: url });
    detach = runtime.attachPreview(frame);
    frame.src = url;
    phase = "server ready";
    stop.disabled = false;
    const stopped = new Promise((resolve) => {
      const onStop = () => resolve();
      stop.addEventListener("click", onStop, { once: true });
      removeStop = () => stop.removeEventListener("click", onStop);
    });
    report(phase);
    await boundedOperation(Promise.race([stopped, unexpectedExit]), "preview exercise", 120000);
    stop.disabled = true;
    server.kill();
    record.exit = await boundedOperation(exited, "preview stop");
    if (record.exit !== 143) throw new Error(`unexpected preview exit ${record.exit}`);
    records.push({ stoppedServerExit: record.exit });
  } finally {
    detach?.();
    removeStop?.();
    server?.kill();
    controller.abort();
    await Promise.allSettled([ready]);
  }
}
