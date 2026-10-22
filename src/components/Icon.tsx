export default function Icon({ name, className = '' }: { name: string; className?: string }) {
  return (
    <svg className={`icon ${className}`} aria-hidden="true">
      <use href={`#i-${name}`} />
    </svg>
  );
}

export function Stars({ rating, label }: { rating: number; label?: string }) {
  return (
    <span className="stars" role="img" aria-label={label ?? `Rated ${rating} out of 5`}>
      <span style={{ width: `${(rating / 5) * 100}%` }} />
    </span>
  );
}
