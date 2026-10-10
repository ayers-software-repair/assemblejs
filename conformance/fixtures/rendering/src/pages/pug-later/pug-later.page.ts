// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { definePage } from "@assemblejs/core";

// Nothing on this page runs in the browser but the child its Pug view places, so a deferral
// stands only if that view's source was read.
export default definePage({ place: { "pug-nest": { defer: true } } });
