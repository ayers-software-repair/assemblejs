# The market: one shop, four teams' servers

A showcase of what AssembleJS is for. Pour & Grind is a shop that sells coffee and the things
that make it. It is four servers, each one team's own AssembleJS project, and every page a
visitor sees is put together on the shop's server from all of them, over HTTP.

| Server       | Port | Owns                                                          | Written in                                                                             |
| ------------ | ---- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `shop`       | 4700 | The pages, header and footer, search, basket, checkout, stock | HTML, Markdown, Nunjucks, Handlebars, Pug, EJS, React, Svelte, Vue, Solid, Lit, Preact |
| `catalog`    | 4701 | The shelves, each product, its facts                          | React, Vue, Preact, Lit, EJS, Handlebars                                               |
| `reviews`    | 4702 | What people said of each product                              | Vue, Lit                                                                               |
| `fulfilment` | 4703 | Where a parcel is, after an order                             | Solid, Nunjucks                                                                        |

The shop and the catalogue were begun with the command line, as a person begins a project:
`assemblejs new`, then `assemblejs add assembly` for each part. The reviews and fulfilment
servers were begun through the agent surface, as an agent begins one: `create_project` and
`add_assembly`, then `check`, and for reviews `render_assembly` and `compose_page` to see what
was made. Every view, service, api and page template was then written by hand, the agent's
servers included: `place_assembly` put its tags where the template's layout did not want them,
and the agent surface takes no route parameter, so it could not show a product's reviews.

## Run it

From the repository's root:

```sh
pnpm install
pnpm build
pnpm --filter "@assemblejs/example-market-*" build
node examples/market/start.mjs
```

Then open <http://127.0.0.1:4700/>. Each team's server has pages of its own too, so a team sees
its work without the shop: <http://127.0.0.1:4701/c/beans>, <http://127.0.0.1:4702/p/kb-guji-250>,
<http://127.0.0.1:4703/>.

## See how a page is put together

Every project here sets `outline: true` in its `assemblejs.config.ts`. Press **Outline** at the
corner of any page: each assembly gets a box that says what it is, which server answered it, how
long that took, and when the browser brought it to life. A product page is twelve assemblies from
three servers.

## What to try

- **A shelf.** <http://127.0.0.1:4700/c/beans>. The facets are Vue and the grid is React; both
  are the catalogue team's, so they share that server's bus. Tick a roast and the grid narrows
  with no request made.
- **A product.** <http://127.0.0.1:4700/p/kb-guji-250>. The product is the catalogue's, the
  reviews are the reviews team's, the buy box is the shop's. Choose a grind: the catalogue's
  control reloads the page with `?grind=`, and the shop's buy box reads it from the address.
- **Buy something.** Add to the basket, check out, and land on the order's own address, where
  the parcel's progress comes from the fulfilment server and moves on every twenty seconds.
- **Break something.** Stop the showcase and start it without the reviews team:
  `node examples/market/start.mjs shop catalog fulfilment`. The product page loads, and says
  reviews are unavailable. Start it without the catalogue and a product page answers 503: the
  product is required, so the page fails whole instead of selling what it cannot show.
- **The staff door.** <http://127.0.0.1:4700/staff>. The key is the one `start.mjs` prints when
  it starts, made for that run, or the `STAFF_KEY` you gave it. The stock board is behind the
  shop's own access check, and changes as orders are placed, over the page's stream.

## What it does not do

Three things a shop like this would want, and that the framework does not do yet. The showcase
is built inside them and says so on its own About page.

- Two servers' assemblies on one page share an event bus only where the shop's config says so
  for that server (`events: true`, which it does for the catalogue). Where two teams must agree, the
  address carries it, which is how the grind reaches the buy box.
- An assembly placed from another server cannot call its own server from the browser, so the
  reviews here are read, not written.
- Nothing of who is asking reaches a service or an api. The basket is kept by the browser and
  priced by the server; an order is found by its address alone.
