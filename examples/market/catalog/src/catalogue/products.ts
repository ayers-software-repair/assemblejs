// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
/** One thing the shop sells, as the catalogue team keeps it. Money is whole cents. */
export type Product = {
  sku: string;
  name: string;
  category: "beans" | "brewers" | "grinders";
  cents: number;
  blurb: string;
  /** Beans only: how far the roast was taken. */
  roast?: "light" | "medium" | "dark";
  /** Two letters and a tone for the tile that stands where a photograph would. */
  mark: string;
  tone: "a" | "b" | "c";
  facts: { [label: string]: string };
};

export const CATEGORIES: { slug: Product["category"]; name: string; blurb: string }[] = [
  { slug: "beans", name: "Beans", blurb: "Roasted on Tuesdays, posted on Wednesdays." },
  { slug: "brewers", name: "Brewers", blurb: "Everything between the kettle and the cup." },
  { slug: "grinders", name: "Grinders", blurb: "The part of the setup that matters most." },
];

export const PRODUCTS: readonly Product[] = [
  {
    sku: "kb-guji-250",
    name: "Guji Natural, Ethiopia",
    category: "beans",
    cents: 1600,
    roast: "light",
    blurb: "Dried in the cherry on raised beds. Blueberry, jasmine and a long, sweet finish.",
    mark: "Gu",
    tone: "a",
    facts: { Origin: "Guji, Ethiopia", Process: "Natural", Altitude: "2,100 m", Weight: "250 g" },
  },
  {
    sku: "kb-huila-250",
    name: "Huila Washed, Colombia",
    category: "beans",
    cents: 1450,
    roast: "medium",
    blurb: "A washed lot from a single association. Caramel, red apple, clean and round.",
    mark: "Hu",
    tone: "b",
    facts: { Origin: "Huila, Colombia", Process: "Washed", Altitude: "1,750 m", Weight: "250 g" },
  },
  {
    sku: "kb-gayo-250",
    name: "Gayo Wet-Hulled, Sumatra",
    category: "beans",
    cents: 1500,
    roast: "dark",
    blurb: "Heavy and low in acidity. Cedar, dark chocolate and a little sweet tobacco.",
    mark: "Ga",
    tone: "c",
    facts: { Origin: "Aceh, Sumatra", Process: "Wet-hulled", Altitude: "1,400 m", Weight: "250 g" },
  },
  {
    sku: "kb-decaf-250",
    name: "Sugarcane Decaf, Colombia",
    category: "beans",
    cents: 1550,
    roast: "medium",
    blurb: "Decaffeinated with a solvent made from cane. Brown sugar and orange peel.",
    mark: "De",
    tone: "b",
    facts: {
      Origin: "Cauca, Colombia",
      Process: "Sugarcane decaf",
      Altitude: "1,800 m",
      Weight: "250 g",
    },
  },
  {
    sku: "br-dripper-02",
    name: "Cone Dripper 02",
    category: "brewers",
    cents: 2800,
    blurb: "A ceramic cone with spiral ribs. Holds its heat and brews one to four cups.",
    mark: "Dr",
    tone: "a",
    facts: { Material: "Ceramic", Cups: "1 to 4", Filter: "02 cone paper", Weight: "410 g" },
  },
  {
    sku: "br-press-600",
    name: "Steel Press 600 ml",
    category: "brewers",
    cents: 4200,
    blurb: "A double-walled press that keeps a pot hot through a slow morning.",
    mark: "Pr",
    tone: "c",
    facts: {
      Material: "Stainless steel",
      Capacity: "600 ml",
      Filter: "Two-stage mesh",
      Weight: "720 g",
    },
  },
  {
    sku: "br-kettle-900",
    name: "Gooseneck Kettle 900 ml",
    category: "brewers",
    cents: 6400,
    blurb: "A slow, exact pour from a counterweighted handle. For any hob, induction too.",
    mark: "Ke",
    tone: "b",
    facts: {
      Material: "Stainless steel",
      Capacity: "900 ml",
      Hob: "Gas, electric, induction",
      Weight: "560 g",
    },
  },
  {
    sku: "br-scale-01",
    name: "Brew Scale 0.1 g",
    category: "brewers",
    cents: 4800,
    blurb: "Weighs to a tenth of a gram and times the pour. Charges over USB-C.",
    mark: "Sc",
    tone: "a",
    facts: { Precision: "0.1 g", Capacity: "2 kg", Battery: "USB-C, 30 hours", Weight: "320 g" },
  },
  {
    sku: "gr-hand-38",
    name: "Hand Grinder, 38 mm burr",
    category: "grinders",
    cents: 12900,
    blurb: "Conical steel burrs on two bearings. Thirty seconds for a filter dose.",
    mark: "Hg",
    tone: "c",
    facts: {
      Burrs: "38 mm conical steel",
      Capacity: "25 g",
      Steps: "24 per turn",
      Weight: "540 g",
    },
  },
  {
    sku: "gr-flat-64",
    name: "Flat Burr Grinder 64",
    category: "grinders",
    cents: 38900,
    blurb: "Single-dose, flat burrs, almost nothing left behind. Quiet enough for 6 a.m.",
    mark: "Fl",
    tone: "a",
    facts: {
      Burrs: "64 mm flat steel",
      Retention: "Under 0.2 g",
      Motor: "Brushless, 150 W",
      Weight: "5.8 kg",
    },
  },
  {
    sku: "gr-brush",
    name: "Grinder Brush",
    category: "grinders",
    cents: 900,
    blurb: "Stiff bristles on a beech handle, for burrs and the chute.",
    mark: "Br",
    tone: "b",
    facts: { Bristles: "Natural, stiff", Handle: "Beech", Length: "18 cm", Weight: "30 g" },
  },
  {
    sku: "gr-bellows",
    name: "Dosing Bellows",
    category: "grinders",
    cents: 2200,
    blurb: "A silicone bellows that clears the last grounds from a single-dose hopper.",
    mark: "Be",
    tone: "c",
    facts: { Material: "Silicone", Fits: "58 mm hoppers", Colour: "Black", Weight: "65 g" },
  },
];

/** A price as it is written for a visitor. */
export const price = (cents: number): string => `$${(cents / 100).toFixed(2)}`;

/** Which of three bands a price falls in, the bands the facets offer. */
export const band = (cents: number): "low" | "mid" | "high" =>
  cents < 2500 ? "low" : cents <= 10000 ? "mid" : "high";

export const productBySku = (sku: string | undefined): Product | undefined =>
  PRODUCTS.find((product) => product.sku === sku);

/** Every product of a category, or of all of them, that holds every word asked for. */
export function productsIn(category: string | undefined, words: string | null): Product[] {
  const wanted = (words ?? "")
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word !== "");
  return PRODUCTS.filter(
    (product) =>
      (category === undefined || category === "all" || product.category === category) &&
      wanted.every((word) => `${product.name} ${product.blurb}`.toLowerCase().includes(word)),
  );
}
