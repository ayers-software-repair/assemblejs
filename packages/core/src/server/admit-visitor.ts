// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { Admit } from "../compose/admit.js";

/**
 * How a route asks, for the visitor of one request, whether that visitor may be shown a
 * placement of one of this server's assemblies: made from what the visitor sent, once a
 * request. Undefined where the server has no control on, since everyone is then let in.
 */
export type AdmitVisitor = (
  sent: Readonly<Record<string, string | undefined>>,
) => Admit | undefined;
