import 'react-native-gesture-handler';
import React from 'react';
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
import FloatingSOSButton from './src/components/FloatingSOSButton';
import FloatingChatButton from './src/components/FloatingChatButton';
import { theme } from './src/theme';
import { toastConfig } from './src/utils/toastConfig';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

export default function App() {
  return (
    <ReduxProvider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <QueryClientProvider client={queryClient}>
          <PaperProvider theme={theme}>
            <SafeAreaProvider>
              <NavigationContainer>
                <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
                <RootNavigator />
                <FloatingSOSButton />
                <FloatingChatButton />
              </NavigationContainer>
              <Toast config={toastConfig} />
            </SafeAreaProvider>
          </PaperProvider>
        </QueryClientProvider>
      </PersistGate>
    </ReduxProvider>
  );
}
