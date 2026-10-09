# @assemblejs/renderer-lit

Write an AssembleJS assembly in Lit.

    src/assemblies/cart/cart.lit.ts

A Lit view default-exports a function from the assembly's props to a template. The server
renders it, its elements into declarative shadow roots, with `@lit-labs/ssr`; the browser
hydrates it, and each element hydrates its own shadow root.

Lit is a peer dependency, so installing this does not install a framework you were not going to
use.

See <https://ayers.repair/assemblejs/>.

Apache-2.0. Copyright Ayers Electronics Inc.
