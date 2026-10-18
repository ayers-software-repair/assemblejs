// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { ApiReply } from "./api-reply.js";
import { REPLY_MARK } from "./reply-mark.js";

/**
 * An answer with a status, headers, cookies and a body, each as given; with nothing given it
 * is a `200` with no body. `reply.redirect(location, status)` sends the caller to another
 * address, `303` by default so a form that posted lands on a page.
 */
export function reply(options: Partial<ApiReply> = {}): ApiReply {
  const made = {
    status: options.status ?? 200,
    headers: options.headers ?? {},
    cookies: options.cookies ?? {},
    ...(options.body === undefined ? {} : { body: options.body }),
    [REPLY_MARK]: true,
  };
  return made;
}

reply.redirect = (location: string, status = 303): ApiReply =>
  reply({ status, headers: { location } });
