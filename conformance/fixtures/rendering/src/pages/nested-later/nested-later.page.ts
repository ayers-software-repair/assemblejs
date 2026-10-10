// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { definePage } from "@assemblejs/core";

// A plain html parent has no browser half; the child its view places has one.
export default definePage({ place: { "html-nest": { defer: true } } });
