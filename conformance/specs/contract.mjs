// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// What every spec shares: the server under test, and reading its answers as the contract
// describes them.
export const origin = process.env.CONFORMANCE_ORIGIN ?? "";
if (origin === "") throw new Error("CONFORMANCE_ORIGIN names the server under test");

export const get = (path, headers = {}) => fetch(new URL(path, origin), { headers });

/** The envelope's opening tag's attributes, by name. */
export const attributesOf = (fragment) => {
  const open = /^<assembly-root\b([^>]*)>/.exec(fragment.trim());
  if (open === null) throw new Error(`no envelope: ${fragment.slice(0, 80)}`);
  return Object.fromEntries(
    [...open[1].matchAll(/\s([a-z-]+)="([^"]*)"/g)].map((match) => [match[1], match[2]]),
  );
};

/** The data island inside an envelope, parsed. */
export const islandOf = (fragment) => {
  const script =
    /<script type="application\/json" data-assembly="([^"]+)">([\s\S]*?)<\/script>/.exec(fragment);
  if (script === null) throw new Error("no data island");
  return { id: script[1], payload: JSON.parse(script[2]) };
};
