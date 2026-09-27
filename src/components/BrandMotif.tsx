interface Props {
  size?: number;
}

// The one intentional MuJam graphic mark — a beamed note pair in the
// app's gold-to-violet gradient, echoing the favicon. Used once, with
// intent (the home hero), not scattered as a repeated divider glyph.
export default function BrandMotif({ size = 72 }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="brand-motif">
      <defs>
        <linearGradient id="brand-motif-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffb648" />
          <stop offset="100%" stopColor="#b06bff" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="31" fill="url(#brand-motif-grad)" opacity="0.14" />
      <path
        d="M25 45V19.5l17-4.3V40"
        fill="none"
        stroke="url(#brand-motif-grad)"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="21" cy="47" r="6.2" fill="url(#brand-motif-grad)" />
      <circle cx="38" cy="42" r="6.2" fill="url(#brand-motif-grad)" />
    </svg>
  );
}
