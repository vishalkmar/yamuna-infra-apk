import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Image,
  ActivityIndicator, NativeModules, Linking,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import api from '../../api/client';
import { palette, FONT } from '../../theme';
import MediaViewer from '../../components/MediaViewer';
import { downloadFile } from '../../services/downloader';
import { onChat, setChatOpen, onLiveStatus, isLive, ensureLive } from '../../services/liveNotifications';
import { showToast } from '../../utils/toastConfig';
import useKeyboardPadding from '../../hooks/useKeyboardPadding';

// WhatsApp-style support chat with the Yamuna Infra office. Real-time over
// the app socket; ticks: ✓ sent · ✓✓ delivered · blue ✓✓ read.
const WALL = '#E9EEF6';
const MINE = '#DCF3E4';
const time = d => new Date(String(d).replace(' ', 'T')).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
const day = d => {
  const dt = new Date(String(d).replace(' ', 'T'));
  const today = new Date(); const y = new Date(Date.now() - 86400000);
  if (dt.toDateString() === today.toDateString()) return 'Today';
  if (dt.toDateString() === y.toDateString()) return 'Yesterday';
  return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

function Ticks({ status }) {
  if (status === 'sending') return <Feather name="clock" size={12} color="#94A3B8" />;
  if (status === 'failed') return <Feather name="alert-circle" size={13} color="#DC2626" />;
  const color = status === 'read' ? '#2563EB' : '#94A3B8';
  return (
    <View style={{ flexDirection: 'row', width: status === 'sent' ? 12 : 17 }}>
      <Feather name="check" size={13} color={color} />
      {status !== 'sent' ? <Feather name="check" size={13} color={color} style={{ marginLeft: -8 }} /> : null}
    </View>
  );
}

function Attachment({ a, onImage }) {
  if (/^image\//.test(a.mime || '') || /\.(jpe?g|png|webp|gif)$/i.test(a.name || '')) {
    return (
      <TouchableOpacity onPress={onImage} activeOpacity={0.85}>
        <Image source={{ uri: a.localUri || a.url }} style={styles.img} resizeMode="cover" />
      </TouchableOpacity>
    );
  }
  const video = /^video\//.test(a.mime || '');
  return (
    <TouchableOpacity onPress={() => (video ? onImage() : a.url && downloadFile(a.url, a.name))} activeOpacity={0.8} style={styles.file}>
      <Feather name={video ? 'film' : 'file-text'} size={22} color={palette.primary} />
      <View style={{ flex: 1, marginLeft: 8 }}>
        <Text style={styles.fileName} numberOfLines={1}>{a.name}</Text>
        <Text style={styles.fileMeta}>{a.size ? `${Math.max(1, Math.round(a.size / 1024))} KB · ` : ''}{video ? 'Tap to play' : 'Tap to download'}</Text>
      </View>
      {!video ? <Feather name="download" size={18} color={palette.primary} /> : null}
    </TouchableOpacity>
  );
}

export default function SupportChatScreen() {
  const insets = useSafeAreaInsets();
  const kb = useKeyboardPadding();
  const [msgs, setMsgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [files, setFiles] = useState([]);
  const [viewer, setViewer] = useState(null);
  const list = useRef(null);

  const [live, setLiveState] = useState(isLive());
  useEffect(() => onLiveStatus(setLiveState), []);

  // Server copy is the truth; keep only our still-sending bubbles on top of it.
  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/support/chat');
      const server = data.data || [];
      setMsgs(prev => [...server, ...prev.filter(m => m.tempId && !server.some(s => s.body === m.body && s.sender === 'user' && !m.failed))]);
      if (server.some(m => m.sender === 'admin' && m.status !== 'read')) api.post('/support/chat/read').catch(() => {});
    } catch (e) { /* offline */ } finally { setLoading(false); }
  }, []);

  // Live over the socket; a light sync every few seconds as a safety net
  // (every 4s while the socket is down, every 15s while it is up).
  useFocusEffect(useCallback(() => {
    setChatOpen(true);
    ensureLive();
    load();
    let n = 0;
    const t = setInterval(() => { n += 1; if (!isLive() || n % 4 === 0) load(); if (!isLive()) ensureLive(); }, 4000);
    return () => { clearInterval(t); setChatOpen(false); };
  }, [load]));

  // Live: new messages, delivered / read receipts.
  useEffect(() => onChat(msg => {
    if (msg.type === 'chat') {
      setMsgs(prev => (prev.some(m => m.id === msg.data.id) ? prev : [...prev.filter(m => !(m.tempId && m.body === msg.data.body && msg.data.sender === 'user')), msg.data]));
      if (msg.data.sender === 'admin') api.post('/support/chat/read').catch(() => {});
    } else if (msg.type === 'chat_read' && msg.data.reader === 'admin') {
      setMsgs(prev => prev.map(m => (m.sender === 'user' ? { ...m, status: 'read' } : m)));
    } else if (msg.type === 'chat_delivered' && msg.data.to === 'admin') {
      setMsgs(prev => prev.map(m => (m.sender === 'user' && m.status === 'sent' ? { ...m, status: 'delivered' } : m)));
    }
  }), []);

  const pick = async () => {
    const picker = NativeModules.YIFilePicker;
    if (!picker) { showToast('info', 'Update the app', 'Attachments need the latest app version.'); return; }
    try {
      const f = await picker.pick('any');
      if (!f) return;
      if (f.size > 15 * 1024 * 1024) { showToast('error', 'File too large', 'Max 15 MB per file.'); return; }
      setFiles(prev => [...prev, f].slice(0, 5));
    } catch (e) { showToast('error', 'Could not attach', e?.message || ''); }
  };

  const send = async () => {
    const body = text.trim();
    if (!body && !files.length) return;
    const tempId = `t${Date.now()}`;
    const optimistic = {
      id: tempId, tempId, sender: 'user', body, status: 'sending', createdAt: new Date().toISOString(),
      attachments: files.map(f => ({ name: f.name, mime: f.type, size: f.size, localUri: f.uri })),
    };
    setMsgs(prev => [...prev, optimistic]);
    setText(''); const sending = files; setFiles([]);
    try {
      const form = new FormData();
      form.append('body', body);
      sending.forEach(f => form.append('files', { uri: f.uri, name: f.name, type: f.type }));
      const { data } = await api.post('/support/chat', form, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120000 });
      setMsgs(prev => {
        const without = prev.filter(m => m.id !== tempId);
        return without.some(m => m.id === data.data.id) ? without : [...without, data.data];
      });
    } catch (e) {
      setMsgs(prev => prev.map(m => (m.id === tempId ? { ...m, status: 'failed', failed: true } : m)));
      showToast('error', 'Not sent', e?.response?.data?.message || 'Check your internet and try again.');
    }
  };

  // Newest at the bottom; inverted list wants newest first. Insert day chips.
  const rows = useMemo(() => {
    const out = [];
    let lastDay = null;
    msgs.forEach(m => {
      const d = day(m.createdAt);
      if (d !== lastDay) { out.push({ kind: 'day', id: `d-${d}-${m.id}`, label: d }); lastDay = d; }
      out.push({ kind: 'msg', ...m });
    });
    return out.reverse();
  }, [msgs]);

  const openImages = (m, a) => {
    const media = (m.attachments || []).filter(x => /^(image|video)\//.test(x.mime || '') || /\.(jpe?g|png|webp|gif)$/i.test(x.name || ''))
      .map(x => ({ type: /^video\//.test(x.mime || '') ? 'video' : 'image', url: x.url || x.localUri }));
    const i = media.findIndex(x => x.url === (a.url || a.localUri));
    setViewer({ items: media, index: Math.max(0, i) });
  };

  const renderItem = ({ item }) => {
    if (item.kind === 'day') return <View style={styles.dayWrap}><Text style={styles.day}>{item.label}</Text></View>;
    const mine = item.sender === 'user';
    return (
      <View style={[styles.row, mine ? styles.rowMine : styles.rowTheirs]}>
        <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
          {!mine ? <Text style={styles.author}>{item.adminName || 'Support'}</Text> : null}
          {(item.attachments || []).map((a, i) => <Attachment key={i} a={a} onImage={() => openImages(item, a)} />)}
          {item.body ? <Text style={styles.body}>{item.body}</Text> : null}
          <View style={styles.meta}>
            <Text style={styles.time}>{time(item.createdAt)}</Text>
            {mine ? <Ticks status={item.status} /> : null}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View ref={kb.ref} collapsable={false} style={[styles.wrap, { paddingBottom: kb.pad }]}>
      <View style={styles.banner}>
        <Feather name="headphones" size={16} color={palette.primary} />
        <Text style={styles.bannerText}>Chat with the Yamuna Infra office · replies here & as a notification</Text>
        <View style={[styles.liveDot, { backgroundColor: live ? '#16A34A' : '#F59E0B' }]} />
        <Text style={[styles.liveText, { color: live ? '#16A34A' : '#B45309' }]}>{live ? 'Live' : 'Connecting…'}</Text>
      </View>
      {loading ? <ActivityIndicator style={{ marginTop: 40 }} color={palette.primary} /> : (
        <FlatList
          ref={list}
          inverted
          data={rows}
          keyExtractor={r => String(r.id)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingVertical: 10, paddingHorizontal: 10 }}
          ListFooterComponent={msgs.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>👋 How can we help?</Text>
              <Text style={styles.emptyText}>Send a message, photo or document. Our team will reply here.</Text>
            </View>
          ) : null}
        />
      )}

      {files.length ? (
        <View style={styles.pending}>
          {files.map((f, i) => (
            <View key={i} style={styles.chip}>
              <Feather name={/^image/.test(f.type) ? 'image' : /^video/.test(f.type) ? 'film' : 'file'} size={14} color={palette.primary} />
              <Text style={styles.chipText} numberOfLines={1}>{f.name}</Text>
              <TouchableOpacity onPress={() => setFiles(p => p.filter((_, j) => j !== i))} hitSlop={8}><Feather name="x" size={14} color="#64748B" /></TouchableOpacity>
            </View>
          ))}
        </View>
      ) : null}

      <View style={[styles.composer, { paddingBottom: kb.keyboardOpen ? 8 : Math.max(insets.bottom, 8) + 4 }]}>
        <TouchableOpacity onPress={pick} style={styles.iconBtn} hitSlop={6}><Feather name="paperclip" size={21} color="#64748B" /></TouchableOpacity>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Type a message"
          placeholderTextColor="#94A3B8"
          multiline
          style={styles.input}
        />
        <TouchableOpacity onPress={send} activeOpacity={0.8} style={[styles.send, !(text.trim() || files.length) && { opacity: 0.5 }]}>
          <Feather name="send" size={19} color="#fff" />
        </TouchableOpacity>
      </View>
      <MediaViewer visible={!!viewer} items={viewer?.items || []} index={viewer?.index || 0} onClose={() => setViewer(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: WALL },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#F6F8FC', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  bannerText: { fontSize: 12, color: '#475569', flex: 1 },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  liveText: { fontSize: 11, fontWeight: '800' },
  dayWrap: { alignItems: 'center', marginVertical: 8 },
  day: { fontSize: 11.5, color: '#475569', backgroundColor: '#fff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, overflow: 'hidden', fontWeight: '600' },
  row: { flexDirection: 'row', marginVertical: 2 },
  rowMine: { justifyContent: 'flex-end' },
  rowTheirs: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '82%', paddingHorizontal: 10, paddingTop: 6, paddingBottom: 4, borderRadius: 14 },
  mine: { backgroundColor: MINE, borderTopRightRadius: 4 },
  theirs: { backgroundColor: '#fff', borderTopLeftRadius: 4 },
  author: { fontSize: 12, fontWeight: '800', color: palette.primary, marginBottom: 2 },
  body: { fontSize: 15, color: '#0F172A', lineHeight: 20 },
  meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 2 },
  time: { fontSize: 10.5, color: '#64748B' },
  img: { width: 220, height: 220, borderRadius: 10, marginBottom: 4, backgroundColor: '#CBD5E1' },
  file: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 10, padding: 8, marginBottom: 4, minWidth: 200 },
  fileName: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  fileMeta: { fontSize: 11, color: '#64748B' },
  empty: { alignItems: 'center', padding: 30 },
  emptyTitle: { fontFamily: FONT, fontSize: 18, fontWeight: '800', color: palette.navy },
  emptyText: { fontSize: 13, color: '#64748B', textAlign: 'center', marginTop: 6 },
  pending: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 10, paddingTop: 6, backgroundColor: '#F6F8FC' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6, maxWidth: 220 },
  chipText: { fontSize: 12, color: '#0F172A', flexShrink: 1 },
  composer: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 8, paddingTop: 8, backgroundColor: '#F6F8FC', gap: 6 },
  iconBtn: { width: 40, height: 44, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, minHeight: 44, maxHeight: 120, backgroundColor: '#fff', borderRadius: 22, paddingHorizontal: 16, paddingTop: 11, paddingBottom: 11, fontSize: 15, color: '#0F172A' },
  send: { width: 46, height: 46, borderRadius: 23, backgroundColor: palette.primary, alignItems: 'center', justifyContent: 'center' },
});
