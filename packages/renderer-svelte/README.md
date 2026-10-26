# @asmjs/renderer-svelte

Write an AssembleJS assembly in Svelte.

    src/assemblies/cart/cart.svelte

No infix, unlike the React renderer: `.svelte` says which framework wrote the file on its own.

The events object arrives as a prop, which is Svelte's idiom; the React renderer uses a context,
which is React's. Neither wraps the other's habits, and an assembly in either can talk to an
assembly in the other with nothing in between.

A view types what it is handed by the renderer's own type, its data and its events:

    <script lang="ts">
      import type { AssemblyProps } from "@asmjs/renderer-svelte";

      let { data, events }: AssemblyProps<{ label: string }> = $props();
    </script>

Svelte is a peer dependency, so installing this does not install a framework you were not going
to use.

See <https://assemblejs.com/>.

Apache-2.0. Copyright Ayers Electronics Inc.
