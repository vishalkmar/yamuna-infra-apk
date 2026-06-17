import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, TextInput,
  ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { palette, radius, spacing, typography } from '../theme';
import { showToast } from '../utils/toastConfig';
import { loadChat, sendChat, pushUserMessage } from '../store/slices/companionSlice';

// Global floating chatbot (overlay), sits beside the SOS button. Opens the
// Vrindavan Companion chat in a modal so it is reachable from anywhere.
export default function FloatingChatButton() {
  const dispatch = useDispatch();
  const isLoggedIn = useSelector(s => s.auth.isLoggedIn);
  const { messages, chatBusy } = useSelector(s => s.companion);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => { if (open && messages.length === 0) dispatch(loadChat()); }, [open, messages.length, dispatch]);

  const scrollDown = useCallback(() => {
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  }, []);

  useEffect(() => { if (open) scrollDown(); }, [messages, chatBusy, open, scrollDown]);

  const send = async () => {
    const msg = draft.trim();
    if (!msg) return;
    setDraft('');
    dispatch(pushUserMessage(msg));
    try { await dispatch(sendChat(msg)).unwrap(); }
    catch (e) { showToast('error', 'Chat failed', String(e)); }
  };

  if (!isLoggedIn) return null;

  return (
    <>
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => setOpen(true)}
        accessibilityLabel="Open Vrindavan Companion chat"
      >
        <Text style={styles.fabIcon}>🤖</Text>
      </TouchableOpacity>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView style={styles.panel} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>🤖 Vrindavan Companion</Text>
                <Text style={styles.subtitle}>Darshan · payments · services · reminders</Text>
              </View>
              <TouchableOpacity onPress={() => setOpen(false)} hitSlop={10}><Text style={styles.close}>×</Text></TouchableOpacity>
            </View>

            <ScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={styles.scrollBody} onContentSizeChange={scrollDown}>
              {messages.length === 0 ? (
                <Text style={styles.empty}>Radhe Radhe 🙏 Ask me anything about your community, temple visits or services.</Text>
              ) : messages.map(m => (
                <View key={m.id} style={[styles.bubbleRow, m.role === 'user' ? styles.right : styles.left]}>
                  <View style={[styles.bubble, m.role === 'user' ? styles.bubbleUser : styles.bubbleAi]}>
                    <Text style={[styles.bubbleText, m.role === 'user' && { color: '#fff' }]}>{m.content}</Text>
                  </View>
                </View>
              ))}
              {chatBusy ? <Text style={styles.typing}>Companion is typing…</Text> : null}
            </ScrollView>

            <View style={styles.composer}>
              <TextInput
                style={styles.input}
                value={draft}
                onChangeText={setDraft}
                placeholder="Type your message…"
                placeholderTextColor={palette.textMuted}
                multiline
              />
              <TouchableOpacity style={[styles.sendBtn, (!draft.trim() || chatBusy) && styles.sendDisabled]} disabled={!draft.trim() || chatBusy} onPress={send}>
                <Text style={styles.sendText}>Send</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute', right: 16, bottom: 150,
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: palette.primary,
    alignItems: 'center', justifyContent: 'center',
    elevation: 8, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 3 },
  },
  fabIcon: { fontSize: 24 },

  overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'flex-end' },
  panel: { backgroundColor: palette.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '82%', overflow: 'hidden' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: palette.divider },
  title: { fontSize: 16, fontWeight: '800', color: palette.text },
  subtitle: { ...typography.caption, marginTop: 2 },
  close: { fontSize: 28, color: palette.textMuted },

  scroll: { flex: 1 },
  scrollBody: { padding: spacing.md },
  empty: { ...typography.bodyMuted, textAlign: 'center', marginTop: spacing.xl, paddingHorizontal: spacing.lg },

  bubbleRow: { flexDirection: 'row', marginBottom: spacing.sm },
  left: { justifyContent: 'flex-start' },
  right: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '85%', padding: spacing.md, borderRadius: radius.lg },
  bubbleAi: { backgroundColor: palette.surface, borderTopLeftRadius: 4 },
  bubbleUser: { backgroundColor: palette.primary, borderTopRightRadius: 4 },
  bubbleText: { fontSize: 14, color: palette.text, lineHeight: 20 },
  typing: { ...typography.caption, fontStyle: 'italic', marginBottom: spacing.sm },

  composer: { flexDirection: 'row', alignItems: 'flex-end', padding: spacing.sm, gap: spacing.sm, backgroundColor: palette.surface, borderTopWidth: 1, borderTopColor: palette.divider },
  input: { flex: 1, maxHeight: 110, minHeight: 44, backgroundColor: palette.background, borderRadius: radius.md, borderWidth: 1, borderColor: palette.border, paddingHorizontal: spacing.md, paddingVertical: 10, color: palette.text, fontSize: 14, marginRight: spacing.sm },
  sendBtn: { backgroundColor: palette.primary, borderRadius: radius.md, paddingHorizontal: spacing.lg, height: 44, justifyContent: 'center' },
  sendDisabled: { opacity: 0.5 },
  sendText: { color: '#fff', fontWeight: '700' },
});
