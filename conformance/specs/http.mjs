// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// What every spec shares: the server under test, and reading its answers as the contract
// describes them.
export const origin = process.env.CONFORMANCE_ORIGIN ?? "";
if (origin === "") throw new Error("CONFORMANCE_ORIGIN names the server under test");

export const get = (path, headers = {}) => fetch(new URL(path, origin), { headers });

// Every attribute of an opening tag, a valueless one too, which reads as the empty string.
const ATTRIBUTE = /\s([^\s=/>"']+)(?:="([^"]*)")?/g;
const readAttributes = (source) =>
  Object.fromEntries([...source.matchAll(ATTRIBUTE)].map((match) => [match[1], match[2] ?? ""]));

/** The envelope's opening tag's attributes, by name. */
export const attributesOf = (fragment) => {
  const open = /^<assembly-root\b([^>]*)>/.exec(fragment.trim());
  if (open === null) throw new Error(`no envelope: ${fragment.slice(0, 80)}`);
  return readAttributes(open[1]);
};

/** Every envelope in a page, in document order, with its attributes and what it holds. */
export const envelopesOf = (page) =>
  [...page.matchAll(/<assembly-root\b([^>]*)>([\s\S]*?)<\/assembly-root>/g)].map((match) => ({
    attributes: readAttributes(match[1]),
    inner: match[2],
  }));

/** The data island inside an envelope, parsed. */
export const islandOf = (fragment) => {
  const script =
    /<script type="application\/json" data-assembly="([^"]+)">([\s\S]*?)<\/script>/.exec(fragment);
  if (script === null) throw new Error("no data island");
  return { id: script[1], payload: JSON.parse(script[2]) };
};
