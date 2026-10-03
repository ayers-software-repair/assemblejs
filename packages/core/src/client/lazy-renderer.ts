// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { ClientRenderer } from "./client-renderer.js";
import type { MountHandle } from "./mount-handle.js";

/**
 * One browser half for a whole build, which loads each assembly's own module the first time an
 * assembly of that name mounts, keyed by name.
 *
 * This is what makes an island a native module: the page loads the runtime, and an assembly's
 * code arrives only when that assembly is due to mount, so a page that places it below the fold
 * with `visible` pays for it only on scroll. The handle is returned at once and the mount
 * happens when the module arrives; an unmount before then means it never happens at all.
 *
 * An assembly with no module in this build gets a handle that does nothing, and a warning, the
 * same as the runtime gives an assembly whose renderer is missing: a static assembly never gets
 * here, because it is declared `none` and never mounted. A module that fails
 * to load or a mount that throws is reported against the assembly's name and leaves it as the
 * markup the server sent, the same as the runtime does for any other mount that fails.
 */
export function lazyRenderer(
  modules: Readonly<Record<string, () => Promise<{ readonly default: ClientRenderer }>>>,
): ClientRenderer {
  return {
    mount(element, data, context) {
      const load = Object.hasOwn(modules, context.name) ? modules[context.name] : undefined;
      if (load === undefined) {
        console.warn(
          `assemblejs: no module in this build for "${context.name}", so it was left as the markup the server sent`,
        );
        return { unmount: () => undefined };
      }

      let inner: MountHandle | undefined;
      let gone = false;
      load()
        .then((module) => {
          if (!gone) inner = module.default.mount(element, data, context);
        })
        .catch((error: unknown) => {
          console.error(`assemblejs: "${context.name}" did not mount`, error);
        });
      return {
        unmount: () => {
          gone = true;
          inner?.unmount();
        },
      };
    },
  };
}
