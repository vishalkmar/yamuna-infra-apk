import { useEffect, useState } from 'react';
import { onChatUnread, refreshChatUnread } from '../services/liveNotifications';

export default function useChatUnread() {
  const [n, setN] = useState(0);
  useEffect(() => { const off = onChatUnread(setN); refreshChatUnread(); return off; }, []);
  return n;
}
