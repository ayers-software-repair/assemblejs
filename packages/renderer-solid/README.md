# @assemblejs/renderer-solid

Write an AssembleJS assembly in Solid.

    src/assemblies/cart/cart.solid.tsx

The infix is not decoration: React, Preact and Solid all write `.tsx`, so a file that does not
say which is a file whose framework only the configuration knows. Solid's JSX is compiled by its
own Babel preset, for the server and for hydration, by the compiler this package carries.

Solid is a peer dependency, so installing this does not install a framework you were not going
to use.

See <https://ayers.repair/assemblejs/>.

Apache-2.0. Copyright Ayers Electronics Inc.
