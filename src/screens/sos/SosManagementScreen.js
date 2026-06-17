import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import ScreenContainer from '../../components/ScreenContainer';
import Card from '../../components/Card';
import Button from '../../components/Button';
import StatusChip from '../../components/StatusChip';
import EmptyState from '../../components/EmptyState';
import SosPersonSheet from '../../components/SosPersonSheet';
import { palette, spacing, typography } from '../../theme';
import { loadContacts, saveContacts } from '../../store/slices/sosSlice';
import { openWhatsAppTo, openSmsTo } from '../../services/sos';
import { sosMessage } from '../../utils/sosDispatch';
import { showToast } from '../../utils/toastConfig';

let _localId = 1000;
const withId = p => (p.id ? p : { ...p, id: ++_localId });

export default function SosManagementScreen() {
  const dispatch = useDispatch();
  const { contacts, bloodGroup, medicalNotes, saveBusy, contactsLoading } = useSelector(s => s.sos);
  const userName = useSelector(s => s.auth.user?.name);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editPerson, setEditPerson] = useState(null);

  const reload = useCallback(() => { dispatch(loadContacts()); }, [dispatch]);
  useEffect(() => { reload(); }, [reload]);

  const persist = async nextContacts => {
    if (nextContacts.length === 0) {
      showToast('info', 'Keep at least one', 'Add at least one person so we can alert someone in an emergency.');
      return;
    }
    try {
      await dispatch(saveContacts({
        contacts: nextContacts.map(withId),
        bloodGroup: bloodGroup || undefined,
        medicalNotes: medicalNotes || undefined,
      })).unwrap();
    } catch (e) {
      showToast('error', 'Could not save', String(e));
    }
  };

  const onSubmitPerson = person => {
    const p = withId(person);
    const exists = contacts.some(c => c.id === p.id);
    const next = exists ? contacts.map(c => (c.id === p.id ? p : c)) : [...contacts, p];
    persist(next);
    setSheetOpen(false);
    setEditPerson(null);
  };

  const removePerson = id => persist(contacts.filter(c => c.id !== id));

  const openAdd = () => { setEditPerson(null); setSheetOpen(true); };
  const openEdit = p => { setEditPerson(p); setSheetOpen(true); };

  const sampleMsg = sosMessage(userName, null);

  return (
    <ScreenContainer refreshing={contactsLoading} onRefresh={reload}>
      <Card style={styles.hero}>
        <Text style={styles.heroTitle}>🆘 SOS Management</Text>
        <Text style={styles.heroSub}>
          When you trigger SOS, these people instantly get your live location via WhatsApp, SMS and email.
        </Text>
      </Card>

      <View style={styles.sectionHead}>
        <Text style={typography.h3}>Emergency persons</Text>
        <TouchableOpacity onPress={openAdd}><Text style={styles.action}>＋ Add</Text></TouchableOpacity>
      </View>

      {(!contacts || contacts.length === 0) ? (
        <EmptyState icon="👥" message="No persons added. Add someone who should be alerted in an emergency." />
      ) : contacts.map(c => (
        <Card key={c.id || c.phone} style={styles.card}>
          <View style={styles.rowTop}>
            <Text style={styles.name}>{c.name}</Text>
            {c.isPrimary ? <StatusChip label="PRIMARY" variant="primary" /> : null}
          </View>
          <Text style={typography.caption}>+91 {c.phone}{c.email ? ` · ${c.email}` : ' · no email'}</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.pill} onPress={() => openWhatsAppTo(c.phone, sampleMsg)}><Text style={styles.pillText}>WhatsApp</Text></TouchableOpacity>
            <TouchableOpacity style={styles.pill} onPress={() => openSmsTo(c.phone, sampleMsg)}><Text style={styles.pillText}>SMS</Text></TouchableOpacity>
            <View style={styles.flex1} />
            <TouchableOpacity onPress={() => openEdit(c)} hitSlop={6}><Text style={styles.edit}>Edit</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => removePerson(c.id)} hitSlop={6}><Text style={styles.remove}>Remove</Text></TouchableOpacity>
          </View>
        </Card>
      ))}

      <Text style={styles.note}>
        💡 Email alerts are sent automatically by the server. WhatsApp & SMS open with your location pre-filled —
        tap the buttons above to test sending to a person right now.
      </Text>

      {contacts.length > 0 ? (
        <Button title="＋ Add another person" variant="outline" onPress={openAdd} style={{ marginTop: spacing.md }} />
      ) : null}

      <SosPersonSheet
        visible={sheetOpen}
        person={editPerson}
        busy={saveBusy}
        onClose={() => { setSheetOpen(false); setEditPerson(null); }}
        onSubmit={onSubmitPerson}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: '#7F1D1D', borderColor: '#7F1D1D', marginBottom: spacing.md },
  heroTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  heroSub: { color: '#FECACA', fontSize: 13, marginTop: 6, lineHeight: 19 },

  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  action: { color: palette.primary, fontWeight: '700', fontSize: 13 },
  card: { marginBottom: spacing.sm },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  name: { fontSize: 15, fontWeight: '700', color: palette.text },

  actionsRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, gap: spacing.sm },
  flex1: { flex: 1 },
  pill: { backgroundColor: palette.surfaceAlt, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  pillText: { fontSize: 12, fontWeight: '700', color: palette.primary },
  edit: { color: palette.primary, fontWeight: '700', fontSize: 12, marginRight: spacing.md },
  remove: { color: palette.error, fontWeight: '700', fontSize: 12 },

  note: { ...typography.caption, marginTop: spacing.md, lineHeight: 18 },
});
