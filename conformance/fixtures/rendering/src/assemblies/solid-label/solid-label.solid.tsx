// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
export default function Label(props: { readonly data: { readonly label: string } }) {
  return (
    <p class="label" data-framework="solid">
      {props.data.label}
    </p>
  );
}
