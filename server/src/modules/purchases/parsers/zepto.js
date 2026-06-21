/** Phase 2: Zepto order email parser stub */
export function parseZeptoEmail(_rawEmail) {
  return {
    merchant: 'ZEPTO',
    lineItems: [],
    orderedAt: new Date().toISOString(),
    stub: true,
    message: 'Phase 2: implement Zepto email field extraction',
  }
}
