/** Phase 2: Blinkit order email parser stub */
export function parseBlinkitEmail(rawEmail) {
  return {
    merchant: 'BLINKIT',
    lineItems: [],
    orderedAt: new Date().toISOString(),
    stub: true,
    message: 'Phase 2: implement Blinkit email field extraction',
    rawPreview: String(rawEmail).slice(0, 200),
  }
}
