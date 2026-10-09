// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { useState } from "preact/hooks";

export const shadow = true;

export default function PreactBox() {
  const [count, setCount] = useState(0);
  return (
    <button type="button" class="bump" id="preact-bump" onClick={() => setCount(count + 1)}>
      preact {count}
    </button>
  );
}
