// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
/** A parcel on its way, as the fulfilment team keeps it. */
export type Shipment = { order: string; city: string; parcels: number; received: number };

export const STEPS = [
  "Order received",
  "Picked and packed",
  "Handed to the courier",
  "Out for delivery",
];

// How long each step takes in a showcase: a parcel moves on every twenty seconds, so the page
// can be watched changing. A real depot would be told by its scanners.
const STEP_MS = 20_000;

// Shipments, by the order they are for. Held in memory.
const shipments = new Map<string, Shipment>();

export const depot = {
  take(order: string, city: string, parcels: number): Shipment {
    const shipment = { order, city, parcels, received: Date.now() };
    shipments.set(order, shipment);
    return shipment;
  },
  find: (order: string | undefined): Shipment | undefined => shipments.get(order ?? ""),
  all: (): Shipment[] =>
    [...shipments.values()].sort((one, other) => other.received - one.received),
  /** Which step a shipment has reached, by how long ago it was taken in. */
  step: (shipment: Shipment, now: number = Date.now()): number =>
    Math.min(STEPS.length - 1, Math.floor((now - shipment.received) / STEP_MS)),
  /** Milliseconds until its next step, or 0 once it has reached the last. */
  next: (shipment: Shipment, now: number = Date.now()): number =>
    depot.step(shipment, now) === STEPS.length - 1
      ? 0
      : STEP_MS - ((now - shipment.received) % STEP_MS),
};
