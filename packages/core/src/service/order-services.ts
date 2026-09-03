// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { JsonObject } from "../json/json-object.js";
import type { ServiceDefinition } from "./service-definition.js";
import { ServiceOrderError } from "./service-order-error.js";

/**
 * Declaration order, with `after` honoured, settled once at boot.
 *
 * Every way this can be wrong is a boot failure rather than a surprise at request time: a
 * duplicate name, an `after` naming a service that does not exist, and a cycle. A set of
 * services whose order depends on which request arrives first is a set nobody can reason about.
 */
export function orderServices<D extends JsonObject>(
  services: readonly ServiceDefinition<D>[],
): readonly ServiceDefinition<D>[] {
  const problems: string[] = [];
  const byName = new Map<string, ServiceDefinition<D>>();
  for (const service of services) {
    if (byName.has(service.name)) {
      problems.push(`service "${service.name}" is declared more than once`);
    }
    byName.set(service.name, service);
  }
  for (const service of services) {
    for (const dependency of service.after ?? []) {
      if (!byName.has(dependency)) {
        problems.push(
          `service "${service.name}" must follow "${dependency}", which is not declared`,
        );
      }
    }
  }
  if (problems.length > 0) throw new ServiceOrderError(problems);

  // Declaration order is the default and is preserved wherever `after` does not override it,
  // so reading the list top to bottom tells you the order unless something says otherwise.
  const ordered: ServiceDefinition<D>[] = [];
  const done = new Set<string>();
  const visiting = new Set<string>();

  const visit = (service: ServiceDefinition<D>, path: readonly string[]): void => {
    if (done.has(service.name)) return;
    if (visiting.has(service.name)) {
      throw new ServiceOrderError([
        `services depend on each other in a circle: ${[...path, service.name].join(" -> ")}`,
      ]);
    }
    visiting.add(service.name);
    for (const dependency of service.after ?? []) {
      const next = byName.get(dependency);
      if (next !== undefined) visit(next, [...path, service.name]);
    }
    visiting.delete(service.name);
    done.add(service.name);
    ordered.push(service);
  };

  for (const service of services) visit(service, []);
  return ordered;
}
