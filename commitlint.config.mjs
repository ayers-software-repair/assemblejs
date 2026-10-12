// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// The commit rule is the house's, read from its byte-copy: the hook, CI's `commits` job and
// `check:commit-rule` all judge a message by this one config.
export { default } from "./scripts/house/commitlint.config.mjs";
