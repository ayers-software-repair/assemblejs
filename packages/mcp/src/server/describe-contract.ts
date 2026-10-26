// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import {
  ASSEMBLY_ROUTE_PREFIX,
  COMPOSITION_HEADER,
  CONTRACT_VERSION,
  DEFAULT_VIEW,
  ENVELOPE_ATTRIBUTE,
  ENVELOPE_ELEMENT,
  FALLBACK_ATTRIBUTE,
  ISLAND_ATTRIBUTE,
  ISLAND_SCRIPT_TYPE,
  PLACEMENT_ELEMENT,
  RESPONSE_HEADER,
} from "@asmjs/core";
import type { DescribedContract } from "./described-contract.js";

/**
 * The contract, built from the names core's server writes it from, so it cannot drift from what a
 * server sends: a header or an attribute renamed there is renamed here in the same build. The
 * meanings are this surface's sentences; a spec holds every name to a real server's answers.
 */
export function describeContract(): DescribedContract {
  const at = `${ASSEMBLY_ROUTE_PREFIX}/{name}/{view}`;
  return {
    contract: CONTRACT_VERSION,
    prefix: ASSEMBLY_ROUTE_PREFIX,
    defaultView: DEFAULT_VIEW,
    endpoints: [
      {
        name: "content",
        method: "GET",
        path: `${at}/ (or ${ASSEMBLY_ROUTE_PREFIX}/{name}/ for the default view)`,
        answers: `200, text/html; charset=utf-8, a fragment that is exactly one element: the envelope, holding the assembly's markup and its data island, with every child its view places composed inside it.`,
        refuses: `500 with the assembly's fallback envelope marked ${ENVELOPE_ATTRIBUTE.failed} when the render or a service fails or the answer is over the server's limit on bytes; 400 for a composition header that does not fit its shape or a path that already holds this assembly; 404 for an assembly or a view the server has not.`,
      },
      {
        name: "data",
        method: "GET",
        path: `${at}/api/`,
        answers:
          "200, application/json: exactly the object the content endpoint put in the island for the same request, from the same services.",
        refuses: "500 with a correlation id and no partial data when a service throws.",
      },
      {
        name: "manifest",
        method: "GET",
        path: `${at}/manifest/`,
        answers: "200, application/json: the fields below, each named, nothing copied wholesale.",
        refuses: "404 for an assembly or a view the server has not.",
      },
    ],
    requestHeaders: [
      {
        name: COMPOSITION_HEADER.page,
        meaning:
          "The id of the page being composed. Present means the answer is a fragment of a page; absent means it is the page.",
        shape: "one uuid",
      },
      {
        name: COMPOSITION_HEADER.id,
        meaning:
          "The id this instance stamps on its envelope, allocated by the parent so it can address the result before it arrives.",
        shape: "one uuid",
      },
      {
        name: COMPOSITION_HEADER.depth,
        meaning: "How many assemblies deep this request is; a server refuses above its cap.",
        shape: "a whole number within the server's cap",
      },
      {
        name: COMPOSITION_HEADER.path,
        meaning:
          "The ancestors' identities, innermost last, so a cycle is refused before anything is dispatched.",
        shape: "comma-separated name/view identities, at most the cap",
      },
      {
        name: COMPOSITION_HEADER.params,
        meaning:
          "The page's route parameters for the services this fragment runs; absent means none.",
        shape: "form-encoded, at most 2048 bytes, each name [A-Za-z_][A-Za-z0-9_]* and named once",
      },
    ],
    responseHeaders: [
      {
        name: RESPONSE_HEADER.version,
        meaning:
          "The version of this assembly's output, from its manifest; a parent holding assets for another version discards them.",
      },
      {
        name: RESPONSE_HEADER.name,
        meaning: "The assembly served, so a proxy or a mistake is visible.",
      },
    ],
    manifest: [
      { name: "contract", meaning: "The version of this contract, an integer." },
      { name: "name", meaning: "The assembly's name." },
      { name: "view", meaning: "The view this manifest is for." },
      {
        name: "version",
        meaning:
          "The version of this assembly's output, an opaque string, for skew during a rolling deploy.",
      },
      { name: "views", meaning: "Every view the assembly has." },
      { name: "renderer", meaning: "The renderer this view is written for." },
      {
        name: "assets",
        meaning:
          "The files a page links for this view: css and js, each a list of urls; empty css for an assembly in its own shadow root, which links its own.",
      },
      { name: "public", meaning: "Whether the assembly may be composed by another server." },
    ],
    envelope: {
      element: ENVELOPE_ELEMENT,
      always: [
        { name: ENVELOPE_ATTRIBUTE.name, meaning: "The assembly's name." },
        {
          name: ENVELOPE_ATTRIBUTE.id,
          meaning: "This instance's id, the one the request carried or one the server made.",
        },
        { name: ENVELOPE_ATTRIBUTE.view, meaning: "The view rendered." },
        {
          name: ENVELOPE_ATTRIBUTE.renderer,
          meaning: "The renderer that rendered it, which the page's runtime mounts it by.",
        },
      ],
      whenTheyApply: [
        {
          name: ENVELOPE_ATTRIBUTE.remote,
          meaning: "The origin the assembly came from, when another server answered it.",
        },
        {
          name: ENVELOPE_ATTRIBUTE.defer,
          meaning: "The content has not been fetched yet; the browser fills it.",
        },
        {
          name: ENVELOPE_ATTRIBUTE.params,
          meaning:
            "On a deferred envelope, the page's route parameters for the fetch that fills it.",
        },
        {
          name: ENVELOPE_ATTRIBUTE.failed,
          meaning:
            "The render or the fetch failed and this is a fallback; the value is the correlation id the failure is logged against.",
        },
        {
          name: ENVELOPE_ATTRIBUTE.mount,
          meaning: "When the browser half runs, when it is not the default.",
        },
      ],
      island: { element: "script", type: ISLAND_SCRIPT_TYPE, attribute: ISLAND_ATTRIBUTE },
      fallback: {
        name: FALLBACK_ATTRIBUTE,
        meaning:
          "On a template inside a deferred envelope: the fallback the page declared, inert, for the browser to show should the fetch fail.",
      },
      directive: {
        name: PLACEMENT_ELEMENT,
        meaning: `What a page template or a view writes to place an assembly, <${PLACEMENT_ELEMENT} name="..."></${PLACEMENT_ELEMENT}>; the server replaces it and it is never sent.`,
      },
    },
  };
}
