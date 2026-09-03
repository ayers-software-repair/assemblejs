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
];
