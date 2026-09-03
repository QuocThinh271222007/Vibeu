import type { DecalAsset, FingerDesign, FingerId, SkinToneId } from '@/types/vibeu'

/** Everything needed to redraw a design pixel-for-pixel, independent of any backend. */
export interface SharedDesignPayload {
  skinTone: SkinToneId
  fingers: Record<FingerId, FingerDesign>
  /** Only the custom (user-uploaded) decals actually referenced by `fingers` — see
   * collectUsedCustomDecals — so the payload never balloons with irrelevant library uploads. */
  customDecals: DecalAsset[]
  light?: { exposure: number; strength: number; angleDeg: number }
}

/** Keeps the QR payload from including custom decals the design doesn't actually use. */
export function collectUsedCustomDecals(fingers: Record<FingerId, FingerDesign>, allCustomDecals: DecalAsset[]): DecalAsset[] {
  const usedIds = new Set<string>()
  for (const finger of Object.values(fingers)) {
    for (const sticker of finger.stickers) usedIds.add(sticker.stickerId)
  }
  return allCustomDecals.filter((d) => usedIds.has(d.id))
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlToBytes(base64url: string): Uint8Array {
  const padded = base64url.replace(/-/g, '+').replace(/_/g, '/').padEnd(base64url.length + ((4 - (base64url.length % 4)) % 4), '=')
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

async function concatStream(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  const reader = stream.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    total += value.length
  }
  const out = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    out.set(chunk, offset)
    offset += chunk.length
  }
  return out
}

const GZIP_SUPPORTED = typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined'
// Version byte prefixing the payload: lets decode() stay correct even if compression
// support changes between the browser that encoded it and the one decoding it later.
const FORMAT_RAW = 0
const FORMAT_GZIP = 1

/** Compresses (when supported) and base64url-encodes a design so it can live in a URL. */
export async function encodeSharedDesign(payload: SharedDesignPayload): Promise<string> {
  const json = JSON.stringify(payload)
  const jsonBytes = new TextEncoder().encode(json)

  if (GZIP_SUPPORTED) {
    const cs = new CompressionStream('gzip')
    const writer = cs.writable.getWriter()
    writer.write(jsonBytes)
    writer.close()
    const gzipped = await concatStream(cs.readable)
    const framed = new Uint8Array(gzipped.length + 1)
    framed[0] = FORMAT_GZIP
    framed.set(gzipped, 1)
    return bytesToBase64Url(framed)
  }

  const framed = new Uint8Array(jsonBytes.length + 1)
  framed[0] = FORMAT_RAW
  framed.set(jsonBytes, 1)
  return bytesToBase64Url(framed)
}

export async function decodeSharedDesign(code: string): Promise<SharedDesignPayload | null> {
  try {
    const framed = base64UrlToBytes(code)
    const format = framed[0]
    const body = framed.slice(1)

    let jsonBytes: Uint8Array
    if (format === FORMAT_GZIP) {
      if (!GZIP_SUPPORTED) return null
      const ds = new DecompressionStream('gzip')
      const writer = ds.writable.getWriter()
      writer.write(body)
      writer.close()
      jsonBytes = await concatStream(ds.readable)
    } else {
      jsonBytes = body
    }

    const json = new TextDecoder().decode(jsonBytes)
    return JSON.parse(json) as SharedDesignPayload
  } catch {
    return null
  }
}
