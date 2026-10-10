// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { ENVELOPE_ELEMENT } from "../vocab/envelope-element.js";

// An envelope's start tag carrying the attribute a fallback is marked with. An attribute value
// never holds a raw ">", so the tag is everything up to the first one.
const FAILED = new RegExp(`<${ENVELOPE_ELEMENT}\\s[^>]*\\sdata-failed=`, "i");

/**
 * Whether markup holds an envelope marked failed: a placement somewhere inside it was answered
 * by a fallback. Read from the markup, never from an account of how it was composed, because
 * the markup is what both transports hand back: another server's answer says nothing of its
 * own children except what is in its html.
 */
export function holdsFailedEnvelope(html: string): boolean {
  return FAILED.test(html);
}
