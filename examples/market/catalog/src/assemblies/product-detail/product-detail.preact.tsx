// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { AssemblyProps } from "@asmjs/renderer-preact";
import { useState } from "preact/hooks";
import type { Found, Missing } from "./product-detail.service.js";

const TONES = ["a", "b", "c"];

// One product, as the catalogue team shows it: what it is, three views of it and, for beans,
// how it is ground. The grind is a form that asks for the same page with `?grind=`: the buy box
// beside it is the shop's, on another server's bus, and reads the choice from the address. It
// works before any script arrives; once this is live, choosing is enough.
export default function ProductDetail({ data }: AssemblyProps<Found | Missing>) {
  const [view, setView] = useState(0);
  if (!data.found) {
    return (
      <section className="detail">
        <h1>We could not find that</h1>
        <p className="notice notice--strong">
          Nothing in the catalogue is called <code>{data.sku}</code>. It may have sold through.
        </p>
        <p>
          <a href="/c/all">See everything on the shelves</a>
        </p>
      </section>
    );
  }
  const tones = [data.tone, ...TONES.filter((tone) => tone !== data.tone)];
  return (
    <section className="detail" aria-labelledby="detail-name">
      <nav className="detail-trail" aria-label="Where this is">
        <a href="/">Home</a> / <a href={`/c/${data.category.slug}`}>{data.category.name}</a>
      </nav>
      <div className="detail-views">
        <span className={`tile tile-${tones[view]}`} aria-hidden="true">
          {data.mark}
        </span>
        <div className="detail-picks" role="group" aria-label="Views of the product">
          {tones.map((tone, at) => (
            <button
              key={tone}
              type="button"
              className={`pick tile-${tone}`}
              aria-pressed={at === view}
              aria-label={`View ${at + 1}`}
              onClick={() => setView(at)}
            >
              {at + 1}
            </button>
          ))}
        </div>
      </div>
      <div className="detail-words">
        <h1 id="detail-name">{data.name}</h1>
        <p className="detail-price">{data.price}</p>
        <p>{data.blurb}</p>
        {data.grinds.length > 0 && (
          <form className="detail-grind" method="get">
            <label className="field">
              <span>Ground for</span>
              <select
                name="grind"
                value={data.grind}
                onChange={(event) => event.currentTarget.form?.requestSubmit()}
              >
                {data.grinds.map((one) => (
                  <option key={one} value={one}>
                    {one}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit">Choose</button>
          </form>
        )}
      </div>
    </section>
  );
}
