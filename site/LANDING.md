# What the landing page claims, and what backs it

Every line on `index.html` has to be true on the day it ships. This file is where each claim is
paired with the thing that makes it true, so a claim that stops being true is findable.

| the page says                          | what backs it                                                                                                                                                                                                                                                                                                    |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "One page. Every framework."           | The renderer packages, one per framework, and the browser proof that two assemblies with different renderers exchange an event on one page.                                                                                                                                                                      |
| "A directory is an assembly"           | Filesystem discovery and the generated registry, with a test asserting `add` writes nothing resembling a server file.                                                                                                                                                                                            |
| "The file name says the framework"     | `rendererForView`, and its test that an ambiguous `.tsx` without an infix is refused rather than guessed.                                                                                                                                                                                                        |
| "One slow assembly is not a slow page" | The composer's deadline, its fallback ladder, and the red tests that a hanging transport and a throwing one both leave the page standing.                                                                                                                                                                        |
| "They talk without adapters"           | The page bus, and the chromium test where one framework's click changes another framework's text.                                                                                                                                                                                                                |
| "An assembly can live anywhere"        | One `Fetch` interface for local and remote, so moving one changes a URL and nothing else; the `remote` conformance fixture proves it over HTTP.                                                                                                                                                                  |
| "Your agent knows the framework"       | `@assemblejs/mcp`, which reads the project, adds and places an assembly, checks it, renders and composes a plain html view, and explains every rule `check` names; the `AGENTS.md` and registrations `new` writes; the `agents` conformance fixture, where an agent builds in a project as the starter wrote it. |

## What it deliberately does not say

- **No competitor is named or compared against.** We describe what we do; the reader draws the
  comparison. There is no table on this page and there will not be one.
- **No third-party logo appears.** Most framework marks need permission for placement on someone
  else's marketing page and several forbid recolouring, so the frameworks are named in our own
  colours. Logos may be added later, per permission, one at a time.
- **Nothing about money.** No sponsorship, no pricing, no funding surface.
- **No benchmark and no "fastest".** A performance claim ships with a benchmark harness in the
  repository or it does not ship.

## Claims ahead of the code

None, as of 2026-10-10. Two were, and the table marked them until they were built; a claim that
gets ahead again is marked the same way, because a landing page describing what a product will
do is the one kind of lie that is hardest to notice from inside.

One was found ahead on 2026-10-10 and brought back the same day: the page said an agent renders
the assembly it adds, and the agent surface renders a plain html view and refuses any other
with the reason. The page now says what holds. The stronger sentence returns when the agent
surface renders a view its renderer compiles (`docs/TODO.md`).
