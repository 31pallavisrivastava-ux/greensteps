const CAR_KG_PER_KM = 0.192
const GRID_KG_PER_KWH = 0.7117
const AVG_HOME_KWH_MONTH = 150

export function computeTripReward(trip) {
  if (!trip.co2eKg || !trip.distanceKm) return null

  const carBaseline = trip.distanceKm * CAR_KG_PER_KM
  const saved = Math.max(0, carBaseline - trip.co2eKg)

  if (saved < 0.01) return null

  const mode = trip.confirmedMode ?? trip.suggestedMode
  let message = `You saved ${saved.toFixed(2)} kg CO₂ on this trip`
  let title = 'Great choice!'

  if (trip.transportCategory === 'PUBLIC') {
    title = 'Public transport win!'
    message = `By taking ${mode?.toLowerCase() ?? 'public transport'} instead of a car, you saved about ${saved.toFixed(2)} kg CO₂ — equal to charging a phone for ${Math.round(saved * 120)} days!`
  } else if (trip.transportCategory === 'ACTIVE') {
    title = 'Active travel star!'
    message = `Walking or cycling ${trip.distanceKm.toFixed(1)} km avoided about ${saved.toFixed(2)} kg CO₂ compared to driving. Your body and the planet thank you!`
  } else if (saved > 0.05) {
    message = `This trip produced ${trip.co2eKg.toFixed(2)} kg CO₂. If you had taken metro or bus, you could have saved up to ${saved.toFixed(2)} kg more.`
    title = 'Trip logged'
  } else {
    return null
  }

  return {
    title,
    message,
    co2SavedKg: Math.round(saved * 100) / 100,
    type: trip.transportCategory === 'PUBLIC' || trip.transportCategory === 'ACTIVE' ? 'celebration' : 'info',
  }
}

export function computeEnergyReward(reading) {
  const rewards = []
  const solarKwh = reading.solarOffsetKwh ?? 0
  const solarCo2Saved = solarKwh * GRID_KG_PER_KWH

  if (solarKwh > 0) {
    rewards.push({
      title: 'Clean energy champion!',
      message: `Your solar panels offset ${solarKwh.toFixed(0)} kWh — saving about ${solarCo2Saved.toFixed(1)} kg CO₂, like planting ${Math.max(1, Math.round(solarCo2Saved / 2))} tree seedlings for a year.`,
      co2SavedKg: Math.round(solarCo2Saved * 10) / 10,
      energySavedKwh: solarKwh,
      type: 'celebration',
    })
  }

  const days = Math.max(
    1,
    (new Date(reading.periodEnd) - new Date(reading.periodStart)) / (1000 * 60 * 60 * 24)
  )
  const dailyKwh = reading.kwh / days
  const avgDaily = AVG_HOME_KWH_MONTH / 30

  if (dailyKwh < avgDaily * 0.85 && reading.kwh > 0) {
    const savedKwh = (avgDaily - dailyKwh) * days
    const savedCo2 = savedKwh * GRID_KG_PER_KWH
    rewards.push({
      title: 'Lower electricity use!',
      message: `You used ${reading.kwh.toFixed(0)} kWh — about ${savedKwh.toFixed(0)} kWh less than a typical home. That saved roughly ${savedCo2.toFixed(1)} kg CO₂.`,
      co2SavedKg: Math.round(savedCo2 * 10) / 10,
      energySavedKwh: Math.round(savedKwh),
      type: 'celebration',
    })
  }

  return rewards[0] ?? {
    title: 'Bill recorded',
    message: `We tracked ${reading.kwh.toFixed(0)} kWh of electricity. Tip: switch off fans and lights when leaving a room to save more next month.`,
    co2SavedKg: 0,
    type: 'info',
  }
}

