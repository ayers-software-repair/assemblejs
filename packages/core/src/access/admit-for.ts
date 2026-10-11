// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { Admission } from "../compose/admission.js";
import type { Admit } from "../compose/admit.js";
import { identity } from "../compose/identity.js";
import type { LogLine } from "../failure/log-line.js";
import { newCorrelationId } from "../failure/new-correlation-id.js";
import { ASSEMBLY_ROUTE_PREFIX } from "../vocab/assembly-route-prefix.js";
import { DEFAULT_VIEW } from "../vocab/default-view.js";
import type { AccessPolicy } from "./access-policy.js";
import type { AccessRequest } from "./access-request.js";
import { checkThrew } from "./check-threw.js";
import { decideAccess } from "./decide-access.js";

/**
 * For one visitor, by what they sent: what asks whether they may be shown a placement of one
 * of this server's assemblies. It is the one decision every request already meets
 * (`decideAccess`), made of the address the assembly answers at, so an assembly is guarded
 * wherever it is placed and by the same rule that guards its own address. Undefined where the
 * server has no control on, since everyone is then let in everywhere.
 *
 * A default view answers at the bare name and under its own, and a visitor either admits is
 * let in. Each assembly and view is decided once for the visitor, however often the request
 * places it. A check that throws refuses, and what it threw is logged against the id the
 * refusal carries.
 */
export function admitFor(
  policy: AccessPolicy,
  sent: AccessRequest["headers"],
  log: (line: LogLine) => void,
): Admit | undefined {
  if (policy.basic === undefined && policy.authenticate === undefined) return undefined;
  const decide = async (name: string, view: string): Promise<Admission> => {
    const addresses = [
      ...(view === DEFAULT_VIEW ? [`${ASSEMBLY_ROUTE_PREFIX}/${name}/`] : []),
      `${ASSEMBLY_ROUTE_PREFIX}/${name}/${view}/`,
    ];
    for (const path of addresses) {
      const broke: { id?: string } = {};
      const request = { method: "GET", path, headers: sent };
      const allowed = await decideAccess(request, policy, (error) => {
        broke.id = newCorrelationId();
        log(checkThrew(broke.id, error));
      });
      if (allowed) return { admitted: true };
      if (broke.id !== undefined) return { admitted: false, correlationId: broke.id };
    }
    return { admitted: false };
  };
  const decided = new Map<string, Promise<Admission>>();
  return (name, view) => {
    const key = identity(name, view);
    const answer = decided.get(key) ?? decide(name, view);
    decided.set(key, answer);
    return answer;
  };
}
