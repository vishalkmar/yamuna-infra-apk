import { useEffect, useRef, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

// Keeps a chat composer above the keyboard (like WhatsApp / Instagram).
//
// Android 15+ draws apps edge-to-edge, so "adjustResize" no longer shrinks the
// screen and the keyboard simply covers the bottom. Older phones DO resize.
// Instead of guessing, we measure: when the keyboard opens we check how much
// of our container (ref) is actually under the keyboard and pad exactly that
// much — 0 on phones that already resized, the full overlap on the others.
export default function useKeyboardPadding() {
  const ref = useRef(null);
  const [pad, setPad] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let timer = null;
    const measure = screenY => {
      const node = ref.current;
      if (!node || !node.measureInWindow) return;
      node.measureInWindow((x, y, w, h) => {
        const overlap = Math.round(y + h - screenY);
        setPad(overlap > 0 ? overlap : 0);
      });
    };
    const onShow = e => {
      const screenY = e?.endCoordinates?.screenY;
      setOpen(true);
      if (screenY == null) return;
      clearTimeout(timer);
      // let a resizing window settle first, then measure the real overlap
      timer = setTimeout(() => measure(screenY), Platform.OS === 'android' ? 80 : 0);
    };
    const onHide = () => { clearTimeout(timer); setPad(0); setOpen(false); };
    const subs = [
      Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', onShow),
      Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', onHide),
      Keyboard.addListener('keyboardDidChangeFrame', e => { if (Keyboard.isVisible()) onShow(e); }),
    ];
    return () => { clearTimeout(timer); subs.forEach(s => s.remove()); };
  }, []);

  return { ref, pad, keyboardOpen: open };
}
