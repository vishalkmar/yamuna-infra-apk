import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import ScreenContainer from '../../components/ScreenContainer';
import Card from '../../components/Card';
import Button from '../../components/Button';
import StatusChip from '../../components/StatusChip';
import EmptyState from '../../components/EmptyState';
import { CardSkeleton } from '../../components/Skeleton';
import PersonalDetailsSheet from '../../components/PersonalDetailsSheet';
import PreferencesSheet from '../../components/PreferencesSheet';
import FamilyMemberSheet from '../../components/FamilyMemberSheet';
import KycSheet from '../../components/KycSheet';
import { palette, radius, spacing, typography } from '../../theme';
import { formatDate } from '../../utils/format';
import {
  KYC_STATUS, RELATION_LABEL, LANGUAGE_LABEL, DIETARY_LABEL, profileCompletion,
} from '../../utils/profile';
import { loadProfile, removeFamily } from '../../store/slices/profileSlice';

const GENDER_LABEL = { male: 'Male', female: 'Female', other: 'Other' };

function Field({ label, value }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value || '—'}</Text>
    </View>
  );
}

function SectionHead({ title, action, onPress }) {
  return (
    <View style={styles.sectionHead}>
      <Text style={typography.h3}>{title}</Text>
      {action ? <TouchableOpacity onPress={onPress}><Text style={styles.action}>{action}</Text></TouchableOpacity> : null}
    </View>
  );
}

