// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { SEGMENT_PATTERN } from "./segment-pattern.js";

/**
 * Whether one whole string is a segment (`SEGMENT_PATTERN`, anchored at both ends). The one
 * test every reader of a name or view applies: the directive finder, boot, the content url
 * parser, and every Slot. Three copies of it drifted apart once; this is the one.
 */
export const SEGMENT = new RegExp(`^${SEGMENT_PATTERN}$`);
