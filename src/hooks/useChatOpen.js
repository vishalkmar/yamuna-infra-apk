import { useEffect, useState } from 'react';
import { onChatOpen } from '../services/liveNotifications';

// true while the full-screen support chat is open (hide tab bar / floating buttons).
export default function useChatOpen() {
  const [open, setOpen] = useState(false);
  useEffect(() => onChatOpen(setOpen), []);
  return open;
}
