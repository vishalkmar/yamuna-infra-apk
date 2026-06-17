import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CommunityScreen from '../screens/community/CommunityScreen';
import RewardsScreen from '../screens/rewards/RewardsScreen';
import { palette } from '../theme';

const Stack = createNativeStackNavigator();

const screenOptions = {
  headerStyle: { backgroundColor: palette.surface },
  headerTitleStyle: { fontWeight: '700', fontSize: 16 },
  headerTintColor: palette.text,
  headerShadowVisible: false,
  contentStyle: { backgroundColor: palette.background },
};

export default function CommunityStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="CommunityHome" component={CommunityScreen} options={{ title: 'Community' }} />
      <Stack.Screen name="VisitorScreen" component={CommunityScreen} options={{ title: 'Visitors' }} />
      <Stack.Screen name="AmenityBookingScreen" component={CommunityScreen} options={{ title: 'Book Amenity' }} />
      <Stack.Screen name="Benefits" component={RewardsScreen} options={{ title: 'Resident Benefits' }} />
      <Stack.Screen name="Investment" component={RewardsScreen} options={{ title: 'Investment Opportunities' }} />
    </Stack.Navigator>
  );
}
