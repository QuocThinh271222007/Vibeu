import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, XCircle } from 'lucide-react'

interface ToastItem {
  id: number
  kind: 'success' | 'error'
  message: string
}

interface ToastContextValue {
  push: (kind: 'success' | 'error', message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const idRef = useRef(0)

  const push = useCallback((kind: 'success' | 'error', message: string) => {
    const id = ++idRef.current
    setItems((cur) => [...cur, { id, kind, message }])
    setTimeout(() => setItems((cur) => cur.filter((t) => t.id !== id)), 4000)
  }, [])

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[200] flex w-[min(20rem,calc(100vw-2rem))] flex-col gap-2">
        <AnimatePresence>
          {items.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className={`pointer-events-auto flex items-start gap-2 rounded-2xl px-4 py-3 text-sm font-medium shadow-vibe-lg ${
                t.kind === 'success' ? 'bg-vibe-ink text-white' : 'bg-red-600 text-white'
              }`}
            >
              {t.kind === 'success' ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : <XCircle size={16} className="mt-0.5 shrink-0" />}
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}
