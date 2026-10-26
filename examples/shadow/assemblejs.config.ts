// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineConfig } from "@asmjs/core";

// Where `perf` weighs the page whose route has a parameter.
export default defineConfig({ addresses: { "/item/:sku": "/item/kb-guji-250" } });
