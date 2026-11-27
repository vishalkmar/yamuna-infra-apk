// App localisation (English / हिन्दी) with i18next + react-i18next.
//
// Every screen is written in English. Instead of wrapping hundreds of strings
// in t(), the JSX runtime is patched once: whenever a <Text> renders a plain
// string (or a TextInput shows a placeholder, or an Alert opens), the string
// is looked up in the active language's dictionary (src/i18n/hi.js). Unknown
// strings stay as they are, so nothing can break. Changing the language
// re-renders the whole app (navigation state is kept).
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { Text, TextInput, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import hi from './hi';

export const LANGS = ['en', 'hi'];
const STORE_KEY = 'app_language';

i18next.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  resources: { en: { translation: {} }, hi: { translation: hi } },
  keySeparator: false,
  nsSeparator: false,
  returnEmptyString: false,
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
  compatibilityJSON: 'v4',
  showSupportNotice: false,
});

// A few dynamic phrases: [regex, replacement]
const PATTERNS = {
  hi: [
    [/^(\d+) unread$/, '$1 अपठित'],
    [/^(\d+) day(s)? left/, '$1 दिन बाकी'],
    [/^Due today/, 'आज देय'],
    [/^(\d+)\/(\d+)$/, '$1/$2'],
  ],
};

let lang = 'en';
export const currentLanguage = () => lang;

// Translate one string (keeps surrounding spaces / newlines).
export function tr(s) {
  if (lang === 'en' || typeof s !== 'string' || !s) return s;
  const core = s.trim();
  if (!core || !/[A-Za-z]/.test(core)) return s;
  const key = core.replace(/\s+/g, ' ');
  let out = i18next.exists(key) ? i18next.t(key) : null;
  if (out == null) {
    for (const [re, rep] of PATTERNS[lang] || []) { if (re.test(key)) { out = key.replace(re, rep); break; } }
  }
  if (out == null) return s;
  const lead = s.match(/^\s*/)[0];
  const trail = s.match(/\s*$/)[0];
  return lead + out + trail;
}

function trChildren(children) {
  if (typeof children === 'string') return tr(children);
  if (Array.isArray(children)) {
    let changed = false;
    const next = children.map(c => { if (typeof c === 'string') { const t = tr(c); if (t !== c) changed = true; return t; } return c; });
    return changed ? next : children;
  }
  return children;
}

function patchProps(type, props) {
  if (lang === 'en' || !props) return props;
  if (type === Text && props.children != null) {
    const c = trChildren(props.children);
    if (c !== props.children) return { ...props, children: c };
  }
  if (type === TextInput && typeof props.placeholder === 'string') {
    const p = tr(props.placeholder);
    if (p !== props.placeholder) return { ...props, placeholder: p };
  }
  return props;
}

let patched = false;
function patchRuntime() {
  if (patched) return;
  patched = true;
  for (const name of ['react/jsx-runtime', 'react/jsx-dev-runtime']) {
    let rt;
    try { rt = name === 'react/jsx-runtime' ? require('react/jsx-runtime') : require('react/jsx-dev-runtime'); } catch (e) { continue; }
    for (const fn of ['jsx', 'jsxs', 'jsxDEV']) {
      const orig = rt[fn];
      if (typeof orig !== 'function') continue;
      try { rt[fn] = (type, props, ...rest) => orig(type, patchProps(type, props), ...rest); } catch (e) { /* read-only */ }
    }
  }
  const React = require('react');
  const ce = React.createElement;
  React.createElement = (type, props, ...children) => {
    if (lang !== 'en' && type === Text && children.length) return ce(type, props, ...children.map(c => (typeof c === 'string' ? tr(c) : c)));
    return ce(type, patchProps(type, props), ...children);
  };
  const alert = Alert.alert;
  Alert.alert = (title, message, buttons, ...rest) => alert(
    tr(title), tr(message),
    Array.isArray(buttons) ? buttons.map(b => ({ ...b, text: tr(b.text) })) : buttons, ...rest,
  );
}
patchRuntime();

const listeners = new Set();
export function onLanguageChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }

export async function setLanguage(next) {
  const l = LANGS.includes(next) ? next : 'en';
  if (l === lang) return;
  lang = l;
  await i18next.changeLanguage(l);
  AsyncStorage.setItem(STORE_KEY, l).catch(() => {});
  listeners.forEach(f => f(l));
}

export async function loadSavedLanguage() {
  try {
    const l = await AsyncStorage.getItem(STORE_KEY);
    if (l && LANGS.includes(l)) { lang = l; await i18next.changeLanguage(l); }
  } catch (e) { /* default en */ }
  return lang;
}

export default i18next;
