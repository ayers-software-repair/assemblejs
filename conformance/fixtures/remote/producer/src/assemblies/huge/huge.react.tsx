// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
export default function Huge(props: { readonly data: { readonly blob: string } }) {
  return <p className="huge">{props.data.blob}</p>;
}
