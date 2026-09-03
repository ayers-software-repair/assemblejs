// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * How the server runs. There are two, and neither is inferred.
 *
 * Development behaviour is enabled only by the mode being set to it explicitly. Every other
 * case is production, including an unset variable, because the predecessor's whole class of
 * defect began with a mode that defaulted to the permissive one when its source was empty.
 */
export type Mode = "development" | "production";
