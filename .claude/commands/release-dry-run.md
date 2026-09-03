---
description: Rehearse the changesets release without publishing anything
---

Run `pnpm changeset status --verbose`, then `pnpm build`, then `node scripts/check-pack.mjs`.
Nothing here touches the npm registry. Report which packages would bump and to what version.
