import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { createDrawerNavigator, DrawerContentScrollView } from '@react-navigation/drawer';
import { useDispatch, useSelector } from 'react-redux';
import TabNavigator from './TabNavigator';
import { logout } from '../store/slices/authSlice';
import { palette, radius, spacing, typography } from '../theme';

const Drawer = createDrawerNavigator();

const DRAWER_ITEMS = [
  { key: 'HomeTab', label: 'Home', icon: '🏠', tab: 'HomeTab' },
  { key: 'BookingDocket', label: 'Booking Docket', icon: '📘', tab: 'HomeTab', screen: 'BookingDocket' },
  { key: 'PaymentDashboard', label: 'Payments', icon: '💳', tab: 'HomeTab', screen: 'PaymentDashboard' },
  { key: 'ConstructionTracker', label: 'Construction Progress', icon: '🏗️', tab: 'HomeTab', screen: 'ConstructionTracker' },
  { key: 'DocumentRepository', label: 'Documents', icon: '📄', tab: 'HomeTab', screen: 'DocumentRepository' },
  { key: 'PossessionDashboard', label: 'Possession', icon: '🔑', tab: 'HomeTab', screen: 'PossessionDashboard' },
  { key: 'SiteVisit', label: 'Site Visit', icon: '🗺️', tab: 'HomeTab', screen: 'SiteVisit' },
  { key: 'Support', label: 'Support', icon: '🎧', tab: 'HomeTab', screen: 'Support' },
  { key: 'ResidentTab', label: 'Resident Services', icon: '🛎️', tab: 'ResidentTab' },
  { key: 'CommunityTab', label: 'Community', icon: '👥', tab: 'CommunityTab' },
  { key: 'ProfileTab', label: 'Profile & Rewards', icon: '👤', tab: 'ProfileTab' },
];

function DrawerContent({ navigation }) {
  const user = useSelector(s => s.auth.user);
  const dispatch = useDispatch();

  const navigateTo = item => {
    if (item.screen) {
      navigation.navigate('Tabs', { screen: item.tab, params: { screen: item.screen } });
    } else {
      navigation.navigate('Tabs', { screen: item.tab });
    }
    navigation.closeDrawer();
  };

  const doLogout = () => {
    // isLoggedIn → false makes RootNavigator swap back to AuthStack automatically.
    dispatch(logout());
  };

  return (
    <DrawerContentScrollView contentContainerStyle={{ paddingTop: 0 }}>
      <View style={styles.header}>
        <View style={styles.avatar}><Text style={{ fontSize: 26, color: '#fff' }}>श्री</Text></View>
        <Text style={styles.name}>{user?.name || 'Guest'}</Text>
        <Text style={styles.mobile}>+91 {user?.mobile || '----------'}</Text>
      </View>

      <View style={styles.menu}>
        {DRAWER_ITEMS.map(item => (
          <TouchableOpacity key={item.key} style={styles.item} onPress={() => navigateTo(item)}>
            <Text style={styles.itemIcon}>{item.icon}</Text>
            <Text style={styles.itemLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={[styles.item, { marginTop: spacing.lg }]} onPress={doLogout}>
        <Text style={styles.itemIcon}>🚪</Text>
        <Text style={[styles.itemLabel, { color: palette.error }]}>Log Out</Text>
      </TouchableOpacity>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 50,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    backgroundColor: palette.primary,
  },
  avatar: {
    width: 56, height: 56, borderRadius: 14,
    backgroundColor: palette.primaryDark,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  name: { fontSize: 16, fontWeight: '700', color: '#fff' },
  mobile: { fontSize: 12, color: '#DBE3FF', marginTop: 2 },
  menu: { paddingTop: spacing.md, paddingHorizontal: spacing.sm },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  itemIcon: { fontSize: 18, marginRight: spacing.md },
  itemLabel: { fontSize: 14, color: palette.text, fontWeight: '500' },
});

export default function DrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={props => <DrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: { width: 280 },
      }}
    >
      <Drawer.Screen name="Tabs" component={TabNavigator} />
    </Drawer.Navigator>
  );
}
