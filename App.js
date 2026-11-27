import 'react-native-gesture-handler';
import React, { useEffect, useRef, useState } from 'react';
import { StatusBar } from 'react-native';
import { Provider as ReduxProvider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { store, persistor } from './src/store';
import RootNavigator from './src/navigation/RootNavigator';
import { theme } from './src/theme';
import { toastConfig } from './src/utils/toastConfig';
import { ensureNotifPermission } from './src/services/notifications';
import { navigationRef } from './src/services/liveNotifications';
import LiveNotificationsBridge from './src/components/LiveNotificationsBridge';
import LanguageBridge from './src/components/LanguageBridge';
import { loadSavedLanguage, onLanguageChange, currentLanguage } from './src/i18n';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

export default function App() {
  // Ask for notification permission early so the SOS siren can fire reliably
  // (Android 13+ drops notifications — and their sound — without it).
  useEffect(() => { ensureNotifPermission(); }, []);

  // App language (English / हिन्दी): wait for the saved choice, then re-render
  // everything when it changes — keeping the screen the user is on.
  const [lang, setLang] = useState(currentLanguage());
  const [langReady, setLangReady] = useState(false);
  const navState = useRef(undefined);
  useEffect(() => {
    loadSavedLanguage().then(l => { setLang(l); setLangReady(true); });
    return onLanguageChange(setLang);
  }, []);
  if (!langReady) return null;

  return (
    <ReduxProvider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <QueryClientProvider client={queryClient}>
          <PaperProvider theme={theme}>
            <SafeAreaProvider>
              <NavigationContainer key={lang} ref={navigationRef} initialState={navState.current} onStateChange={s => { navState.current = s; }}>
                <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
                <RootNavigator />
                <LiveNotificationsBridge />
                <LanguageBridge />
              </NavigationContainer>
              <Toast config={toastConfig} />
            </SafeAreaProvider>
          </PaperProvider>
        </QueryClientProvider>
      </PersistGate>
    </ReduxProvider>
  );
}
