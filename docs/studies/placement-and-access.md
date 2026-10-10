# Placement and access: a visitor is shown what its own address refuses

A design memo for the owner. The lead ruled on 2026-10-10 that closing this changes what the
framework promises about access, so the choice is the owner's, and that nothing is built into
`next` until he has made it. It ends with one question.

## The fault

Found by the second reading of the design (its finding 4) and measured on `next` at `16d8b92`.

- A project turns on a login for everything but a list of open routes. An assembly behind it
  answers 401 at its own address.
- The login is asked once for each request, of the address that was asked. What that page
  places is put together inside the server and is not asked again (DESIGN 5.2).
- The server reads what a view rendered and places every directive in it, whoever wrote it
  (DESIGN 7). A view that writes a visitor's text unescaped lets the visitor write one.
- Together: a visitor with no login asks an open page, puts a directive naming the guarded
  assembly in the page's address, and is shown that assembly.

`conformance/specs/trust/raw.spec.mjs` holds it, and its cases are titled KNOWN FAULT. `GET
/assembly/ledger/` answers 401. `GET /public/board?note=...` answers 200 with the ledger's
words in it, through a view written in EJS and through one written in Pug. Nothing is
published, so nobody is exposed today.

The author's mistake starts it: writing a visitor's text unescaped is a fault in any
framework. What is ours is what follows from it here, and that the design said it could not.

## What nobody disputes

A visitor with no credentials is not shown the ledger, however a directive naming it came to
be in the page. That spec is written, and red, on the local branch
`security/guarded-wherever-placed`, in two cases: an EJS view and a Pug one. Each way below
turns both green.

## Three ways

### A. Access follows the assembly

Wherever an assembly is placed, the decision its own address would make is made again, for
this visitor, before it is rendered. Refused, the placement shows what a failed one shows: its
fallback, or nothing.

- **Closes:** the fault, in every kind of view. It reads nobody's source, so it holds for a
  Pug view and for a directive built in code.
- **Changes for an author:** an open page no longer shows a guarded assembly to everyone. The
  assembly's own address has to be open too, which is one more entry in `publicRoutes`:
  `"/assembly/badge/*"`. In return one page can hold parts for members and parts for
  everyone, and each visitor is shown the parts that are theirs. A product's own
  `authenticate` is asked about each assembly's address as well as the page's. One that admits
  only the page paths it knows would refuse every assembly on those pages.
- **Measured:** none of the seven examples turns access on, so none changes. Among the
  fixtures one page does. `/public/notice` in the trust fixture shows `badge` with no
  credentials today, and a spec says so (`inbound.spec.mjs`, "placed without credentials
  too"). Under A it shows the badge only once the fixture opens the badge's address.
- **Costs:** one function on the composer, asked before a placement is dispatched and before
  a cached answer is used. The server makes it from the one decision that exists
  (`decideAccess`), so no second rule can disagree with the first, and binds it to the
  request: the visitor's headers themselves still never reach the composer or another
  server (DESIGN 5.1). One reason more in the contract's list. A product's own `authenticate`
  is called once for each assembly on a page, where today it is called once for the page; the
  server can keep each answer for the length of the request.
- **Leaves:** a visitor can still place an assembly that is open at its own address. That
  shows them nothing they could not have asked for.

### B. The server places only what a view's source places

The build already records what each view's source places. A render refuses, before dispatch,
a directive naming anything else.

- **Closes:** the fault, in every view the build reads. Measured over the examples and the
  fixtures, with the renderers each installs: all 105 views are read, the Pug ones among them
  since the second reading's finding 3.
- **Changes for an author:** two things that render today stop. One is a slot written inside
  a component that comes from a package. It gets a declaration: the view says
  `export const places = ["nav"]`, beside the `mount` and the `shadow` it may already export,
  and `check` reads it. The other is a directive a view builds in code, which has no reason to
  exist: the view writes it plainly.
- **Has a choice of its own to make:** what a render does for a view with no record. An
  assembly declared by hand in code has none unless its author writes one, and neither has a
  template holding a directive that reads only once the template has computed part of it.
  Allow, and the fault stays open for those. Refuse, and a third thing stops: such a view
  places nothing until it says what it places. The seat would refuse, so the rule has no
  exception.
- **Measured, by reading and not by running, since B is not built:** the reader records 30
  views, in the examples and the fixtures, as placing a child. The only views that place what
  their source does not show are the seven written to show this fault.
- **Costs:** one option on the composer, one reason more in the contract's list, and the
  declaration with its reader.
- **Leaves:** an author who places a guarded assembly on an open page still shows it to
  everyone. That is today's rule, and under B it stays the rule.

### C. Both

A decides who may be shown an assembly. B decides which assemblies a page may hold. Each
closes the fault alone. Together, a visitor cannot be shown a guarded assembly, and cannot
fill an open page with open ones its author never put there.

## Found beside it, and closed since: nothing counted the placements

A page placed as many assemblies as its markup named, all at once. The limits were how deep
(8) and how large one answer may be (2 MiB); nothing limited how many, so a view that writes
a visitor's text unescaped could be made to render an assembly as many times as that text
named it. The lead ordered a limit without waiting on the choice above, since it changes no
promise about access: one request places no more than 256 assemblies, at every depth
together, and the ones past that are refused before anything renders them (DESIGN 3.4). It
holds under any of the three.

## Advice

The lead advises A, with B on top of it. This seat advises the same, in that order.

- **A first.** It is the root. Guarded should mean guarded wherever an assembly is shown, and
  A needs no reading of anyone's source to be true.
- **B after it.** Every static view the examples and fixtures hold is read now, so B would
  hold for all of them at once.

## The question

**Which: A, B or both?**
