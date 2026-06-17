import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import SplashScreen from '../screens/auth/SplashScreen';
import AuthStack from './AuthStack';
import DrawerNavigator from './DrawerNavigator';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const isLoggedIn = useSelector(s => s.auth.isLoggedIn);
  const [booting, setBooting] = useState(true);

  // Show the splash briefly, then let auth state decide which stack renders.
  // No manual navigation/reset — conditional rendering drives the flow, which
  // is what makes this reliable in release/Hermes builds.
  useEffect(() => {
    const t = setTimeout(() => setBooting(false), 1200);
    return () => clearTimeout(t);
  }, []);

  if (booting) return <SplashScreen />;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isLoggedIn ? (
        <Stack.Screen name="MainDrawer" component={DrawerNavigator} />
      ) : (
        <Stack.Screen name="AuthStack" component={AuthStack} />
      )}
    </Stack.Navigator>
  );
}
