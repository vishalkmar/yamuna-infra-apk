import { AppState, Platform } from 'react-native';
import Toast from 'react-native-toast-message';
import { createNavigationContainerRef } from '@react-navigation/native';
import api from '../api/client';
import { ENV } from '../constants/env';
import { paymentApi } from '../api/paymentApi';

// Live notifications:
//  • WebSocket to the API (/ws) — new notifications arrive instantly, the bell
//    count updates, and a phone notification (notifee) is shown.
//  • Payment due reminders are also scheduled ON the phone (3, 2, 1 days
//    before and on the due date at 10 AM) so they ring even if the app is
//    closed and there is no internet.
//  • Tapping any notification opens the right screen (link → route).

export const navigationRef = createNavigationContainerRef();

function notifeeLib() {
  try { return require('@notifee/react-native'); } catch (e) { return null; }
}
const CHANNEL = 'updates-v1';

// ---------------------------------------------------------------- store
let unread = 0;
const listeners = new Set();
const feedListeners = new Set();
export function onUnreadChange(fn) { listeners.add(fn); fn(unread); return () => listeners.delete(fn); }
export function onNewNotification(fn) { feedListeners.add(fn); return () => feedListeners.delete(fn); }
function setUnread(n) { unread = Math.max(0, n); listeners.forEach(f => f(unread)); }
export function getUnread() { return unread; }
export function decUnread(by = 1) { setUnread(unread - by); }
export function clearUnread() { setUnread(0); }

export async function refreshUnread() {
  try {
    const { data } = await api.get('/notifications/unread-count');
    setUnread(Number(data?.data?.count || 0));
  } catch (e) { /* offline */ }
}

// ---------------------------------------------------------------- deep links
// link formats from the server: 'payment:<propertyId>', 'docket',
// 'construction:<propertyId>', 'site', 'food', 'transport', 'services', 'profile'
export function openLink(link) {
  if (!navigationRef.isReady()) return;
  const [kind, id] = String(link || '').split(':');
  const nav = (tab, screen, params) => navigationRef.navigate('MainDrawer', { screen: 'Tabs', params: { screen: tab, params: screen ? { screen, params } : undefined } });
  switch (kind) {
    case 'payment': return nav('HomeTab', 'PaymentDashboard', id ? { propertyId: Number(id) } : undefined);
    case 'docket': return nav('HomeTab', 'BookingDocket');
    case 'construction': return nav('HomeTab', 'ConstructionTracker', id ? { propertyId: Number(id) } : undefined);
    case 'site': return nav('HomeTab', 'SiteVisit', id ? { projectId: Number(id) } : undefined);
    case 'food': return nav('ResidentTab', 'MealOrder');
    case 'transport': return nav('ResidentTab', 'Darshan');
    case 'services': return nav('ResidentTab', 'ResidentHome');
    case 'profile': return nav('ProfileTab', 'ProfileHome');
    case 'support': return nav('HomeTab', 'Support');
    case 'reminders': return nav('ProfileTab', 'AICompanion');
    case 'notifications': return nav('HomeTab', 'NotificationsScreen');
    case 'mybookings': return nav('HomeTab', 'MyBookings');
    case 'transactions': return nav('HomeTab', 'Transactions');
    case 'sos': return nav('HomeTab', 'SOSScreen');
    case 'healthcare': return nav('ResidentTab', 'HealthcareScreen');
    case 'cleaning': return nav('ResidentTab', 'HomeServices');
    case 'cook': return nav('ResidentTab', 'CookBooking');
    case 'housekeeping': case 'attendant': return nav('ResidentTab', 'Housekeeping');
    case 'maintenance': return nav('ResidentTab', 'Maintenance');
    case 'wellness': return nav('ResidentTab', 'WellnessScreen');
    case 'mobility': return nav('ResidentTab', 'Wheelchair');
    case 'darshan': return nav('ResidentTab', 'TempleDirectoryScreen');
    case 'amenity': return nav('CommunityTab', 'AmenityBookingScreen');
    case 'visitors': return nav('CommunityTab', 'VisitorScreen');
    case 'rewards': return nav('ProfileTab', 'Rewards');
    case 'settings': return nav('ProfileTab', 'Settings');
    default: return nav('HomeTab', 'NotificationsScreen');
  }
}

let pendingLink = null;
export function setPendingLink(link) { if (link != null) pendingLink = link; }
function flushPending() {
  if (pendingLink == null || !navigationRef.isReady()) return;
  const l = pendingLink; pendingLink = null;
  setTimeout(() => openLink(l), 300);
}

// ---------------------------------------------------------------- phone notification
async function ensureChannel(mod) {
  await mod.default.createChannel({
    id: CHANNEL, name: 'Payments, dockets & updates', importance: mod.AndroidImportance.HIGH, sound: 'default', vibration: true,
  });
}

