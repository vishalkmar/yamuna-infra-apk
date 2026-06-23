import React, { useRef, useEffect } from 'react';
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
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Animated, Easing } from 'react-native';
import ScreenContainer from '../components/ScreenContainer';
import { palette, radius, spacing, typography } from '../theme';

const Stack = createNativeStackNavigator();

const SERVICES = [
  { key: 'HomeServices', label: 'Home Cleaning', icon: '🧹', tint: '#E8EEFF' },
  { key: 'Housekeeping', label: 'Housekeeping', icon: '🧺', tint: '#FFF0D6' },
  { key: 'CookBooking', label: 'Book a Cook', icon: '👨‍🍳', tint: '#FCE4E8' },
  { key: 'MealOrder', label: 'Meal Tiffin', icon: '🍱', tint: '#E4F6EC' },
  { key: 'HealthcareScreen', label: 'Doctor & Healthcare', icon: '🩺', tint: '#E6F4FB' },
  { key: 'Wheelchair', label: 'Mobility Aid', icon: '🦽', tint: '#EDE7FF' },
  { key: 'WellnessScreen', label: 'Wellness & Spa', icon: '🧘', tint: '#FFF0D6' },
  { key: 'SpiritualScreen', label: 'Spiritual Concierge', icon: '🕉️', tint: '#FCE4E8' },
  { key: 'TempleDirectoryScreen', label: 'Temple Directory', icon: '🛕', tint: '#E8EEFF' },
  { key: 'Darshan', label: 'Darshan & Transport', icon: '🚕', tint: '#E4F6EC' },
];

function ResidentHome({ navigation }) {
  // One shared spin value drives the rotating ring on every card (cheap, and
  // keeps all rings in sync).
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    anim.start();
    return () => anim.stop();
  }, [spin]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

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
        columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: spacing.md }}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.tile}
            onPress={() => navigation.navigate(item.key)}
          >
            <View style={styles.ringWrap}>
              <Animated.View style={[styles.ring, { transform: [{ rotate }] }]} />
              <View style={[styles.iconCircle, { backgroundColor: item.tint }]}>
                <Text style={styles.icon}>{item.icon}</Text>
              </View>
            </View>
            <Text style={styles.tileLabel}>{item.label}</Text>
          </TouchableOpacity>
        )}
      />
    </ScreenContainer>
  );
}

const RING = 88;
const styles = StyleSheet.create({
  tile: {
    width: '48%',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    backgroundColor: palette.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: palette.divider,
    alignItems: 'center',
    shadowColor: palette.primary,
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  ringWrap: {
    width: RING, height: RING,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
  },
  ring: {
    position: 'absolute',
    width: RING, height: RING,
    borderRadius: RING / 2,
    borderWidth: 3,
    borderColor: 'rgba(245,166,35,0.18)',
    borderTopColor: palette.accent,
    borderRightColor: palette.accent,
  },
  iconCircle: {
    width: 62, height: 62,
    borderRadius: 31,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    // Raised, slightly tilted 3D look.
    transform: [{ perspective: 600 }, { rotateX: '14deg' }],
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  icon: { fontSize: 30 },
  tileLabel: { fontSize: 14, fontWeight: '600', color: palette.text, textAlign: 'center' },
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
