// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { scriptEnd } from "@asmjs/core";

/** What follows the script a piece of markup opens with, as its text is read to end. */
const after = (html: string): string => html.slice(scriptEnd(html, "<script>".length));

describe("where the text of a script ends", () => {
  it("is just past its own end tag, whatever that tag holds after its name", () => {
    expect(after("<script>a</script>X")).toBe("X");
    expect(after("<script>a</SCRIPT\n>X")).toBe("X");
    expect(after("<script>a</script foo>X")).toBe("X");
    // An end tag whose name only starts like its own is its text.
    expect(after("<script>a</scripts></script>X")).toBe("X");
  });

  it("is the end of the markup where it is never closed", () => {
    expect(after("<script>never")).toBe("");
    expect(after("<script>a</script")).toBe("");
  });

  // Read as ending at the first end tag, the rest of each of these scripts was read as markup.
  it("is not its first end tag where a script is written inside a comment inside it", () => {
    expect(after("<script><!-- <script> </script> --></script>X")).toBe("X");
    expect(after("<script><!-- <SCRIPT/ </SCRIPT > </script >X")).toBe("X");
    expect(after("<script><!-- <script> </script> </script>X --> </script>Y")).toBe(
      "X --> </script>Y",
    );
    // Never closed twice over: all of it is the script's text.
    expect(after("<script><!-- <script> </script>X")).toBe("");
  });

  it("is its first end tag inside a comment that holds no script, as the tokenizer ends it", () => {
    expect(after("<script><!-- </script>X")).toBe("X");
    // A name that only starts like a script's begins nothing.
    expect(after("<script><!-- <scripts> </script>X")).toBe("X");
    expect(after("<script><!-- <script-x> </script>X")).toBe("X");
  });

  it("reads the dashes that end a comment wherever they stand, the opening ones among them", () => {
    expect(after("<script><!--> </script>X --> ")).toBe("X --> ");
    expect(after("<script><!---> </script>X")).toBe("X");
    expect(after("<script><!-- <script> --> </script>X")).toBe("X");
    expect(after("<script><!-- <script> </script --> </script>X")).toBe("X");
    expect(after("<script><!-- a ---> <script> </script>X")).toBe("X");
    // Not a comment's opening: nothing is escaped.
    expect(after("<script><!- <script> </script>X")).toBe("X");
  });

  it("reads a megabyte of them in the time its length takes", () => {
    const html = `<script>${"<!-- <script> </script> --> ".repeat(40_000)}</script>X`;
    const started = performance.now();
    expect(after(html)).toBe("X");
    expect(performance.now() - started).toBeLessThan(1000);
  });
});