async function showPhoneNotification(n) {
  const mod = notifeeLib();
  if (!mod || Platform.OS === 'web') return;
  try {
    await ensureChannel(mod);
    await mod.default.displayNotification({
      id: `n-${n.id}`,
      title: n.title,
      body: n.body || '',
      data: { link: n.link || '' },
      android: { channelId: CHANNEL, smallIcon: 'ic_launcher', pressAction: { id: 'default' }, importance: mod.AndroidImportance.HIGH },
    });
  } catch (e) { /* best effort */ }
}

// Tapping a phone notification → open its screen (foreground + cold start).
let pressWired = false;
function wirePress() {
  const mod = notifeeLib();
  if (!mod || pressWired) return;
  pressWired = true;
  const { EventType } = mod;
  mod.default.onForegroundEvent(({ type, detail }) => {
    if (type === EventType.PRESS && detail?.notification?.data?.link != null) openLink(detail.notification.data.link);
  });
  mod.default.getInitialNotification?.().then(init => {
    const link = init?.notification?.data?.link;
    if (link != null) setTimeout(() => openLink(link), 1200);
  }).catch(() => {});
}

// ---------------------------------------------------------------- socket
let ws = null;
let token = null;
let retry = 0;
let timer = null;
let pingTimer = null;
let stopped = true;

function wsUrl() {
  const origin = ENV.API_BASE_URL.replace(/\/api\/?$/, '').replace(/^http/, 'ws');
  return `${origin}/ws?token=${encodeURIComponent(token)}`;
}

// ---------------------------------------------------------------- support chat
// The chat screen subscribes with onChat(); while it is open (chatOpen) new
// office replies don't raise a toast/phone notification.
const chatListeners = new Set();
let chatUnread = 0;
const chatUnreadListeners = new Set();
export let chatOpen = false;
const chatOpenListeners = new Set();
let fullScreen = false;
export function setChatOpen(v) { chatOpen = v; if (v) setChatUnread(0); chatOpenListeners.forEach(f => f(v || fullScreen)); }
// Full-screen pages (AI assistant) also hide the tab bar / floating buttons.
export function setFullScreen(v) { fullScreen = v; chatOpenListeners.forEach(f => f(v || chatOpen)); }
export function onChatOpen(fn) { chatOpenListeners.add(fn); fn(chatOpen || fullScreen); return () => chatOpenListeners.delete(fn); }
export function onChat(fn) { chatListeners.add(fn); return () => chatListeners.delete(fn); }
export function onChatUnread(fn) { chatUnreadListeners.add(fn); fn(chatUnread); return () => chatUnreadListeners.delete(fn); }
function setChatUnread(n) { chatUnread = Math.max(0, n); chatUnreadListeners.forEach(f => f(chatUnread)); }
export async function refreshChatUnread() {
  try { const { data } = await api.get('/support/chat/unread'); setChatUnread(Number(data?.data?.count || 0)); } catch (e) { /* offline */ }
}
function handleChat(msg) {
  chatListeners.forEach(f => f(msg));
  if (msg.type !== 'chat' || msg.data.sender !== 'admin' || chatOpen) return;
  setChatUnread(chatUnread + 1);
  const m = msg.data;
  const preview = m.body || `📎 ${(m.attachments || []).map(a => a.name).join(', ')}`;
  if (AppState.currentState === 'active') {
    Toast.show({ type: 'info', text1: `💬 ${m.adminName || 'Support'}`, text2: preview, visibilityTime: 5000, onPress: () => { Toast.hide(); openLink('support'); } });
  }
  showPhoneNotification({ id: `chat-${m.id}`, title: `💬 New message from ${m.adminName || 'Yamuna Infra Support'}`, body: preview, link: 'support' });
}

// Socket status for UI ("Live" vs "Connecting…").
let live = false;
const liveListeners = new Set();
function setLive(v) { if (live !== v) { live = v; liveListeners.forEach(f => f(v)); } }
export const isLive = () => live;
export function onLiveStatus(fn) { liveListeners.add(fn); fn(live); return () => liveListeners.delete(fn); }
// Reconnect now (e.g. a chat screen opened and the socket is down).
export function ensureLive() { if (!stopped && token && (!ws || ws.readyState > 1)) { retry = 0; connect(); } }

