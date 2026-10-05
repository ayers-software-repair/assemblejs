// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineConfig } from "@assemblejs/core";

// A declared remote, placed by no page: the default policy names it all the same, because it is
// the one other origin a page here is designed to load from.
export default defineConfig({ remotes: [{ origin: process.env.GUARDED_ORIGIN ?? "" }] });
