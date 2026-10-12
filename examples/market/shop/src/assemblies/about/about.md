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

## What it does not do

Three things a shop like this would want, and that the framework does not do yet.

- The teams' assemblies cannot talk to each other in the browser across servers: each server's
  assemblies are on that server's own bus. So where two teams must agree, the address carries
  it. The grind you pick is the catalogue team's control; it reloads the page with `?grind=`,
  and the shop's buy box reads it from there.
- An assembly from another server cannot call its own server from your browser. So the reviews
  are read-only here: there is no form to write one.
- The server never knows who you are. Your basket is kept by your browser, and an order is
  found by its address alone.
