# About this shop

Pour & Grind is a showcase. Nothing is for sale; everything else is real. It is four servers,
each a team's own project, and every page you see is put together from all of them.

## Who makes what

- **The shop** (this server) owns the pages, the header and footer, the search, the basket, the
  checkout and the stock. Six frameworks, five template languages and plain HTML, one page at
  a time.
- **The catalogue team** owns what is sold: the shelves, each product, its facts.
- **The reviews team** owns what people said about it.
- **The fulfilment team** owns what happens after you order.

The shop places the other teams' assemblies on its pages over HTTP. If the reviews server is
slow or down, the product page still loads and says reviews are unavailable. If the catalogue is
down, a product page has nothing to show, and says so with an error rather than half a page.

## See how it is put together

Press **Outline** at the corner of any page. Every assembly gets a box: its name, which server
answered it, how long that took, and when the browser brought it to life.

## How the teams interact

Each team keeps its own assemblies and apis. The shop declares which servers its page trusts.

- The teams' assemblies talk to each other in the browser across servers only where the shop
  says so for that server: the catalogue's join the page's bus, the others are on a bus of their
  own. So where two teams must agree, the address carries it. The grind you pick is the
  catalogue team's control; it reloads the page with `?grind=`, and the shop's buy box reads it
  from there.
- An assembly can call its own server's apis through the page's server. The reviews here are
  read-only: this showcase has no form to write one.
- Services depend on the address; apis can also read request headers and cookies. Your basket
  here is kept by your browser, and an order is found by its address alone. The staff door
  checks its session cookie.
