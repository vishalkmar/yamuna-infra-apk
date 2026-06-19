import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import RewardsScreen from '../screens/rewards/RewardsScreen';
import AICompanionScreen from '../screens/rewards/AICompanionScreen';
import ProfileDetailsScreen from '../screens/profile/ProfileDetailsScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import ScreenContainer from '../components/ScreenContainer';
import Card from '../components/Card';
import Button from '../components/Button';
import { logout } from '../store/slices/authSlice';
import { palette, radius, spacing, typography } from '../theme';

const Stack = createNativeStackNavigator();

function ProfileHome({ navigation }) {
  const user = useSelector(s => s.auth.user);
  const dispatch = useDispatch();

  const items = [
    { key: 'ProfileDetails', label: '👤  Profile Details', icon: '›' },
    { key: 'Rewards', label: '🎁  Rewards & Referrals', icon: '›' },
    { key: 'AICompanion', label: '🤖  Vrindavan Companion', icon: '›' },
    { key: 'NotificationsScreen', label: '🔔  Notifications', icon: '›' },
    { key: 'Settings', label: '⚙️  Settings', icon: '›' },
  ];

  const doLogout = () => {
    // isLoggedIn → false makes RootNavigator swap back to AuthStack automatically.
    dispatch(logout());
  };

  return (
    <ScreenContainer>
      <Card style={styles.userCard}>
        <View style={styles.avatar}><Text style={{ fontSize: 28 }}>👤</Text></View>
        <Text style={typography.h3}>{user?.name || 'Guest'}</Text>
        <Text style={typography.caption}>+91 {user?.mobile || '----------'}</Text>
        {user?.email ? <Text style={typography.caption}>{user.email}</Text> : null}
      </Card>

      <Card padded={false}>
        {items.map((item, i) => (
          <TouchableOpacity
            key={item.key}
            style={[styles.row, i === items.length - 1 && { borderBottomWidth: 0 }]}
            onPress={() => navigation.navigate(item.key)}
          >
            <Text style={styles.rowLabel}>{item.label}</Text>
            <Text style={styles.chev}>{item.icon}</Text>
          </TouchableOpacity>
        ))}
      </Card>

      <Button title="Log Out" variant="outline" style={{ marginTop: spacing.lg }} onPress={doLogout} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  userCard: { alignItems: 'center', marginBottom: spacing.md },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: palette.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: spacing.lg,
    borderBottomWidth: 1, borderBottomColor: palette.divider,
  },
  rowLabel: { fontSize: 14, color: palette.text, fontWeight: '500' },
  chev: { fontSize: 18, color: palette.textMuted },
});

const screenOptions = {
  headerStyle: { backgroundColor: palette.surface },
  headerTitleStyle: { fontWeight: '700', fontSize: 16 },
  headerTintColor: palette.text,
  headerShadowVisible: false,
  contentStyle: { backgroundColor: palette.background },
};

export default function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="ProfileHome" component={ProfileHome} options={{ title: 'Profile' }} />
      <Stack.Screen name="ProfileDetails" component={ProfileDetailsScreen} options={{ title: 'Profile Details' }} />
      <Stack.Screen name="Rewards" component={RewardsScreen} options={{ title: 'Rewards' }} />
      <Stack.Screen name="AICompanion" component={AICompanionScreen} options={{ title: 'Vrindavan Companion' }} />
      <Stack.Screen name="NotificationsScreen" component={NotificationsScreen} options={{ title: 'Notifications' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
    </Stack.Navigator>
  );
}
