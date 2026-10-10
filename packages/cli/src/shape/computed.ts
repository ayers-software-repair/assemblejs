// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * The mark, in what is shown of a project, on a value its source computes: the file is read and
 * never run, so the value is known only to be there. It is nothing an author could have meant:
 * a route starts with a slash, a name has no bracket, a url has a scheme.
 */
export const COMPUTED = "(computed)";
