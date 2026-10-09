// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { useState } from "react";

// Rendered in its own shadow root: no page style reaches in, and none of its own leaks out.
export const shadow = true;

export default function Panel() {
  const [opened, setOpened] = useState(0);
  return (
    <section>
      <p className="title" id="panel-title">
        panel
      </p>
      <button id="panel-open" type="button" onClick={() => setOpened(opened + 1)}>
        Opened {opened}
      </button>
    </section>
  );
}
