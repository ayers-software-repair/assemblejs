// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { ApiReply } from "./api-reply.js";
import { REPLY_MARK } from "./reply-mark.js";

/** Whether an api's answer was made by `reply`. */
export function isReply(value: unknown): value is ApiReply {
  return typeof value === "object" && value !== null && REPLY_MARK in value;
}
