// Pure helpers for Darshan & Transport (Module 34).

export const VEHICLES = [
  { type: 'auto',  label: 'Auto',       icon: '🛺', capacity: 3,  base: 30, perKm: 11, etaMin: 4,  note: 'Quick & economical' },
  { type: 'mini',  label: 'Mini',       icon: '🚗', capacity: 4,  base: 50, perKm: 14, etaMin: 5,  note: 'AC hatchback' },
  { type: 'sedan', label: 'Sedan',      icon: '🚙', capacity: 4,  base: 80, perKm: 18, etaMin: 7,  note: 'Comfortable AC sedan' },
  { type: 'bus',   label: 'Shared Bus', icon: '🚌', capacity: 30, base: 20, perKm: 6,  etaMin: 12, note: 'Cheapest, shared ride' },
];

export const vehicleByType = type => VEHICLES.find(v => v.type === type) || null;

const toRad = d => (d * Math.PI) / 180;

// Great-circle distance in km between {lat,lng} points.
export function haversineKm(a, b) {
  if (!a || !b || a.lat == null || a.lng == null || b.lat == null || b.lng == null) return 0;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function roundKm(km) {
  return Math.max(0, Math.round(km * 10) / 10);
}

// Fare = max(base, base + perKm*km), rounded to the rupee.
export function fareFor(vehicle, km) {
  if (!vehicle) return 0;
  return Math.max(vehicle.base, Math.round(vehicle.base + vehicle.perKm * Math.max(0, km)));
}

// Vehicle options for a given distance (km).
export function estimateOptions(km) {
  const d = roundKm(km);
  return VEHICLES.map(v => ({
    type: v.type,
    label: v.label,
    icon: v.icon,
    capacity: v.capacity,
    note: v.note,
    distanceKm: d,
    etaMin: v.etaMin,
    fare: fareFor(v, d),
  }));
}
