import { VEHICLES, vehicleByType, haversineKm, roundKm, fareFor, estimateOptions } from '../src/utils/transport';

describe('transport helpers', () => {
  it('haversineKm ~ 0 for same point, positive for different', () => {
    const a = { lat: 27.58, lng: 77.70 };
    expect(haversineKm(a, a)).toBeCloseTo(0, 5);
    const km = haversineKm({ lat: 27.5826, lng: 77.7064 }, { lat: 27.5530, lng: 77.6685 });
    expect(km).toBeGreaterThan(3);
    expect(km).toBeLessThan(7);
  });

  it('haversineKm returns 0 for missing coords', () => {
    expect(haversineKm(null, { lat: 1, lng: 1 })).toBe(0);
    expect(haversineKm({ lat: 1 }, { lat: 2, lng: 2 })).toBe(0);
  });

  it('roundKm clamps and rounds to 1 decimal', () => {
    expect(roundKm(3.456)).toBe(3.5);
    expect(roundKm(-2)).toBe(0);
  });

  it('fareFor respects base minimum and scales with distance', () => {
    const auto = vehicleByType('auto');
    expect(fareFor(auto, 0)).toBe(auto.base);
    expect(fareFor(auto, 10)).toBe(Math.round(auto.base + auto.perKm * 10));
    expect(fareFor(null, 5)).toBe(0);
  });

  it('estimateOptions returns one priced option per vehicle', () => {
    const opts = estimateOptions(8);
    expect(opts).toHaveLength(VEHICLES.length);
    opts.forEach(o => {
      expect(o.fare).toBeGreaterThan(0);
      expect(o.distanceKm).toBe(8);
      expect(o.etaMin).toBeGreaterThan(0);
    });
    // bus should be the cheapest for a meaningful distance
    const bus = opts.find(o => o.type === 'bus');
    const sedan = opts.find(o => o.type === 'sedan');
    expect(bus.fare).toBeLessThan(sedan.fare);
  });
});
