// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Where the name of a tag ends, as the tokenizer reads it: at a tab, a line feed, a form feed,
 * a carriage return, a space, a slash or the tag's own end. One character class, as the source
 * of a pattern, so every reader of tags ends a name at the same place: `<title-bar>` is an
 * element named title-bar, and `</script foo>` is a script's end tag.
 */
export const TAG_NAME_END = "[\\t\\n\\f\\r />]";
