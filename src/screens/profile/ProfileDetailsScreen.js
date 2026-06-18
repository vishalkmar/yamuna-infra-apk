import React, { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import ScreenContainer from '../../components/ScreenContainer';
import Card from '../../components/Card';
import StatusChip from '../../components/StatusChip';
import EmptyState from '../../components/EmptyState';
import { CardSkeleton } from '../../components/Skeleton';
import { palette, spacing, typography } from '../../theme';
import { formatDate } from '../../utils/format';
import { KYC_STATUS, RELATION_LABEL, LANGUAGE_LABEL, DIETARY_LABEL } from '../../utils/profile';
import { loadProfile } from '../../store/slices/profileSlice';

const GENDER_LABEL = { male: 'Male', female: 'Female', other: 'Other' };

function Field({ label, value }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value || '—'}</Text>
    </View>
  );
}

function SectionHead({ title }) {
  return (
    <View style={styles.sectionHead}>
      <Text style={typography.h3}>{title}</Text>
    </View>
  );
}

// Resident profile is READ-ONLY in the app. All data (personal details,
// address, properties) is created and maintained by the admin office. The
// resident can view but not edit or delete anything here.
export default function ProfileDetailsScreen() {
  const dispatch = useDispatch();
  const { personal, preferences, family, properties, kyc, loading } = useSelector(s => s.profile);

  const reload = useCallback(() => { dispatch(loadProfile()); }, [dispatch]);
  useEffect(() => { reload(); }, [reload]);

  if (loading && !personal) {
    return <ScreenContainer><CardSkeleton /><CardSkeleton /></ScreenContainer>;
  }

  const ks = KYC_STATUS[kyc?.status] || KYC_STATUS.not_started;
  const ch = preferences?.channels || {};
  const channelsOn = Object.entries(ch).filter(([, v]) => v).map(([k]) => k);

  const fullAddress = [personal?.addressLine, personal?.city, personal?.state, personal?.pincode].filter(Boolean).join(', ');

  return (
    <ScreenContainer refreshing={loading} onRefresh={reload}>
      {/* Header */}
      <Card style={styles.hero}>
        <View style={styles.avatar}>
          {personal?.photo ? (
            <Image source={{ uri: personal.photo }} style={styles.avatarImg} />
          ) : (
            <Text style={{ fontSize: 30 }}>👤</Text>
          )}
        </View>
        <Text style={styles.heroName}>{personal?.name || 'Resident'}</Text>
        {personal?.mobile ? <Text style={styles.heroSub}>+91 {personal.mobile}</Text> : null}
        {personal?.email ? <Text style={styles.heroSub}>{personal.email}</Text> : null}
      </Card>

      {/* Personal details (read-only) */}
      <SectionHead title="Personal details" />
      <Card style={styles.card}>
        <Field label="Email" value={personal?.email} />
        <Field label="Phone" value={personal?.mobile ? `+91 ${personal.mobile}` : ''} />
        <Field label="Date of birth" value={personal?.dob ? formatDate(personal.dob) : ''} />
        <Field label="Gender" value={GENDER_LABEL[personal?.gender]} />
        <Field label="Occupation" value={personal?.occupation} />
        <Field label="Address" value={fullAddress} />
        <Field label="Residence" value={[personal?.tower, personal?.unit].filter(Boolean).join(' · ')} />
      </Card>

      {/* Properties (assigned by the office) */}
      <SectionHead title="My properties" />
      {(!properties || properties.length === 0) ? (
        <EmptyState icon="🏠" message="No properties on your account yet." />
      ) : properties.map(p => (
        <Card key={p.id} style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.name}>{p.label || p.propertyType || 'Property'}{p.flatNo ? ` · ${p.flatNo}` : ''}</Text>
            {p.propertyType ? <StatusChip label={p.propertyType} variant="info" /> : null}
          </View>
          {p.projectName ? <Text style={typography.caption}>{p.projectName}</Text> : null}
          <View style={{ marginTop: spacing.sm }}>
            {(p.tower || p.floor) ? (
              <Field label="Tower / Floor" value={[p.tower && `Tower ${p.tower}`, p.floor && `Floor ${p.floor}`].filter(Boolean).join(' · ')} />
            ) : null}
            {p.areaSqft ? <Field label="Area" value={`${p.areaSqft} sq.ft`} /> : null}
            <Field label="Address" value={[p.addressLine, p.city, p.state, p.pincode].filter(Boolean).join(', ')} />
          </View>
        </Card>
      ))}

      {/* Preferences (read-only) */}
      <SectionHead title="Preferences" />
      <Card style={styles.card}>
        <Field label="App language" value={LANGUAGE_LABEL[preferences?.language]} />
        <Field label="Dietary" value={DIETARY_LABEL[preferences?.dietary]} />
        <Field label="Contact channels" value={channelsOn.length ? channelsOn.map(c => c.toUpperCase()).join(', ') : 'None'} />
        <Field label="Festival alerts" value={preferences?.festivalAlerts ? 'On' : 'Off'} />
      </Card>

      {/* Family (read-only) */}
      <SectionHead title="Family members" />
      {(!family || family.length === 0) ? (
        <EmptyState icon="👨‍👩‍👧" message="No family members on record." />
      ) : family.map(m => (
        <Card key={m.id} style={styles.card}>
          <Text style={styles.name}>{m.name}</Text>
          <Text style={typography.caption}>
            {RELATION_LABEL(m.relation)}{m.age != null ? ` · ${m.age} yrs` : ''}{m.phone ? ` · +91 ${m.phone}` : ''}
          </Text>
        </Card>
      ))}

      {/* KYC (read-only) */}
      <SectionHead title="KYC verification" />
      <Card style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.name}>Identity status</Text>
          <StatusChip label={ks.label.toUpperCase()} variant={ks.variant} />
        </View>
        {kyc?.idNumberMasked ? (
          <Text style={typography.caption}>{String(kyc.idType || '').toUpperCase()} · {kyc.idNumberMasked}</Text>
        ) : null}
      </Card>

      <Text style={styles.footNote}>
        Your profile is managed by the Yamuna Infra office. To update any detail, please contact us.
      </Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', marginBottom: spacing.md },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: palette.surfaceAlt, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm, overflow: 'hidden' },
  avatarImg: { width: 72, height: 72, borderRadius: 36 },
  heroName: { ...typography.h3 },
  heroSub: { ...typography.caption, marginBottom: 2 },

  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md, marginBottom: spacing.sm },
  card: { marginBottom: spacing.sm },

  field: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 5 },
  fieldLabel: { fontSize: 13, color: palette.textMuted, flexShrink: 0, marginRight: spacing.md },
  fieldValue: { fontSize: 14, color: palette.text, fontWeight: '500', flex: 1, textAlign: 'right' },

  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { fontSize: 15, fontWeight: '700', color: palette.text },

  footNote: { ...typography.caption, marginTop: spacing.md, marginBottom: spacing.xl, textAlign: 'center', color: palette.textMuted },
});
