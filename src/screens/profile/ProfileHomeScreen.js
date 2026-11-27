import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useDispatch, useSelector } from 'react-redux';
import ScreenContainer from '../../components/ScreenContainer';
import { Neu, IconTile, IconButton, BrandHeader, PageTitle, Pill, ART } from '../../components/neu';
import { logout } from '../../store/slices/authSlice';
import { palette, NEU } from '../../theme';

const MENU = [
  { key: 'ProfileDetails', title: 'Profile Details', sub: 'View & update your info', art: ART.pmDetails },
  { key: 'Rewards', title: 'Rewards & Referrals', sub: 'Earn benefits & invite neighbors', art: ART.pmRewards },
  { key: 'AICompanion', title: 'Vrindavan Companion', sub: 'Your smart community assistant', art: ART.pmAi },
  { key: 'NotificationsScreen', title: 'Notifications', sub: 'Manage alerts & updates', art: ART.pmNotify },
  { key: 'Settings', title: 'Settings', sub: 'App, privacy & preferences', art: ART.pmSettings },
  { key: 'help', title: 'Help & Support', sub: 'Get help, raise a request', art: ART.pmHelp, to: ['HomeTab', 'Support'] },
];

export default function ProfileHome({ navigation }) {
  const user = useSelector(s => s.auth.user);
  const photo = useSelector(s => s.profile?.personal?.photo);
  const dispatch = useDispatch();
  // isLoggedIn → false makes RootNavigator swap back to AuthStack automatically.
  const doLogout = () => dispatch(logout());
  const go = m => (m.to ? navigation.navigate(m.to[0], { screen: m.to[1], initial: false }) : navigation.navigate(m.key));

  return (
    <ScreenContainer>
      <BrandHeader
        subtitle="RESIDENT PORTAL"
        right={(
          <>
            <IconButton icon="bell" dot onPress={() => navigation.navigate('NotificationsScreen')} />
            <IconButton icon="headphones" onPress={() => navigation.navigate('HomeTab', { screen: 'Support', initial: false })} />
          </>
        )}
      />
      <PageTitle title="My Profile" subtitle="Manage your account, preferences and app settings." art={ART.profileBuildings} />

      <Neu variant="raisedLg" radius={30} style={ps.hero}>
        <View style={ps.avatarRing}>
          <Neu variant="raised" radius={70} style={ps.avatar}>
            {photo ? <Image source={{ uri: photo }} style={ps.avatarImg} /> : <Feather name="user" size={60} color="#1E6FD9" />}
          </Neu>
          <TouchableOpacity style={ps.editBadge} onPress={() => navigation.navigate('ProfileDetails')}>
            <Feather name="edit-2" size={16} color={palette.primary} />
          </TouchableOpacity>
        </View>
        <Text style={ps.name} numberOfLines={1}>{user?.name || 'Resident'}</Text>
        {user?.mobile ? (
          <View style={ps.line}><Feather name="phone" size={16} color={palette.navy} /><Text style={ps.lineText}>+91 {user.mobile}</Text></View>
        ) : null}
        {user?.email ? (
          <View style={ps.line}><Feather name="mail" size={16} color={palette.navy} /><Text style={ps.lineText} numberOfLines={1}>{user.email}</Text></View>
        ) : null}
        <Pill label="Resident" icon="home" style={ps.rolePill} />
      </Neu>

      <View style={ps.grid}>
        {MENU.map(m => (
          <TouchableOpacity key={m.key} activeOpacity={0.85} onPress={() => go(m)} style={ps.cell}>
            <Neu variant="raised" radius={22} style={ps.menuCard}>
              <IconTile source={m.art} size={44} radius={14} imageScale={0.8} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={ps.menuTitle} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.85}>{m.title}</Text>
                <Text style={ps.menuSub} numberOfLines={2}>{m.sub}</Text>
              </View>
              <Feather name="chevron-right" size={17} color={palette.navy} />
            </Neu>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity activeOpacity={0.85} onPress={doLogout} style={ps.logout}>
        <Feather name="log-out" size={22} color="#C62828" />
        <Text style={ps.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </ScreenContainer>
  );
}

const ps = StyleSheet.create({
  hero: { alignItems: 'center', paddingTop: 22, paddingBottom: 22, paddingHorizontal: 16, marginTop: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)' },
  avatarRing: { width: 132, height: 132, borderRadius: 66, alignItems: 'center', justifyContent: 'center', boxShadow: '0px 0px 26px rgba(242,169,59,0.35), -6px -6px 14px rgba(255,255,255,0.95), 6px 8px 16px rgba(150,166,198,0.4)', backgroundColor: palette.surface },
  avatar: { width: 112, height: 112, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImg: { width: 112, height: 112, borderRadius: 56 },
  avatarIcon: { width: 70, height: 70 },
  editBadge: { position: 'absolute', right: 4, bottom: 8, width: 40, height: 40, borderRadius: 20, backgroundColor: palette.surface, alignItems: 'center', justifyContent: 'center', boxShadow: NEU.raisedSm },
  name: { fontSize: 28, fontWeight: '800', color: palette.navy, marginTop: 16 },
  line: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  lineText: { fontSize: 16, color: palette.navy, marginLeft: 10 },
  rolePill: { alignSelf: 'center', marginTop: 14, paddingHorizontal: 20, paddingVertical: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 22 },
  cell: { width: '48%', marginBottom: 16 },
  menuCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingLeft: 11, paddingRight: 8, minHeight: 96, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)' },
  menuTitle: { fontSize: 14, fontWeight: '800', color: palette.navy, letterSpacing: -0.2 },
  menuSub: { fontSize: 11.5, color: palette.textMuted, marginTop: 3, lineHeight: 15 },
  logout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 62, borderRadius: 31, backgroundColor: '#FBE7EA', boxShadow: NEU.raised, marginTop: 8 },
  logoutText: { fontSize: 19, fontWeight: '800', color: '#C62828', marginLeft: 12 },
});
