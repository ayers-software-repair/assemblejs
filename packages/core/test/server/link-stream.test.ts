// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { linkStream } from "@assemblejs/core";

describe("naming a page's stream in its document", () => {
  it("adds a meta element at the end of the head, its path escaped", () => {
    expect(linkStream("<head><!-- </head> --></head><body></body>", '/live?a="b"')).toBe(
      '<head><!-- </head> --><meta name="assemblejs-stream" content="/live?a=&quot;b&quot;"></head><body></body>',
    );
  });

  it("puts it first in a template with no head, and adds nothing for a page with no stream", () => {
    expect(linkStream("<p>x</p>", "/live")).toBe(
      '<meta name="assemblejs-stream" content="/live"><p>x</p>',
    );
    expect(linkStream("<head></head>", undefined)).toBe("<head></head>");
  });
});
