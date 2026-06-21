export async function shareText(title: string, text: string, url?: string) {
  const payload = { title, text: url ? `${text}\n${url}` : text }

  if (navigator.share) {
    try {
      await navigator.share(payload)
      return true
    } catch (e) {
      if ((e as Error).name === 'AbortError') return false
    }
  }

  try {
    await navigator.clipboard.writeText(payload.text)
    return 'copied'
  } catch {
    return false
  }
}
