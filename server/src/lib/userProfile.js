export function serializeUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    city: user.city,
    state: user.state,
    homeLat: user.homeLat,
    homeLng: user.homeLng,
    workLat: user.workLat,
    workLng: user.workLng,
    onboardingCompleted: user.onboardingCompleted ?? false,
    transportPreference: user.transportPreference,
    topConcern: user.topConcern,
    vehicles: user.vehicles,
  }
}
