import React, { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useDispatch, useSelector } from 'react-redux';

import ScreenContainer from '../../components/ScreenContainer';
import { Neu, IconTile, IconButton, Pill, ART } from '../../components/neu';
import { showToast } from '../../utils/toastConfig';
import EmptyState from '../../components/EmptyState';
import { CardSkeleton } from '../../components/Skeleton';
import { palette, spacing, NEU } from '../../theme';
import { formatDate } from '../../utils/format';
import { LANGUAGE_LABEL, DIETARY_LABEL } from '../../utils/profile';
import { loadProfile } from '../../store/slices/profileSlice';

const GENDER_LABEL = { male: 'Male', female: 'Female', other: 'Other' };

const W = Dimensions.get('window').width;

function Row({ icon, label, value, last }) {
  return (
    <View style={[styles.row, last && { borderBottomWidth: 0 }]}>
      <IconTile icon={icon} size={40} radius={13} />
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value || '—'}</Text>
    </View>
  );
}

function SectionHead({ icon, title, right }) {
  return (
    <View style={styles.sectionHead}>
      <IconTile icon={icon} size={44} radius={14} />
      <Text style={styles.sectionTitle}>{title}</Text>
      {right}
    </View>
  );
}

// Resident profile is READ-ONLY in the app: the admin office maintains it.
export default function ProfileDetailsScreen({ navigation }) {
  const dispatch = useDispatch();
  const { personal, preferences, properties, loading } = useSelector(s => s.profile);

  const reload = useCallback(() => { dispatch(loadProfile()); }, [dispatch]);
  useEffect(() => { reload(); }, [reload]);

  const managedByOffice = () => showToast('info', 'Managed by the office', 'To update your details, raise a request from Help & Support.');

  if (loading && !personal) {
    return <ScreenContainer><CardSkeleton /><CardSkeleton /></ScreenContainer>;
  }

  const ch = preferences?.channels || {};
  const channelsOn = Object.entries(ch).filter(([, v]) => v).map(([k]) => k);
  const fullAddress = [personal?.addressLine, personal?.city, personal?.state, personal?.pincode].filter(Boolean).join(', ');

  return (
    <ScreenContainer refreshing={loading} onRefresh={reload}>
      {/* header */}
      <View style={styles.header}>
        <IconButton icon="arrow-left" size={52} color={palette.primary} onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>Profile Details</Text>
      </View>

      {/* identity card */}
      <Neu variant="raisedLg" radius={28} style={styles.idCard}>
        <View>
          <Neu variant="raised" radius={60} style={styles.photo}>
            {personal?.photo
              ? <Image source={{ uri: personal.photo }} style={styles.photoImg} />
              : <Feather name="user" size={56} color="#1E6FD9" />}
          </Neu>
          <TouchableOpacity style={styles.camBadge} onPress={managedByOffice}>
            <Feather name="camera" size={16} color={palette.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.idDivider} />
        <View style={{ flex: 1 }}>
          <Text style={styles.idName} numberOfLines={1}>{personal?.name || 'Resident'}</Text>
          {personal?.mobile ? <View style={styles.idLine}><Feather name="phone" size={15} color={palette.primary} /><Text style={styles.idText}>+91 {personal.mobile}</Text></View> : null}
          {personal?.email ? <View style={styles.idLine}><Feather name="mail" size={15} color={palette.primary} /><Text style={styles.idText} numberOfLines={1}>{personal.email}</Text></View> : null}
        </View>
      </Neu>

      <SectionHead
        icon="user"
        title="Personal Details"
        right={(
          <TouchableOpacity onPress={managedByOffice} style={styles.editBtn}>
            <Feather name="edit-2" size={16} color={palette.primary} />
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
        )}
      />
      <Neu variant="raised" radius={26} style={styles.panel}>
        <Row icon="mail" label="Email" value={personal?.email} />
        <Row icon="phone" label="Phone" value={personal?.mobile ? `+91 ${personal.mobile}` : ''} />
        <Row icon="calendar" label="Date of Birth" value={personal?.dob ? formatDate(personal.dob) : ''} />
        <Row icon="user-check" label="Gender" value={GENDER_LABEL[personal?.gender]} />
        <Row icon="briefcase" label="Occupation" value={personal?.occupation} />
        <Row icon="map-pin" label="Address" value={fullAddress} />
        <Row icon="home" label="Residence" value={[personal?.tower, personal?.unit].filter(Boolean).join(' · ')} last />
      </Neu>

      <SectionHead icon="layers" title="My Properties" />
      {(!properties || properties.length === 0) ? (
        <EmptyState icon="🏠" message="No properties on your account yet." />
      ) : properties.map(p => (
        <Neu key={p.id} variant="raised" radius={26} style={[styles.panel, { marginBottom: 16 }]}>
          <View style={styles.propTop}>
            <Image source={ART.propertyThumb} style={styles.thumb} resizeMode="cover" />
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.propName} numberOfLines={2}>{p.label || p.propertyType || 'Property'}{p.flatNo ? ` · ${p.flatNo}` : ''}</Text>
              {p.projectName ? <Text style={styles.propProject}>{p.projectName}</Text> : null}
            </View>
            {p.propertyType ? <Pill label={p.propertyType} /> : null}
          </View>
          {(p.tower || p.floor) ? <Row icon="layers" label="Tower / Floor" value={[p.tower && `Tower ${p.tower}`, p.floor && `Floor ${p.floor}`].filter(Boolean).join(' · ')} /> : null}
          {p.areaSqft ? <Row icon="maximize" label="Area" value={`${p.areaSqft} sq.ft`} /> : null}
          <Row icon="map-pin" label="Address" value={[p.addressLine, p.city, p.state, p.pincode].filter(Boolean).join(', ')} last />
        </Neu>
      ))}

      <SectionHead icon="sliders" title="Preferences" />
      <Neu variant="raised" radius={26} style={styles.panel}>
        <Row icon="globe" label="App language" value={LANGUAGE_LABEL[preferences?.language]} />
        <Row icon="coffee" label="Dietary" value={DIETARY_LABEL[preferences?.dietary]} />
        <Row icon="message-circle" label="Contact channels" value={channelsOn.length ? channelsOn.map(c => c.toUpperCase()).join(', ') : 'None'} />
        <Row icon="sun" label="Festival alerts" value={preferences?.festivalAlerts ? 'On' : 'Off'} last />
      </Neu>

      <Text style={styles.footNote}>Your profile is managed by the Shri Yamuna Infra office. To update any detail, please contact us.</Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', minHeight: 92, marginBottom: 4 },
  headerArt: { position: 'absolute', right: -18, top: -14, width: W * 0.4, height: 110 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: palette.navy, marginLeft: 18 },
  idCard: { flexDirection: 'row', alignItems: 'center', padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)' },
  photo: { width: 104, height: 104, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 4, borderColor: palette.surface },
  photoImg: { width: 104, height: 104 },
  camBadge: { position: 'absolute', right: -4, bottom: -2, width: 40, height: 40, borderRadius: 14, backgroundColor: palette.surface, alignItems: 'center', justifyContent: 'center', boxShadow: NEU.raisedSm },
  idDivider: { width: 1.5, height: 80, backgroundColor: '#D3DBE8', marginHorizontal: 18 },
  idName: { fontSize: 22, fontWeight: '800', color: palette.navy },
  idLine: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  idText: { fontSize: 14.5, color: palette.navy, marginLeft: 10, flexShrink: 1 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', marginTop: 24, marginBottom: 14 },
  sectionTitle: { flex: 1, fontSize: 20, fontWeight: '800', color: palette.navy, marginLeft: 14 },
  editBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8EFFB', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 9, boxShadow: NEU.raisedSm },
  editText: { fontSize: 15, fontWeight: '700', color: palette.primary, marginLeft: 8 },
  panel: { paddingHorizontal: 16, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: palette.divider },
  rowLabel: { fontSize: 14.5, color: palette.navy, marginLeft: 14, marginRight: 10 },
  rowValue: { flex: 1, fontSize: 14.5, fontWeight: '700', color: palette.navy, textAlign: 'right' },
  propTop: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  thumb: { width: 92, height: 68, borderRadius: 16 },
  propName: { fontSize: 19, fontWeight: '800', color: palette.navy },
  propProject: { fontSize: 14, color: palette.textMuted, marginTop: 2 },
  footNote: { fontSize: 12.5, marginTop: spacing.lg, textAlign: 'center', color: palette.textMuted, paddingHorizontal: 10 },
});
