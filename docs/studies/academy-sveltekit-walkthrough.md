# SvelteKit tutorial walkthrough

Browser observations, 30 October 2026. This supplements `academy-research.md`.
Solution-assisted inspection is distinct from manually completing an exercise.
URLs below are under `https://svelte.dev/tutorial/kit/`.

| Lesson                  | Actions and observed outcome                                                                                                                                                                                                                                                                                      |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| introducing-sveltekit   | Read the introduction and inspected project files, preview URL control and real development-server terminal. Runtime boot was asynchronous.                                                                                                                                                                       |
| pages                   | Manually created the About route file through the file tree, entered markup and followed About to its rendered heading/text.                                                                                                                                                                                      |
| layouts                 | Read full exercise and used Solve; file tree gained the layout and preview showed shared navigation with home content.                                                                                                                                                                                            |
| params                  | Read full exercise and used Solve; followed the first blog link to `/blog/one`, which rendered the dynamic route's heading.                                                                                                                                                                                       |
| page-data               | Read full exercise and used Solve; blog links changed from placeholders to loaded titles. Followed Safety notice and saw title/body. An earlier URL-control probe of `/blog/nope` showed 404 with a matching terminal GET.                                                                                        |
| layout-data             | Read full exercise and used Solve. The file rename initially produced a 500 and a terminal missing-module error for the removed page loader. Preview reload recovered the blog list; following Safety notice rendered the post and inherited More posts sidebar.                                                  |
| headers                 | Read full exercise and used Solve; preview reload displayed literal document markup rather than the rendered heading, matching the changed content type.                                                                                                                                                          |
| cookies                 | Read full exercise and used Solve; preview reload showed the first-visit greeting, then another reload showed the returning-visit greeting. No personal data was entered.                                                                                                                                         |
| lib                     | Read full exercise and used Solve; followed the deeply nested route and saw the shared module's message there as well as on home.                                                                                                                                                                                 |
| the-form-element        | Read full exercise and used Solve; the first synthetic todo submission returned a 500 with a database push error in the terminal. Preview reload recovered the GET; retrying added Practice composition to the list.                                                                                              |
| named-form-actions      | Read full exercise and used Solve; reloaded, added the synthetic practice todo, then removed that item through its own Mark as complete button. Terminal showed successful create and delete POSTs.                                                                                                               |
| validation              | Read full exercise and used Solve. Empty Enter left the form in place without a terminal POST. Submitting the existing description displayed a uniqueness error and retained the entered value; a new synthetic description then succeeded. Terminal showed 422 for the duplicate and 200 for recovery.           |
| progressive-enhancement | Read full exercise and used Solve; added Enhanced practice. Input cleared and list updated; terminal showed POST plus data refresh. No no-JavaScript test or animation measurement was performed.                                                                                                                 |
| customizing-use-enhance | Read full exercise and used Solve; submitted Pending practice. Observed disabled input and saving text, then the new item and re-enabled input after completion.                                                                                                                                                  |
| get-handlers            | Read full exercise and used Solve; Roll the dice displayed 6 and terminal showed successful GET `/roll`.                                                                                                                                                                                                          |
| post-handlers           | Read full exercise and used Solve; submitted API practice, saw it in the list and terminal's 201 POST. Preview reload retained the item.                                                                                                                                                                          |
| other-handlers          | Read full exercise and used Solve; created a synthetic item and checked it. Preview reload retained the checked state; removing that item removed it from the list. Terminal showed 204 for both PUT and DELETE.                                                                                                  |
| page-state              | Read the exercise and manually imported page state into the layout, adding current-path bindings to both navigation links. The source compiled; following About changed the preview address to `/about` and rendered its heading/body. No independent assertion of the rendered aria-current attributes was made. |
| error-basics            | Read the exercise, followed the app-error link and saw its 420 heading and message. The unknown-error link showed 500 and Internal Error while the terminal retained the real thrown diagnostic. Client data requests logged 200; a full preview reload logged a real 500 GET.                                    |
| error-pages             | Read the exercise and used Solve. The app route rendered its dedicated expected-error heading; the unknown route rendered the root boundary's 500 Internal Error heading. This is solution-assisted boundary interaction, not manual creation of both error components.                                           |
| fallback-errors         | Read the exercise and used Solve; the failing root loader produced the static Game over document, Code 500 and Internal Error. Reset removed the files but briefly left a missing-loader reload error. Preview reload recovered the home page and a 200 GET.                                                      |

At [navigating-state](https://svelte.dev/tutorial/kit/navigating-state), manually imported
`navigating` in the layout and added conditional pending-path text. Following About first
showed `navigating to /about` with the old home content; the next observation showed the
About heading/body, `/about` address and successful data GET with that pending text removed.
This is an actual delayed-navigation interaction, without clicking Solve. The retained
local screenshot `/tmp/assemblejs-academy-kit-navigation.png` shows the edited layout and
completed About navigation; the transient pending state was observed in the accessibility tree.

At [updated-state](https://svelte.dev/tutorial/kit/updated-state), read the exercise's explicit
development-mode limitation, used Solve and inspected the layout's `updated` import and
`updated.current` conditional around its reload toast. The home preview rendered without
that toast. Reset removed the import/conditional and restored the starter's visible toast
and reload button. No production deployment/version-polling behavior was tested; a solution
source change is not proof of a real app update.

At [custom-error-messages](https://svelte.dev/tutorial/kit/custom-error-messages), manually
added page status/message handling to the root error view. About initially showed the generic
Internal Error; its client data request logged 200. Manually edited both existing error hooks
to return the example's message only for unknown errors. After preview reload, the terminal
showed 500 GETs; a first observation displayed the offline branch, then the next source-view
observation showed Oops and the actual example error text. The reason for that transient branch
was not established. The screenshot `/tmp/assemblejs-academy-kit-custom-error.png` shows the
edited server hook beside the resulting message. Solve replaced the manual edits with the
provided solution; Reset restored both empty hooks and the initial generic error view.

During that manual exercise, character-by-character input triggered editor auto-closing and
left extra closing tags. The actual compiler overlay named the invalid closing tag and source
line. Pasting the corrected complete source removed it; preview reload recovered home and a
200 GET before the error-route tests. This was an input-method artifact, not a claimed framework
bug or a completion check. No production error-reporting or real offline-network test was run.

At [redirects](https://svelte.dev/tutorial/kit/redirects), first followed A to its own heading.
Manually created `src/routes/a/+page.server.js`, called the temporary redirect to B, and placed
a deliberate throw after it. Preview reload logged 307 for A and 200 for B, with B rendered;
the guard error did not appear. Following A through the app again left the preview at B while
its data request logged 200. Do not call that data response a 307 document response. The retained
screenshot `/tmp/assemblejs-academy-kit-redirect.png` shows the manual guard and the B result.
Solve replaced it with the provided redirect-only function. Reset removed the new file but
briefly logged a stale missing-module reload error. Preview reload recovered B with 200; then
following A rendered A at `/a`, without redirection. The temporary research tab was closed.

The development server, preview and file editor settle separately. A changed source tree
does not by itself prove the preview has rebuilt successfully. Record recoverable errors
and recovery steps rather than silently counting Solve as success.

The walkthrough is in progress. Hooks, advanced loading and the remaining course have not
yet been exercised here. Earlier rows do not imply that every interaction, language variant or
keyboard/mobile path was tested.
