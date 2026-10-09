// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { AssemblyPlan } from "../compose/assembly-plan.js";
import type { Fetch } from "../compose/fetch.js";
import type { RemoteTransport } from "../remote/remote-transport.js";

/**
 * The one transport the composer is given for a page: a placement whose plan names a url goes to
 * the remote transport with that url, and every other one is rendered in this process. Same
 * request, same result type, same deadline either way, so moving an assembly to another server
 * changes a url and nothing else.
 */
export function pageFetch(
  plan: Readonly<Record<string, AssemblyPlan>>,
  local: Fetch,
  remote: RemoteTransport,
): Fetch {
  return (request) => {
    const url = Object.hasOwn(plan, request.name) ? plan[request.name]?.url : undefined;
    return url === undefined ? local(request) : remote.fetch(url, request);
  };
}
