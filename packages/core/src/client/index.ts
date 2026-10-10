// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
/** @module @assemblejs/core/client */
// The browser half of a renderer: its own published entry point.

// The shape browser code receives. Re-exported here rather than reached for through the package
// root, so a renderer's browser half can name what it is handed without importing the server
// surface to do it.
export type { JsonObject } from "../json/json-object.js";
export type { MountMode } from "./mount-mode.js";
export { readMountMode } from "./read-mount-mode.js";
export { readIsland } from "./read-island.js";
export { findEnvelopes } from "./find-envelopes.js";
export { placementDirective } from "./placement-directive.js";
export { scheduleMount } from "./schedule-mount.js";
export { fillDeferred } from "./fill-deferred.js";
export { scheduleFill } from "./schedule-fill.js";
export type { MountedAssembly } from "./mounted-assembly.js";
export type { Runtime } from "./runtime.js";
export type { StartOptions } from "./start-options.js";
export { start } from "./start.js";
export type { StreamSource } from "./stream-source.js";
export { readStreamMessage } from "./read-stream-message.js";
export { readStreamUrl } from "./read-stream-url.js";
export { connectStream } from "./connect-stream.js";
export { openPageStream } from "./open-page-stream.js";
export type { ClientRenderer } from "./client-renderer.js";
export { lazyRenderer } from "./lazy-renderer.js";
export type { MountContext } from "./mount-context.js";
export type { MountHandle } from "./mount-handle.js";
export * from "./events/index.js";
