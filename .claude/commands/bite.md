---
description: Start or resume one ladder rung
---

Read `docs/PLAN.md` for the frozen ladder and `docs/TODO.md` for which rung is next; the rung is
$ARGUMENTS if given, otherwise the first unchecked box. Read `docs/DESIGN.md` for the sections
that rung builds, and `docs/DECISIONS.md` for what is already settled.

State the rung's proof command, from the ladder, before writing any code. Where the rung adds a
gate, construct the known-bad input and watch the gate refuse it BEFORE trusting it. Work only
inside `packages/`, `scripts/` and `docs/`.

Run the proof command yourself and paste its real output. Check the rung's box in `docs/TODO.md`
in the same commit that does the work. Then have a separate agent verify it at the source before
reporting it done.
