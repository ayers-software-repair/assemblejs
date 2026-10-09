// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
export default function Tally(props: { readonly data: { readonly count: number } }) {
  return <p className="tally">{props.data.count}</p>;
}
