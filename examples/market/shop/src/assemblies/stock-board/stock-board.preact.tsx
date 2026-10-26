// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { AssemblyProps } from "@asmjs/renderer-preact";
import { useEvents } from "@asmjs/renderer-preact/client";
import { useEffect, useState } from "preact/hooks";

type Level = { sku: string; name: string; left: number };

// What is on the shelves, for staff: every level as it stands, changing as orders come in, and
// a field to set each one. The page and the api behind it are both behind the shop's own
// access check; this assembly is guarded wherever it is shown.
export default function StockBoard({ data }: AssemblyProps<{ levels: Level[] }>) {
  const events = useEvents();
  const [levels, setLevels] = useState(data.levels);
  const [said, setSaid] = useState("");
  useEffect(
    () =>
      events.on<{ sku: string; left: number }>("stock:changed", (message) =>
        setLevels((now) =>
          now.map((level) =>
            level.sku === message.payload.sku ? { ...level, left: message.payload.left } : level,
          ),
        ),
      ),
    [events],
  );
  const set = async (sku: string, left: number): Promise<void> => {
    try {
      const answer = await fetch("/api/restock", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sku, left }),
      });
      const done = (await answer.json()) as { ok: boolean };
      setSaid(done.ok ? `${sku} set to ${left}` : `${sku} was not changed`);
    } catch {
      setSaid("The shop did not answer");
    }
  };
  return (
    <section className="board" aria-labelledby="board-title">
      <h1 id="board-title">Stock</h1>
      <p role="status" className="board-said">
        {said}
      </p>
      <table className="table">
        <thead>
          <tr>
            <th scope="col">What</th>
            <th scope="col">Left</th>
            <th scope="col">Set to</th>
          </tr>
        </thead>
        <tbody>
          {levels.map((level) => (
            <tr key={level.sku} className={level.left === 0 ? "board-none" : ""}>
              <th scope="row">
                {level.name} <code>{level.sku}</code>
              </th>
              <td>{level.left}</td>
              <td>
                <form
                  className="board-set"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const field = event.currentTarget.elements.namedItem(
                      "left",
                    ) as HTMLInputElement;
                    void set(level.sku, Number(field.value));
                  }}
                >
                  <input
                    type="number"
                    className="control"
                    name="left"
                    min={0}
                    max={999}
                    defaultValue={level.left}
                    aria-label={`Set how many ${level.name} are left`}
                  />
                  <button type="submit">Set</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
