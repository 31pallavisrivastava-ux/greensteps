/** Phase 2: Swiggy order email/OCR parser stub */
export function parseSwiggyOrder(raw) {
  return {
    merchant: 'SWIGGY_FOOD',
    lineItems: [],
    orderedAt: new Date().toISOString(),
    stub: true,
    message: 'Phase 2: implement Swiggy order parsing',
  }
}
