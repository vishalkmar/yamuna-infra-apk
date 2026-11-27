import React, { useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { palette } from '../theme';

// Alarm-clock style time picker: scroll wheels for hour (1–12) and minute
// (00–59) plus an AM/PM toggle. value/onChange use { hour12, minute, period }.
const ITEM = 44;
const VISIBLE = 5;
const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

function Wheel({ data, value, onChange, format = v => String(v) }) {
  const ref = useRef(null);
  const idx = Math.max(0, data.indexOf(Number(value)));
  useEffect(() => {
    const t = setTimeout(() => ref.current?.scrollTo({ y: idx * ITEM, animated: false }), 30);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const settle = y => {
    const i = Math.max(0, Math.min(data.length - 1, Math.round(y / ITEM)));
    if (data[i] !== Number(value)) onChange(data[i]);
  };
  return (
    <View style={styles.wheel}>
      <View pointerEvents="none" style={styles.band} />
      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM}
        decelerationRate="fast"
        nestedScrollEnabled
        contentContainerStyle={{ paddingVertical: ITEM * ((VISIBLE - 1) / 2) }}
        onMomentumScrollEnd={e => settle(e.nativeEvent.contentOffset.y)}
        onScrollEndDrag={e => settle(e.nativeEvent.contentOffset.y)}
      >
        {data.map((v, i) => {
          const on = v === Number(value);
          return (
            <TouchableOpacity key={v} activeOpacity={0.6} onPress={() => { ref.current?.scrollTo({ y: i * ITEM, animated: true }); onChange(v); }} style={styles.item}>
              <Text style={[styles.itemText, on && styles.itemOn]}>{format(v)}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

export default function TimeWheel({ value, onChange }) {
  const set = (k, v) => onChange({ ...value, [k]: v });
  return (
    <View style={styles.row}>
      <Wheel data={HOURS} value={value.hour12} onChange={v => set('hour12', v)} />
      <Text style={styles.colon}>:</Text>
      <Wheel data={MINUTES} value={value.minute} onChange={v => set('minute', v)} format={v => String(v).padStart(2, '0')} />
      <View style={styles.ampm}>
        {['AM', 'PM'].map(p => (
          <TouchableOpacity key={p} onPress={() => set('period', p)} style={[styles.pBtn, value.period === p && styles.pOn]} activeOpacity={0.8}>
            <Text style={[styles.pText, value.period === p && { color: '#fff' }]}>{p}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surface, borderRadius: 20, paddingVertical: 6, boxShadow: 'inset 3px 3px 7px rgba(163,177,198,0.55), inset -3px -3px 7px rgba(255,255,255,0.9)' },
  wheel: { width: 76, height: ITEM * VISIBLE, overflow: 'hidden' },
  band: { position: 'absolute', left: 4, right: 4, top: ITEM * ((VISIBLE - 1) / 2), height: ITEM, borderRadius: 12, backgroundColor: '#E3ECFB' },
  item: { height: ITEM, alignItems: 'center', justifyContent: 'center' },
  itemText: { fontSize: 20, color: '#94A3B8', fontWeight: '600' },
  itemOn: { fontSize: 28, color: palette.navy, fontWeight: '800' },
  colon: { fontSize: 28, fontWeight: '800', color: palette.navy, marginHorizontal: 2 },
  ampm: { marginLeft: 12, gap: 8 },
  pBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: '#EEF2FA' },
  pOn: { backgroundColor: palette.primary },
  pText: { fontWeight: '800', color: palette.navy, fontSize: 15 },
});
