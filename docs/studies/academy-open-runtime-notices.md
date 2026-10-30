# Open runtime notice inventory: incomplete

Source verification of exact `@vivari/core@1.1.4`, pinned upstream commit
`8e91ade350445a61abed81dad61dc6ab1734cb40`, before product redistribution/adoption.
The published 27-file archive and its checksum are recorded in `academy-open-package-probe.md`.
This is an open inventory, not a complete notice bundle.

The pinned [root MIT licence](https://github.com/maitrungduc1410/vivari/blob/8e91ade350445a61abed81dad61dc6ab1734cb40/LICENSE)
permits commercial redistribution subject to its notice condition. The fixture carries that
exact notice. It does not replace notices for code bundled from other projects. The published
archive has no LICENSE/NOTICE file, and the shipped worker bundles omit full third-party terms.

Concrete source-backed gaps:

- The process worker includes Node libraries/internal modules. Pinned
  [`net.js`](https://github.com/maitrungduc1410/vivari/blob/8e91ade350445a61abed81dad61dc6ab1734cb40/packages/runtime/node/lib/net.js#L6)
  carries the Node/Joyent MIT notice, absent from the published worker.
- The vendored
  [`smol-toml` source](https://github.com/maitrungduc1410/vivari/blob/8e91ade350445a61abed81dad61dc6ab1734cb40/packages/runtime/node/vendor/smol-toml.js#L19)
  carries BSD-3-Clause terms, also absent from the worker. Its redistribution terms need
  preservation alongside the actual bundled code.
- Embedded VFS, compression, crypto and llhttp Wasm need a per-payload source/licence inventory.
  The pinned [llhttp generator](https://github.com/maitrungduc1410/vivari/blob/8e91ade350445a61abed81dad61dc6ab1734cb40/scripts/vendor-llhttp.mjs#L11)
  identifies its undici 8.7.0 payload and MIT provenance. Rust manifests/locks identify other
  inputs but are not a collected licence bundle.

The separate source reader inspected the complete pinned repository tree and actual published
workers: there is no aggregate third-party notice file or per-binary licence manifest there.
Complete the inventory from the actual bundled versions, reconcile generated/vendored source
against dependency metadata, and collect their required notices before product redistribution.
Do not infer completeness from the core package's empty runtime-dependency field or MIT label.
No vendor contact, account, paid runtime, hosting change or adoption follows from this record.
