import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { setLanguage } from '../i18n';

// Applies the language chosen in Settings (settings.language) to the app.
// The first value (store default 'en' before settings load) is ignored so the
// language saved on the phone is kept at startup.
export default function LanguageBridge() {
  const language = useSelector(s => s.settings.language);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (language) setLanguage(language);
  }, [language]);
  return null;
}
