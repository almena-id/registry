/**
 * Thin concentric arcs offset to the top-right corner, as on a banknote or an
 * identity card: the pattern over a credential card. Decorative.
 */
export function Guilloche({ className }: { className?: string }) {
  const rings = Array.from({ length: 10 }, (_, index) => index);
  return (
    <svg
      className={className}
      viewBox="0 0 320 202"
      preserveAspectRatio="xMaxYMin slice"
      aria-hidden
    >
      <g fill="none" stroke="currentColor" strokeWidth="1">
        {rings.map((index) => (
          <ellipse
            key={index}
            cx={300}
            cy={-10}
            rx={40 + index * 26}
            ry={30 + index * 22}
            transform={`rotate(${-12 + index * 2} 300 -10)`}
          />
        ))}
      </g>
    </svg>
  );
}
