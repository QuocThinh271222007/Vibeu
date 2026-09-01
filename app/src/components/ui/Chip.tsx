import clsx from 'clsx'
import { motion } from 'framer-motion'

interface ChipProps {
  active?: boolean
  onClick?: () => void
  children: React.ReactNode
  className?: string
}

export function Chip({ active, onClick, children, className }: ChipProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.94 }}
      className={clsx(
        'whitespace-nowrap rounded-full border-2 px-4 py-1.5 text-sm font-medium transition-colors',
        active
          ? 'border-transparent bg-vibe-ink text-white shadow-vibe'
          : 'border-vibe-ink/10 bg-white/70 text-vibe-ink-soft hover:border-vibe-pink/40 hover:text-vibe-ink',
        className,
      )}
    >
      {children}
    </motion.button>
  )
}
