// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { liveClosingTags } from "@assemblejs/core";

describe("finding the closing tags a browser would read as tags", () => {
  it("passes over one inside a comment, a script or a style", () => {
    const html =
      "<!-- </head> --><script>'</head>'</script><style>a::after{content:'</head>'}</style></head>";
    expect(liveClosingTags(html, /<\/head\s*>/gi)).toEqual([html.length - "</head>".length]);
  });

  it("finds every one, in order, whatever its case and spacing", () => {
    expect(liveClosingTags("</BODY ></body>", /<\/body\s*>/gi)).toEqual([0, 8]);
  });
});
