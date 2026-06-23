import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  // Lift the bar above the device's gesture/button navigation so it never
  // gets clipped or sits under the system buttons.
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 8);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#9AA3C7',
        tabBarStyle: {
          backgroundColor: palette.primaryDark,
          borderTopWidth: 0,
          height: 60 + bottomInset,
          paddingBottom: bottomInset,
          paddingTop: 8,
          elevation: 12,
          shadowColor: '#000',
          shadowOpacity: 0.2,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: -3 },
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
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
  icon: { fontSize: 18, opacity: 0.55 },
  iconActive: { opacity: 1 },
});
