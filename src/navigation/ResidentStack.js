import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { neuScreenOptions } from './neuStack';
import ResidentHome from '../screens/services/ServicesHomeScreen';
import HomeCleaningScreen from '../screens/services/HomeCleaningScreen';
import MaintenanceScreen from '../screens/services/MaintenanceScreen';
import HousekeepingScreen from '../screens/services/HousekeepingScreen';
import CookBookingScreen from '../screens/services/CookBookingScreen';
import ProviderOfferingsScreen from '../screens/services/ProviderOfferingsScreen';
import TransportScreen from '../screens/transport/TransportScreen';
import FoodCategoryScreen from '../screens/food/FoodCategoryScreen';
import CartScreen from '../screens/food/CartScreen';
import MealOrderScreen from '../screens/services/MealOrderScreen';
import HealthcareScreen from '../screens/services/HealthcareScreen';
import WheelchairScreen from '../screens/services/WheelchairScreen';
import WellnessScreen from '../screens/services/WellnessScreen';
import SpiritualScreen from '../screens/services/SpiritualScreen';

const Stack = createNativeStackNavigator();

// Neumorphic header (round back button + bold title) for every inner screen.
const screenOptions = neuScreenOptions;

export default function ResidentStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="ResidentHome" component={ResidentHome} options={{ headerShown: false }} />
      <Stack.Screen name="HomeServices" component={HomeCleaningScreen} options={{ title: 'Home Cleaning' }} />
      <Stack.Screen name="Maintenance" component={MaintenanceScreen} options={{ title: 'Maintenance & Repairs' }} />
      <Stack.Screen name="Housekeeping" component={HousekeepingScreen} options={{ title: 'Housekeeping' }} />
      <Stack.Screen name="CookBooking" component={CookBookingScreen} options={{ title: 'Book a Cook' }} />
      <Stack.Screen name="MealOrder" component={MealOrderScreen} options={{ title: 'Meal Ordering' }} />
      <Stack.Screen name="HealthcareScreen" component={HealthcareScreen} options={{ title: 'Healthcare' }} />
      <Stack.Screen name="Wheelchair" component={WheelchairScreen} options={{ title: 'Mobility Assistance' }} />
      <Stack.Screen name="WellnessScreen" component={WellnessScreen} options={{ title: 'Wellness' }} />
      <Stack.Screen name="SpiritualScreen" component={SpiritualScreen} options={{ title: 'Spiritual Concierge' }} />
      <Stack.Screen name="TempleDirectoryScreen" component={SpiritualScreen} options={{ title: 'Temple Directory' }} />
      <Stack.Screen name="Darshan" component={TransportScreen} options={{ title: 'Darshan & Transport' }} />
      <Stack.Screen name="ProviderOfferings" component={ProviderOfferingsScreen} options={{ title: 'Services' }} />
      <Stack.Screen name="FoodCategory" component={FoodCategoryScreen} options={{ title: 'Menu' }} />
      <Stack.Screen name="FoodCart" component={CartScreen} options={{ title: 'Cart' }} />
    </Stack.Navigator>
  );
}

