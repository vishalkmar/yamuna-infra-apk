import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Image, Dimensions } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import ScreenContainer from '../../components/ScreenContainer';
import { Neu, IconTile, IconButton, BrandHeader, PageTitle, ART, navyFill } from '../../components/neu';
import { palette, NEU } from '../../theme';

// Services menu — neumorphic tiles with 3D icons, live search and category chips.
// `to` is either a screen in this stack, or [tab, screen] for another tab.
const SERVICES = [
  { key: 'HomeServices', label: 'Cleaning', art: ART.cleaning, cat: 'home' },
  { key: 'Housekeeping', label: 'Housekeeping', art: ART.housekeeping, cat: 'home' },
  { key: 'CookBooking', label: 'Book a Cook', art: ART.cook, cat: 'home' },
  { key: 'MealOrder', label: 'Meal Tiffin', art: ART.meal, cat: 'lifestyle' },
  { key: 'HealthcareScreen', label: 'Healthcare', art: ART.health, cat: 'health' },
  { key: 'Wheelchair', label: 'Mobility Aid', art: ART.mobility, cat: 'health' },
  { key: 'WellnessScreen', label: 'Wellness & Spa', art: ART.wellness, cat: 'health' },
  { key: 'SpiritualScreen', label: 'Spiritual', art: ART.spiritual, cat: 'lifestyle' },
  { key: 'TempleDirectoryScreen', label: 'Temples', art: ART.temples, cat: 'lifestyle' },
  { key: 'Darshan', label: 'Darshan', art: ART.darshan, cat: 'lifestyle' },
  { key: 'parcel', label: 'Parcel & Courier', art: ART.parcel, cat: 'home', to: ['HomeTab', 'Support'] },
  { key: 'maintenance', label: 'Maintenance', art: ART.maintenance, cat: 'home', to: ['HomeTab', 'Support'] },
  { key: 'community', label: 'Community', art: ART.community, cat: 'community', to: ['CommunityTab'] },
  { key: 'events', label: 'Events', art: ART.events, cat: 'community', to: ['CommunityTab'] },
  { key: 'docket', label: 'Booking Docket', art: ART.docket, cat: 'home', to: ['HomeTab', 'BookingDocket'] },
  { key: 'support', label: 'Support', art: ART.support, cat: 'community', to: ['HomeTab', 'Support'] },
];
const CATS = [
  { key: 'all', label: 'All Services', icon: 'grid' },
  { key: 'home', label: 'Home', icon: 'home' },
  { key: 'lifestyle', label: 'Lifestyle', icon: 'heart' },
  { key: 'health', label: 'Health', icon: 'plus-square' },
  { key: 'community', label: 'Community', icon: 'users' },
];
const SW = Dimensions.get('window').width;
const COLS = SW < 340 ? 3 : 4;
const GAP = 12;
const TILE_W = Math.floor((SW - 36 - GAP * (COLS - 1)) / COLS);

export default function ResidentHome({ navigation }) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const list = SERVICES.filter(s => (cat === 'all' || s.cat === cat) && s.label.toLowerCase().includes(q.trim().toLowerCase()));

  const open = s => {
    if (!s.to) return navigation.navigate(s.key);
    const [tab, screen] = s.to;
    return screen ? navigation.navigate(tab, { screen, initial: false }) : navigation.navigate(tab);
  };

  return (
    <ScreenContainer>
      <BrandHeader
        subtitle="RESIDENT SERVICES"
        right={(
          <>
            <IconButton icon="bell" dot onPress={() => navigation.navigate('HomeTab', { screen: 'NotificationsScreen', initial: false })} />
            <IconButton icon="user" onPress={() => navigation.navigate('ProfileTab')} />
          </>
        )}
      />
      <PageTitle title="Resident Services" subtitle="Everything you need for life inside the community." art={ART.headerBuildings} />

      <View style={rs.searchRow}>
        <Neu variant="inset" radius={28} style={rs.search}>
          <Feather name="search" size={20} color={palette.navy} />
          <TextInput value={q} onChangeText={setQ} placeholder="Search a service..." placeholderTextColor={palette.textMuted} style={rs.searchInput} />
          {q ? <TouchableOpacity onPress={() => setQ('')}><Feather name="x" size={18} color={palette.textMuted} /></TouchableOpacity> : null}
        </Neu>
        <IconButton icon="sliders" size={56} onPress={() => setCat('all')} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={rs.cats}>
        {CATS.map(c => {
          const on = cat === c.key;
          return (
            <TouchableOpacity key={c.key} activeOpacity={0.85} onPress={() => setCat(c.key)}
              style={[rs.cat, on ? [rs.catOn, navyFill] : rs.catOff]}>
              <Feather name={c.icon} size={20} color={on ? '#fff' : palette.navy} />
              <Text style={[rs.catText, on && { color: '#fff' }]} numberOfLines={1}>{c.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={rs.grid}>
        {list.map(s => (
          <TouchableOpacity key={s.key} activeOpacity={0.85} onPress={() => open(s)} style={{ width: TILE_W }}>
            <Neu variant="raised" radius={22} style={rs.tile}>
              <IconTile source={s.art} size={Math.min(62, TILE_W - 22)} radius={20} imageScale={0.8} variant="raisedSm" />
              <Text style={rs.tileLabel} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.8}>{s.label}</Text>
            </Neu>
          </TouchableOpacity>
        ))}
        {list.length === 0 ? <Text style={rs.empty}>No service matches “{q}”.</Text> : null}
      </View>

      <Neu variant="raised" radius={26} color="#FBE8EC" style={rs.sos}>
        <Image source={ART.sosSiren} style={rs.siren} resizeMode="contain" />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={rs.sosTitle}>Emergency SOS</Text>
          <Text style={rs.sosSub}>Get immediate help from the community team.</Text>
        </View>
        <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('HomeTab', { screen: 'SOSScreen', initial: false })} style={rs.sosBtn}>
          <Feather name="phone" size={18} color="#fff" />
          <Text style={rs.sosBtnText}>SOS</Text>
        </TouchableOpacity>
      </Neu>
    </ScreenContainer>
  );
}

const rs = StyleSheet.create({
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  search: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, height: 56 },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 15.5, color: palette.navy, paddingVertical: 0 },
  cats: { gap: 12, paddingVertical: 8, paddingRight: 8, paddingLeft: 2 },
  cat: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 22, minWidth: 82 },
  catOn: { boxShadow: NEU.primary },
  catOff: { backgroundColor: palette.surface, boxShadow: NEU.raisedSm },
  catText: { fontSize: 13, fontWeight: '600', color: palette.navy, marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP, marginTop: 18 },
  tile: { alignItems: 'center', paddingVertical: 14, paddingHorizontal: 3, minHeight: 128, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)' },
  tileLabel: { fontSize: TILE_W < 92 ? 11.5 : 13, fontWeight: '700', color: palette.navy, textAlign: 'center', marginTop: 10, letterSpacing: -0.2 },
  empty: { color: palette.textMuted, paddingVertical: 20 },
  sos: { flexDirection: 'row', alignItems: 'center', padding: 16, marginTop: 22 },
  siren: { width: 52, height: 52 },
  sosTitle: { fontSize: 19, fontWeight: '800', color: '#C62828' },
  sosSub: { fontSize: 13, color: palette.textMuted, marginTop: 2 },
  sosBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E53935', borderRadius: 999, paddingHorizontal: 18, paddingVertical: 11, boxShadow: NEU.danger },
  sosBtnText: { color: '#fff', fontWeight: '800', fontSize: 17, marginLeft: 8 },
});
