import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import ScreenContainer from '../../components/ScreenContainer';
import Card from '../../components/Card';
import Button from '../../components/Button';
import StatusChip from '../../components/StatusChip';
import EmptyState from '../../components/EmptyState';
import EmergencyContactsSheet from '../../components/EmergencyContactsSheet';
import { palette, radius, spacing, typography } from '../../theme';
import { showToast } from '../../utils/toastConfig';
import { dispatchSos } from '../../services/sos';
import { loadContacts, activateSos, trackAmbulance } from '../../store/slices/sosSlice';

const HOLD_MS = 3000;
const REL_LABEL = r => (r ? r.charAt(0).toUpperCase() + r.slice(1) : '');

export default function SOSScreen() {
  const dispatch = useDispatch();
  const { contacts, bloodGroup, medicalNotes, activeRequest, activating } = useSelector(s => s.sos);
  const userName = useSelector(s => s.auth.user?.name);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [holding, setHolding] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;
  const anim = useRef(null);

  useEffect(() => { dispatch(loadContacts()); }, [dispatch]);

  const fire = useCallback(async () => {
    try {
      const res = await dispatch(activateSos({})).unwrap();
      showToast('error', '🆘 SOS ACTIVATED', 'Help is on the way! Helpdesk notified.');
      setTimeout(() => showToast('info', 'Ambulance dispatched', `ETA ~${res.etaMinutes} min.`), 900);
      const summary = await dispatchSos({ contacts, userName });
      const where = summary.location ? 'with your live location' : '(location unavailable)';
      setTimeout(() => showToast(
        'success',
        `${summary.notified || 0} contact(s) alerted`,
        `Location ${where} sent via WhatsApp, SMS & email.`,
      ), 1800);
    } catch (e) {
      showToast('error', 'SOS failed', String(e));
    }
  }, [dispatch, contacts, userName]);

  const start = () => {
    setHolding(true);
    progress.setValue(0);
    anim.current = Animated.timing(progress, { toValue: 1, duration: HOLD_MS, useNativeDriver: false });
    anim.current.start(({ finished }) => { if (finished) { setHolding(false); fire(); } });
  };
  const cancel = () => { anim.current?.stop(); setHolding(false); progress.setValue(0); };

  const ringWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <ScreenContainer refreshing={false} onRefresh={() => dispatch(loadContacts())}>
      <Text style={styles.intro}>
        In an emergency, press and hold the button for 3 seconds. We'll alert the 24×7 helpdesk,
        dispatch help and notify your family instantly.
      </Text>

      {/* Hold to activate */}
      <Pressable onPressIn={start} onPressOut={cancel} disabled={activating} style={styles.bigWrap}>
        <View style={styles.bigBtn}>
          <Text style={styles.bigText}>SOS</Text>
          <Text style={styles.bigHint}>{holding ? 'Keep holding…' : activating ? 'Sending…' : 'Hold 3 seconds'}</Text>
        </View>
        <View style={styles.track}><Animated.View style={[styles.fill, { width: ringWidth }]} /></View>
      </Pressable>

      {/* Active request */}
      {activeRequest ? (
        <Card style={styles.activeCard}>
          <View style={styles.rowBetween}>
            <Text style={styles.activeTitle}>🚑 {activeRequest.requestCode}</Text>
            <StatusChip label={String(activeRequest.status).toUpperCase()} variant="error" />
          </View>
          <Text style={typography.caption}>
            {activeRequest.ambulanceLabel} · ETA ~{activeRequest.etaMinutes} min
            {activeRequest.gpsFix === false ? ' · sent with last known location' : ''}
          </Text>
          <Button
            title="Refresh tracking"
            variant="outline"
            onPress={() => dispatch(trackAmbulance(activeRequest.id))}
            style={{ marginTop: spacing.sm }}
          />
        </Card>
      ) : null}

      {/* Emergency contacts */}
      <View style={styles.sectionHead}>
        <Text style={typography.h3}>Emergency contacts</Text>
        <Pressable onPress={() => setSheetOpen(true)}><Text style={styles.edit}>{contacts.length ? 'Edit' : 'Set up'}</Text></Pressable>
      </View>
      {contacts.length === 0 ? (
        <EmptyState icon="📇" message="No emergency contacts yet. Set them up so we can alert family during an SOS." />
      ) : (
        contacts.map(c => (
          <Card key={c.id || c.phone} style={styles.contactCard}>
            <View style={styles.rowBetween}>
              <Text style={styles.contactName}>{c.name}</Text>
              {c.isPrimary ? <StatusChip label="PRIMARY" variant="primary" /> : null}
            </View>
            <Text style={typography.caption}>+91 {c.phone} · {REL_LABEL(c.relation)}</Text>
          </Card>
        ))
      )}

      {/* Medical info */}
      {(bloodGroup || medicalNotes) ? (
        <Card style={{ marginTop: spacing.md }}>
          <Text style={typography.label}>Medical info</Text>
          {bloodGroup ? <Text style={styles.med}>Blood group: <Text style={styles.medStrong}>{bloodGroup}</Text></Text> : null}
          {medicalNotes ? <Text style={styles.med}>{medicalNotes}</Text> : null}
        </Card>
      ) : null}

      <EmergencyContactsSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSaved={() => dispatch(loadContacts())}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  intro: { ...typography.bodyMuted, marginBottom: spacing.lg },

  bigWrap: { alignItems: 'center', marginBottom: spacing.xl },
  bigBtn: {
    width: 200, height: 200, borderRadius: 100, backgroundColor: '#DC2626',
    alignItems: 'center', justifyContent: 'center',
    elevation: 8, shadowColor: '#DC2626', shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 6 },
  },
  bigText: { color: '#fff', fontSize: 44, fontWeight: '900', letterSpacing: 2 },
  bigHint: { color: '#FECACA', fontSize: 12, fontWeight: '700', marginTop: 4 },
  track: { width: 200, height: 6, borderRadius: radius.pill, backgroundColor: palette.surfaceAlt, overflow: 'hidden', marginTop: spacing.md },
  fill: { height: '100%', backgroundColor: '#DC2626' },

  activeCard: { borderColor: '#FCA5A5', backgroundColor: '#FEF2F2', marginBottom: spacing.md },
  activeTitle: { fontSize: 15, fontWeight: '800', color: '#B91C1C' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },

  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm, marginTop: spacing.sm },
  edit: { color: palette.primary, fontWeight: '700', fontSize: 13 },
  contactCard: { marginBottom: spacing.sm },
  contactName: { fontSize: 15, fontWeight: '700', color: palette.text },

  med: { ...typography.body, marginTop: 4 },
  medStrong: { fontWeight: '800', color: palette.text },
});
