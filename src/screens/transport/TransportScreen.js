import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import ScreenContainer from '../../components/ScreenContainer';
import Card from '../../components/Card';
import Button from '../../components/Button';
import StatusChip from '../../components/StatusChip';
import EmptyState from '../../components/EmptyState';
import LocationPicker from '../../components/LocationPicker';
import CashfreeCheckout from '../../components/CashfreeCheckout';
import { palette, radius, spacing, typography } from '../../theme';
import { formatINR, formatDate } from '../../utils/format';
import { loadEstimate, bookRide, loadRides, clearEstimate } from '../../store/slices/transportSlice';
import { paymentApi } from '../../api/paymentApi';
import { showToast } from '../../utils/toastConfig';

// Quick temple drops (coords mirror the curated places in mock.js).
const TEMPLE_PRESETS = [
  { id: 'banke',  name: 'Banke Bihari Temple', area: 'Vrindavan',  lat: 27.5826, lng: 77.7064 },
  { id: 'prem',   name: 'Prem Mandir',         area: 'Vrindavan',  lat: 27.5530, lng: 77.6685 },
  { id: 'iskcon', name: 'ISKCON Vrindavan',    area: 'Raman Reti', lat: 27.5705, lng: 77.6595 },
];

export default function TransportScreen() {
  const dispatch = useDispatch();
  const { distanceKm, options, optionsLoading, rides, bookBusy } = useSelector(s => s.transport);

  const [pickup, setPickup] = useState(null);
  const [drop, setDrop] = useState(null);
  const [selected, setSelected] = useState(null);
  const [order, setOrder] = useState(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [paying, setPaying] = useState(false);

  useEffect(() => { dispatch(loadRides()); }, [dispatch]);

  // Re-estimate whenever both ends are set.
  useEffect(() => {
    if (pickup && drop) dispatch(loadEstimate({ pickup, drop }));
    else dispatch(clearEstimate());
    setSelected(null);
  }, [pickup, drop, dispatch]);

  const reload = useCallback(() => dispatch(loadRides()), [dispatch]);

  const chosen = options.find(o => o.type === selected) || null;

  const confirm = async () => {
    if (!chosen) return;
    try {
      const ride = await dispatch(bookRide({
        pickupName: pickup.name, dropName: drop.name,
        vehicleType: chosen.type, distanceKm: chosen.distanceKm, fare: chosen.fare,
      })).unwrap();
      setPaying(true);
      const ord = await paymentApi.initiate({ rideId: ride.id, amount: ride.fare, mode: 'cashfree', remarks: `Ride ${ride.code} · ${ride.dropName}` });
      setPaying(false);
      setOrder(ord);
      setCheckoutOpen(true);
    } catch (e) {
      setPaying(false);
      showToast('error', 'Could not book ride', String(e));
    }
  };

  const finishOk = async () => {
    setCheckoutOpen(false);
    try {
      const r = await paymentApi.verify(order?.orderId);
      showToast(r?.status === 'paid' ? 'success' : 'warning',
        r?.status === 'paid' ? 'Ride confirmed' : 'Ride booked — payment pending',
        r?.status === 'paid' ? 'Your driver will be assigned shortly.' : 'We are confirming your payment.');
    } catch (e) {
      showToast('warning', 'Ride booked — payment pending', 'We could not confirm payment yet.');
    }
    setPickup(null); setDrop(null); setSelected(null);
    reload();
  };

  const finishCancel = () => {
    setCheckoutOpen(false);
    showToast('warning', 'Ride booked — pay later', 'You can pay the driver directly.');
    setPickup(null); setDrop(null); setSelected(null);
    reload();
  };

  return (
    <ScreenContainer onRefresh={reload}>
      <CashfreeCheckout visible={checkoutOpen} order={order} onClose={finishCancel} onSuccess={finishOk} onCancel={finishCancel} />

      <Card style={styles.hero}>
        <Text style={styles.heroTitle}>🚕 Darshan & Transport</Text>
        <Text style={styles.heroSub}>Book a cab, auto or shared bus across Vrindavan & Mathura.</Text>
      </Card>

      {/* Pickup / drop */}
      <Card style={styles.card}>
        <LocationPicker label="Pickup" value={pickup} placeholder="Where from?" onChange={setPickup} />
        <LocationPicker label="Drop" value={drop} placeholder="Where to?" onChange={setDrop} />

        <Text style={styles.presetLabel}>Popular temple drops</Text>
        <View style={styles.presetRow}>
          {TEMPLE_PRESETS.map(t => (
            <TouchableOpacity key={t.id} style={styles.presetChip} onPress={() => setDrop(t)}>
              <Text style={styles.presetText}>🛕 {t.name.replace(' Temple', '')}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      {/* Vehicle options */}
      {pickup && drop ? (
        <>
          <View style={styles.rowBetween}>
            <Text style={typography.h3}>Choose a ride</Text>
            {distanceKm != null ? <Text style={styles.distance}>{distanceKm} km</Text> : null}
          </View>
          {optionsLoading ? (
            <ActivityIndicator color={palette.primary} style={{ marginVertical: spacing.lg }} />
          ) : options.map(o => {
            const sel = selected === o.type;
            return (
              <TouchableOpacity key={o.type} activeOpacity={0.8} onPress={() => setSelected(o.type)}>
                <Card style={[styles.optCard, sel && styles.optCardSel]}>
                  <Text style={styles.optIcon}>{o.icon}</Text>
                  <View style={styles.flex1}>
                    <Text style={styles.optLabel}>{o.label} · {o.capacity} seats</Text>
                    <Text style={typography.caption}>{o.note} · {o.etaMin} min away</Text>
                  </View>
                  <Text style={styles.optFare}>{formatINR(o.fare)}</Text>
                </Card>
              </TouchableOpacity>
            );
          })}

          {chosen ? (
            <Button
              title={bookBusy || paying ? 'Please wait…' : `Pay ${formatINR(chosen.fare)} & Book ${chosen.label}`}
              onPress={confirm}
              loading={bookBusy || paying}
              style={{ marginTop: spacing.sm }}
            />
          ) : null}
        </>
      ) : (
        <EmptyState icon="🧭" message="Set pickup and drop to see cabs, autos and buses with fares." />
      )}

      {/* My rides */}
      <Text style={[typography.h3, styles.sectionTitle]}>My rides</Text>
      {rides.length === 0 ? (
        <EmptyState icon="🚗" message="No rides yet." />
      ) : rides.map(r => (
        <Card key={r.id} style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.rideName}>{r.pickupName} → {r.dropName}</Text>
            <StatusChip label={String(r.status).toUpperCase()} variant="success" />
          </View>
          <Text style={typography.caption}>
            {r.vehicleLabel} · {r.distanceKm} km · {formatINR(r.fare)} · {formatDate(r.createdAt)}
          </Text>
          <Text style={styles.rideCode}>{r.code}</Text>
        </Card>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: palette.primary, borderColor: palette.primary, marginBottom: spacing.md },
  heroTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  heroSub: { color: '#DBE3FF', fontSize: 13, marginTop: 6, lineHeight: 19 },

  card: { marginBottom: spacing.md },
  presetLabel: { ...typography.label, marginTop: 2, marginBottom: spacing.sm },
  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  presetChip: { backgroundColor: palette.surfaceAlt, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7, marginRight: spacing.sm, marginBottom: spacing.sm },
  presetText: { fontSize: 12, fontWeight: '700', color: palette.primary },

  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  distance: { fontSize: 13, fontWeight: '700', color: palette.textMuted },
  optCard: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, borderWidth: 1, borderColor: palette.divider },
  optCardSel: { borderColor: palette.primary, backgroundColor: '#EEF2FF' },
  optIcon: { fontSize: 28, marginRight: spacing.md },
  flex1: { flex: 1 },
  optLabel: { fontSize: 15, fontWeight: '700', color: palette.text },
  optFare: { fontSize: 16, fontWeight: '800', color: palette.primary, marginLeft: spacing.sm },

  sectionTitle: { marginTop: spacing.md, marginBottom: spacing.sm },
  rideName: { fontSize: 14, fontWeight: '700', color: palette.text, flex: 1, marginRight: spacing.sm },
  rideCode: { fontSize: 11, color: palette.textMuted, marginTop: 4, letterSpacing: 0.4 },
});
