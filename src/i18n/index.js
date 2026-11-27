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
import hiBase from './hi';
import { hiExtra, hiPatterns } from './hi_extra';

const hi = { ...hiBase, ...hiExtra };

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

// Phrases built from template strings, e.g. "Pay {0} with Cashfree":
// compiled to /^Pay (.+?) with Cashfree$/ → "Cashfree से $1 भुगतान करें".
function compile(map) {
  return Object.entries(map).map(([en, out]) => {
    const parts = en.split(/\{(\d+)\}/);
    let re = '^';
    const order = [];
    parts.forEach((p, i) => {
      if (i % 2) { re += '(.+?)'; order.push(Number(p)); } else re += p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    });
    re += '$';
    return [new RegExp(re), out, order];
  }).sort((x, y) => y[0].source.length - x[0].source.length); // most specific first
}
const PATTERNS = { hi: compile(hiPatterns) };

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
    for (const [re, tpl, order] of PATTERNS[lang] || []) {
      const m = key.match(re);
      if (m) { out = tpl.replace(/\{(\d+)\}/g, (_, n) => { const v = m[order.indexOf(Number(n)) + 1] ?? ''; return i18next.exists(v.trim()) ? i18next.t(v.trim()) : v; }); break; }
    }
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

// ---- live language store: every translated Text subscribes to it ----
const listeners = new Set();
export function onLanguageChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }
const subscribe = fn => { listeners.add(fn); return () => listeners.delete(fn); };
const getLang = () => lang;

// Drop-in replacements for <Text> / <TextInput>. Each one re-renders ITSELF
// when the language changes, so switching language updates the current page
// in place — no app restart, navigation/back history untouched.
let ce = null; // original React.createElement (set in patchRuntime)
const React = require('react');
const TText = React.forwardRef((props, ref) => {
  React.useSyncExternalStore(subscribe, getLang);
  const children = props.children == null ? props.children : trChildren(props.children);
  return ce(Text, { ...props, ref, children });
});
TText.displayName = 'Text';
const TInput = React.forwardRef((props, ref) => {
  React.useSyncExternalStore(subscribe, getLang);
  const placeholder = typeof props.placeholder === 'string' ? tr(props.placeholder) : props.placeholder;
  return ce(TextInput, { ...props, ref, placeholder });
});
TInput.displayName = 'TextInput';
const swap = type => (type === Text ? TText : type === TextInput ? TInput : type);

let patched = false;
function patchRuntime() {
  if (patched) return;
  patched = true;
  ce = React.createElement;
  for (const name of ['react/jsx-runtime', 'react/jsx-dev-runtime']) {
    let rt;
    try { rt = name === 'react/jsx-runtime' ? require('react/jsx-runtime') : require('react/jsx-dev-runtime'); } catch (e) { continue; }
    for (const fn of ['jsx', 'jsxs', 'jsxDEV']) {
      const orig = rt[fn];
      if (typeof orig !== 'function') continue;
      try { rt[fn] = (type, ...rest) => orig(swap(type), ...rest); } catch (e) { /* read-only */ }
    }
  }
  const createElement = ce;
  React.createElement = (type, ...rest) => createElement(swap(type), ...rest);
  const alert = Alert.alert;
  Alert.alert = (title, message, buttons, ...rest) => alert(
    tr(title), tr(message),
    Array.isArray(buttons) ? buttons.map(b => ({ ...b, text: tr(b.text) })) : buttons, ...rest,
  );
}
patchRuntime();

export async function setLanguage(next) {
  const l = LANGS.includes(next) ? next : 'en';
  if (l === lang) return;
  await i18next.changeLanguage(l);
  lang = l;
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
