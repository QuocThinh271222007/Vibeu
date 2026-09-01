import { useState } from 'react'
import { HandCanvas } from '@/components/studio/HandCanvas'
import { fingersFromTemplate } from '@/lib/templateUtils'
import type { Template } from '@/types/vibeu'

interface TemplatePreviewMediaProps {
  template: Template
  className?: string
  imageClassName?: string
  eager?: boolean
}

/**
 * Marketing/library media surface for a Template.
 *
 * Curated photography is intentionally preferred here because a showcase card
 * has a different quality bar than an editable compositor. If a curated asset
 * is missing or fails to load, the component falls back to the live HandCanvas
 * so legacy templates never render a broken image.
 */
export function TemplatePreviewMedia({
  template,
  className = '',
  imageClassName = '',
  eager = false,
}: TemplatePreviewMediaProps) {
  const [curatedFailed, setCuratedFailed] = useState(false)
  const preview = template.preview
  const canUseCurated = preview?.type === 'curated' && Boolean(preview.image) && !curatedFailed

  return (
    <div className={`relative overflow-hidden bg-vibe-cream ${className}`}>
      {canUseCurated ? (
        <img
          src={preview!.image}
          alt={preview!.alt ?? template.name}
          className={`h-full w-full object-cover ${imageClassName}`}
          style={{ objectPosition: preview!.objectPosition ?? 'center center' }}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          draggable={false}
          onError={() => setCuratedFailed(true)}
        />
      ) : (
        <HandCanvas skinTone={template.skinTone} fingers={fingersFromTemplate(template)} className="rounded-none" />
      )}
    </div>
  )
}
