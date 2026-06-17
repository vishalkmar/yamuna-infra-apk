import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import ScreenContainer from '../../components/ScreenContainer';
import Card from '../../components/Card';
import StatusChip from '../../components/StatusChip';
import { CardSkeleton } from '../../components/Skeleton';
import { palette, radius, spacing, typography } from '../../theme';
import { formatDate } from '../../utils/format';
import {
  loadTicket, replyTicket, rateTicket, bookAppointment, clearActive,
} from '../../store/slices/supportSlice';
import { showToast } from '../../utils/toastConfig';

const STATUS_VARIANT = {
  open: 'info', in_progress: 'warning', resolved: 'success', closed: 'neutral',
};

function nextWeekdaySlotISO() {
  // Tomorrow at 11:00 local — a sensible default CRM call slot.
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(11, 0, 0, 0);
  return d.toISOString();
}

export default function TicketDetailScreen({ route }) {
  const dispatch = useDispatch();
  const { ticketId } = route.params;
  const { active, activeLoading, replyBusy, rateBusy, apptBusy } = useSelector(s => s.support);
  const [draft, setDraft] = useState('');

  const reload = useCallback(() => { dispatch(loadTicket(ticketId)); }, [dispatch, ticketId]);

  useEffect(() => {
    reload();
    return () => dispatch(clearActive());
  }, [reload, dispatch]);

  const send = async () => {
    const body = draft.trim();
    if (!body) return;
    try {
      await dispatch(replyTicket({ ticketId, body })).unwrap();
      setDraft('');
    } catch (e) {
      showToast('error', 'Could not send', String(e));
    }
  };

  const rate = async stars => {
    try {
      await dispatch(rateTicket({ ticketId, rating: stars })).unwrap();
      showToast('success', 'Thanks!', 'Your feedback has been recorded.');
    } catch (e) {
      showToast('error', 'Could not rate', String(e));
    }
  };

  const scheduleCall = async () => {
    try {
      const res = await dispatch(bookAppointment({
        ticketId,
        category: active?.category,
        scheduledAt: nextWeekdaySlotISO(),
        mode: 'call',
      })).unwrap();
      showToast('success', 'Call scheduled', `With ${res.agentName} on ${formatDate(res.scheduledAt)}.`);
    } catch (e) {
      showToast('error', 'Could not schedule', String(e));
    }
  };

  if (activeLoading && !active) {
    return <ScreenContainer><CardSkeleton /><CardSkeleton /></ScreenContainer>;
  }
  if (!active) {
    return <ScreenContainer><Text style={typography.bodyMuted}>Ticket not found.</Text></ScreenContainer>;
  }

  const messages = active.messages || [];
  const showRating = active.status === 'resolved' && !active.rating;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenContainer refreshing={activeLoading} onRefresh={reload}>
        {/* Header */}
        <Card style={{ marginBottom: spacing.md }}>
          <View style={styles.headRow}>
            <Text style={styles.code}>{active.ticketCode}</Text>
            <StatusChip
              label={String(active.status).replace('_', ' ').toUpperCase()}
              variant={STATUS_VARIANT[active.status] || 'neutral'}
            />
          </View>
          <Text style={styles.subject}>{active.subject}</Text>
          {active.assignedAgent ? (
            <Text style={typography.caption}>Assigned to {active.assignedAgent}</Text>
          ) : null}
          <TouchableOpacity style={styles.callBtn} disabled={apptBusy} onPress={scheduleCall}>
            <Text style={styles.callText}>{apptBusy ? 'Scheduling…' : '📞 Schedule a call with CRM'}</Text>
          </TouchableOpacity>
        </Card>

        {/* Thread */}
        {messages.map(m => (
          <View
            key={m.id}
            style={[styles.bubbleRow, m.author === 'user' ? styles.rowRight : styles.rowLeft]}
          >
            <View style={[styles.bubble, m.author === 'user' ? styles.bubbleUser : styles.bubbleAgent]}>
              <Text style={[styles.bubbleText, m.author === 'user' && styles.bubbleTextUser]}>{m.body}</Text>
              <Text style={[styles.bubbleTime, m.author === 'user' && styles.bubbleTimeUser]}>
                {formatDate(m.createdAt)}
              </Text>
            </View>
          </View>
        ))}

        {/* Rating */}
        {showRating ? (
          <Card style={styles.rateCard}>
            <Text style={typography.label}>Rate your experience</Text>
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map(s => (
                <TouchableOpacity key={s} disabled={rateBusy} onPress={() => rate(s)} hitSlop={6}>
                  <Text style={styles.star}>☆</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>
        ) : null}

        {active.rating ? (
          <Text style={styles.ratedNote}>You rated this {active.rating}/5 ⭐</Text>
        ) : null}
      </ScreenContainer>

      {/* Composer */}
      {active.status !== 'closed' ? (
        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            placeholder="Type a message…"
            placeholderTextColor={palette.textMuted}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!draft.trim() || replyBusy) && styles.sendDisabled]}
            disabled={!draft.trim() || replyBusy}
            onPress={send}
          >
            <Text style={styles.sendText}>{replyBusy ? '…' : 'Send'}</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  code: { fontSize: 12, fontWeight: '700', color: palette.textMuted, letterSpacing: 0.4 },
  subject: { fontSize: 16, fontWeight: '800', color: palette.text, marginBottom: 4 },
  callBtn: {
    marginTop: spacing.md, paddingVertical: 10,
    borderRadius: radius.md, borderWidth: 1.5, borderColor: palette.primary, alignItems: 'center',
  },
  callText: { color: palette.primary, fontWeight: '700', fontSize: 13 },

  bubbleRow: { flexDirection: 'row', marginBottom: spacing.sm },
  rowLeft: { justifyContent: 'flex-start' },
  rowRight: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '82%', padding: spacing.md, borderRadius: radius.lg },
  bubbleAgent: { backgroundColor: palette.surface, borderTopLeftRadius: 4 },
  bubbleUser: { backgroundColor: palette.primary, borderTopRightRadius: 4 },
  bubbleText: { fontSize: 14, color: palette.text, lineHeight: 20 },
  bubbleTextUser: { color: '#fff' },
  bubbleTime: { fontSize: 10, color: palette.textMuted, marginTop: 6 },
  bubbleTimeUser: { color: '#DBE3FF' },

  rateCard: { marginTop: spacing.sm, alignItems: 'flex-start' },
  starRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  star: { fontSize: 30, color: palette.accent, marginRight: 6 },
  ratedNote: { ...typography.caption, marginTop: spacing.sm },

  composer: {
    flexDirection: 'row', alignItems: 'flex-end',
    padding: spacing.sm, gap: spacing.sm,
    backgroundColor: palette.surface,
    borderTopWidth: 1, borderTopColor: palette.divider,
  },
  input: {
    flex: 1, maxHeight: 120, minHeight: 44,
    backgroundColor: palette.background,
    borderRadius: radius.md, borderWidth: 1, borderColor: palette.border,
    paddingHorizontal: spacing.md, paddingVertical: 10,
    color: palette.text, fontSize: 14,
    marginRight: spacing.sm,
  },
  sendBtn: {
    backgroundColor: palette.primary, borderRadius: radius.md,
    paddingHorizontal: spacing.lg, height: 44, justifyContent: 'center',
  },
  sendDisabled: { opacity: 0.5 },
  sendText: { color: '#fff', fontWeight: '700' },
});
