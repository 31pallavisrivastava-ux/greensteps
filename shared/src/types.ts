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

export interface ActionReward {
  title: string
  message: string
  co2SavedKg?: number
  energySavedKwh?: number
  plasticRecycledG?: number
  type: 'celebration' | 'info'
}

export interface RewardBadge {
  id: string
  label: string
  emoji: string
}

export interface WeeklyRewards {
  headline: string
  co2SavedKg: number
  energySavedKwh: number
  plasticRecycledG: number
  treesEquivalent: number
  badges: RewardBadge[]
  highlights: Array<{ icon: string; text: string }>
  level: 'starter' | 'bronze' | 'silver' | 'gold'
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
  rewards: WeeklyRewards
}

export interface CommunityComparison {
  percentile: number
  rankLabel: string
  user: {
    co2SavedKg: number
    co2TotalKg: number
    plasticGrams: number
    recycledGrams: number
    deliveryOrders: number
  }
  community: {
    weeklyCo2TotalAvg: number
    weeklyCo2SavedAvg: number
    weeklyPlasticGramsAvg: number
    weeklyDeliveryOrdersAvg: number
  }
  vsAverage: {
    co2SavedDiffKg: number
    co2SavedPct: number
    co2TotalDiffKg: number
    co2TotalPct: number
    plasticDiffG: number
    deliveryOrdersDiff: number
  }
  wins: string[]
}

export interface ContextChecklistItem {
  id: string
  label: string
  tip: string
  co2eHint: string
}

export interface ContextChecklist {
  id: string
  label: string
  emoji: string
  intro: string
  items: ContextChecklistItem[]
}

export interface SustainabilityTip {
  id: string
  category: string
  title: string
  body: string
  icon: string
}

export interface ShareMilestone {
  title: string
  text: string
  url: string
}

export interface ShareCardPayload {
  userName: string
  headline: string
  co2SavedKg: number
  co2TotalKg: number
  percentile: number
  rankLabel: string
  badges: RewardBadge[]
  contextEmoji?: string
  contextLabel?: string
  checklistPct?: number
}

export interface WeeklyChallenge {
  id: string
  title: string
  description: string
  emoji: string
  target: number
  current: number
  progressPct: number
  completed: boolean
}

export interface StreakInfo {
  id: string
  label: string
  emoji: string
  days: number
  best: number
  hint: string
}

export interface CarbonBudget {
  usedKg: number
  fairShareKg: number
  remainingKg: number
  usedPct: number
  overBudget: boolean
  status: 'on_track' | 'warning' | 'over'
  statusLabel: string
  annualFairShareKg: number
  source: string
}

export interface AqiReading {
  city: string
  usAqi: number | null
  pm25: number | null
  pm10: number | null
  level: string
  label: string
  color: string
  updatedAt: string | null
}

export interface AqiNudge {
  show: boolean
  severity: 'good' | 'info' | 'warning' | 'danger'
  title: string
  message: string
  action: string
}

export interface EngageDashboard {
  challenges: WeeklyChallenge[]
  streaks: StreakInfo[]
  budget: CarbonBudget
  aqi: AqiReading
  aqiNudge: AqiNudge
  rewardsSummary: { co2SavedKg: number; headline: string }
}

export interface ClassGroupSummary {
  id: string
  name: string
  joinCode: string
  memberCount: number
  joinedAt: string
}

export interface LeaderboardEntry {
  rank: number
  userId: string
  name: string
  co2SavedKg: number
  co2TotalKg: number
  publicTrips: number
  deliveryOrders: number
  isYou: boolean
}

export interface ClassLeaderboard {
  group: { id: string; name: string; joinCode: string; memberCount: number }
  leaderboard: LeaderboardEntry[]
  yourRank: number | null
}

export interface UserProfile {
  id: string
  email: string
  name: string | null
  city: string | null
  state: string | null
  homeLat: number | null
  homeLng: number | null
  workLat: number | null
  workLng: number | null
  onboardingCompleted: boolean
  transportPreference: TransportPreference | null
  topConcern: TopConcern | null
}

export type TransportPreference = 'CAR' | 'BUS_METRO' | 'WALK_CYCLE' | 'MIXED'
export type TopConcern = 'POWER' | 'TRAVEL' | 'DELIVERY' | 'PLASTIC'

export interface CityOption {
  name: string
  lat: number
  lng: number
  state: string
}

export interface TodayAction {
  id: string
  title: string
  message: string
  actionLabel: string
  link: string
  impactHint: string
  emoji: string
  priority: number
}

export interface WeeklyHistoryPoint {
  weekStart: string
  weekEnd: string
  label: string
  scope1: number
  scope2: number
  scope3: number
  total: number
  tripCount: number
  orderCount: number
}

export interface FootprintHistory {
  weeks: WeeklyHistoryPoint[]
  trend: {
    deltaKg: number
    direction: 'up' | 'down' | 'flat'
    message: string
  }
}

export interface FootprintExplainLine {
  scope: string
  category: string
  label: string
  co2eKg: number
  formula: string
  source: string
  detail?: string
}

export interface FootprintExplanation {
  totalKg: number
  scope1: number
  scope2: number
  scope3: number
  lines: FootprintExplainLine[]
  topLine: FootprintExplainLine | null
}

export interface BillOcrResult {
  kwh: number | null
  periodStart: string | null
  periodEnd: string | null
  confidence: number
  message: string
  rawText?: string
}

export type FamilyRole = 'OWNER' | 'ADULT' | 'CHILD'

export interface PersonalFootprint {
  period: 'week'
  totalKg: number
  scope1: number
  scope2: number
  scope3: number
  byCategory: Record<string, number>
  plasticGrams: number
  activity: { trips: number; orders: number; energyReadings: number }
  fairShareKg: number
  vsFairSharePct: number
  status: 'under' | 'on_track' | 'over'
  statusLabel: string
}

export interface FamilyGroupSummary {
  id: string
  name: string
  joinCode: string
  memberCount: number
  role: FamilyRole
  joinedAt: string
}

export interface FamilyMemberFootprint {
  userId: string
  name: string
  role: FamilyRole
  co2TotalKg: number
  scope1: number
  scope2: number
  scope3: number
  co2SavedKg: number
  plasticGrams: number
  tripCount: number
  orderCount: number
  byCategory: { fuel: number; energy: number; travel: number }
  isYou: boolean
}

export interface FamilyDashboard {
  family: { id: string; name: string; joinCode: string; memberCount: number }
  household: {
    totalKg: number
    scope1: number
    scope2: number
    scope3: number
    fairShareKg: number
    perPersonAvgKg: number
    vsFairSharePct: number
    topDriver: string
    status: 'under' | 'on_track' | 'over'
  }
  members: FamilyMemberFootprint[]
  yourSharePct: number | null
}

export interface CoachChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface CoachChatResponse {
  reply: string
  mode: 'agent' | 'rules'
  toolsUsed: string[]
  suggestedLink: string | null
  agentError?: string | null
  model?: string
  provider?: string
}

export interface CoachStatus {
  agentEnabled: boolean
  provider: string
  model: string
  llmReachable?: boolean
  modelReady?: boolean
  hint?: string | null
  modelsAvailable?: string[]
  tools: string[]
  description: string
}

export interface VehicleDto {
  id: string
  label: string
  fuelType: FuelType
  mileageKmpl: number | null
}
