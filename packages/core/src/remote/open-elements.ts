// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

// Where the browser stops looking for an open `<p>`: the elements of the parser's button scope,
// each in the one kind of content it is named for (html.spec.whatwg.org, parsing, "has an
// element in button scope", read 2026-10-11).
const SCOPE = {
  html: new Set("applet caption html table td th marquee object select template button".split(" ")),
  svg: new Set(["foreignobject", "desc", "title"]),
  math: new Set(["mi", "mo", "mn", "ms", "mtext", "annotation-xml"]),
} as const;

/**
 * The elements open around a place in a remote's answer, innermost last, each with the kind of
 * content it is, and what a start tag there asks of them: its parent, whether one of a name is
 * open at any depth, and whether a paragraph is open where the browser would look for one.
 *
 * Each answer is kept as elements open and close and never searched for, so a question costs
 * the same however deep the answer goes. Searched for, an answer forty thousand elements deep
 * held one thread for ten seconds.
 */
export class OpenElements {
  readonly #open: Array<{
    readonly name: string;
    readonly kind: "html" | "svg" | "math";
    readonly paragraph: boolean;
  }> = [];
  readonly #counts = new Map<string, number>();

  /** How many are open. */
  get depth(): number {
    return this.#open.length;
  }

  /** The innermost, or nothing when none is open. */
  get innermost(): { readonly name: string; readonly kind: "html" | "svg" | "math" } | undefined {
    return this.#open.at(-1);
  }

  /** Whether a `<p>` is open with nothing around this place that ends the search for one. */
  get paragraph(): boolean {
    return this.#open.at(-1)?.paragraph === true;
  }

  /** Whether an element of this name is open at any depth. */
  holds(name: string): boolean {
    return (this.#counts.get(name) ?? 0) > 0;
  }

  open(name: string, kind: "html" | "svg" | "math"): void {
    const paragraph =
      kind === "html" && name === "p" ? true : SCOPE[kind].has(name) ? false : this.paragraph;
    this.#open.push({ name, kind, paragraph });
    this.#counts.set(name, (this.#counts.get(name) ?? 0) + 1);
  }

  close(): void {
    const closed = this.#open.pop();
    if (closed !== undefined) {
      this.#counts.set(closed.name, (this.#counts.get(closed.name) ?? 1) - 1);
    }
  }
}
