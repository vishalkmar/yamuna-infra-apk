import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Linking } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import ScreenContainer from '../../components/ScreenContainer';
import Card from '../../components/Card';
import StatusChip from '../../components/StatusChip';
import EmptyState from '../../components/EmptyState';
import { palette, radius, spacing, typography } from '../../theme';
import { showToast } from '../../utils/toastConfig';
import { loadContacts, activateSos } from '../../store/slices/sosSlice';

const HOLD_MS = 3000;

export default function SOSScreen() {
  const dispatch = useDispatch();
  const { sosPhone, services, activeRequest, activating } = useSelector(s => s.sos);
  const [holding, setHolding] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;
  const anim = useRef(null);

  useEffect(() => { dispatch(loadContacts()); }, [dispatch]);

  const fire = useCallback(async () => {
    try {
      await dispatch(activateSos({})).unwrap();
      showToast('error', '🆘 SOS SENT', 'Reception alerted. Help is on the way!');
    } catch (e) {
      showToast('error', 'SOS failed', String(e));
    }
  }, [dispatch]);

  const start = () => {
    setHolding(true);
    progress.setValue(0);
    anim.current = Animated.timing(progress, { toValue: 1, duration: HOLD_MS, useNativeDriver: false });
    anim.current.start(({ finished }) => { if (finished) { setHolding(false); fire(); } });
  };
  const cancel = () => { anim.current?.stop(); setHolding(false); progress.setValue(0); };

  const ringWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const call = phone => phone && Linking.openURL(`tel:${phone}`).catch(() => {});

  return (
    <ScreenContainer refreshing={false} onRefresh={() => dispatch(loadContacts())}>
      <Text style={styles.intro}>
        In an emergency, press and hold the button for 3 seconds. Reception is alerted instantly with
        your unit details so the team can reach you fast.
      </Text>

      {/* Hold to activate */}
      <Pressable onPressIn={start} onPressOut={cancel} disabled={activating} style={styles.bigWrap}>
        <View style={styles.bigBtn}>
          <Text style={styles.bigText}>SOS</Text>
          <Text style={styles.bigHint}>{holding ? 'Keep holding…' : activating ? 'Sending…' : 'Hold 3 seconds'}</Text>
        </View>
        <View style={styles.track}><Animated.View style={[styles.fill, { width: ringWidth }]} /></View>
      </Pressable>

      {activeRequest ? (
        <Card style={styles.activeCard}>
          <View style={styles.rowBetween}>
            <Text style={styles.activeTitle}>🆘 {activeRequest.requestCode}</Text>
            <StatusChip label="SENT" variant="error" />
          </View>
          <Text style={typography.caption}>Reception has been alerted. Stay safe — help is on the way.</Text>
        </Card>
      ) : null}

      {/* SOS dispatch number */}
      {sosPhone ? (
        <Pressable onPress={() => call(sosPhone)}>
          <Card style={styles.sosCard}>
            <View style={styles.rowBetween}>
              <View>
                <Text style={styles.sosLabel}>SOS Control Room</Text>
                <Text style={styles.sosNum}>{sosPhone}</Text>
              </View>
              <Text style={styles.callBtn}>📞 Call</Text>
            </View>
          </Card>
        </Pressable>
      ) : null}

      {/* Emergency services (admin-managed) */}
      <View style={styles.sectionHead}><Text style={typography.h3}>Emergency contacts</Text></View>
      {(!services || services.length === 0) ? (
        <EmptyState icon="📇" message="No emergency contacts available yet." />
      ) : services.map(c => (
        <Pressable key={c.id} onPress={() => call(c.phone)}>
          <Card style={styles.contactCard}>
            <View style={styles.rowBetween}>
              <View>
                <Text style={styles.contactName}>{c.name}</Text>
                <Text style={typography.caption}>{c.phone}</Text>
              </View>
              <Text style={styles.callBtn}>📞 Call</Text>
            </View>
          </Card>
        </Pressable>
      ))}
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
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  sosCard: { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5', marginBottom: spacing.md },
  sosLabel: { ...typography.caption, color: '#B91C1C', fontWeight: '700' },
  sosNum: { fontSize: 18, fontWeight: '800', color: palette.text, marginTop: 2 },

  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm, marginTop: spacing.sm },
  contactCard: { marginBottom: spacing.sm },
  contactName: { fontSize: 15, fontWeight: '700', color: palette.text },
  callBtn: { color: palette.primary, fontWeight: '800', fontSize: 14 },
});
