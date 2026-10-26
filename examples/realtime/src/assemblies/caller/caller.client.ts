// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { api } from "@asmjs/core/client";
import type { ClientRenderer } from "@asmjs/core/client";

interface Answer {
  readonly word: string;
  readonly host: string;
  readonly lang: string | null;
}

// Asks the api of the server it came from and writes the answer: the word, the host that
// answered and the language that host was told.
const caller: ClientRenderer = {
  mount(element) {
    const line = element.querySelector("p");
    void fetch(api("/api/answer"))
      .then((response) => response.json() as Promise<Answer>)
      .then((answer) => {
        line?.setAttribute("data-host", answer.host);
        line?.setAttribute("data-lang", answer.lang ?? "");
        line?.setAttribute("data-answer", answer.word);
      })
      .catch(() => line?.setAttribute("data-answer", "failed"));
    return { unmount: () => undefined };
  },
};
export default caller;
