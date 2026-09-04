export function Avatar({
  name,
  color,
  url,
  size = 40,
  className = '',
}: {
  name: string
  color: string
  url?: string | null
  size?: number
  className?: string
}) {
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className={`shrink-0 rounded-full object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    )
  }
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full font-display font-bold text-white ${className}`}
      style={{ width: size, height: size, background: color, fontSize: Math.round(size * 0.4) }}
    >
      {name.trim().charAt(0).toUpperCase() || 'V'}
    </span>
  )
}
