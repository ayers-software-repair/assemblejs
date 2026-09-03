// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// The wire format of the server-to-browser boundary. Both sides read this directory: the
// server writes the island, the browser parses it. It holds shapes only, never behaviour.

export type { IslandPayload } from "./island-payload.js";
