# @asmjs/renderer-lit

Server rendering and browser hydration for Lit assemblies in AssembleJS.

## Install

Inside an AssembleJS project using Node.js 22 or newer:

```sh
npm install @asmjs/renderer-lit lit
npx assemblejs add assembly cart --renderer lit
```

Edit `src/assemblies/cart/cart.lit.ts`. Its default export maps props to a Lit template.
Add it to a page:

```html
<assembly name="cart"></assembly>
```

The server renders declarative shadow roots; the browser hydrates them.
Requires `@asmjs/core`.

[Documentation](https://assemblejs.com/docs/) · [Source](https://github.com/ayers-software-repair/assemblejs)

Apache-2.0. Copyright Ayers Electronics Inc. See LICENSE and NOTICE.
