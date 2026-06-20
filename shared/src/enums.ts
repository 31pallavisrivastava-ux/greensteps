export enum FuelType {
  PETROL = 'PETROL',
  DIESEL = 'DIESEL',
  CNG = 'CNG',
  EV = 'EV',
}

export enum TransportMode {
  WALK = 'WALK',
  CYCLE = 'CYCLE',
  METRO = 'METRO',
  BUS = 'BUS',
  TRAIN = 'TRAIN',
  CAR = 'CAR',
  BIKE = 'BIKE',
  TAXI = 'TAXI',
  AUTO = 'AUTO',
}

export enum TransportCategory {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  ACTIVE = 'ACTIVE',
}

export enum TripSource {
  GPS = 'GPS',
  MANUAL = 'MANUAL',
}

export enum EnergySource {
  MANUAL = 'MANUAL',
  OCR = 'OCR',
  API = 'API',
}

export enum GhgScope {
  SCOPE1 = 'SCOPE1',
  SCOPE2 = 'SCOPE2',
  SCOPE3 = 'SCOPE3',
}

export enum DeliveryMerchant {
  BLINKIT = 'BLINKIT',
  ZEPTO = 'ZEPTO',
  SWIGGY_INSTAMART = 'SWIGGY_INSTAMART',
  SWIGGY_FOOD = 'SWIGGY_FOOD',
  ZOMATO = 'ZOMATO',
}

export enum OrderType {
  QUICK_COMMERCE = 'QUICK_COMMERCE',
  FOOD_DELIVERY = 'FOOD_DELIVERY',
}

export enum OrderSource {
  MANUAL = 'MANUAL',
  EMAIL = 'EMAIL',
  OCR = 'OCR',
}

export enum PlasticType {
  PET = 'PET',
  HDPE = 'HDPE',
  LDPE = 'LDPE',
  PP = 'PP',
  MULTILAYER = 'MULTILAYER',
  MIXED = 'MIXED',
}

export enum PlasticSource {
  PURCHASE = 'PURCHASE',
  DISPOSAL = 'DISPOSAL',
}

export enum DisposalMethod {
  RECYCLED = 'RECYCLED',
  LANDFILL = 'LANDFILL',
  REUSED = 'REUSED',
}
