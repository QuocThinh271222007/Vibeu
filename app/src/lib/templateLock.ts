import { findTemplate } from '@/data/templates'
import { resolveTemplatePreview } from '@/data/curatedPreviews'

export interface LockedTemplateView {
  templateId: string
  name: string
  image: string
  alt: string
  objectPosition: string
}

/**
 * A template's AI-generated cover photo can't be reconstructed pixel-for-pixel by the
 * recipe-driven compositor — it's a real generated photo, not a formula. So loading a
 * template from the Library locks Studio into showing that exact photo instead of an
 * approximation (see loadTemplate in studioStore.ts). The underlying recipe (fingers/
 * skinTone) is still set and still drives the self-contained QR export, which
 * intentionally keeps reconstructing from the recipe rather than embedding/hosting the
 * photo itself (no new image-hosting infra needed for salons scanning the QR).
 */
export function getLockedTemplateView(templateId: string | null): LockedTemplateView | null {
  if (!templateId) return null
  const template = findTemplate(templateId)
  if (!template) return null
  const preview = resolveTemplatePreview(template)
  if (preview?.type !== 'curated' || !preview.image) return null
  return {
    templateId,
    name: template.name,
    image: preview.image,
    alt: preview.alt ?? template.name,
    objectPosition: preview.objectPosition ?? 'center center',
  }
}
