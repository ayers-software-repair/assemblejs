// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Which paths are an api's that a browser half may reach through the page's server: `/api`
 * itself, and what is under it, with or without a query. `/apis` and `//api` are not.
 */
export const API_PATH = /^\/api(?:[/?]|$)/;
