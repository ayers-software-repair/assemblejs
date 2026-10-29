# @asmjs/renderer-templates

Server-rendered EJS, Markdown, Nunjucks, Handlebars, and Pug assemblies for AssembleJS.

## Install

```sh
npm install @asmjs/renderer-templates
```

Requires `@asmjs/core` and Node.js 22 or newer. Template engines are included and loaded when their language is first used.

## View files

| Language | Example file | Data interpolation |
| --- | --- | --- |
| EJS | `src/assemblies/cart/cart.ejs` | `<%= data.total %>` |
| Nunjucks | `src/assemblies/cart/cart.njk` | `{{ data.total }}` |
| Handlebars | `src/assemblies/cart/cart.hbs` | `{{data.total}}` |
| Pug | `src/assemblies/cart/cart.pug` | `p= data.total` |
| Markdown | `src/assemblies/notes/notes.md` | Plain prose; no data interpolation |

Templates receive the assembly service's `data`. They render on the server; add a sibling `.client.ts` file for browser behavior.
EJS, Nunjucks, Handlebars, and Pug views can place another assembly with the language's equivalent of `<assembly name="cart"></assembly>`.
Markdown treats embedded HTML as text and does not place assemblies.

## Template boundaries

Each view is one file. Cross-file includes, inheritance, imports, and partials are refused; a Handlebars inline partial defined in that same file is supported.
Values interpolated from `data` are escaped. In Pug, use Pug attribute syntax such as `a(title=data.name)` rather than a single-quoted raw HTML attribute.

## Documentation

[AssembleJS documentation](https://assemblejs.com/docs/) · [Source](https://github.com/ayers-software-repair/assemblejs)

Apache-2.0. Copyright Ayers Electronics Inc. See the distributed LICENSE and NOTICE files.
