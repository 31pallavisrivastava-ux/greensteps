import { parseBlinkitEmail } from './blinkit.js'
import { parseZeptoEmail } from './zepto.js'
import { parseSwiggyOrder } from './swiggy.js'
import { parseZomatoOrder } from './zomato.js'

const PARSERS = {
  BLINKIT: parseBlinkitEmail,
  ZEPTO: parseZeptoEmail,
  SWIGGY_INSTAMART: parseSwiggyOrder,
  SWIGGY_FOOD: parseSwiggyOrder,
  ZOMATO: parseZomatoOrder,
}

export function parseOrderEmail(merchant, rawEmail) {
  const parser = PARSERS[merchant]
  if (!parser) throw new Error(`No parser for merchant: ${merchant}`)
  return parser(rawEmail)
}

export function parseOrderScreenshot(merchant, _imageBuffer) {
  return {
    ...PARSERS[merchant]?.(''),
    source: 'OCR',
    message: 'Phase 2: Gemini Vision OCR for order screenshots',
  }
}
