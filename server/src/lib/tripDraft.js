import { inferModeFromPoints } from '../modules/emissions/engine.js'

/** Create a GPS-sourced trip draft (shared by /trips/draft and offline sync). */
export async function createTripFromDraft(prisma, userId, payload) {
  const { mode, confidence } = inferModeFromPoints(payload.points, payload.distanceKm)
  return prisma.trip.create({
    data: {
      userId,
      startedAt: new Date(payload.startedAt),
      endedAt: new Date(payload.endedAt),
      distanceKm: payload.distanceKm,
      suggestedMode: mode,
      isCommute: payload.isCommute ?? false,
      source: 'GPS',
      confidence,
      routePolyline: JSON.stringify(payload.points),
    },
  })
}
