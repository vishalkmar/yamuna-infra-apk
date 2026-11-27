import React, { useRef, useState, useEffect } from 'react';
import { Modal, View, Text, Image, FlatList, TouchableOpacity, StyleSheet, Dimensions, StatusBar, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import Feather from 'react-native-vector-icons/Feather';

// Full-screen gallery: swipe between photos and videos. Videos play with
// normal controls (play/pause/seek/fullscreen) — mp4 via an HTML5 player,
// YouTube via its embed player.
export function youtubeId(u) {
  const m = String(u || '').match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,})/);
  return m ? m[1] : null;
}
export function thumbOf(m) {
  if (m.thumb) return m.thumb;
  if (m.type !== 'video') return m.url;
  const yt = youtubeId(m.url);
  if (yt) return `https://img.youtube.com/vi/${yt}/hqdefault.jpg`;
  if (/res\.cloudinary\.com\/.+\/video\/upload\//.test(m.url)) return m.url.replace(/\.(mp4|mov|m4v|webm|3gp)(\?.*)?$/i, '.jpg').replace('/video/upload/', '/video/upload/so_1/');
  return null;
}

function VideoPlayer({ url, active }) {
  const yt = youtubeId(url);
  const html = yt
    ? `<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;background:#000;height:100%}iframe{border:0;width:100%;height:100%}</style></head>
       <body><iframe src="https://www.youtube.com/embed/${yt}?playsinline=1&rel=0&modestbranding=1" allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe></body></html>`
    : `<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;background:#000;height:100%;display:flex;align-items:center;justify-content:center}video{width:100%;max-height:100%}</style></head>
       <body><video src="${url}" controls playsinline preload="metadata"></video></body></html>`;
  if (!active) return <View style={styles.black} />;
  return (
    <WebView
      source={{ html, baseUrl: 'https://www.youtube.com' }}
      style={styles.black}
      allowsFullscreenVideo
      allowsInlineMediaPlayback
      mediaPlaybackRequiresUserAction={false}
      javaScriptEnabled
      startInLoadingState
      renderLoading={() => <ActivityIndicator color="#fff" style={StyleSheet.absoluteFill} />}
    />
  );
}

export default function MediaViewer({ items = [], index = 0, visible, onClose }) {
  const { width, height } = Dimensions.get('window');
  const [cur, setCur] = useState(index);
  const ref = useRef(null);
  useEffect(() => { if (visible) setCur(index); }, [visible, index]);

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={styles.wrap}>
        <FlatList
          ref={ref}
          data={items}
          horizontal pagingEnabled
          initialScrollIndex={index}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          keyExtractor={(m, i) => `${i}-${m.url}`}
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={e => setCur(Math.round(e.nativeEvent.contentOffset.x / width))}
          renderItem={({ item, index: i }) => (
            <View style={{ width, height, justifyContent: 'center' }}>
              {item.type === 'video'
                ? <View style={{ width, height: height * 0.8 }}><VideoPlayer url={item.url} active={i === cur} /></View>
                : <Image source={{ uri: item.url }} style={{ width, height: height * 0.85 }} resizeMode="contain" />}
              {item.caption ? <Text style={styles.caption}>{item.caption}</Text> : null}
            </View>
          )}
        />
        <View style={styles.top}>
          <Text style={styles.count}>{items.length ? `${cur + 1} / ${items.length}` : ''}</Text>
          <TouchableOpacity onPress={onClose} style={styles.close} hitSlop={10}>
            <Feather name="x" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#000' },
  black: { flex: 1, backgroundColor: '#000' },
  top: { position: 'absolute', top: 40, left: 16, right: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  count: { color: '#fff', fontWeight: '700', fontSize: 15 },
  close: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  caption: { color: '#ddd', textAlign: 'center', marginTop: 10, paddingHorizontal: 20 },
});
