// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { useState } from "react";

export const shadow = true;

export default function ReactBox() {
  const [count, setCount] = useState(0);
  return (
    <button type="button" className="bump" id="react-bump" onClick={() => setCount(count + 1)}>
      react {count}
    </button>
  );
}
