import React, { useState } from 'react';
import { Image, View, Text } from 'react-native';

// Remote image with a friendly fallback: when there is no URL (or it fails to
// load) show a soft tinted tile with an emoji instead of an empty grey box.
const TINTS = ['#FFF0D6', '#E8EEFF', '#E4F6EC', '#FCE4E8', '#EDE7FF', '#E6F4FB'];

export default function SmartImage({ uri, style, emoji = '🍽️', seed = '', resizeMode = 'cover' }) {
  const [failed, setFailed] = useState(false);
  if (uri && !failed) {
    return <Image source={{ uri }} style={style} resizeMode={resizeMode} onError={() => setFailed(true)} />;
  }
  const tint = TINTS[Math.abs(String(seed).split('').reduce((a, ch) => a + ch.charCodeAt(0), 0)) % TINTS.length];
  const h = (style && (Array.isArray(style) ? Object.assign({}, ...style) : style).height) || 64;
  return (
    <View style={[style, { backgroundColor: tint, alignItems: 'center', justifyContent: 'center' }]}>
      <Text style={{ fontSize: Math.max(18, Math.round(h * 0.42)) }} allowFontScaling={false}>{emoji}</Text>
    </View>
  );
}
