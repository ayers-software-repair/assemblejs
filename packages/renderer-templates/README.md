# @assemblejs/renderer-templates

Write an AssembleJS assembly as an EJS, Markdown, Nunjucks, Handlebars or Pug template.

    src/assemblies/cart/cart.ejs
    src/assemblies/cart/cart.njk
    src/assemblies/cart/cart.hbs
    src/assemblies/cart/cart.pug
    src/assemblies/notes/notes.md

The extension names the language. A template renders on the server only, like an `.html` view;
a `.client.ts` beside it gives it browser behaviour.

A template sees one name: `data`, from the assembly's service. What a template writes from
`data` is escaped. It places another assembly by writing the directive in its own markup, as a
page does, and the server puts that assembly where the directive stood:

| Language   | A value from `data` | Another assembly                    |
| ---------- | ------------------- | ----------------------------------- |
| EJS        | `<%= data.total %>` | `<assembly name="cart"></assembly>` |
| Nunjucks   | `{{ data.total }}`  | `<assembly name="cart"></assembly>` |
| Handlebars | `{{data.total}}`    | `<assembly name="cart"></assembly>` |
| Pug        | `p= data.total`     | `assembly(name="cart")`             |

A Markdown view is prose: it reads no data, places no assembly, and shows HTML written inside it
as text.

A view is one file: an include, an extends, an import or a partial from another file is refused
when it renders; a Handlebars inline partial, defined in the same file, renders. Each engine is
imported the first time a template in its language renders, so a project using one language
never loads the other four, and each template compiles once. An error names the view's file.

Pug's escaping leaves `'` as it is: write an attribute with Pug's own syntax, `a(title=data.name)`,
rather than inside a single-quoted attribute in raw HTML.

See <https://ayers.repair/assemblejs/>.

Apache-2.0. Copyright Ayers Electronics Inc.
