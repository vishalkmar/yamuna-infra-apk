import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';

import { palette, spacing, FONT, NEU } from '../../theme';
import { Neu } from '../../components/neu';
import { showToast } from '../../utils/toastConfig';
import { setFullScreen } from '../../services/liveNotifications';
import { loadChat, sendChat, pushUserMessage } from '../../store/slices/companionSlice';

// Vrindavan Assistant — the AI chatbot as a full-screen tab (between
// Community and Profile). The tab bar hides while it is open so the
// composer has the whole bottom edge.
const SUGGESTIONS = [
  'Banke Bihari darshan timings today?',
  'When is my next installment due?',
  'Book a cook for tomorrow',
  'Nearest temples to my home',
];

export default function AssistantScreen({ navigation }) {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { messages, chatBusy } = useSelector(s => s.companion);
  const [draft, setDraft] = useState('');
  const scrollRef = useRef(null);

  useFocusEffect(useCallback(() => {
    setFullScreen(true);
    if (!messages.length) dispatch(loadChat());
    return () => setFullScreen(false);
  }, [dispatch, messages.length]));

  const scrollDown = useCallback(() => requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true })), []);
  useEffect(() => { scrollDown(); }, [messages, chatBusy, scrollDown]);

  const send = async text => {
    const msg = (text ?? draft).trim();
    if (!msg || chatBusy) return;
    setDraft('');
    dispatch(pushUserMessage(msg));
    try { await dispatch(sendChat(msg)).unwrap(); } catch (e) { showToast('error', 'Chat failed', String(e)); }
  };

  return (
    <KeyboardAvoidingView style={[styles.wrap, { paddingTop: insets.top }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('HomeTab')} hitSlop={10} style={styles.back}>
          <Feather name="arrow-left" size={22} color={palette.navy} />
        </TouchableOpacity>
        <View style={styles.avatar}><Text style={{ fontSize: 22 }}>🤖</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Vrindavan Assistant</Text>
          <Text style={styles.subtitle}>{chatBusy ? 'Companion is typing…' : 'Darshan · payments · services · reminders'}</Text>
        </View>
      </View>

      <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={styles.body} onContentSizeChange={scrollDown} keyboardShouldPersistTaps="handled">
        {messages.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🙏</Text>
            <Text style={styles.emptyText}>Radhe Radhe 🙏 Ask me anything about your community, temple visits or services.</Text>
            <View style={styles.sugs}>
              {SUGGESTIONS.map(s => (
                <TouchableOpacity key={s} onPress={() => send(s)} activeOpacity={0.8}>
                  <Neu variant="raisedSm" radius={16} style={styles.sug}><Text style={styles.sugText}>{s}</Text></Neu>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : messages.map(m => (
          <View key={m.id} style={[styles.row, m.role === 'user' ? styles.right : styles.left]}>
            <View style={[styles.bubble, m.role === 'user' ? styles.user : styles.ai]}>
              <Text style={[styles.text, m.role === 'user' && { color: '#fff' }]}>{m.content}</Text>
            </View>
          </View>
        ))}
        {chatBusy ? (
          <View style={[styles.row, styles.left]}><View style={[styles.bubble, styles.ai]}><Text style={styles.typing}>• • •</Text></View></View>
        ) : null}
      </ScrollView>

      <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 8) + 6 }]}>
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          placeholder="Ask anything…"
          placeholderTextColor={palette.textMuted}
          multiline
        />
        <TouchableOpacity style={[styles.send, (!draft.trim() || chatBusy) && { opacity: 0.45 }]} disabled={!draft.trim() || chatBusy} onPress={() => send()}>
          <Feather name="send" size={19} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: palette.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: 10, gap: 10, borderBottomWidth: 1, borderBottomColor: palette.divider },
  back: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surface, boxShadow: NEU.raisedSm },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E3ECFB' },
  title: { fontFamily: FONT, fontSize: 17, fontWeight: '800', color: palette.navy },
  subtitle: { fontSize: 12, color: palette.textMuted, marginTop: 1 },
  body: { padding: spacing.md, paddingBottom: spacing.lg },
  empty: { alignItems: 'center', marginTop: spacing.xl, paddingHorizontal: spacing.md },
  emptyIcon: { fontSize: 44 },
  emptyText: { fontSize: 15, color: palette.text, textAlign: 'center', marginTop: 10, lineHeight: 22 },
  sugs: { marginTop: spacing.lg, gap: 10, alignSelf: 'stretch' },
  sug: { paddingHorizontal: 16, paddingVertical: 12 },
  sugText: { color: palette.primary, fontWeight: '700', fontSize: 14 },
  row: { flexDirection: 'row', marginBottom: spacing.sm },
  left: { justifyContent: 'flex-start' },
  right: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '86%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  ai: { backgroundColor: palette.surface, borderTopLeftRadius: 4, boxShadow: NEU.raisedSm },
  user: { backgroundColor: palette.primary, borderTopRightRadius: 4 },
  text: { fontSize: 15, color: palette.text, lineHeight: 21 },
  typing: { fontSize: 18, color: palette.textMuted, letterSpacing: 2 },
  composer: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: spacing.md, paddingTop: 10, gap: 8, borderTopWidth: 1, borderTopColor: palette.divider, backgroundColor: palette.background },
  input: { flex: 1, minHeight: 46, maxHeight: 120, backgroundColor: palette.surface, borderRadius: 23, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, color: palette.text, fontSize: 15, boxShadow: NEU.insetSm },
  send: { width: 46, height: 46, borderRadius: 23, backgroundColor: palette.primary, alignItems: 'center', justifyContent: 'center', experimental_backgroundImage: NEU.navyGradient },
});
