import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import ScreenContainer from '../../components/ScreenContainer';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Input from '../../components/Input';
import StatusChip from '../../components/StatusChip';
import EmptyState from '../../components/EmptyState';
import { CardSkeleton } from '../../components/Skeleton';
import AppointmentBookingSheet from '../../components/AppointmentBookingSheet';
import { palette, radius, spacing, typography } from '../../theme';
import { formatDate } from '../../utils/format';
import { showToast } from '../../utils/toastConfig';
import { loadDoctors, loadMyAppointments, orderMedicine } from '../../store/slices/healthcareSlice';

const SPECIALTIES = [
  { key: null, label: 'All' },
  { key: 'General Physician', label: 'General' },
  { key: 'Cardiologist', label: 'Cardio' },
  { key: 'Orthopedic', label: 'Ortho' },
  { key: 'Diabetologist', label: 'Diabetes' },
  { key: 'Pediatrician', label: 'Pediatric' },
  { key: 'Physiotherapist', label: 'Physio' },
];

const CONSULT_LABEL = { video: '📹 Video', home: '🏠 Home', clinic: '🏥 Clinic' };

export default function HealthcareScreen() {
  const dispatch = useDispatch();
  const { doctors, doctorsLoading, appointments, appointmentsLoading, medicineBusy } = useSelector(s => s.healthcare);
  const [specialty, setSpecialty] = useState(null);
  const [bookDoctor, setBookDoctor] = useState(null);
  const [medOpen, setMedOpen] = useState(false);
  const [medItems, setMedItems] = useState('');
  const [medNote, setMedNote] = useState('');

  const reload = useCallback(() => {
    dispatch(loadDoctors({ specialty: specialty || undefined }));
    dispatch(loadMyAppointments());
  }, [dispatch, specialty]);

  useEffect(() => { reload(); }, [reload]);

  const placeMedicine = async () => {
    if (medItems.trim().length < 2) { showToast('error', 'Add items', 'List the medicines to order.'); return; }
    try {
      await dispatch(orderMedicine({ items: medItems.trim(), deliveryNote: medNote || undefined })).unwrap();
      showToast('success', 'Order placed', 'Medicine delivery in 2-4 hours.');
      setMedOpen(false); setMedItems(''); setMedNote('');
    } catch (e) {
      showToast('error', 'Could not order', String(e));
    }
  };

  return (
    <ScreenContainer refreshing={doctorsLoading || appointmentsLoading} onRefresh={reload}>
      <Card style={styles.hero}>
        <Text style={styles.heroTitle}>🩺 Doctor & Healthcare</Text>
        <Text style={styles.heroSub}>Video, home or clinic consultations with verified doctors.</Text>
        <Button title="💊 Order Medicine Delivery" variant="secondary" onPress={() => setMedOpen(true)} style={{ marginTop: spacing.md }} />
      </Card>

      {/* Specialty filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {SPECIALTIES.map(s => {
          const active = specialty === s.key;
          return (
            <TouchableOpacity key={s.label} onPress={() => setSpecialty(s.key)} style={[styles.chip, active && styles.chipActive]}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{s.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Doctors */}
      <Text style={[typography.h3, styles.sectionTitle]}>Doctors</Text>
      {doctorsLoading && doctors.length === 0 ? (
        <><CardSkeleton /><CardSkeleton /></>
      ) : doctors.length === 0 ? (
        <EmptyState icon="🩺" message="No doctors for this specialty." />
      ) : (
        doctors.map(d => (
          <Card key={d.id} style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.name}>{d.name}</Text>
              <Text style={styles.rating}>★ {d.rating}</Text>
            </View>
            <Text style={typography.caption}>{d.specialty} · {d.experienceYears} yrs · ₹{d.fee}</Text>
            <Text style={typography.caption}>{d.languages}</Text>
            <TouchableOpacity style={styles.bookBtn} onPress={() => setBookDoctor(d)}>
              <Text style={styles.bookText}>Book appointment</Text>
            </TouchableOpacity>
          </Card>
        ))
      )}

      {/* My appointments */}
      <Text style={[typography.h3, styles.sectionTitle]}>My appointments</Text>
      {appointmentsLoading && appointments.length === 0 ? (
        <CardSkeleton />
      ) : appointments.length === 0 ? (
        <EmptyState icon="📅" message="No appointments yet." />
      ) : (
        appointments.map(a => (
          <Card key={a.id} style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.name}>{a.doctorName}</Text>
              <StatusChip label={String(a.status).toUpperCase()} variant="info" />
            </View>
            <Text style={typography.caption}>
              {a.specialty} · {CONSULT_LABEL[a.consultationType] || a.consultationType}
            </Text>
            <Text style={typography.caption}>
              {formatDate(a.scheduledAt)} at {a.timeSlot} · {a.patientName} ({a.patientAge})
            </Text>
          </Card>
        ))
      )}

      <AppointmentBookingSheet
        visible={!!bookDoctor}
        doctor={bookDoctor}
        onClose={() => setBookDoctor(null)}
        onBooked={() => { setBookDoctor(null); dispatch(loadMyAppointments()); }}
      />

      {/* Medicine order modal */}
      <Modal visible={medOpen} transparent animationType="slide" onRequestClose={() => setMedOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.medSheet}>
            <View style={styles.medHeader}>
              <Text style={typography.h2}>Order Medicines</Text>
              <TouchableOpacity onPress={() => setMedOpen(false)} hitSlop={10}><Text style={styles.close}>×</Text></TouchableOpacity>
            </View>
            <Input label="Medicines / items" value={medItems} onChangeText={setMedItems} multiline numberOfLines={3} placeholder="e.g. Paracetamol 500mg x10, Vitamin D3…" />
            <Input label="Delivery note (optional)" value={medNote} onChangeText={setMedNote} maxLength={150} placeholder="Leave at door / call on arrival" />
            <Button title={medicineBusy ? 'Placing…' : 'Place Order'} onPress={placeMedicine} loading={medicineBusy} style={{ marginTop: spacing.sm }} />
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: palette.primary, borderColor: palette.primary, marginBottom: spacing.md },
  heroTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  heroSub: { color: '#DBE3FF', fontSize: 13, marginTop: 6, lineHeight: 19 },

  chipRow: { paddingVertical: spacing.xs, gap: spacing.sm, marginBottom: spacing.sm },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.pill, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface, marginRight: spacing.sm },
  chipActive: { backgroundColor: palette.primary, borderColor: palette.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: palette.textMuted },
  chipTextActive: { color: '#fff' },

  sectionTitle: { marginBottom: spacing.sm, marginTop: spacing.sm },
  card: { marginBottom: spacing.sm },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  name: { fontSize: 15, fontWeight: '700', color: palette.text },
  rating: { fontSize: 13, fontWeight: '700', color: palette.accent },
  bookBtn: { marginTop: spacing.sm, paddingVertical: 9, borderRadius: radius.md, borderWidth: 1.5, borderColor: palette.primary, alignItems: 'center' },
  bookText: { color: palette.primary, fontWeight: '700', fontSize: 13 },

  overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'flex-end' },
  medSheet: { backgroundColor: palette.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, paddingBottom: spacing.xxl },
  medHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  close: { fontSize: 26, color: palette.textMuted },
});
