import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeStack from './HomeStack';
import ResidentStack from './ResidentStack';
import CommunityStack from './CommunityStack';
import ProfileStack from './ProfileStack';
import { palette } from '../theme';

const Tab = createBottomTabNavigator();

const tabIcon = emoji => ({ focused }) => (
  <Text style={[styles.icon, focused && styles.iconActive]}>{emoji}</Text>
);

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.textMuted,
        tabBarStyle: { backgroundColor: palette.surface, borderTopColor: palette.divider, height: 60, paddingBottom: 8, paddingTop: 6 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen name="HomeTab" component={HomeStack} options={{ title: 'Home', tabBarIcon: tabIcon('🏠') }} />
      <Tab.Screen name="ResidentTab" component={ResidentStack} options={{ title: 'Services', tabBarIcon: tabIcon('🛎️') }} />
      <Tab.Screen name="CommunityTab" component={CommunityStack} options={{ title: 'Community', tabBarIcon: tabIcon('👥') }} />
      <Tab.Screen name="ProfileTab" component={ProfileStack} options={{ title: 'Profile', tabBarIcon: tabIcon('👤') }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  icon: { fontSize: 18, opacity: 0.7 },
  iconActive: { opacity: 1 },
});
