# Svelte tutorial walkthrough

Browser observations, 30 October 2026. This supplements `academy-research.md`.
Solution-assisted inspection is identified separately from manually completed exercises.
No full-course completion is claimed while later rows are absent.

URLs below are under `https://svelte.dev/tutorial/svelte/`.

| Lesson                           | Actions and observed outcome                                                                                                                                                               |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| welcome-to-svelte                | Read introduction and four-part progression; Solve disabled.                                                                                                                               |
| your-first-component             | Manual variable/interpolation edit rendered uppercase greeting; malformed markup produced compiler error; Solve/Reset restored solution/starter.                                           |
| dynamic-attributes               | Read exercise, used Solve; source gained dynamic src/name/alt and preview exposed the descriptive image alternative.                                                                       |
| styling                          | Read full exercise and used Solve; source gained scoped CSS; preview rendered the paragraph. Visual color/font was not sampled.                                                            |
| nested-components                | Read full exercise and used Solve; source imported the second file, file tree exposed both, preview rendered both paragraphs.                                                              |
| html-tags                        | Read full exercise including raw-HTML trust warning; Solve changed escaped text into a preview with a strong element.                                                                      |
| state                            | Manually added state/increment; clicking preview button changed 0 times to 1 time. Reload restored starter.                                                                                |
| deep-state                       | Read full exercise and used Solve; source mutated a reactive array and preview exposed Add a number.                                                                                       |
| derived-state                    | Read full exercise and used Solve; source computed a derived sum; preview displayed 1 + 2 + 3 + 4 = 10.                                                                                    |
| inspecting-state                 | Read full exercise and used Solve; clicking Add a number changed sum to 15 and emitted an update trace showing five values.                                                                |
| effects                          | Read full exercise including interval cleanup and server-rendering boundary; Solve added cleanup; preview exposed speed up, slow down and elapsed count. Timing changes were not measured. |
| universal-reactivity             | Read full exercise and used Solve; file renamed to the rune-aware module; clicking one counter changed all three preview buttons from 0 to 1.                                              |
| declaring-props                  | Read full exercise and used Solve; preview displayed the supplied answer 42.                                                                                                               |
| default-values                   | Read full exercise and used Solve; preview displayed supplied 42 and the second instance's fallback value.                                                                                 |
| spread-props                     | Read full exercise and used Solve; preview displayed package metadata and resolved npm/documentation links.                                                                                |
| if-blocks                        | Read full exercise and used Solve; preview exposed the initial counter without the conditional message.                                                                                    |
| else-blocks                      | Read full exercise and used Solve; preview displayed the initial between-0-and-10 branch.                                                                                                  |
| else-if-blocks                   | Read full exercise and used Solve; clicks verified the less-than-5, 5-to-10 and greater-than-10 branches at 0, 5 and 11.                                                                   |
| each-blocks                      | Read full exercise and used Solve; preview exposed all seven labelled color buttons. Color interaction was not sampled.                                                                    |
| keyed-each-blocks                | Read full exercise and used Solve; editor keyed by id; preview paired five labels with their corresponding symbols. Removal was not exercised here.                                        |
| await-blocks                     | Read full exercise and used Solve; preview moved from pending to Request failed. Reroll returned to pending. This proves observed error/pending handling, not a successful dice response.  |
| dom-events                       | Read full exercise and used Solve; preview displayed pointer coordinates at 0 x 0. Pointer tracking was not exercised.                                                                     |
| inline-handlers                  | Read full exercise and used Solve; editor moved logic inline; preview displayed coordinate text. Pointer tracking was not exercised.                                                       |
| capturing                        | Read full exercise and used Solve; editor attached capture-phase handlers and preview exposed the input. Alert ordering was not exercised.                                                 |
| component-events                 | Read full exercise and used Solve; source passed increment/decrement callbacks; preview exposed current value and both controls.                                                           |
| spreading-events                 | Read full exercise and used Solve; preview exposed Push and source connected a supplied handler through props. Audio was not played.                                                       |
| text-inputs                      | Read full exercise and used Solve; entering Learner changed the preview greeting immediately.                                                                                              |
| numeric-inputs                   | Read full exercise and used Solve; preview showed linked number/range controls and arithmetic sum 3.                                                                                       |
| checkbox-inputs                  | Read full exercise and used Solve; preview showed unchecked input, conditional text and disabled action. No subscription action was invoked.                                               |
| select-bindings                  | Read full exercise and used Solve; selecting the second option changed the displayed selected id from 1 to 2. No personal answer was entered or submitted.                                 |
| group-inputs                     | Read full exercise and used Solve; preview showed radio and checkbox groups with the initial missing-selection message.                                                                    |
| multiple-select-bindings         | Read full exercise and used Solve; preview replaced checkboxes with a multi-select list.                                                                                                   |
| textarea-inputs                  | Read full exercise and used Solve; typed Markdown produced an Academy heading and strong text in the live preview.                                                                         |
| classes                          | Read full exercise and used Solve; editor converted conditional classes to object/array syntax; preview displayed the card. Flip was not exercised.                                        |
| styles                           | Read full exercise and used Solve; editor split dynamic transform and custom properties into style directives; preview displayed the card. Flip was not exercised.                         |
| component-styles                 | Read full exercise and used Solve; preview's three boxes computed red, green and blue background colors.                                                                                   |
| attach                           | Read full exercise including focus trap teardown; Solve applied the attachment. Initial runtime snapshot was not settled; keyboard/canvas probes remain.                                   |
| attachment-factories             | Read full exercise and used Solve; source passed changing tooltip content through a factory. Snapshot still showed previous preview; tooltip interaction remains.                          |
| transition                       | Read full exercise and used Solve; unchecking removed text after the transition and checking restored it.                                                                                  |
| adding-parameters-to-transitions | Read full exercise and used Solve; fly transition source included distance/duration and preview displayed its content. Reversal timing was not measured.                                   |
| in-and-out                       | Read full exercise and used Solve; source separated entry/exit behavior and preview displayed content.                                                                                     |
| custom-css-transitions           | Read full exercise and used Solve; source defined generated CSS animation and preview displayed the target text. Animation was not sampled.                                                |
| custom-js-transitions            | Read full exercise and used Solve; source included typewriter validation/tick logic; preview exposed its initially unchecked control.                                                      |
| transition-events                | Read full exercise and used Solve; source wired start/end handlers; preview displayed waiting status. Lifecycle ordering was not exercised.                                                |
| global-transitions               | Read full exercise and used Solve; End on the range expanded five labels to ten. Unchecking hid and then removed them; a settled body read contained only the checkbox label.              |
| key-blocks                       | Read full exercise and used Solve; source keyed the periodically replaced loading message; preview displayed its heading and paragraph.                                                    |
| raw-state                        | Read full exercise and used Solve; source used raw state for polled chart data. Plot rendering was not visually verified.                                                                  |
| reactive-classes                 | Read full exercise and used Solve; clicking embiggen changed dimensions from 100/100 to 110/110 and derived area from 10000 to 12100.                                                      |

The compiler preview settles asynchronously. Immediate navigation snapshots sometimes show
the previous lesson's output; a changed editor alone is not runtime proof. Rows record only
the outcomes actually observed. Mobile, keyboard, error and reload probes are in the parent study.

The sequential walkthrough reached Advanced Svelte. Continue with the current Next exercise
link after reactive-classes. Missing interaction probes above still remain open.
