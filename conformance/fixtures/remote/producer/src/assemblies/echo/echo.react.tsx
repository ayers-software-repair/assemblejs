export default function Echo(props: { readonly data: { readonly note: string } }) {
  return <p className="echo">{props.data.note}</p>;
}
