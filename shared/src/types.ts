import type {
  DeliveryMerchant,
  DisposalMethod,
  FuelType,
  OrderType,
  PlasticType,
  TransportCategory,
  TransportMode,
  TripSource,
} from './enums.js'

export interface GpsPoint {
  lat: number
  lng: number
  timestamp: number
  speedKmh?: number
}

export interface TripDraftRequest {
  points: GpsPoint[]
  startedAt: string
  endedAt: string
  distanceKm: number
  isCommute?: boolean
}

export interface TripConfirmRequest {
  confirmedMode: TransportMode
  vehicleId?: string
  isCommute?: boolean
}

export interface TripResponse {
  id: string
  startedAt: string
  endedAt: string
  distanceKm: number
  suggestedMode: TransportMode
  confirmedMode: TransportMode | null
  transportCategory: TransportCategory | null
  co2eKg: number | null
  fuelLitersEst: number | null
  isCommute: boolean
  source: TripSource
  confidence: number
}

export interface FuelCreateRequest {
  vehicleId?: string
  purchasedAt: string
  liters: number
  amountInr?: number
  fuelType?: FuelType
}

export interface EnergyCreateRequest {
  periodStart: string
  periodEnd: string
  kwh: number
  solarOffsetKwh?: number
  lpgKg?: number
}

export interface OrderLineItemInput {
  catalogId?: string
  label: string
  quantity: number
}

export interface DeliveryOrderCreateRequest {
  merchant: DeliveryMerchant
  orderedAt: string
  amountInr?: number
  lineItems: OrderLineItemInput[]
}

export interface PlasticDisposalRequest {
  occurredAt: string
  plasticType: PlasticType
  grams: number
  disposalMethod: DisposalMethod
  notes?: string
}

export interface MerchantInfo {
  merchant: DeliveryMerchant
  label: string
  orderType: OrderType
  defaultBagGrams: number
  defaultContainerGrams: number
  defaultCutleryGrams: number
  deliveryCo2eKgDefault: number
}

export interface PackagingCatalogItemDto {
  id: string
  category: string
  label: string
  orderTypes: OrderType[]
  plasticGramsPerUnit: number
  plasticType: PlasticType
  co2ePerUnitKg: number | null
}

export interface EmissionFactorDto {
  id: string
  region: string
  scope: string
  category: string
  value: number
  unit: string
  source: string
  sourceUrl: string | null
}

export interface FootprintSummary {
  scope1: number
  scope2: number
  scope3: number
  total: number
  byCategory: Record<string, number>
  byMerchant: Record<string, number>
  factorCitations: string[]
}

export interface PlasticSummary {
  purchaseG: number
  disposalG: number
  recycledG: number
  landfillG: number
  byType: Record<string, number>
  byMerchant: Record<string, number>
}

export interface WeeklyInsight {
  tips: string[]
  commuteSplit: { public: number; private: number; active: number }
  footprint: FootprintSummary
  plastic: PlasticSummary
  scenarios: {
    shift10pctToPublic: { savedKg: number }
    reduceDeliveryOrdersBy2: { savedPlasticG: number; savedCo2eKg: number }
  }
}

export interface UserProfile {
  id: string
  email: string
  name: string | null
  state: string | null
  homeLat: number | null
  homeLng: number | null
  workLat: number | null
  workLng: number | null
}

export interface VehicleDto {
  id: string
  label: string
  fuelType: FuelType
  mileageKmpl: number | null
}
