// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// One encoder per position, and the position decides which. Nothing crosses into markup
// without passing through one of these.

export { escapeText } from "./escape-text.js";
export { escapeAttribute } from "./escape-attribute.js";
export { encodeIslandJson } from "./encode-island-json.js";
