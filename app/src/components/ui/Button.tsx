import { forwardRef } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import clsx from 'clsx'

type Variant = 'primary' | 'secondary' | 'ghost' | 'dark'
type Size = 'md' | 'lg' | 'sm'

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref'> {
  variant?: Variant
  size?: Size
}

const variantClass: Record<Variant, string> = {
  primary:
    'text-white shadow-vibe bg-[linear-gradient(100deg,#7fa8e0,#ff92f9_55%,#ffd879)] bg-[length:180%_180%] hover:bg-[position:100%_0%]',
  secondary: 'bg-white text-vibe-ink border-2 border-vibe-ink/10 hover:border-vibe-pink/50 shadow-sm',
  ghost: 'bg-transparent text-vibe-ink hover:bg-white/60',
  dark: 'bg-vibe-ink text-white hover:bg-vibe-ink/90 shadow-vibe',
}

const sizeClass: Record<Size, string> = {
  sm: 'px-4 py-2 text-sm gap-1.5',
  md: 'px-6 py-3 text-base gap-2',
  lg: 'px-8 py-4 text-lg gap-2.5',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', className, children, ...props },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      whileHover={{ scale: 1.035, y: -1 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
      className={clsx(
        'inline-flex items-center justify-center rounded-full font-display font-semibold transition-[background-position,box-shadow] duration-500',
        variantClass[variant],
        sizeClass[size],
        className,
      )}
      {...props}
    >
      {children}
    </motion.button>
  )
})
