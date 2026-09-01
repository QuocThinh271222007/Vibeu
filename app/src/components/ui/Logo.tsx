import { Link } from 'react-router-dom'

export function Logo({ className = '' }: { className?: string }) {
  return (
    <Link to="/" className={`group flex items-center gap-2 ${className}`}>
      <span className="relative grid h-9 w-9 place-items-center rounded-2xl bg-[linear-gradient(135deg,#90B8EB,#FF92F9)] shadow-vibe transition-transform group-hover:rotate-[-8deg] group-hover:scale-105">
        <span className="font-display text-lg font-bold text-white">v</span>
        <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-vibe-yellow" />
      </span>
      <span className="font-display text-xl font-semibold tracking-tight text-vibe-ink">
        VIBE<span className="vibe-gradient-text">U</span>
      </span>
    </Link>
  )
}
