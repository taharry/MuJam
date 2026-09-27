// A quiet, generic separator line. The one expressive graphic mark for
// the whole app lives in BrandMotif — this stays plain on purpose so
// it doesn't compete with it.
export default function Divider() {
  return <div className="divider" aria-hidden="true" />;
}
