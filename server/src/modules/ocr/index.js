/** Phase 2: OCR module stubs for fuel, utility, and delivery receipts */

export async function parseFuelReceipt(_imageBuffer) {
  return {
    stub: true,
    liters: null,
    amountInr: null,
    purchasedAt: null,
    message: 'Phase 2: Tesseract.js or Gemini Vision for fuel receipts',
  }
}

export async function parseUtilityBill(_imageBuffer) {
  return {
    stub: true,
    kwh: null,
    periodStart: null,
    periodEnd: null,
    message: 'Phase 2: OCR for electricity bill parsing',
  }
}

export async function parseDeliveryOrderScreenshot(_merchant, _imageBuffer) {
  return {
    stub: true,
    lineItems: [],
    message: 'Phase 2: OCR for delivery order screenshots',
  }
}