export function computePlasticReward(event) {
  if (event.disposalMethod === 'RECYCLED') {
    return {
      title: 'Recycling hero!',
      message: `You recycled ${event.grams.toFixed(0)}g of plastic — keeping it out of landfills and oceans. Every bit counts!`,
      plasticRecycledG: event.grams,
      type: 'celebration',
    }
  }
  if (event.disposalMethod === 'REUSED') {
    return {
      title: 'Reuse superstar!',
      message: `You reused ${event.grams.toFixed(0)}g of plastic instead of throwing it away. That is the best kind of saving!`,
      plasticRecycledG: event.grams,
      type: 'celebration',
    }
  }
  return {
    title: 'Logged honestly',
    message: 'Tracking waste helps you improve next week. Try segregating and giving clean plastic to a kabadiwala.',
    type: 'info',
  }
}

export function computeWeeklyRewards({ trips, energy, plastic, orders }) {
  let co2SavedKg = 0
  let energySavedKwh = 0
  const badges = []
  const highlights = []

  for (const trip of trips) {
    if (!trip.co2eKg || !trip.distanceKm) continue
    const carBaseline = trip.distanceKm * CAR_KG_PER_KM
    const saved = Math.max(0, carBaseline - trip.co2eKg)
    co2SavedKg += saved

    if (trip.transportCategory === 'PUBLIC' && saved > 0.1) {
      highlights.push({
        icon: 'train',
        text: `Metro/bus trip saved ${saved.toFixed(1)} kg CO₂ vs driving`,
      })
    }
    if (trip.transportCategory === 'ACTIVE' && saved > 0.05) {
      highlights.push({
        icon: 'footprints',
        text: `Walking/cycling avoided ${saved.toFixed(1)} kg CO₂`,
      })
    }
  }

  for (const e of energy) {
    const solar = e.solarOffsetKwh ?? 0
    if (solar > 0) {
      const saved = solar * GRID_KG_PER_KWH
      co2SavedKg += saved
      energySavedKwh += solar
      highlights.push({
        icon: 'sun',
        text: `Solar power saved ${saved.toFixed(1)} kg CO₂ (${solar.toFixed(0)} kWh clean energy)`,
      })
    }
  }

  const publicTrips = trips.filter((t) => t.transportCategory === 'PUBLIC').length
  const activeKm = trips
    .filter((t) => t.transportCategory === 'ACTIVE')
    .reduce((s, t) => s + t.distanceKm, 0)
  const recycledG = plastic.recycledG ?? 0

  if (publicTrips >= 2) badges.push({ id: 'public-hero', label: 'Public transport hero', emoji: '🚌' })
  if (activeKm >= 3) badges.push({ id: 'active-star', label: 'Active travel star', emoji: '🚶' })
  if (energySavedKwh >= 10) badges.push({ id: 'sun-saver', label: 'Sun saver', emoji: '☀️' })
  if (recycledG >= 30) badges.push({ id: 'recycle-star', label: 'Recycling star', emoji: '♻️' })
  if (orders.length <= 2 && orders.length > 0) {
    badges.push({ id: 'low-delivery', label: 'Fewer deliveries', emoji: '🛒' })
    highlights.push({ icon: 'package', text: 'Fewer delivery orders means less packaging waste' })
  }

  co2SavedKg = Math.round(co2SavedKg * 10) / 10
  energySavedKwh = Math.round(energySavedKwh)

  let headline = 'Keep going — every small step helps!'
  if (co2SavedKg >= 5) {
    headline = `Wow! You saved about ${co2SavedKg} kg CO₂ this week — like skipping ${Math.round(co2SavedKg / 2.3)} litres of petrol!`
  } else if (co2SavedKg >= 1) {
    headline = `Nice work! You saved ${co2SavedKg} kg CO₂ this week through smarter travel and energy.`
  } else if (recycledG >= 20) {
    headline = `You recycled ${recycledG.toFixed(0)}g of plastic this week — the planet thanks you!`
  }

  const treesEquivalent = Math.max(0, Math.round(co2SavedKg / 21))

  return {
    headline,
    co2SavedKg,
    energySavedKwh,
    plasticRecycledG: recycledG,
    treesEquivalent,
    badges,
    highlights: highlights.slice(0, 4),
    level: co2SavedKg >= 10 ? 'gold' : co2SavedKg >= 3 ? 'silver' : co2SavedKg >= 0.5 ? 'bronze' : 'starter',
  }
}