export default function ProfileDetailsScreen() {
  const dispatch = useDispatch();
  const { personal, preferences, family, kyc, loading } = useSelector(s => s.profile);

  const [personalOpen, setPersonalOpen] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [familyOpen, setFamilyOpen] = useState(false);
  const [editMember, setEditMember] = useState(null);
  const [kycOpen, setKycOpen] = useState(false);

  const reload = useCallback(() => { dispatch(loadProfile()); }, [dispatch]);
  useEffect(() => { reload(); }, [reload]);

  if (loading && !personal) {
    return <ScreenContainer><CardSkeleton /><CardSkeleton /></ScreenContainer>;
  }

  const completion = profileCompletion(personal, kyc, family);
  const ks = KYC_STATUS[kyc?.status] || KYC_STATUS.not_started;
  const ch = preferences?.channels || {};
  const channelsOn = Object.entries(ch).filter(([, v]) => v).map(([k]) => k);

  const openAddMember = () => { setEditMember(null); setFamilyOpen(true); };
  const openEditMember = m => { setEditMember(m); setFamilyOpen(true); };

  return (
    <ScreenContainer refreshing={loading} onRefresh={reload}>
      {/* Completion */}
      <Card style={styles.hero}>
        <View style={styles.avatar}><Text style={{ fontSize: 30 }}>👤</Text></View>
        <Text style={styles.heroName}>{personal?.name || 'Resident'}</Text>
        <Text style={styles.heroSub}>+91 {personal?.mobile || '----------'}</Text>
        <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${completion}%` }]} /></View>
        <Text style={styles.progressText}>Profile {completion}% complete</Text>
      </Card>

      {/* Personal details */}
      <SectionHead title="Personal details" action="Edit" onPress={() => setPersonalOpen(true)} />
      <Card style={styles.card}>
        <Field label="Email" value={personal?.email} />
        <Field label="Date of birth" value={personal?.dob ? formatDate(personal.dob) : ''} />
        <Field label="Gender" value={GENDER_LABEL[personal?.gender]} />
        <Field label="Alternate phone" value={personal?.altPhone ? `+91 ${personal.altPhone}` : ''} />
        <Field label="Occupation" value={personal?.occupation} />
        <Field label="Address" value={[personal?.addressLine, personal?.city, personal?.state, personal?.pincode].filter(Boolean).join(', ')} />
        <Field label="Residence" value={[personal?.tower, personal?.unit].filter(Boolean).join(' · ')} />
      </Card>

      {/* Preferences */}
      <SectionHead title="Preferences" action="Edit" onPress={() => setPrefsOpen(true)} />
      <Card style={styles.card}>
        <Field label="App language" value={LANGUAGE_LABEL[preferences?.language]} />
        <Field label="Dietary" value={DIETARY_LABEL[preferences?.dietary]} />
        <Field label="Contact channels" value={channelsOn.length ? channelsOn.map(c => c.toUpperCase()).join(', ') : 'None'} />
        <Field label="Festival alerts" value={preferences?.festivalAlerts ? 'On' : 'Off'} />
      </Card>

      {/* Family */}
      <SectionHead title="Family members" action="＋ Add" onPress={openAddMember} />
      {(!family || family.length === 0) ? (
        <EmptyState icon="👨‍👩‍👧" message="No family members added yet." />
      ) : family.map(m => (
        <Card key={m.id} style={styles.card}>
          <View style={styles.rowBetween}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{m.name}</Text>
              <Text style={typography.caption}>
                {RELATION_LABEL(m.relation)}{m.age != null ? ` · ${m.age} yrs` : ''}{m.phone ? ` · +91 ${m.phone}` : ''}
              </Text>
            </View>
            <TouchableOpacity onPress={() => openEditMember(m)} hitSlop={6}><Text style={styles.editSmall}>Edit</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => dispatch(removeFamily(m.id))} hitSlop={6}><Text style={styles.remove}>Remove</Text></TouchableOpacity>
          </View>
        </Card>
      ))}

      {/* KYC */}
      <SectionHead title="KYC verification" />
      <Card style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.name}>Identity status</Text>
          <StatusChip label={ks.label.toUpperCase()} variant={ks.variant} />
        </View>
        {kyc?.idNumberMasked ? (
          <Text style={typography.caption}>{String(kyc.idType || '').toUpperCase()} · {kyc.idNumberMasked}</Text>
        ) : null}
        {kyc?.submittedAt ? <Text style={typography.caption}>Submitted {formatDate(kyc.submittedAt)}</Text> : null}
        {(kyc?.status === 'not_started' || kyc?.status === 'rejected') ? (
          <Button title="Complete KYC" onPress={() => setKycOpen(true)} style={{ marginTop: spacing.sm }} />
        ) : kyc?.status === 'pending' ? (
          <Text style={[typography.caption, { marginTop: 6 }]}>We are reviewing your documents.</Text>
        ) : (
          <Text style={[typography.caption, { marginTop: 6, color: palette.success || '#15803D' }]}>✓ Your identity is verified.</Text>
        )}
      </Card>

      <PersonalDetailsSheet visible={personalOpen} onClose={() => setPersonalOpen(false)} onSaved={reload} />
      <PreferencesSheet visible={prefsOpen} onClose={() => setPrefsOpen(false)} onSaved={reload} />
      <FamilyMemberSheet visible={familyOpen} member={editMember} onClose={() => setFamilyOpen(false)} onSaved={reload} />
      <KycSheet visible={kycOpen} onClose={() => setKycOpen(false)} onSaved={reload} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', marginBottom: spacing.md },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: palette.surfaceAlt, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  heroName: { ...typography.h3 },
  heroSub: { ...typography.caption, marginBottom: spacing.sm },
  progressTrack: { width: '100%', height: 6, borderRadius: radius.pill, backgroundColor: palette.surfaceAlt, overflow: 'hidden', marginTop: 4 },
  progressFill: { height: '100%', backgroundColor: palette.primary },
  progressText: { ...typography.caption, marginTop: 6, color: palette.primary, fontWeight: '700' },

  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md, marginBottom: spacing.sm },
  action: { color: palette.primary, fontWeight: '700', fontSize: 13 },
  card: { marginBottom: spacing.sm },

  field: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 5 },
  fieldLabel: { fontSize: 13, color: palette.textMuted, flexShrink: 0, marginRight: spacing.md },
  fieldValue: { fontSize: 14, color: palette.text, fontWeight: '500', flex: 1, textAlign: 'right' },

  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { fontSize: 15, fontWeight: '700', color: palette.text },
  editSmall: { color: palette.primary, fontWeight: '700', fontSize: 12, marginLeft: spacing.md },
  remove: { color: palette.error, fontWeight: '700', fontSize: 12, marginLeft: spacing.md },
});
