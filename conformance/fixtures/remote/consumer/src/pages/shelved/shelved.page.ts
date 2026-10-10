// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { definePage } from "@assemblejs/core";

const producer = process.env.PRODUCER_ORIGIN ?? "";

// The producer's parent, whose own view places the producer's card.
export default definePage({ place: { shelf: { url: `${producer}/assembly/shelf/` } } });
