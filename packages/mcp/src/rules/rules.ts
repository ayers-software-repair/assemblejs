// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { Rule } from "./rule.js";

/**
 * What the framework knows, as constraints rather than as prose.
 *
 * This is the difference between a tool surface and an expert one. An agent reading these does
 * not have to infer the design from the API, and does not have to guess which of its habits
 * from another framework transfer.
 */
export const RULES: readonly Rule[] = [
  {
    id: "one-framework-per-assembly",
    rule: "An assembly is written in exactly one UI framework.",
    because:
      "The whole product is that a page carries several frameworks and no developer has to learn a second one. An assembly that mixes two puts the seam inside the unit instead of at its edge, where nothing can compose across it.",
    smell:
      "A view file importing from two framework packages, or a renderer that branches on which one to use.",
  },
  {
    id: "directory-is-an-assembly",
    rule: "A directory under src/assemblies IS an assembly. Nothing registers it.",
    because:
      "A hand-maintained list restating the directory tree is the largest piece of ceremony an author would carry, the thing a new hire gets wrong first, and the one file two people editing different assemblies always conflict in.",
    smell: "Editing src/server.ts to add an assembly, or any array of assemblies in authored code.",
  },
  {
    id: "children-arrive-as-strings",
    rule: "A renderer receives its children already rendered, as strings.",
    because:
      "One conversion, in the caller, is what lets plain HTML nest inside React and React nest inside Markdown. A renderer that fetches its own children can only nest inside renderers that agree with it.",
    smell: "A renderer that takes a child descriptor and renders it itself.",
  },
  {
    id: "nothing-crosses-but-json",
    rule: "Only a named projection of six fields crosses from the server to the browser.",
    because:
      "An object that is spread carries whatever it was given, so the day someone puts the request on the server's context is the day the request reaches the browser. Naming each field means growing the context can never leak a new one.",
    smell:
      "A spread into the island payload, or any field on it that is not id, name, view, renderer, data or deferred.",
  },
  {
    id: "a-renderer-does-not-catch",
    rule: "A renderer throws on failure and never returns its own error markup.",
    because:
      "The composer catches it and the placement falls back. A renderer that returns an error div produces markup that passes every check downstream, so the page looks fine and is wrong.",
    smell:
      "try/catch inside a render function, or a render that returns a string mentioning an error.",
  },
  {
    id: "every-placement-has-a-deadline",
    rule: "Every placement carries a finite deadline and settles independently.",
    because:
      "A page is ready when the slowest placement finishes or times out, never later, and never fails because one of them did. A placement with no deadline is a page that waits on someone else's outage.",
    smell: "Promise.all over placements, or a fetch without a signal and a race.",
  },
  {
    id: "nothing-forwarded-by-default",
    rule: "Nothing is forwarded to an assembly on another server unless that remote declared it.",
    because:
      "Forwarding an incoming authorization header to a third party's origin is a credential leak that looks like a convenience.",
    smell: "Passing the incoming headers object through to an outbound fetch.",
  },
  {
    id: "the-file-name-says-the-framework",
    rule: "A view's extension picks its renderer, and where an extension is shared the filename carries an infix.",
    because:
      "React, Preact and Solid all write .tsx. A file that does not say which is a file whose framework only the configuration knows, and a directory listing should tell you what a page is made of.",
    smell: "A bare cart.tsx, or a config mapping files to frameworks.",
  },
  {
    id: "config-comes-from-the-environment",
    rule: "Configuration is read from the process environment, validated at boot, and refuses to start when it cannot be resolved.",
    because:
      "The predecessor read a bundler's compile-time constants, which are empty in the shipped run path, so every setting took its default forever and the security controls keyed on them could never turn on.",
    smell:
      "import.meta.env in server code, or a setting that silently falls back when its value is unreadable.",
  },
  {
    id: "no-default-credential",
    rule: "A security control that is on without its credential is a boot failure, never a warning.",
    because:
      "A framework that defaults a password ships one password to everybody who installs it.",
    smell: "Any credential with a fallback value.",
  },
  {
    id: "a-directory-is-a-page",
    rule: "A directory under src/pages IS a page: <name>/<name>.html is the page at /<name>, home at /.",
    because:
      "The same reason a directory is an assembly: a route table restating the directory tree is a second place to keep in step, and the one two people adding pages both edit.",
    smell: "A page template with no directory of its own, or a list of routes in authored code.",
  },
  {
    id: "an-api-file-is-an-api",
    rule: "A file src/api/<name>.api.ts default-exports one api, and the name says it is one.",
    because:
      "The build finds apis by their file name. A file that looks like one and is not named like one is left out of the build with nothing saying so.",
    smell: "An api file in another directory, or one whose name has capitals.",
  },
  {
    id: "a-view-needs-its-renderer",
    rule: "A view builds only when its renderer is one the build knows and its package is installed.",
    because:
      "A view the build cannot render would otherwise fail on the first request instead of at build time, where the author is looking.",
    smell:
      "A framework view in a project that does not depend on that framework's renderer package.",
  },
  {
    id: "a-placement-names-an-assembly",
    rule: "Every <assembly name=...> in a page template names an assembly that exists.",
    because:
      "A placement with nothing behind it is a blank space a visitor finds. The server refuses to start rather than serve one, and check says so before it gets that far.",
    smell: "A template placing a name no directory under src/assemblies has.",
  },
  {
    id: "policy-names-a-placement",
    rule: "Policy in a page's declaration is an object per placement its template makes, saying only what the server reads: defer or required, a positive deadline in milliseconds, a cache.",
    because:
      "Policy for a name the template never places, or that is not an object, is read by nothing, and the author believes it applies. A deadline that is not a positive, finite number is one the composer cannot wait for. A deferred placement is filled by the browser after load, so a deadline or a cache on it is read by nothing, one from another server cannot be fetched across origins, and one on a page with no runtime is never filled. The server refuses each at boot; check says so first.",
    smell:
      "A place entry whose name is not in the template or whose value is not an object, a deadline of zero, or defer beside required, a deadline or a cache.",
  },
  {
    id: "a-page-opens-one-stream",
    rule: "A page's stream is the path of one of this server's streaming apis, without parameters, on a page that places an assembly of this server's with a browser half.",
    because:
      "The page's own runtime opens the stream, by the path as written, and is on the page only for a local assembly that runs in the browser. A stream nothing would open, or a path that is no stream, is a page waiting for messages that never come. The server refuses it at boot; check says so first.",
    smell:
      "A stream naming a data api or a path with :parameters, or a page of static views alone.",
  },
  {
    id: "the-server-file-never-grows",
    rule: "src/server.ts hands createServer the generated project and does nothing else.",
    because:
      "Everything the server serves is found on disk by the build. A server file that registers things is a second registry, and the first thing two people adding assemblies both edit.",
    smell: "An import of an assembly, a page or an api in src/server.ts.",
  },
  {
    id: "one-project-per-root",
    rule: "The agent surface works on one project root, and create_project scaffolds into it only while it holds no project.",
    because:
      "Scaffolding over an existing project overwrites the author's files with a starter's, and a tool scoped to one root never reaches outside it.",
    smell: "Asking to create a project where a package.json already is.",
  },
  {
    id: "an-assembly-owns-its-styles",
    rule: "An assembly's styles are its own .css files and its components' <style>, scoped to it at build time, with every file they reference built beside them.",
    because:
      "The stylesheet is served from the build, not from the assembly's directory, so a reference the build did not carry along points at nothing, and a stylesheet it cannot parse cannot be scoped.",
    smell:
      "A relative @import, a url() naming a file that is not there, or CSS the build reports it cannot parse.",
  },
];
