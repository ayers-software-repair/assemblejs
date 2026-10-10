// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { definePage } from "@assemblejs/core";

// The page does not wait for the plain html assembly, nor for the twelve it holds: the browser
// fetches all thirteen in one answer once the page has loaded. The page links ahead what each of
// them needs, from what their views are known to place.
export default definePage({ place: { "html-shell": { defer: true } } });
