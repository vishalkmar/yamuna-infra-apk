import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeCleaningScreen from '../screens/services/HomeCleaningScreen';
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
import { Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import ScreenContainer from '../components/ScreenContainer';
import { palette, radius, spacing, typography } from '../theme';

const Stack = createNativeStackNavigator();

const SERVICES = [
  { key: 'HomeServices', label: 'Home Cleaning', icon: '🧹' },
  { key: 'Housekeeping', label: 'Housekeeping', icon: '🧺' },
  { key: 'CookBooking', label: 'Book a Cook', icon: '👨‍🍳' },
  { key: 'MealOrder', label: 'Meal Tiffin', icon: '🍱' },
  { key: 'HealthcareScreen', label: 'Doctor & Healthcare', icon: '🩺' },
  { key: 'Wheelchair', label: 'Mobility Aid', icon: '🦽' },
  { key: 'WellnessScreen', label: 'Wellness & Spa', icon: '🧘' },
  { key: 'SpiritualScreen', label: 'Spiritual Concierge', icon: '🕉️' },
  { key: 'TempleDirectoryScreen', label: 'Temple Directory', icon: '🛕' },
  { key: 'Darshan', label: 'Darshan & Transport', icon: '🚕' },
];

function ResidentHome({ navigation }) {
  return (
    <ScreenContainer>
      <Text style={typography.h1}>Resident Services</Text>
      <Text style={[typography.bodyMuted, { marginBottom: spacing.lg }]}>
        Everything you need for life inside the community.
      </Text>
      <FlatList
        data={SERVICES}
        keyExtractor={i => i.key}
        scrollEnabled={false}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: spacing.sm }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.tile}
            onPress={() => navigation.navigate(item.key)}
          >
            <Text style={{ fontSize: 32 }}>{item.icon}</Text>
            <Text style={styles.tileLabel}>{item.label}</Text>
          </TouchableOpacity>
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: '48%',
    padding: spacing.lg,
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.divider,
    alignItems: 'flex-start',
  },
  tileLabel: { fontSize: 14, fontWeight: '600', color: palette.text, marginTop: spacing.sm },
});

const screenOptions = {
  headerStyle: { backgroundColor: palette.surface },
  headerTitleStyle: { fontWeight: '700', fontSize: 16 },
  headerTintColor: palette.text,
  headerShadowVisible: false,
  contentStyle: { backgroundColor: palette.background },
};

export default function ResidentStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="ResidentHome" component={ResidentHome} options={{ headerShown: false }} />
      <Stack.Screen name="HomeServices" component={HomeCleaningScreen} options={{ title: 'Home Cleaning' }} />
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
