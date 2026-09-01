import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

export function useQrCode(text: string): string | null {
  const [dataUrl, setDataUrl] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    QRCode.toDataURL(text, {
      width: 320,
      margin: 1,
      color: { dark: '#2C2740', light: '#FFFFFF00' },
    })
      .then((url) => {
        if (alive) setDataUrl(url)
      })
      .catch(() => {
        if (alive) setDataUrl(null)
      })
    return () => {
      alive = false
    }
  }, [text])

  return dataUrl
}
