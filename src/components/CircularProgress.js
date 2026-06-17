import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { palette } from '../theme';

// Circular progress without react-native-svg.
// Two half-circle "covers" rotate to reveal the underlying coloured ring.
// Trick:
//   • Draw a full ring (border) on the base View.
//   • Place 2 absolute-positioned half-circles on top of it.
//   • Rotate the right half (0–180°) and left half (180–360°) based on %.
//
// Works fine for ANY arbitrary %, no native deps, no animation lib required.

export default function CircularProgress({
  size = 160,
  thickness = 14,
  percent = 0,
  color = palette.primary,
  trackColor = palette.surfaceAlt,
  textColor = palette.text,
  label,
}) {
  const safePct = Math.max(0, Math.min(100, percent));
  const angle = (safePct / 100) * 360;
  const half = size / 2;

  // Rotation for two halves:
  const rightRotate = Math.min(180, angle);
  const leftRotate = Math.max(0, angle - 180);

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      {/* Track */}
      <View
        style={[
          styles.ring,
          {
            width: size, height: size, borderRadius: half,
            borderWidth: thickness, borderColor: trackColor,
          },
        ]}
      />
      {/* Coloured progress — left half */}
      <View
        style={[
          styles.halfWrap,
          { width: half, height: size, left: 0, transform: [{ rotate: '180deg' }] },
        ]}
      >
        <View
          style={[
            styles.halfInner,
            { width: half, height: size, borderRadius: half },
          ]}
        >
          <View
            style={[
              styles.halfFill,
              {
                width: half, height: size, borderRadius: half,
                borderWidth: thickness, borderColor: color,
                transform: [{ rotate: `${rightRotate}deg` }],
              },
            ]}
          />
        </View>
      </View>
      <View
        style={[
          styles.halfWrap,
          { width: half, height: size, right: 0, transform: [{ rotate: '0deg' }] },
        ]}
      >
        <View
          style={[
            styles.halfInner,
            { width: half, height: size, borderRadius: half },
          ]}
        >
          <View
            style={[
              styles.halfFill,
              {
                width: half, height: size, borderRadius: half,
                borderWidth: thickness, borderColor: color,
                transform: [{ rotate: `${leftRotate}deg` }],
              },
            ]}
          />
        </View>
      </View>
      {/* Center label */}
      <View style={[styles.center, { width: size, height: size }]}>
        <Text style={[styles.percent, { color: textColor }]}>{Math.round(safePct)}%</Text>
        {label ? <Text style={styles.label}>{label}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute' },
  halfWrap: { position: 'absolute', overflow: 'hidden' },
  halfInner: { overflow: 'hidden' },
  halfFill: { position: 'absolute', left: 0, top: 0 },
  center: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  percent: { fontSize: 28, fontWeight: '800' },
  label: { fontSize: 11, color: palette.textMuted, marginTop: 2, fontWeight: '600', letterSpacing: 0.4 },
});
