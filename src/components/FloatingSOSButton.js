import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Text, StyleSheet, Pressable, Animated, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { activateSos, loadContacts } from '../store/slices/sosSlice';
import { dispatchSos } from '../services/sos';
import { showToast } from '../utils/toastConfig';
import { radius } from '../theme';

const HOLD_MS = 3000;

// Global red SOS button (overlay). 3-second hold to fire (anti-accidental).
export default function FloatingSOSButton() {
  const dispatch = useDispatch();
  const isLoggedIn = useSelector(s => s.auth.isLoggedIn);
  const activating = useSelector(s => s.sos.activating);
  const contacts = useSelector(s => s.sos.contacts);
  const userName = useSelector(s => s.auth.user?.name);
  const [holding, setHolding] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;
  const anim = useRef(null);

  // Make sure emergency persons are loaded so we can alert them on SOS.
  useEffect(() => { if (isLoggedIn) dispatch(loadContacts()); }, [isLoggedIn, dispatch]);

  const fire = useCallback(async () => {
    try {
      const res = await dispatch(activateSos({})).unwrap();
      showToast('error', '🆘 SOS ACTIVATED', 'Help is on the way! Helpdesk notified.');
      setTimeout(() => showToast('info', 'Ambulance dispatched', `ETA ~${res.etaMinutes} min. Track on map.`), 900);
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
    anim.current.start(({ finished }) => {
      if (finished) { setHolding(false); fire(); }
    });
  };

  const cancel = () => {
    anim.current?.stop();
    setHolding(false);
    progress.setValue(0);
  };

  if (!isLoggedIn) return null;

  const ringWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <Pressable
      onPressIn={start}
      onPressOut={cancel}
      disabled={activating}
      style={styles.wrap}
      accessibilityLabel="Emergency SOS — hold 3 seconds to activate"
    >
      <Text style={styles.label}>SOS</Text>
      <Text style={styles.hint}>{holding ? 'Hold…' : activating ? '…' : 'Hold 3s'}</Text>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, { width: ringWidth }]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    right: 16,
    bottom: 90,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  label: { color: '#fff', fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
  hint: { color: '#FECACA', fontSize: 7, fontWeight: '700', marginTop: 1 },
  track: {
    position: 'absolute', bottom: 5, left: 9, right: 9, height: 3,
    borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.3)', overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: '#fff' },
});
