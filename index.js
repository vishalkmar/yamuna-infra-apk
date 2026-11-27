/**
 * @format
 */

import './src/i18n';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { setPendingLink } from './src/services/liveNotifications';

// Notification tapped while the app was in the background → remember where
// it should go; the app opens that screen as soon as it is in front.
try {
  const notifee = require('@notifee/react-native');
  notifee.default.onBackgroundEvent(async ({ type, detail }) => {
    if (type === notifee.EventType.PRESS) setPendingLink(detail?.notification?.data?.link);
  });
} catch (e) { /* notifee missing (tests / web) */ }

AppRegistry.registerComponent(appName, () => App);
