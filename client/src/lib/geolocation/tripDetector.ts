export interface GpsPoint {
  lat: number
  lng: number
  timestamp: number
  speedKmh?: number
}

export interface TripSession {
  points: GpsPoint[]
  startedAt: Date | null
  watchId: number | null
}

let session: TripSession = { points: [], startedAt: null, watchId: null }

function haversineKm(a: GpsPoint, b: GpsPoint) {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

export function getTripDistanceKm(points: GpsPoint[]) {
  let total = 0
  for (let i = 1; i < points.length; i++) {
    total += haversineKm(points[i - 1], points[i])
  }
  return Math.round(total * 100) / 100
}

export function startTripTracking(onUpdate: (points: GpsPoint[]) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'))
      return
    }

    session = { points: [], startedAt: new Date(), watchId: null }

    session.watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const point: GpsPoint = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          timestamp: pos.timestamp,
          speedKmh: pos.coords.speed ? pos.coords.speed * 3.6 : undefined,
        }
        session.points.push(point)
        onUpdate([...session.points])
      },
      (err) => reject(err),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    )
    resolve()
  })
}

export function stopTripTracking() {
  if (session.watchId !== null) {
    navigator.geolocation.clearWatch(session.watchId)
  }
  const result = {
    points: [...session.points],
    startedAt: session.startedAt,
    endedAt: new Date(),
    distanceKm: getTripDistanceKm(session.points),
  }
  session = { points: [], startedAt: null, watchId: null }
  return result
}

export function isTracking() {
  return session.watchId !== null
}

export async function queueOfflineTrip(payload: unknown) {
  try {
    const { api } = await import('../api')
    await api('/offline/queue', {
      method: 'POST',
      body: JSON.stringify({ type: 'trip_draft', payload }),
    })
  } catch {
    localStorage.setItem(
      `offline_trip_${Date.now()}`,
      JSON.stringify(payload)
    )
  }
}
