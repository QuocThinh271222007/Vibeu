import { useEffect, useState } from 'react'
import type { ColorPreset, HandData, SkinToneId, StickerCategory, StickerDef } from '@/types/vibeu'

interface ColorManifest {
  presets: ColorPreset[]
}

interface StickerManifest {
  categories: StickerCategory[]
  stickers: StickerDef[]
}

function cachedFetch<T>(url: string): () => Promise<T> {
  let promise: Promise<T> | null = null
  return () => {
    if (!promise) {
      promise = fetch(url).then((r) => {
        if (!r.ok) throw new Error(`Failed to load ${url}`)
        return r.json() as Promise<T>
      })
    }
    return promise
  }
}

const getColorManifest = cachedFetch<ColorManifest>('/assets/colors/manifest.json')
const getStickerManifest = cachedFetch<StickerManifest>('/assets/stickers/manifest.json')
const getHandCozy = cachedFetch<HandData>('/assets/hands/cozy/coordinates.json')
const getHandMatcha = cachedFetch<HandData>('/assets/hands/matcha/coordinates.json')

export function getHandData(tone: SkinToneId): Promise<HandData> {
  return tone === 'cozy' ? getHandCozy() : getHandMatcha()
}

function useAsync<T>(loader: () => Promise<T>, deps: unknown[]): { data: T | null; loading: boolean; error: boolean } {
  const [state, setState] = useState<{ data: T | null; loading: boolean; error: boolean }>({
    data: null,
    loading: true,
    error: false,
  })

  useEffect(() => {
    let alive = true
    setState((s) => ({ ...s, loading: true }))
    loader()
      .then((data) => {
        if (alive) setState({ data, loading: false, error: false })
      })
      .catch(() => {
        if (alive) setState({ data: null, loading: false, error: true })
      })
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return state
}

export function useColorPresets() {
  const { data, loading, error } = useAsync(getColorManifest, [])
  return { presets: data?.presets ?? [], loading, error }
}

export function useStickers() {
  const { data, loading, error } = useAsync(getStickerManifest, [])
  return { stickers: data?.stickers ?? [], categories: data?.categories ?? [], loading, error }
}

export function useHandData(tone: SkinToneId) {
  const { data, loading, error } = useAsync(() => getHandData(tone), [tone])
  return { hand: data, loading, error }
}

export function stickerAssetUrl(path: string) {
  return `/assets/stickers/${path}`
}

export function colorSwatchUrl(path: string) {
  return `/assets/colors/${path}`
}

export function handBaseUrl(tone: SkinToneId) {
  return `/assets/hands/${tone}/base.jpg`
}

export async function getPresetById(id: string): Promise<ColorPreset | undefined> {
  const m = await getColorManifest()
  return m.presets.find((p) => p.id === id)
}

export async function getStickerById(id: string): Promise<StickerDef | undefined> {
  const m = await getStickerManifest()
  return m.stickers.find((s) => s.id === id)
}

export async function getAllPresets(): Promise<ColorPreset[]> {
  return (await getColorManifest()).presets
}

export async function getAllStickers(): Promise<StickerDef[]> {
  return (await getStickerManifest()).stickers
}
