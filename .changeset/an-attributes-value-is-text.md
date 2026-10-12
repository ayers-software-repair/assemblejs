---
"@assemblejs/core": patch
---

An attribute's value is text. The readers of a view's markup read a tag's attributes as markup: a value holding `<!--` or `<script>` ended every placement after it in silence, one holding a directive's text failed the assembly or, written whole in a single-quoted value, was placed and its markup put inside the attribute. A renderer that escapes only the quote in an attribute, as HTML allows and Solid does, wrote a visitor's value there with its angle brackets. What a tag holds between its name and its end is now inert to every reader (`inertSpans`), and a tag ends where the tokenizer ends it, a `>` inside a quoted value being the value's (`tagEnd`). A `<template-card>` is no longer read as a `<template>`.
