/**
 * Build contextual weekly insight tips from footprint activity.
 * Pure function — easy to unit test without DB.
 */
export function buildWeeklyTips({
  totalKm,
  publicKm: _publicKm,
  privateKm,
  quickCommerceOrders,
  foodDeliveryOrders,
  plastic,
  unconfirmedTrips,
}) {
  const tips = []
  const km = totalKm || 1

  if (privateKm / km > 0.7) {
    tips.push('Over 70% of commute km is private — try metro or bus for your recurring route.')
  }
  if (quickCommerceOrders >= 4) {
    tips.push('4+ quick-commerce orders this week — batch groceries into one Zepto/Blinkit run.')
  }
  if (foodDeliveryOrders >= 3) {
    tips.push('3+ food deliveries — cook one meal at home or choose "no cutlery" when ordering.')
  }
  if (plastic.landfillG > plastic.recycledG && plastic.disposalG > 0) {
    tips.push('More plastic going to landfill than recycled — segregate and use local kabadi.')
  }
  if (plastic.purchaseG > 50) {
    tips.push('Delivery packaging is adding up — reuse bags when offered or skip extra orders.')
  }
  if (unconfirmedTrips > 0) {
    tips.push(
      `You have ${unconfirmedTrips} trip(s) awaiting mode confirmation — confirm for accurate Scope 3 data.`
    )
  }
  if (tips.length === 0) {
    tips.push('Great week! Keep tracking to build your 4-week plastic and CO₂e trends.')
  }

  return tips.slice(0, 2)
}

export function computeCommuteSplit(totalKm, publicKm, privateKm, activeKm) {
  const km = totalKm || 1
  return {
    public: Math.round((publicKm / km) * 100),
    private: Math.round((privateKm / km) * 100),
    active: Math.round((activeKm / km) * 100),
  }
}
