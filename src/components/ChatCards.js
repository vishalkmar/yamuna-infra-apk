import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { palette, FONT, NEU } from '../theme';

// Rich cards the assistant sends with a reply: key/value tables, lists with
// per-row buttons, how-to steps and action buttons.
//   action: { label, link } → open a screen
//           { label, download, filename } → save a PDF to the phone
//           { label, book: { type, data, category?, categoryLabel? } } → booking sheet in the chat
const TONE = {
  green: ['#16794A', '#DCF5E7'], amber: ['#B45309', '#FDF0DA'], red: ['#C62828', '#FDE4E4'], slate: ['#475569', '#EEF2F7'],
};

function Btn({ a, onAction, small }) {
  const icon = a.download ? 'download' : a.book ? 'calendar' : 'arrow-right';
  const primary = !!a.book || (!small && !a.download);
  return (
    <TouchableOpacity onPress={() => onAction(a)} activeOpacity={0.8}
      style={[styles.btn, small && styles.btnSmall, primary ? styles.btnPrimary : styles.btnLight]}>
      <Feather name={icon} size={small ? 13 : 15} color={primary ? '#fff' : palette.primary} />
      <Text style={[styles.btnText, small && { fontSize: 12 }, { color: primary ? '#fff' : palette.primary }]} numberOfLines={1}>{a.label}</Text>
    </TouchableOpacity>
  );
}

function Item({ it, onAction }) {
  const [open, setOpen] = useState(false);
  const tone = TONE[it.tone] || TONE.slate;
  return (
    <View style={styles.item}>
      <TouchableOpacity activeOpacity={it.details?.length ? 0.7 : 1} onPress={() => it.details?.length && setOpen(o => !o)} style={styles.itemTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.itemTitle} numberOfLines={2}>{it.title}</Text>
          {it.sub ? <Text style={styles.itemSub} numberOfLines={2}>{it.sub}</Text> : null}
          {it.badge ? <View style={[styles.badge, { backgroundColor: tone[1] }]}><Text style={[styles.badgeText, { color: tone[0] }]}>{String(it.badge).replace(/_/g, ' ')}</Text></View> : null}
        </View>
        {it.right ? <Text style={styles.itemRight}>{it.right}</Text> : null}
      </TouchableOpacity>
      {open ? it.details.map((d, i) => <Text key={i} style={styles.detail}>• {d}</Text>) : null}
      {it.details?.length && !open ? <Text style={styles.more} onPress={() => setOpen(true)}>{`${it.details.length} services ›`}</Text> : null}
      {it.actions?.length ? <View style={styles.itemActions}>{it.actions.map((a, i) => <Btn key={i} a={a} onAction={onAction} small />)}</View> : null}
    </View>
  );
}

export function ChatCard({ card, onAction }) {
  const kv = (card.kv || []).filter(([, v]) => v != null && v !== '');
  return (
    <View style={styles.card}>
      <View style={styles.head}>
        {card.icon ? <View style={styles.iconWrap}><Feather name={card.icon} size={16} color={palette.primary} /></View> : null}
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{card.title}</Text>
          {card.subtitle ? <Text style={styles.subtitle}>{card.subtitle}</Text> : null}
        </View>
      </View>
      {kv.length ? (
        <View style={styles.kv}>
          {kv.map(([k, v], i) => (
            <View key={`${k}-${i}`} style={[styles.kvRow, i % 2 === 0 && { backgroundColor: '#F6F8FC' }]}>
              <Text style={styles.kvKey}>{k}</Text>
              <Text style={styles.kvVal} selectable>{String(v)}</Text>
            </View>
          ))}
        </View>
      ) : null}
      {card.steps?.length ? (
        <View style={{ marginTop: 6 }}>
          {card.steps.map((s, i) => (
            <View key={i} style={styles.step}>
              <View style={styles.stepNum}><Text style={styles.stepNumText}>{i + 1}</Text></View>
              <Text style={styles.stepText}>{s}</Text>
            </View>
          ))}
        </View>
      ) : null}
      {card.items?.length ? (
        <View style={{ marginTop: 8 }}>
          {card.itemsTitle ? <Text style={styles.itemsTitle}>{card.itemsTitle}</Text> : null}
          {card.items.map((it, i) => <Item key={i} it={it} onAction={onAction} />)}
        </View>
      ) : null}
      {card.actions?.length ? <View style={styles.actions}>{card.actions.map((a, i) => <Btn key={i} a={a} onAction={onAction} />)}</View> : null}
    </View>
  );
}

export default function ChatCards({ cards, onAction }) {
  if (!cards || !cards.length) return null;
  return <View style={{ marginTop: 6, marginBottom: 6 }}>{cards.map((c, i) => <ChatCard key={i} card={c} onAction={onAction} />)}</View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: palette.surface, borderRadius: 18, padding: 12, marginBottom: 10, boxShadow: NEU.raisedSm, maxWidth: '96%' },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconWrap: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#E3ECFB', alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: FONT, fontSize: 15, fontWeight: '800', color: palette.navy },
  subtitle: { fontSize: 12, color: palette.textMuted, marginTop: 1 },
  kv: { marginTop: 10, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0' },
  kvRow: { flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 7, gap: 8 },
  kvKey: { width: '44%', fontSize: 12.5, color: palette.textMuted },
  kvVal: { flex: 1, fontSize: 12.5, color: palette.text, fontWeight: '700' },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 6 },
  stepNum: { width: 20, height: 20, borderRadius: 10, backgroundColor: palette.primary, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  stepNumText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  stepText: { flex: 1, fontSize: 13, color: palette.text, lineHeight: 19 },
  itemsTitle: { fontSize: 11.5, fontWeight: '800', color: palette.primary, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 },
  item: { paddingVertical: 9, borderTopWidth: 1, borderTopColor: '#EEF2F7' },
  itemTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  itemTitle: { fontSize: 13.5, fontWeight: '800', color: palette.text },
  itemSub: { fontSize: 12, color: palette.textMuted, marginTop: 2 },
  itemRight: { fontSize: 13.5, fontWeight: '900', color: palette.navy },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginTop: 5 },
  badgeText: { fontSize: 11, fontWeight: '800', textTransform: 'capitalize' },
  detail: { fontSize: 12, color: palette.text, marginTop: 3, marginLeft: 4 },
  more: { fontSize: 12, fontWeight: '800', color: palette.primary, marginTop: 5 },
  itemActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 7 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  btn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12 },
  btnSmall: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  btnPrimary: { backgroundColor: palette.primary },
  btnLight: { backgroundColor: '#E3ECFB' },
  btnText: { fontSize: 13, fontWeight: '800' },
});
