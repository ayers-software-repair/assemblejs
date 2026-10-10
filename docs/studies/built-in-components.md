# A-04: what "built in" means, before any code

A design memo. PLAN 4.1 asks for it and for the owner's answer before a line of A-04 is
written. It ends with one question.

## What was asked

The owner, 2026-10-09 (`docs/DECISIONS.md`, "AI first"): the best practices and the components
built in, so what an agent builds does not look machine-made. The plan's row: a token-based
starter design system with accessible components, and `check` rules that refuse what reads as
machine-made, which it names as inline styles, missing labels and alternative text, and colours
outside the tokens.

## What stands today

Each of these was read at its source on 2026-10-10.

- **Nothing in a project is shared between assemblies but the page.** An assembly's stylesheet
  is scoped to its own envelope, and `:root` in it means that envelope
  (`packages/cli/src/styles/scope-css.ts`, DESIGN 10). A page is a template and an optional
  declaration and has no stylesheet of its own (`discovery/discover-pages.ts`). So there is
  nowhere to write a value once and have every assembly read it.
- **An inline style is already dead, and nobody is told.** The default content policy sends
  `style-src` with no allowance for inline styles (`core/src/access/content-security-policy.ts`,
  DESIGN 5.2), so a `style` attribute in a view is refused by the browser. `check` says nothing.
- **`check` reads a view for what it places and for nothing else.** S-07 gave it a reader per
  kind of view: a template with its computed parts marked out, a module through its syntax
  tree, a Svelte and a Vue file as text. None of them reads an element's attributes, and Pug
  is not read at all.
- **The starter is unstyled.** One page, one plain html assembly holding a sentence, and no
  stylesheet.
- **The estate has done this once.** `platform/sitekit/ROLES.md` names roles (`--surface`,
  `--ink`, `--accent` and ten more), each product binds them in a skin, and a checker holds
  each binding to a contrast number. This repository's own `scripts/check-site.mjs` holds the
  site's skin to those numbers and refuses an unreadable ink.

## What makes a page read as machine-made

Only what a check can see is listed, because the rest is taste and a rule cannot hold taste.

- A value invented where it is used: a new colour in every rule, a new distance in every margin.
- A style written on the element.
- A control with no name, and an image with no alternative.
- Text too faint to read, and a control that shows no focus.

The first two are about one decision made in many places. The last three are about a person
who cannot use what was built.

## The proposal

### 1. Tokens: one file, linked by every page

`src/tokens.css` declares the project's roles at `:root`. The build carries it as it carries an
assembly's stylesheet, and every page links it before any assembly's. A custom property is
inherited, so every assembly reads it, one in a shadow root included.

- **Roles, not values.** Colour takes the estate's vocabulary as it stands: surface, panel,
  border, ink, muted ink, accent, strong accent, wash, and the faces. Beside it, three scales a
  page cannot be built without: distance, type size and corner.
- **Invariants, held by `check`.** Each colour role states what must be true of whatever binds
  it, and `check` refuses a file that breaks one, in both colour schemes where it has two. The
  numbers are WCAG 2.2's, not ours: text against its ground "has a contrast ratio of at least
  4.5:1" (1.4.3, level AA), and what identifies a control "at least 3:1" (1.4.11, level AA).
- **The values `new` writes are placeholders that pass.** The look is the owner's, as the
  site's palette is. A project changes the file and the invariants are waiting for it.

### 2. Components: styled native HTML

A component here is an element HTML already has, a class, and the tokens. `new` writes one
stylesheet of them beside the tokens: the button, the field with its label, the link, the list,
the table, the notice, the dialog, each with its focus ring and its states.

This is option A of three, and the question at the end is which.

- **A. Styled native HTML.** One stylesheet. It works in all twelve kinds of view, because
  every one of them writes HTML, and an agent already knows every element in it. What makes a
  component usable is the browser's and not ours: a modal `dialog` makes "the rest of the page
  inert" and puts focus inside itself (MDN, the `dialog` element, read 2026-10-10). It needs no
  script but to open that dialog, and HTML's own attributes for opening one are newer than the
  element, so whether the starter may rely on them is a thing to establish in its bite.
- **B. Custom elements.** A package of elements with behaviour of their own: tabs, a menu, a
  combobox. Usable from every framework. Each needs server rendering, hydration and an
  accessibility story the browser does not give it, and each is ours to keep right.
- **C. A component library per framework.** Six libraries, kept equal for ever.

### 3. Rules: what `check` refuses

A rule refuses only what its reader can be certain of. A value the view computes counts as
present.

| rule                          | refuses                                                                                           | why                                                                                                                                                                                |
| ----------------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `a-view-has-no-inline-style`  | a `style` attribute, in any view's spelling of it                                                 | it does nothing under the default policy, and it is a value invented where it is used                                                                                              |
| `an-image-has-an-alternative` | an `img` with no `alt` at all; an empty one says the image is decoration and passes               | WCAG 2.2, 1.1.1, level A: non-text content "has a text alternative"                                                                                                                |
| `a-control-has-a-name`        | an input, a select, a textarea with no label in its view and no name given it; a button with none | WCAG 2.2, level A: 3.3.2, "Labels or instructions are provided when content requires user input", and for the button 4.1.2, "the name and role can be programmatically determined" |
| `a-colour-is-a-token`         | a literal colour in an assembly's stylesheet                                                      | one decision, made in one file                                                                                                                                                     |
| `tokens-hold-their-contrast`  | a binding in `src/tokens.css` that breaks its role's invariant                                    | WCAG 2.2, 1.4.3 and 1.4.11, level AA                                                                                                                                               |

A project that has no `src/tokens.css` is held to the first three alone. Each rule joins the
list `explain` answers and the instructions `new` writes.

### 4. What it takes

The rules about markup need what S-07 built for placements, one level deeper: for each kind of
view, the elements it writes and the attributes on each.

- Templates (html, EJS, Handlebars, Nunjucks): the reader that marks out what is computed,
  then a tokenizer of what is left.
- Modules (React, Preact, Solid): the syntax tree `check` already builds, where an element's
  attributes are an object.
- Lit: the fixed parts of its `html` templates, through the same tokenizer.
- Vue and Svelte: their markup is read as text today. Read as elements, with the same
  tokenizer.
- Pug and Markdown: Pug's own syntax needs its own reader, and is not read today for
  placements either. Markdown writes an image with its alternative in one form.

The colour rule needs no new reader: assemblies' stylesheets are already parsed.

In bites, each proved as the others were: the tokens file and its link; its invariants; the
stylesheet of components and the starter that uses it; the element reader for templates; for
modules and Lit; for Vue and Svelte; then one bite a rule. About nine.

### 5. What it leaves out

No icon set. No script. No dependency on a stylesheet framework. No theme switcher: a second
colour scheme is a second set of bindings under `prefers-color-scheme`, checked like the first.
No rule about distances or type sizes outside the tokens in 1.0: the plan names colours, and a
rule that reads every length would refuse more than it should until it has been tried.

## The question

**What is a built-in component: A, B or C above?**

The advice is A for 1.0. It is the only one of the three that is the same in every kind of
view, that an agent can use from what it already knows, and that is accessible because the
browser makes it so. B is worth having for the few things HTML cannot do, after 1.0 and one
element at a time. C is refused: it is the thing this framework exists so that nobody has to
maintain.

Everything else above is the seat's to decide and is decided as written, unless the answer
changes it: the tokens file and where it lives, the estate's role names, placeholder values,
and the five rules.
