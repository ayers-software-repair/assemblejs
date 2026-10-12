// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Where `dev` records the url its server listens on, under the project's root, for as long as
 * that server runs: written when the server says it is listening, removed when dev stops it.
 * The agent surface reads it to ask the running server for what only the project's own code
 * renders (DESIGN 13.4). A stale record from a dev that died is told apart by asking the url.
 */
export const DEV_RECORD = ".assemblejs/dev.json";
