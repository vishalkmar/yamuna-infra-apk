import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { neuScreenOptions } from './neuStack';
import HomeScreen from '../screens/home/HomeScreen';
import BookingDocketScreen from '../screens/booking/BookingDocketScreen';
import PaymentDashboardScreen from '../screens/payment/PaymentDashboardScreen';
import DocumentRepositoryScreen from '../screens/documents/DocumentRepositoryScreen';
import PdfViewerScreen from '../screens/documents/PdfViewerScreen';
import ConstructionTrackerScreen from '../screens/project/ConstructionTrackerScreen';
import SiteVisitScreen from '../screens/sitevisit/SiteVisitScreen';
import SupportChatScreen from '../screens/support/SupportChatScreen';
import TicketDetailScreen from '../screens/support/TicketDetailScreen';
import PossessionDashboardScreen from '../screens/possession/PossessionDashboardScreen';
import SnagScreen from '../screens/snag/SnagScreen';
import MoveInScreen from '../screens/movein/MoveInScreen';
import SOSScreen from '../screens/sos/SOSScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import { palette } from '../theme';

const Stack = createNativeStackNavigator();

// Neumorphic header (round back button + bold title) for every inner screen.
const screenOptions = neuScreenOptions;

export default function HomeStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="HomeMain" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="BookingDocket" component={BookingDocketScreen} options={{ title: 'Booking Docket' }} />
      <Stack.Screen name="PaymentDashboard" component={PaymentDashboardScreen} options={{ title: 'Payments' }} />
      <Stack.Screen name="DocumentRepository" component={DocumentRepositoryScreen} options={{ title: 'Documents' }} />
      <Stack.Screen name="PdfViewer" component={PdfViewerScreen} options={{ title: 'Document' }} />
      <Stack.Screen name="ConstructionTracker" component={ConstructionTrackerScreen} options={{ title: 'Construction Progress' }} />
      <Stack.Screen name="SiteVisit" component={SiteVisitScreen} options={{ title: 'Site Overview' }} />
      <Stack.Screen name="Support" component={SupportChatScreen} options={{ title: 'Support Chat' }} />
      <Stack.Screen name="TicketDetail" component={TicketDetailScreen} options={{ title: 'Ticket' }} />
      <Stack.Screen name="PossessionDashboard" component={PossessionDashboardScreen} options={{ title: 'Possession' }} />
      <Stack.Screen name="SnagReport" component={SnagScreen} options={{ title: 'Home Inspection & Snags' }} />
      <Stack.Screen name="MoveIn" component={MoveInScreen} options={{ title: 'Move-In Assistance' }} />
      <Stack.Screen name="NotificationsScreen" component={NotificationsScreen} options={{ title: 'Notifications' }} />
      <Stack.Screen name="SOSScreen" component={SOSScreen} options={{ title: 'Emergency SOS' }} />
    </Stack.Navigator>
  );
}
