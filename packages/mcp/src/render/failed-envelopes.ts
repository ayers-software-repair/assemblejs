// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { readElements } from "@assemblejs/check";
import { ENVELOPE_ATTRIBUTE, ENVELOPE_ELEMENT } from "@assemblejs/core";

/**
 * The envelopes in markup that are marked failed, in the order they stand: each one's assembly
 * and the id its failure is logged against on the server that wrote it. A server's account of
 * what fell back inside its answer is in its own log; its markup is where another reader finds
 * that anything did, and by what id.
 */
export function failedEnvelopes(
  html: string,
): readonly { readonly name: string; readonly id: string }[] {
  return readElements(html).flatMap(({ tag, attributes }) => {
    const id = attributes.get(ENVELOPE_ATTRIBUTE.failed);
    if (tag !== ENVELOPE_ELEMENT || id === undefined) return [];
    const name = attributes.get(ENVELOPE_ATTRIBUTE.name);
    return [{ name: typeof name === "string" ? name : "", id: typeof id === "string" ? id : "" }];
  });
}
