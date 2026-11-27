import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { neuScreenOptions } from './neuStack';
import ProfileHome from '../screens/profile/ProfileHomeScreen';
import RewardsScreen from '../screens/rewards/RewardsScreen';
import AICompanionScreen from '../screens/rewards/AICompanionScreen';
import ProfileDetailsScreen from '../screens/profile/ProfileDetailsScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';

const Stack = createNativeStackNavigator();

// Neumorphic header (round back button + bold title) for every inner screen.
const screenOptions = neuScreenOptions;

export default function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="ProfileHome" component={ProfileHome} options={{ title: 'Profile', headerShown: false }} />
      <Stack.Screen name="ProfileDetails" component={ProfileDetailsScreen} options={{ title: 'Profile Details', headerShown: false }} />
      <Stack.Screen name="Rewards" component={RewardsScreen} options={{ title: 'Rewards' }} />
      <Stack.Screen name="AICompanion" component={AICompanionScreen} options={{ title: 'Vrindavan Companion' }} />
      <Stack.Screen name="NotificationsScreen" component={NotificationsScreen} options={{ title: 'Notifications' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
    </Stack.Navigator>
  );
}

