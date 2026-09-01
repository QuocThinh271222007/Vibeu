import { useEffect, useState } from 'react'
import { getMaterialPreviewUrl } from '@/data/loaders'
import { renderMaterialSwatch } from '@/lib/materialSwatch'
import type { EffectId } from '@/types/vibeu'

/**
 * Visual preview for one material effect (Defect A) — a real photographed/rendered asset
 * when `public/assets/materials/manifest.json` supplies one (asset-ready, per the
 * corrective spec), otherwise a deterministic canvas swatch rendered through the exact
 * same compositor the live nail uses (never a generic icon or a colour-only swatch, and
 * never silently disagreeing with what the effect actually looks like on a real nail).
 */
export function MaterialPreview({ effect, className = '' }: { effect: EffectId; className?: string }) {
  const [assetUrl, setAssetUrl] = useState<string | null | undefined>(undefined)

  useEffect(() => {
    let alive = true
    getMaterialPreviewUrl(effect).then((url) => {
      if (alive) setAssetUrl(url)
    })
    return () => {
      alive = false
    }
  }, [effect])

  const canvasUrl = assetUrl === null ? renderMaterialSwatch(effect).toDataURL() : null
  const src = assetUrl ?? canvasUrl

  return (
    <div className={`overflow-hidden rounded-xl bg-vibe-cream ${className}`}>
      {src ? (
        <img src={src} alt="" className="h-full w-full object-cover" draggable={false} />
      ) : (
        <div className="h-full w-full animate-pulse bg-vibe-cream" />
      )}
    </div>
  )
}
