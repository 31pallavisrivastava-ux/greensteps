import type { ShareCardPayload } from '@carbon/shared'

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

export async function renderShareCard(data: ShareCardPayload): Promise<Blob> {
  const W = 1080
  const H = 1080
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  const grad = ctx.createLinearGradient(0, 0, W, H)
  grad.addColorStop(0, '#059669')
  grad.addColorStop(0.5, '#0d9488')
  grad.addColorStop(1, '#0891b2')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)

  ctx.fillStyle = 'rgba(255,255,255,0.12)'
  roundRect(ctx, 48, 48, W - 96, H - 96, 40)
  ctx.fill()

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 52px system-ui, sans-serif'
  ctx.fillText('🌿 GreenSteps', 96, 140)

  if (data.contextEmoji && data.contextLabel) {
    ctx.font = '42px system-ui, sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.95)'
    ctx.fillText(`${data.contextEmoji} ${data.contextLabel}`, 96, 210)
  }

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 64px system-ui, sans-serif'
  const nameLine = `${data.userName}'s win!`
  ctx.fillText(nameLine, 96, data.contextLabel ? 290 : 220)

  ctx.font = '36px system-ui, sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.9)'
  ctx.fillText(data.headline, 96, data.contextLabel ? 360 : 290)

  ctx.fillStyle = 'rgba(255,255,255,0.2)'
  roundRect(ctx, 96, data.contextLabel ? 400 : 340, W - 192, 280, 24)
  ctx.fill()

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 96px system-ui, sans-serif'
  ctx.fillText(`${data.co2SavedKg} kg`, 130, data.contextLabel ? 520 : 460)
  ctx.font = '32px system-ui, sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.fillText('CO₂ saved this week', 130, data.contextLabel ? 570 : 510)

  ctx.font = 'bold 48px system-ui, sans-serif'
  ctx.fillStyle = '#fef08a'
  ctx.fillText(`🏆 ${data.percentile}% · ${data.rankLabel}`, 130, data.contextLabel ? 650 : 590)

  if (data.checklistPct != null) {
    ctx.font = '32px system-ui, sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.9)'
    ctx.fillText(`✅ Checklist ${data.checklistPct}% complete`, 130, data.contextLabel ? 710 : 650)
  }

  if (data.badges.length > 0) {
    const badgeText = data.badges.map((b) => `${b.emoji} ${b.label}`).join('  ')
    ctx.font = '28px system-ui, sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    ctx.fillText(badgeText.slice(0, 55), 96, data.contextLabel ? 780 : 720)
  }

  ctx.font = '28px system-ui, sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.7)'
  ctx.fillText(`Footprint: ${data.co2TotalKg} kg/week · Join me on GreenSteps`, 96, H - 120)

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Could not create image'))
    }, 'image/png')
  })
}

export async function shareCardImage(blob: Blob, title: string, text: string) {
  const file = new File([blob], 'greensteps-milestone.png', { type: 'image/png' })

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ title, text, files: [file] })
      return 'shared' as const
    } catch (e) {
      if ((e as Error).name === 'AbortError') return 'cancelled' as const
    }
  }

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'greensteps-milestone.png'
  a.click()
  URL.revokeObjectURL(url)
  return 'downloaded' as const
}
