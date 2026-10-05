// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

const NAME = /^[A-Za-z_][A-Za-z0-9_]*$/;
const MAX_BYTES = 2048;

/**
 * A page's route parameters read back from the form in which a request header carries them,
 * checked against their declared shape: at most 2048 bytes, each name a route parameter's
 * (`[A-Za-z_][A-Za-z0-9_]*`) and each named once. A value is any text. Malformed is refused
 * with what is wrong, never coerced: a parameter is what a service is given, and one that is
 * not what the page's route named would be read as though it were. The object has no
 * prototype, as the router's own has none, so a parameter named `__proto__` or `constructor`
 * is a key of its own and nothing else.
 */
export function readParams(
  raw: string,
):
  | { readonly ok: true; readonly params: Readonly<Record<string, string>> }
  | { readonly ok: false; readonly detail: string } {
  if (new TextEncoder().encode(raw).length > MAX_BYTES) {
    return { ok: false, detail: `is longer than ${MAX_BYTES} bytes` };
  }
  const params: Record<string, string> = Object.create(null) as Record<string, string>;
  for (const [name, value] of new URLSearchParams(raw)) {
    if (!NAME.test(name)) return { ok: false, detail: `names "${name}", which is not a parameter` };
    if (Object.hasOwn(params, name)) return { ok: false, detail: `names "${name}" twice` };
    params[name] = value;
  }
  return { ok: true, params };
}
