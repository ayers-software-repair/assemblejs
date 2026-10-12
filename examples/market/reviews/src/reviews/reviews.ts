// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
/** What one person said of one product, as the reviews team keeps it. */
export type Review = {
  sku: string;
  by: string;
  stars: 1 | 2 | 3 | 4 | 5;
  said: string;
  on: string;
};

const REVIEWS: readonly Review[] = [
  {
    sku: "kb-guji-250",
    by: "Imani",
    stars: 5,
    on: "2026-09-28",
    said: "Blueberry, like the bag says. Best as a slow pour-over.",
  },
  {
    sku: "kb-guji-250",
    by: "Tomasz",
    stars: 4,
    on: "2026-09-12",
    said: "Lovely and bright. A little wild as espresso.",
  },
  {
    sku: "kb-guji-250",
    by: "Sena",
    stars: 5,
    on: "2026-08-30",
    said: "The one I keep reordering.",
  },
  {
    sku: "kb-huila-250",
    by: "Mirela",
    stars: 4,
    on: "2026-09-20",
    said: "Round and easy. Everyone at the office likes it.",
  },
  {
    sku: "kb-huila-250",
    by: "Okonkwo",
    stars: 5,
    on: "2026-09-02",
    said: "Caramel all the way down.",
  },
  {
    sku: "kb-gayo-250",
    by: "Anneli",
    stars: 3,
    on: "2026-09-15",
    said: "Heavy. Good with milk, too much for me black.",
  },
  {
    sku: "kb-decaf-250",
    by: "Farid",
    stars: 5,
    on: "2026-09-25",
    said: "I could not tell it was decaf, and I tried.",
  },
  {
    sku: "br-dripper-02",
    by: "Imani",
    stars: 5,
    on: "2026-08-11",
    said: "Holds its heat far better than the plastic one I had.",
  },
  {
    sku: "br-dripper-02",
    by: "Jun",
    stars: 4,
    on: "2026-07-29",
    said: "Brews beautifully. Mind the lip when you wash it.",
  },
  {
    sku: "br-kettle-900",
    by: "Sena",
    stars: 5,
    on: "2026-09-05",
    said: "The pour is as slow as you want it to be.",
  },
  {
    sku: "br-scale-01",
    by: "Tomasz",
    stars: 4,
    on: "2026-08-19",
    said: "Fast and exact. The timer button is easy to press by accident.",
  },
  {
    sku: "gr-hand-38",
    by: "Mirela",
    stars: 5,
    on: "2026-09-18",
    said: "Thirty seconds for a cup, as promised. Travels well.",
  },
  {
    sku: "gr-hand-38",
    by: "Farid",
    stars: 4,
    on: "2026-08-02",
    said: "Even grind. My arm noticed the espresso setting.",
  },
  {
    sku: "gr-flat-64",
    by: "Okonkwo",
    stars: 5,
    on: "2026-09-27",
    said: "Quiet, and there is truly nothing left in the chute.",
  },
];

export const reviewsOf = (sku: string | undefined): Review[] =>
  REVIEWS.filter((review) => review.sku === sku);

/** How a product is rated: how many said so, and the mean of what they gave, to one place. */
export const ratingOf = (sku: string | undefined): { count: number; mean: number } => {
  const given = reviewsOf(sku).map((review) => review.stars);
  const sum = given.reduce((total, stars) => total + stars, 0);
  return {
    count: given.length,
    mean: given.length === 0 ? 0 : Math.round((sum / given.length) * 10) / 10,
  };
};