function connect() {
  if (stopped || !token) return;
  clearTimeout(timer); // a manual reconnect cancels any pending auto-reconnect
  // Retire the old socket completely: its late close event must not touch the
  // new connection (that race used to drop the new socket and lose messages).
  const old = ws;
  if (old) { old.onopen = old.onmessage = old.onclose = old.onerror = null; try { old.close(); } catch (e) { /* noop */ } }
  const sock = new WebSocket(wsUrl());
  ws = sock;
  sock.onopen = () => {
    if (ws !== sock) return;
    retry = 0;
    setLive(true);
    refreshUnread();
    refreshChatUnread();
    clearInterval(pingTimer);
    pingTimer = setInterval(() => { try { if (ws === sock) sock.send('ping'); } catch (e) { /* noop */ } }, 30000);
  };
  sock.onmessage = e => {
    let msg; try { msg = JSON.parse(e.data); } catch (_) { return; }
    if (!msg.data) return;
    if (msg.type === 'chat' || msg.type === 'chat_read' || msg.type === 'chat_delivered') { handleChat(msg); return; }
    if (msg.type !== 'notification') return;
    const n = msg.data;
    setUnread(unread + 1);
    feedListeners.forEach(f => f(n));
    if (AppState.currentState === 'active') {
      Toast.show({ type: 'info', text1: n.title, text2: n.body, visibilityTime: 5000, onPress: () => { Toast.hide(); openLink(n.link); } });
    }
    showPhoneNotification(n);
  };
  sock.onclose = () => {
    if (ws !== sock) return;
    ws = null;
    setLive(false);
    clearInterval(pingTimer);
    if (stopped) return;
    retry = Math.min(retry + 1, 4);
    clearTimeout(timer);
    timer = setTimeout(connect, Math.min(15000, 1000 * 2 ** retry)); // 2s … 15s
  };
  sock.onerror = () => { /* onclose follows */ };
}

let appStateSub = null;
export function startLive(authToken) {
  if (!authToken) return;
  if (!stopped && token === authToken) return;
  token = authToken;
  stopped = false;
  wirePress();
  connect();
  refreshUnread();
  scheduleDueReminders();
  setTimeout(flushPending, 1500);
  appStateSub?.remove?.();
  appStateSub = AppState.addEventListener('change', s => {
    if (s === 'active') {
      flushPending();
      refreshUnread();
      if (!ws || ws.readyState > 1) { retry = 0; connect(); }
    }
  });
}

export function stopLive() {
  stopped = true;
  token = null;
  clearTimeout(timer);
  clearInterval(pingTimer);
  const old = ws;
  ws = null;
  if (old) { old.onopen = old.onmessage = old.onclose = old.onerror = null; try { old.close(); } catch (e) { /* noop */ } }
  setLive(false);
  appStateSub?.remove?.();
  setUnread(0);
  cancelDueReminders();
}

// ---------------------------------------------------------------- due reminders on the phone
const DUE_PREFIX = 'due-';
async function cancelDueReminders() {
  const mod = notifeeLib();
  if (!mod) return;
  try {
    const ids = await mod.default.getTriggerNotificationIds();
    await Promise.all(ids.filter(id => id.startsWith(DUE_PREFIX)).map(id => mod.default.cancelTriggerNotification(id)));
  } catch (e) { /* noop */ }
}

const inr = n => '₹' + Number(n || 0).toLocaleString('en-IN');

export async function scheduleDueReminders() {
  const mod = notifeeLib();
  if (!mod || Platform.OS === 'web') return;
  try {
    await ensureChannel(mod);
    await cancelDueReminders();
    const props = await paymentApi.myProperties();
    const now = Date.now();
    for (const p of props || []) {
      const pid = p.id ?? p.propertyId;
      if (!pid) continue;
      const sch = await paymentApi.getSchedule(pid).catch(() => null);
      const upcoming = (sch?.installments || []).filter(i => !i.isPaid && i.dueDate).slice(0, 6);
      for (const inst of upcoming) {
        for (const daysBefore of [3, 2, 1, 0]) {
          const [y, m, d] = inst.dueDate.split('-').map(Number);
          // 10:00 AM local time, N days before the due date
          const at = new Date(y, m - 1, d - daysBefore, 10, 0, 0).getTime();
          if (at <= now + 60000) continue;
          const left = daysBefore === 0 ? 'is due TODAY' : `is due in ${daysBefore} day${daysBefore === 1 ? '' : 's'}`;
          await mod.default.createTriggerNotification({
            id: `${DUE_PREFIX}${inst.id}-${daysBefore}`,
            title: daysBefore === 0 ? `⏰ Payment due today: ${inr(inst.amount)}` : `⏰ ${daysBefore} day${daysBefore === 1 ? '' : 's'} left — ${inr(inst.amount)}`,
            body: `${inst.label} ${left} (${inst.dueDate}). Pay on time to avoid late charges.`,
            data: { link: `payment:${pid}` },
            android: { channelId: CHANNEL, smallIcon: 'ic_launcher', pressAction: { id: 'default' } },
          }, { type: mod.TriggerType.TIMESTAMP, timestamp: at, alarmManager: { allowWhileIdle: true } });
        }
      }
    }
  } catch (e) { /* best effort */ }
}
