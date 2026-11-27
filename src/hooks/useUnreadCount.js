import { useEffect, useState } from 'react';
import { onUnreadChange, refreshUnread } from '../services/liveNotifications';

// Live unread-notification count for bell badges.
export default function useUnreadCount() {
  const [n, setN] = useState(0);
  useEffect(() => {
    const off = onUnreadChange(setN);
    refreshUnread();
    return off;
  }, []);
  return n;
}
