# @assemblejs/renderer-templates

Write an AssembleJS assembly as an EJS, Markdown, Nunjucks, Handlebars or Pug template.

    src/assemblies/cart/cart.ejs
    src/assemblies/cart/cart.njk
    src/assemblies/cart/cart.hbs
    src/assemblies/cart/cart.pug
    src/assemblies/notes/notes.md

The extension names the language. A template renders on the server only, like an `.html` view;
a `.client.ts` beside it gives it browser behaviour.

A template sees two names: `data`, from the assembly's service, and `children`, the HTML of the
assemblies it places. What a template writes from `data` is escaped. `children` is already
HTML and is written as it is:

| Language   | A value from `data` | A child's HTML          |
| ---------- | ------------------- | ----------------------- |
| EJS        | `<%= data.total %>` | `<%- children.inner %>` |
| Nunjucks   | `{{ data.total }}`  | `{{ children.inner }}`  |
| Handlebars | `{{data.total}}`    | `{{children.inner}}`    |
| Pug        | `p= data.total`     | `div!= children.inner`  |

A Markdown view is prose: it reads no data, places no children, and shows HTML written inside it
as text.

A view is one file: an include, an extends or a partial is refused when it renders. Each engine
is imported the first time a template in its language renders, so a project using one language
never loads the other four, and each template compiles once.

See <https://ayers.repair/assemblejs/>.

Apache-2.0. Copyright Ayers Electronics Inc.
