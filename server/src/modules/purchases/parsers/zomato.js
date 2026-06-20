/** Phase 2: Zomato order email/OCR parser stub */
export function parseZomatoOrder(raw) {
  return {
    merchant: 'ZOMATO',
    lineItems: [],
    orderedAt: new Date().toISOString(),
    stub: true,
    message: 'Phase 2: implement Zomato order parsing',
  }
}
