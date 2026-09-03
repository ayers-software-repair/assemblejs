# What the landing page claims, and what backs it

Every line on `index.html` has to be true on the day it ships. This file is where each claim is
paired with the thing that makes it true, so a claim that stops being true is findable.

| the page says                          | what backs it                                                                                                                               |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| "One page. Every framework."           | The renderer packages, one per framework, and the browser proof that two assemblies with different renderers exchange an event on one page. |
| "A directory is an assembly"           | Filesystem discovery and the generated registry, with a test asserting `add` writes nothing resembling a server file.                       |
| "The file name says the framework"     | `rendererForView`, and its test that an ambiguous `.tsx` without an infix is refused rather than guessed.                                   |
| "One slow assembly is not a slow page" | The composer's deadline, its fallback ladder, and the red tests that a hanging transport and a throwing one both leave the page standing.   |
| "They talk without adapters"           | The page bus, and the chromium test where one framework's click changes another framework's text.                                           |
| "An assembly can live anywhere"        | One `Fetch` interface for local and remote, so moving one changes a URL and nothing else. Not yet built: B-13.                              |
| "Your agent knows the framework"       | `@assemblejs/mcp`. Not yet built: B-09b.                                                                                                    |

## What it deliberately does not say

- **No competitor is named or compared against.** We describe what we do; the reader draws the
  comparison. There is no table on this page and there will not be one.
- **No third-party logo appears.** Most framework marks need permission for placement on someone
  else's marketing page and several forbid recolouring, so the frameworks are named in our own
  colours. Logos may be added later, per permission, one at a time.
- **Nothing about money.** No sponsorship, no pricing, no funding surface.
- **No benchmark and no "fastest".** A performance claim ships with a benchmark harness in the
  repository or it does not ship.

## The two claims that are ahead of the code

The table above marks them. Both are on the ladder, and neither may stay on the page if it is
still unbuilt when the page goes live: a landing page describing what a product will do is the
one kind of lie that is hardest to notice from inside.
