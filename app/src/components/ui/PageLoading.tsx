/** Shown while a lazy-loaded route's JS chunk is still downloading — brief on a fast
 * connection, but real content should never be blank/white while that happens. */
export function PageLoading() {
  return (
    <div className="grid min-h-[60vh] w-full place-items-center">
      <div className="flex items-center gap-3 text-vibe-ink-soft">
        <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-vibe-pink-dark [animation-delay:-0.3s]" />
        <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-vibe-pink-dark [animation-delay:-0.15s]" />
        <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-vibe-pink-dark" />
      </div>
    </div>
  )
}
