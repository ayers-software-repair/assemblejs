// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
export default function Tag(props: { readonly data: { readonly sku: string } }) {
  return <p className="tag">{props.data.sku}</p>;
}
