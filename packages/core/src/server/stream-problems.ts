// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Everything wrong with the stream a page names, found without running anything: a path that is
 * not one of this server's streaming apis without parameters, and a stream on a page whose own
 * runtime is never on it, so nothing would open it. `opened` is undefined where the page's
 * placements could not be read, and the second rule then says nothing: a template that cannot
 * be read is reported as that. Boot and `check` call this with the same facts, each read its own
 * way.
 */
export function streamProblems(
  at: string,
  stream: string | undefined,
  streams: ReadonlySet<string>,
  opened: boolean | undefined,
): readonly string[] {
  if (stream === undefined) return [];
  const problems: string[] = [];
  // A query is the stream's own, read from its context; the path names the stream.
  if (!streams.has(stream.split("?")[0] ?? "")) {
    problems.push(
      `${at} opens the stream "${stream}", which is not the path of a streaming api without parameters`,
    );
  }
  // The page's own runtime opens its stream, and is on the page only for an assembly of this
  // server's that has a browser half: without one, the stream is named and never opened.
  if (opened === false) {
    problems.push(
      `${at} opens a stream and places no assembly of this server's with a browser half, so nothing would open it`,
    );
  }
  return problems;
}
