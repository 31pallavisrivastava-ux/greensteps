/** Parse kWh and dates from Indian electricity bill OCR text */

const KWH_PATTERNS = [
  /(?:units?\s*consumed|total\s*consumption|energy\s*consumed|billed\s*units|bill\s*units|consumption\s*units)[\s:\-]*(\d+(?:\.\d+)?)/i,
  /(?:kwh|k\.w\.h)[\s:\-]*(\d+(?:\.\d+)?)/i,
  /(\d+(?:\.\d+)?)\s*(?:kwh|units?\s*consumed)/i,
  /(?:reading|units)[\s:\-]*(\d{2,4}(?:\.\d+)?)/i,
]

const DATE_PATTERNS = [
  /(?:bill\s*period|billing\s*period|from|period)[\s:\-]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\s*(?:to|\-)\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
  /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\s*(?:to|\-)\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
]

function parseIndianDate(str) {
  if (!str) return null
  const parts = str.split(/[\/\-]/)
  if (parts.length !== 3) return null
  let [d, m, y] = parts.map(Number)
  if (y < 100) y += 2000
  const date = new Date(Date.UTC(y, m - 1, d))
  return Number.isNaN(date.getTime()) ? null : date
}

function pickBestKwh(matches) {
  const nums = matches.map(Number).filter((n) => n > 0 && n < 10000)
  if (!nums.length) return null
  // Prefer typical household monthly range 50–800 kWh
  const inRange = nums.filter((n) => n >= 30 && n <= 2000)
  if (inRange.length) return inRange.sort((a, b) => b - a)[0]
  return nums.sort((a, b) => b - a)[0]
}

export function parseUtilityBillText(text) {
  const normalized = text.replace(/\s+/g, ' ').trim()
  let kwh = null
  const kwhMatches = []

  for (const pattern of KWH_PATTERNS) {
    const m = normalized.match(pattern)
    if (m?.[1]) kwhMatches.push(parseFloat(m[1]))
  }

  // Fallback: largest number near "unit" or "kwh" keywords
  if (!kwhMatches.length) {
    const chunks = normalized.split(/unit|kwh|consumption/i)
    for (const chunk of chunks) {
      const nums = chunk.match(/\d+(?:\.\d+)?/g)?.map(Number) ?? []
      kwhMatches.push(...nums.filter((n) => n >= 20 && n <= 5000))
    }
  }

  kwh = pickBestKwh(kwhMatches)

  let periodStart = null
  let periodEnd = null
  for (const pattern of DATE_PATTERNS) {
    const m = normalized.match(pattern)
    if (m?.[1] && m?.[2]) {
      periodStart = parseIndianDate(m[1])
      periodEnd = parseIndianDate(m[2])
      if (periodStart && periodEnd) break
    }
  }

  if (!periodEnd) periodEnd = new Date()
  if (!periodStart) {
    periodStart = new Date(periodEnd)
    periodStart.setUTCMonth(periodStart.getUTCMonth() - 1)
  }

  const confidence = kwh ? (kwhMatches.length > 1 ? 0.85 : 0.7) : 0

  return {
    kwh,
    periodStart: periodStart?.toISOString() ?? null,
    periodEnd: periodEnd?.toISOString() ?? null,
    confidence,
    rawText: normalized.slice(0, 500),
    message: kwh
      ? `Found ${kwh} kWh on bill — review and save`
      : 'Could not find kWh — enter manually or try a clearer photo',
  }
}

export const SAMPLE_BILL_TEXT = `
BSES Rajdhani Power Limited
Consumer No: 1234567890
Billing Period: 01/05/2026 to 31/05/2026
Units Consumed: 138 kWh
Energy Charges: Rs 1245.00
`
