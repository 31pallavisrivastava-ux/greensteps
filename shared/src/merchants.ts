import { DeliveryMerchant, OrderType } from './enums.js'
import type { MerchantInfo } from './types.js'

export const MERCHANTS: MerchantInfo[] = [
  {
    merchant: DeliveryMerchant.BLINKIT,
    label: 'Blinkit',
    orderType: OrderType.QUICK_COMMERCE,
    defaultBagGrams: 20,
    defaultContainerGrams: 0,
    defaultCutleryGrams: 0,
    deliveryCo2eKgDefault: 0.08,
  },
  {
    merchant: DeliveryMerchant.ZEPTO,
    label: 'Zepto',
    orderType: OrderType.QUICK_COMMERCE,
    defaultBagGrams: 18,
    defaultContainerGrams: 0,
    defaultCutleryGrams: 0,
    deliveryCo2eKgDefault: 0.08,
  },
  {
    merchant: DeliveryMerchant.SWIGGY_INSTAMART,
    label: 'Swiggy Instamart',
    orderType: OrderType.QUICK_COMMERCE,
    defaultBagGrams: 20,
    defaultContainerGrams: 0,
    defaultCutleryGrams: 0,
    deliveryCo2eKgDefault: 0.09,
  },
  {
    merchant: DeliveryMerchant.SWIGGY_FOOD,
    label: 'Swiggy Food',
    orderType: OrderType.FOOD_DELIVERY,
    defaultBagGrams: 15,
    defaultContainerGrams: 45,
    defaultCutleryGrams: 15,
    deliveryCo2eKgDefault: 0.12,
  },
  {
    merchant: DeliveryMerchant.ZOMATO,
    label: 'Zomato',
    orderType: OrderType.FOOD_DELIVERY,
    defaultBagGrams: 15,
    defaultContainerGrams: 50,
    defaultCutleryGrams: 15,
    deliveryCo2eKgDefault: 0.12,
  },
]

export function getMerchantInfo(merchant: DeliveryMerchant): MerchantInfo {
  const info = MERCHANTS.find((m) => m.merchant === merchant)
  if (!info) throw new Error(`Unknown merchant: ${merchant}`)
  return info
}

export function modeToCategory(mode: string): 'PUBLIC' | 'PRIVATE' | 'ACTIVE' {
  switch (mode) {
    case 'WALK':
    case 'CYCLE':
      return 'ACTIVE'
    case 'METRO':
    case 'BUS':
    case 'TRAIN':
    case 'AUTO':
      return 'PUBLIC'
    default:
      return 'PRIVATE'
  }
}
