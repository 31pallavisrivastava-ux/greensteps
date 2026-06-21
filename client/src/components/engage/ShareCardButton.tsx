import { useState } from 'react'
import { ImageIcon } from 'lucide-react'
import { api } from '../../lib/api'
import { renderShareCard, shareCardImage } from '../../lib/shareCard'
import type { ShareCardPayload, ShareMilestone } from '@carbon/shared'

interface ShareCardButtonProps {
  contextEmoji?: string
  contextLabel?: string
  checklistPct?: number
  className?: string
  label?: string
}

export function ShareCardButton({
  contextEmoji,
  contextLabel,
  checklistPct,
  className = 'btn-secondary w-full',
  label = 'Share image',
}: ShareCardButtonProps) {
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  const handleShare = async () => {
    setBusy(true)
    setMsg('')
    try {
      const data = await api<{ share: ShareMilestone; card: ShareCardPayload }>('/guide/milestones/share')
      const card: ShareCardPayload = {
        ...data.card,
        contextEmoji,
        contextLabel,
        checklistPct,
      }
      const blob = await renderShareCard(card)
      const result = await shareCardImage(blob, data.share.title, data.share.text)
      setMsg(
        result === 'shared'
          ? 'Shared!'
          : result === 'downloaded'
            ? 'Image saved — open WhatsApp and attach it!'
            : ''
      )
    } catch {
      setMsg('Could not create share card')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <button type="button" className={className} onClick={handleShare} disabled={busy}>
        <ImageIcon className="h-5 w-5" aria-hidden />
        {busy ? 'Creating image…' : label}
      </button>
      {msg && (
        <p className="mt-2 text-center text-sm font-semibold text-emerald-700">{msg}</p>
      )}
    </div>
  )
}
