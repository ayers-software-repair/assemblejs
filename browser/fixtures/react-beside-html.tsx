// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// The browser fixture: a React assembly and a plain HTML assembly on one page, bundled the way
// a real build would bundle them, so what chromium runs is what would ship.
import { useState } from "react";
import { start } from "@assemblejs/core/client";
import { hydrate } from "@assemblejs/renderer-react/client";
import type { AssemblyProps } from "@assemblejs/renderer-react";

const Counter = ({ data }: AssemblyProps) => {
  const [count, setCount] = useState(0);
  return (
    <button type="button" id="bump" onClick={() => setCount(count + 1)}>
      {String(data["label"])} {count}
    </button>
  );
};

declare global {
  interface Window {
    mounted: string[];
  }
}

window.mounted = [];
start({
  renderers: {
    react: {
      mount: (element, data, context) => {
        window.mounted.push(context.name);
        return hydrate(Counter).mount(element, data, context);
      },
    },
  },
});
