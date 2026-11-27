import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { startLive, stopLive } from '../services/liveNotifications';

// Starts the live notification socket + phone due-reminders while a resident
// is logged in, and stops them on logout.
export default function LiveNotificationsBridge() {
  const token = useSelector(s => s.auth.token);
  const isLoggedIn = useSelector(s => s.auth.isLoggedIn);
  useEffect(() => {
    if (isLoggedIn && token) startLive(token);
    else stopLive();
  }, [isLoggedIn, token]);
  return null;
}
