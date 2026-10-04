// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
export default function Card(props: { readonly data: { readonly label: string } }) {
  return <p className="card">{props.data.label}</p>;
}
