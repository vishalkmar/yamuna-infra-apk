import { estimateOptions, haversineKm, roundKm, vehicleByType, fareFor } from '../utils/transport';

const wait = (ms = 600) => new Promise(r => setTimeout(r, ms));

// In-memory support desk so the demo behaves like a real thread without a backend.
let _ticketSeq = 43;
const _supportTickets = [
  {
    id: 42,
    ticketCode: 'SR-2026-00042',
    category: 'payment',
    subject: 'Receipt not received for Slab Casting payment',
    description: 'I paid the Slab Casting installment yesterday via UPI but have not received the receipt yet.',
    priority: 'normal',
    status: 'in_progress',
    assignedAgent: 'Kunal Naskar',
    rating: null,
    createdAt: '2026-06-04T18:05:00Z',
    lastMessageAt: '2026-06-05T11:20:00Z',
    messages: [
      { id: 1, author: 'user',  body: 'I paid the Slab Casting installment yesterday via UPI but have not received the receipt yet.', createdAt: '2026-06-04T18:05:00Z' },
      { id: 2, author: 'agent', body: 'Thanks for reaching out, Piyush. I can see the payment. Generating your receipt now — you will get it within 2 hours.', createdAt: '2026-06-05T10:15:00Z' },
      { id: 3, author: 'user',  body: 'Thank you, will wait for it.', createdAt: '2026-06-05T11:20:00Z' },
    ],
    attachments: [],
  },
];

const AGENT_BY_CATEGORY = {
  payment: 'Kunal Naskar', construction: 'Rohit Verma', document: 'Sneha Iyer', general: 'Support Desk',
};

// In-memory possession state so scheduling an appointment flips the banner.
const _possession = {
  checklist: [
    { id: 1, step: 'Final payment cleared',       category: 'payment',    completed: true, sortOrder: 1 },
    { id: 2, step: 'Agreement fully signed',      category: 'document',   completed: true, sortOrder: 2 },
    { id: 3, step: 'No-dues certificate issued',  category: 'document',   completed: true, sortOrder: 3 },
    { id: 4, step: 'Snag inspection completed',   category: 'inspection', completed: true, sortOrder: 4 },
    { id: 5, step: 'Possession letter generated', category: 'document',   completed: true, sortOrder: 5 },
    { id: 6, step: 'Keys & handover kit ready',   category: 'handover',   completed: true, sortOrder: 6 },
  ],
  documents: [
    { id: 1, name: 'Possession Letter',              kind: 'possession_letter', url: '/files/possession/letter.pdf',   available: true },
    { id: 2, name: 'No-Objection Certificate (NOC)', kind: 'noc',               url: '/files/possession/noc.pdf',      available: true },
    { id: 3, name: 'Handover Checklist',             kind: 'handover',          url: '/files/possession/handover.pdf', available: true },
  ],
  appointment: null,
};

function _derivePossessionStatus() {
  if (_possession.appointment) return 'scheduled';
  if (_possession.checklist.every(c => c.completed)) return 'ready';
  return 'pending_clearance';
}

const _POSSESSION_STATUS_LABEL = {
  pending_clearance: 'Pending Clearance', ready: 'Possession Ready',
  scheduled: 'Scheduled', possessed: 'Possession Complete',
};

// In-memory snag list so report + sign-off behave like a real flow.
let _snagSeq = 2;
const _snags = [
  {
    id: 1, snagCode: 'SN-0001', location: 'Bathroom 1', defectType: 'plumbing',
    description: 'Wash basin tap is leaking and water pressure is very low.',
    severity: 'major', status: 'resolved', createdAt: '2026-06-01T09:00:00Z',
    photos: ['https://picsum.photos/seed/snag1a/600/400', 'https://picsum.photos/seed/snag1b/600/400'],
  },
  {
    id: 2, snagCode: 'SN-0002', location: 'Hall', defectType: 'paint',
    description: 'Patchy paint finish on the north wall near the balcony door.',
    severity: 'minor', status: 'open', createdAt: '2026-06-04T10:30:00Z',
    photos: ['https://picsum.photos/seed/snag2a/600/400'],
  },
];

const _SEVERITY_RANK = { critical: 0, major: 1, minor: 2 };

// In-memory Move-In state.
let _shiftingSeq = 0;
let _utilitySeq = 0;
const _shifting = [];
const _utilities = [];
const _MOVEIN_VENDOR_BLACKOUTS = ['2026-11-08', '2026-12-25', '2027-01-01'];
const _UTILITY_PROVIDER = {
  electricity: 'UPPCL — Dakshinanchal', water: 'Vrindavan Jal Nigam',
  piped_gas: 'Green Gas Ltd', internet: 'Yamuna Fibernet',
};
const _INTERIOR_PARTNERS = [
  { id: 1, name: 'Vrindavan Interiors', specialty: 'Full home interiors, modular kitchens', phone: '9810011111', rating: 4.7 },
  { id: 2, name: 'NestCraft Studio',    specialty: 'Space planning & custom furniture',     phone: '9810022222', rating: 4.5 },
  { id: 3, name: 'Saffron Living',      specialty: 'Vastu-aligned & spiritual decor',       phone: '9810033333', rating: 4.8 },
];

function _addDaysIso(iso, days) {
  const base = iso ? new Date(iso + 'T00:00:00Z') : new Date();
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString().slice(0, 10);
}

// In-memory Home Services state.
let _serviceBookingSeq = 0;
const _serviceBookings = [];
const _SERVICE_CATEGORIES = [
  { id: 1, code: 'cleaning',     name: 'Home Cleaning', icon: '🧹' },
  { id: 2, code: 'cook',         name: 'Cook',          icon: '👨‍🍳' },
  { id: 3, code: 'housekeeping', name: 'Housekeeping',  icon: '🧺' },
  { id: 4, code: 'attendant',    name: 'Attendant',     icon: '🧑‍⚕️' },
];
const _SERVICE_PROVIDERS = [
  { id: 1, name: 'Sparkle Home Services', tagline: 'Deep cleaning specialists',    phone: '9820010001', gender: 'any',    rating: 4.8, experienceYears: 6, priceFrom: 499, categoryCode: 'cleaning' },
  { id: 2, name: 'FreshNest Cleaners',    tagline: 'Eco-friendly products only',   phone: '9820010002', gender: 'female', rating: 4.6, experienceYears: 4, priceFrom: 399, categoryCode: 'cleaning' },
  { id: 3, name: 'PrideCare Facility',    tagline: 'Trained & background-verified', phone: '9820010003', gender: 'male',  rating: 4.5, experienceYears: 8, priceFrom: 599, categoryCode: 'cleaning' },
  { id: 11, name: 'Sahayata Domestic Help', tagline: 'Live-in & part-time maids',          phone: '9820010102', gender: 'female', rating: 4.6, experienceYears: 6, priceFrom: 9000,  categoryCode: 'housekeeping' },
  { id: 12, name: 'GharSeva Maids',         tagline: 'Daily cooking + cleaning combo',      phone: '9820010103', gender: 'female', rating: 4.5, experienceYears: 4, priceFrom: 7500,  categoryCode: 'housekeeping' },
  { id: 13, name: 'Apna Ghar Attendants',   tagline: 'Trained elder-care & baby-care help', phone: '9820010104', gender: 'any',    rating: 4.7, experienceYears: 9, priceFrom: 12000, categoryCode: 'housekeeping' },
  { id: 14, name: 'NeatNest Part-Time',     tagline: 'Part-time utensils, mopping, dusting', phone: '9820010105', gender: 'female', rating: 4.3, experienceYears: 3, priceFrom: 4500,  categoryCode: 'housekeeping' },
  { id: 21, name: 'Annapurna Rasoi', tagline: 'Pure veg, North & South Indian',    phone: '9820010202', gender: 'female', rating: 4.8, experienceYears: 8, priceFrom: 6500, categoryCode: 'cook' },
  { id: 22, name: 'Maa Ki Rasoi',    tagline: 'Homely daily meals, low oil',       phone: '9820010203', gender: 'female', rating: 4.6, experienceYears: 5, priceFrom: 5500, categoryCode: 'cook' },
  { id: 23, name: 'Brij Bhoj Cooks', tagline: 'Satvik & festival bhog specialists', phone: '9820010204', gender: 'any',   rating: 4.7, experienceYears: 7, priceFrom: 7000, categoryCode: 'cook' },
];
// Each provider exposes a few bookable offerings (packages). Generated from a
// per-category template scaled by the provider's base price so the drill-down
// (provider → offerings → Book) has real, priced items.
const _OFFERING_TEMPLATES = {
  cleaning: [
    { code: 'standard', name: 'Standard home cleaning', desc: 'Sweeping, mopping & dusting — up to 2 hrs', mult: 1, unit: 'visit' },
    { code: 'deep', name: 'Deep cleaning (full home)', desc: 'Intensive top-to-bottom clean', mult: 3, unit: 'visit' },
    { code: 'bathroom', name: 'Bathroom deep clean', desc: 'Descaling & sanitising', mult: 1.2, unit: 'visit' },
    { code: 'kitchen', name: 'Kitchen deep clean', desc: 'Degreasing, chimney & slabs', mult: 1.6, unit: 'visit' },
  ],
  housekeeping: [
    { code: 'parttime', name: 'Part-time help (4 hrs/day)', desc: 'Cleaning + utensils', mult: 1, unit: 'month' },
    { code: 'fulltime', name: 'Full-time (live-out)', desc: 'All-day domestic help', mult: 1.7, unit: 'month' },
    { code: 'livein', name: 'Live-in maid', desc: '24×7 stay-in help', mult: 2.4, unit: 'month' },
  ],
  cook: [
    { code: 'two_meals', name: 'Daily 2 meals (lunch + dinner)', desc: 'Monthly subscription', mult: 1, unit: 'month' },
    { code: 'one_meal', name: 'Daily 1 meal', desc: 'Monthly subscription', mult: 0.7, unit: 'month' },
    { code: 'party', name: 'Party / festival cooking', desc: 'Per event, up to 10 guests', fixed: 1500, unit: 'event' },
  ],
};
function _offeringsFor(provider) {
  const tpl = _OFFERING_TEMPLATES[provider.categoryCode] || [];
  return tpl.map((t, i) => ({
    id: provider.id * 100 + i + 1,
    code: t.code,
    name: t.name,
    description: t.desc,
    unit: t.unit,
    price: t.fixed != null ? t.fixed : Math.round((provider.priceFrom * t.mult) / 10) * 10,
  }));
}

// In-memory Rewards / Investments / Companion state (Modules 24-26).
let _rewardPoints = 1500;
let _referralSeq = 0;
let _reminderSeq = 0;
let _checkinSeq = 0;
const _referrals = [];
const _reminders = [
  { id: 1, category: 'medicine', title: 'BP tablet (Amlodipine)', note: '5mg · after breakfast', timeLabel: '08:00', active: true },
  { id: 2, category: 'darshan', title: 'Banke Bihari morning darshan', note: 'Shringar aarti', timeLabel: '06:30', active: true },
];
const _checkins = [];
const _aiMessages = [
  { id: 1, role: 'assistant', content: 'Radhe Radhe! 🙏 I am your Vrindavan Companion. Ask me about darshan, payments, home services or reminders.', createdAt: '2026-06-06T06:30:00Z' },
];
const _REWARD_OFFERS = [
  { id: 1, title: 'Wellness Spa — 20% off', partner: 'Yamuna Wellness', description: 'Flat 20% off any Ayurvedic therapy', pointsCost: 500, category: 'wellness' },
  { id: 2, title: 'Dining voucher ₹500', partner: 'Brij Rasoi', description: 'Use at the clubhouse restaurant', pointsCost: 300, category: 'dining' },
  { id: 3, title: 'Movie tickets (2)', partner: 'PVR Mathura', description: 'Two tickets, any show', pointsCost: 400, category: 'entertainment' },
  { id: 4, title: 'Grocery 10% cashback', partner: 'DailyNeeds Mart', description: 'On orders above ₹1000', pointsCost: 200, category: 'grocery' },
  { id: 5, title: 'Salon & grooming ₹400 off', partner: 'GlowUp Salon', description: 'On services above ₹1500', pointsCost: 350, category: 'lifestyle' },
];
const _INVESTMENTS = [
  { id: 1, code: 'VG', name: 'Vrindavan Greens', location: 'Chhatikara Road, Vrindavan', priceFrom: 4500000, status: 'pre_launch', description: '2 & 3 BHK premium apartments near ISKCON', imageUrl: 'https://picsum.photos/seed/vg/800/450' },
  { id: 2, code: 'YR', name: 'Yamuna Riverside', location: 'Mathura Road, Vrindavan', priceFrom: 7800000, status: 'launching', description: 'Riverside villas with private ghats', imageUrl: 'https://picsum.photos/seed/yr/800/450' },
  { id: 3, code: 'GR', name: 'Gokul Residency', location: 'Gokul, Mathura', priceFrom: 3200000, status: 'open', description: 'Affordable 1 & 2 BHK for investors', imageUrl: 'https://picsum.photos/seed/gr/800/450' },
];
const _DAILY_QUOTES = ['योगः कर्मसु कौशलम् — Yoga is skill in action.', 'Wherever there is Krishna, there is victory.', 'A calm mind brings inner strength.'];
const _DAILY_BHAJANS = ['Achyutam Keshavam', 'Hare Krishna Maha-mantra', 'Govind Bolo Hari Gopal Bolo'];

function _aiReplyMock(message = '') {
  const m = String(message).toLowerCase();
  if (/aarti|darshan|temple|mandir/.test(m)) return 'Banke Bihari morning shringar aarti is at 9:00 AM. Shall I book a shuttle?';
  if (/payment|installment|due|emi/.test(m)) return 'Your next installment is on the Payments screen. Want me to open Pay Now?';
  if (/doctor|health|medicine|appointment/.test(m)) return 'I can book a doctor or set a medicine reminder. Which would you like?';
  if (/clean|cook|maid|housekeep/.test(m)) return 'Book cleaning, a cook or housekeeping from Resident Services. Take you there?';
  if (/sos|emergency|ambulance/.test(m)) return 'For emergencies, hold the red SOS button 3 seconds. Are you safe right now?';
  if (/hello|hi|namaste|radhe/.test(m)) return 'Radhe Radhe! 🙏 How can I help — temple, payments, or home services?';
  return "I'm your Vrindavan Companion — darshan, payments, services, healthcare & reminders. What do you need?";
}

// In-memory Profile state — personal details, preferences, family, KYC (Module 27).
let _familySeq = 2;
const _profile = {
  personal: {
    name: 'Piyush Sharma', mobile: '9876543210', email: 'piyush.sharma@example.com',
    dob: '1985-04-12', gender: 'male', altPhone: '', occupation: 'Business',
    addressLine: 'B-1204, Yamuna Greens', city: 'Vrindavan', state: 'Uttar Pradesh', pincode: '281121',
    tower: 'Tower B', unit: '1204', projectName: 'Yamuna Greens',
  },
  preferences: {
    language: 'en',
    dietary: 'veg',
    channels: { push: true, sms: true, whatsapp: true, email: false },
    festivalAlerts: true,
  },
  kyc: { status: 'not_started', idType: null, idNumberMasked: null, submittedAt: null, verifiedAt: null },
};
const _family = [
  { id: 1, name: 'Sunita Sharma', relation: 'spouse', age: 36, phone: '9876500011' },
  { id: 2, name: 'Aarav Sharma', relation: 'son', age: 9, phone: '' },
];

// In-memory Transport / Darshan cab state (Module 34). Curated Vrindavan places
// with coords so distance + fares work offline (no Google key needed).
let _rideSeq = 0;
const _rides = [];
const _VRINDAVAN_PLACES = [
  { id: 'home',    name: 'Yamuna Greens (Home)',     area: 'Chhatikara Road',  lat: 27.5600, lng: 77.7000, temple: false },
  { id: 'banke',   name: 'Banke Bihari Temple',      area: 'Vrindavan',        lat: 27.5826, lng: 77.7064, temple: true },
  { id: 'prem',    name: 'Prem Mandir',              area: 'Vrindavan',        lat: 27.5530, lng: 77.6685, temple: true },
  { id: 'iskcon',  name: 'ISKCON Vrindavan',         area: 'Raman Reti',       lat: 27.5705, lng: 77.6595, temple: true },
  { id: 'radha',   name: 'Radha Raman Temple',       area: 'Vrindavan',        lat: 27.5810, lng: 77.7010, temple: true },
  { id: 'nidhi',   name: 'Nidhivan',                 area: 'Vrindavan',        lat: 27.5840, lng: 77.7030, temple: true },
  { id: 'chatikara', name: 'Chhatikara Bus Stand',   area: 'Chhatikara',       lat: 27.5380, lng: 77.6450, temple: false },
  { id: 'mathura', name: 'Mathura Junction',         area: 'Mathura',          lat: 27.4880, lng: 77.6790, temple: false },
  { id: 'govind',  name: 'Govardhan Hill',           area: 'Govardhan',        lat: 27.4980, lng: 77.4640, temple: true },
];

// In-memory Food Ordering catalog + orders (Module 35) — a mini food app.
let _foodOrderSeq = 0;
const _foodOrders = [];
const _FOOD_CATEGORIES = [
  { code: 'breakfast', name: 'Breakfast',       icon: '🌅', image: 'https://picsum.photos/seed/food-breakfast/600/400' },
  { code: 'thali',     name: 'Lunch Thali',     icon: '🍛', image: 'https://picsum.photos/seed/food-thali/600/400' },
  { code: 'dinner',    name: 'Dinner',          icon: '🌙', image: 'https://picsum.photos/seed/food-dinner/600/400' },
  { code: 'south',     name: 'South Indian',    icon: '🥘', image: 'https://picsum.photos/seed/food-south/600/400' },
  { code: 'snacks',    name: 'Snacks & Chaat',  icon: '🥪', image: 'https://picsum.photos/seed/food-snacks/600/400' },
  { code: 'sweets',    name: 'Sweets & Prasad', icon: '🪔', image: 'https://picsum.photos/seed/food-sweets/600/400' },
  { code: 'beverages', name: 'Beverages',       icon: '☕', image: 'https://picsum.photos/seed/food-bev/600/400' },
];
const _FOOD_ITEMS = [
  // breakfast
  { id: 101, categoryCode: 'breakfast', name: 'Poha', description: 'Flattened rice with peanuts & curry leaves', price: 60,  veg: true, rating: 4.5, image: 'https://picsum.photos/seed/poha/400/300' },
  { id: 102, categoryCode: 'breakfast', name: 'Aloo Paratha (2)', description: 'Stuffed parathas with curd & pickle', price: 90,  veg: true, rating: 4.7, image: 'https://picsum.photos/seed/paratha/400/300' },
  { id: 103, categoryCode: 'breakfast', name: 'Chole Bhature', description: 'Spiced chickpeas with fried bhature', price: 110, veg: true, rating: 4.6, image: 'https://picsum.photos/seed/chole/400/300' },
  { id: 104, categoryCode: 'breakfast', name: 'Bread Butter Jam', description: 'Toasted bread, butter & mixed jam', price: 50,  veg: true, rating: 4.1, image: 'https://picsum.photos/seed/breadjam/400/300' },
  // thali
  { id: 201, categoryCode: 'thali', name: 'Satvik Veg Thali', description: '2 sabzi, dal, rice, 4 roti, salad, sweet', price: 160, veg: true, rating: 4.8, image: 'https://picsum.photos/seed/satvik/400/300' },
  { id: 202, categoryCode: 'thali', name: 'Jain Thali', description: 'No onion-garlic, dal, sabzi, roti, rice', price: 170, veg: true, rating: 4.7, image: 'https://picsum.photos/seed/jain/400/300' },
  { id: 203, categoryCode: 'thali', name: 'Deluxe Thali', description: 'Paneer, 2 sabzi, dal makhani, rice, naan', price: 220, veg: true, rating: 4.9, image: 'https://picsum.photos/seed/deluxe/400/300' },
  // dinner
  { id: 301, categoryCode: 'dinner', name: 'Paneer Butter Masala', description: 'Creamy paneer curry · serves 1', price: 180, veg: true, rating: 4.7, image: 'https://picsum.photos/seed/paneer/400/300' },
  { id: 302, categoryCode: 'dinner', name: 'Dal Makhani', description: 'Slow-cooked black dal · serves 1', price: 140, veg: true, rating: 4.6, image: 'https://picsum.photos/seed/dal/400/300' },
  { id: 303, categoryCode: 'dinner', name: 'Veg Biryani', description: 'Aromatic basmati with veggies & raita', price: 160, veg: true, rating: 4.5, image: 'https://picsum.photos/seed/biryani/400/300' },
  // south
  { id: 401, categoryCode: 'south', name: 'Masala Dosa', description: 'Crispy dosa with potato masala & chutney', price: 100, veg: true, rating: 4.7, image: 'https://picsum.photos/seed/dosa/400/300' },
  { id: 402, categoryCode: 'south', name: 'Idli Sambar (4)', description: 'Steamed idlis with sambar & chutney', price: 80,  veg: true, rating: 4.5, image: 'https://picsum.photos/seed/idli/400/300' },
  { id: 403, categoryCode: 'south', name: 'Uttapam', description: 'Onion-tomato uttapam with chutney', price: 90,  veg: true, rating: 4.4, image: 'https://picsum.photos/seed/uttapam/400/300' },
  // snacks
  { id: 501, categoryCode: 'snacks', name: 'Samosa (2)', description: 'Crispy potato samosas with chutney', price: 40,  veg: true, rating: 4.6, image: 'https://picsum.photos/seed/samosa/400/300' },
  { id: 502, categoryCode: 'snacks', name: 'Pani Puri', description: '6 puris with spiced water', price: 50,  veg: true, rating: 4.8, image: 'https://picsum.photos/seed/panipuri/400/300' },
  { id: 503, categoryCode: 'snacks', name: 'Aloo Tikki Chaat', description: 'Tikki with curd, chutney & sev', price: 70,  veg: true, rating: 4.5, image: 'https://picsum.photos/seed/tikki/400/300' },
  // sweets
  { id: 601, categoryCode: 'sweets', name: 'Peda (250g)', description: 'Mathura special milk peda', price: 120, veg: true, rating: 4.9, image: 'https://picsum.photos/seed/peda/400/300' },
  { id: 602, categoryCode: 'sweets', name: 'Gulab Jamun (4)', description: 'Warm syrup-soaked jamuns', price: 80,  veg: true, rating: 4.7, image: 'https://picsum.photos/seed/jamun/400/300' },
  { id: 603, categoryCode: 'sweets', name: 'Makhan Mishri Prasad', description: 'Bhog prasad · butter & mishri', price: 60,  veg: true, rating: 4.8, image: 'https://picsum.photos/seed/makhan/400/300' },
  // beverages
  { id: 701, categoryCode: 'beverages', name: 'Masala Chai', description: 'Cardamom-ginger tea', price: 25, veg: true, rating: 4.6, image: 'https://picsum.photos/seed/chai/400/300' },
  { id: 702, categoryCode: 'beverages', name: 'Thandai', description: 'Cooling almond-saffron drink', price: 70, veg: true, rating: 4.7, image: 'https://picsum.photos/seed/thandai/400/300' },
  { id: 703, categoryCode: 'beverages', name: 'Sweet Lassi', description: 'Thick curd lassi', price: 50, veg: true, rating: 4.5, image: 'https://picsum.photos/seed/lassi/400/300' },
];

// In-memory App Settings (Module 30).
const _settings = {
  language: 'en',
  notifications: { master: true, announcements: true, payments: true, services: true, reminders: true },
  privacy: { analytics: true, profileVisible: true, biometricLock: false },
};

// In-memory Community / Visitor / Amenity state (Modules 21-23).
let _visitorSeq = 0;
let _amenityBookingSeq = 0;
const _visitorPasses = [];
const _amenityBookings = [];
const _AMENITY_SLOTS = ['06:00-08:00', '08:00-10:00', '10:00-12:00', '16:00-18:00', '18:00-20:00'];
const _ANNOUNCEMENTS = [
  { id: 1, title: 'Water supply maintenance', body: 'Water supply off on Tower 2 between 10 AM – 1 PM this Saturday for tank cleaning.', category: 'maintenance', pinned: true, postedAt: '2026-06-05T09:00:00Z' },
  { id: 2, title: 'Janmashtami decoration drive', body: 'Volunteers needed to decorate the community hall. Register at the clubhouse desk.', category: 'event', pinned: false, postedAt: '2026-06-03T09:00:00Z' },
  { id: 3, title: 'Annual General Meeting', body: 'The society AGM is scheduled next month. Agenda & venue shared soon.', category: 'notice', pinned: false, postedAt: '2026-06-01T09:00:00Z' },
];
const _EVENTS = [
  { id: 1, title: 'Holi Celebration', description: 'Phoolon wali Holi with dhol & thandai', eventDate: '2027-03-13', location: 'Party Lawn' },
  { id: 2, title: 'Morning Yoga Camp', description: '7-day sunrise yoga camp', eventDate: '2026-09-21', location: 'Yoga Hall' },
  { id: 3, title: 'Kids Summer Workshop', description: 'Art, music & dance for children 5-14', eventDate: '2026-10-05', location: 'Community Hall' },
];
// Amenities are grouped by category. Each category holds multiple bookable
// facilities (unique global ids). The booking form adapts per category code.
const _AMENITY_CATEGORIES = [
  {
    code: 'HALL', name: 'Community Halls', icon: '🏛️',
    blurb: 'Banquet & event halls for functions and gatherings',
    facilities: [
      { id: 1, name: 'Grand Banquet Hall', icon: '🏛️', capacity: 150, deposit: 5000, hourlyRate: 2000, location: 'Clubhouse · Ground Floor', features: ['Air-conditioned', 'Stage', 'Valet parking'], description: 'Spacious AC banquet hall ideal for weddings, receptions and large functions.' },
      { id: 6, name: 'Celebration Hall', icon: '🎉', capacity: 80, deposit: 3000, hourlyRate: 1200, location: 'Tower B · Podium Level', features: ['Air-conditioned', 'Pantry'], description: 'Mid-size hall for birthdays, kitty parties and small gatherings.' },
    ],
  },
  {
    code: 'YOGA', name: 'Yoga & Fitness', icon: '🧘',
    blurb: 'Yoga studios and fitness rooms',
    facilities: [
      { id: 2, name: 'Sunrise Yoga Studio', icon: '🧘', capacity: 30, deposit: 0, hourlyRate: 0, location: 'Clubhouse · 1st Floor', features: ['Mats provided', 'Mirror wall', 'Air-conditioned'], description: 'Calm wooden-floor studio for yoga, meditation and aerobics.' },
      { id: 7, name: 'Power Gym Studio', icon: '🏋️', capacity: 15, deposit: 0, hourlyRate: 0, location: 'Clubhouse · Basement', features: ['Strength equipment', 'Cardio', 'Air-conditioned'], description: 'Fully-equipped strength & cardio studio for private sessions.' },
    ],
  },
  {
    code: 'POOL', name: 'Swimming Pools', icon: '🏊',
    blurb: 'Pools and aqua facilities',
    facilities: [
      { id: 3, name: 'Olympic Pool', icon: '🏊', capacity: 40, deposit: 0, hourlyRate: 0, location: 'Clubhouse · Rear', features: ['6 lanes', 'Heated', 'Lifeguard on duty'], description: '6-lane heated pool with a certified lifeguard on duty.' },
      { id: 8, name: 'Kids Splash Pool', icon: '🐬', capacity: 20, deposit: 0, hourlyRate: 0, location: 'Clubhouse · Rear', features: ['Shallow', 'Lifeguard on duty'], description: 'Shallow pool reserved for children and learners.' },
    ],
  },
  {
    code: 'TENNIS', name: 'Sports Courts', icon: '🎾',
    blurb: 'Tennis, badminton and indoor courts',
    facilities: [
      { id: 4, name: 'Tennis Court A', icon: '🎾', capacity: 4, deposit: 0, hourlyRate: 0, location: 'Sports Block · Outdoor', features: ['Synthetic hard court', 'Floodlights'], description: 'Synthetic hard court with floodlights for evening play.' },
      { id: 9, name: 'Badminton Court', icon: '🏸', capacity: 4, deposit: 0, hourlyRate: 0, location: 'Indoor Sports Block', features: ['Wooden floor', 'Air-conditioned'], description: 'Indoor wooden-floor badminton court.' },
    ],
  },
  {
    code: 'LAWN', name: 'Party Lawns', icon: '🌳',
    blurb: 'Open lawns for large outdoor events',
    facilities: [
      { id: 5, name: 'Central Party Lawn', icon: '🌳', capacity: 200, deposit: 8000, hourlyRate: 2500, location: 'Central Garden', features: ['Open air', 'Power points', 'Parking'], description: 'Landscaped open lawn for grand functions, sangeet and festivals.' },
      { id: 10, name: 'Riverside Lawn', icon: '🏞️', capacity: 120, deposit: 5000, hourlyRate: 1800, location: 'East Garden', features: ['Open air', 'Gazebo'], description: 'Scenic lawn with a gazebo for intimate outdoor events.' },
    ],
  },
];
// Flat lookup of every bookable facility, tagged with its category.
const _FACILITIES = _AMENITY_CATEGORIES.flatMap(c =>
  c.facilities.map(f => ({ ...f, categoryCode: c.code, categoryName: c.name })),
);
const _AMENITY_BLACKOUTS = { 1: ['2026-08-15'] }; // Grand Banquet Hall maintenance

// In-memory Spiritual / Temple state (Modules 18-20).
let _darshanSeq = 0;
const _darshanBookings = [];
const _TEMPLES = [
  { id: 1, name: 'Banke Bihari Temple', city: 'Vrindavan', rating: 4.9, crowdStatus: 'very_high', distanceKm: 2.5, imageUrl: 'https://picsum.photos/seed/banke/800/450', aartiTimes: 'Shringar 9:00 AM, Rajbhog 12:00 PM, Shayan 9:00 PM', mapsUrl: 'https://maps.google.com/?q=Banke+Bihari+Temple+Vrindavan', donationUrl: 'https://example.invalid/donate/banke', vipAvailable: true, description: 'The most revered temple of Vrindavan, dedicated to Banke Bihari.' },
  { id: 2, name: 'Prem Mandir', city: 'Vrindavan', rating: 4.8, crowdStatus: 'moderate', distanceKm: 4.0, imageUrl: 'https://picsum.photos/seed/prem/800/450', aartiTimes: 'Darshan 8:30 AM – 12 PM, 4:30 – 8:30 PM', mapsUrl: 'https://maps.google.com/?q=Prem+Mandir+Vrindavan', donationUrl: 'https://example.invalid/donate/prem', vipAvailable: true, description: 'A stunning marble temple with evening light & fountain shows.' },
  { id: 3, name: 'ISKCON Vrindavan', city: 'Vrindavan', rating: 4.7, crowdStatus: 'high', distanceKm: 5.5, imageUrl: 'https://picsum.photos/seed/iskcon/800/450', aartiTimes: 'Mangala 4:30 AM, Shringar 7:15 AM, Sandhya 6:30 PM', mapsUrl: 'https://maps.google.com/?q=ISKCON+Vrindavan', donationUrl: 'https://example.invalid/donate/iskcon', vipAvailable: true, description: 'Krishna-Balaram Mandir, known for kirtans and the Govardhan feast.' },
  { id: 4, name: 'Radha Raman Temple', city: 'Vrindavan', rating: 4.8, crowdStatus: 'moderate', distanceKm: 3.0, imageUrl: 'https://picsum.photos/seed/radharaman/800/450', aartiTimes: 'Mangala 5:00 AM, Shringar 8:00 AM, Shayan 8:00 PM', mapsUrl: 'https://maps.google.com/?q=Radha+Raman+Temple+Vrindavan', donationUrl: 'https://example.invalid/donate/radharaman', vipAvailable: false, description: 'One of the seven Goswami temples, with a self-manifested deity.' },
  { id: 5, name: 'Nidhivan', city: 'Vrindavan', rating: 4.6, crowdStatus: 'low', distanceKm: 2.8, imageUrl: 'https://picsum.photos/seed/nidhivan/800/450', aartiTimes: 'Open 6:00 AM – 8:00 PM', mapsUrl: 'https://maps.google.com/?q=Nidhivan+Vrindavan', donationUrl: 'https://example.invalid/donate/nidhivan', vipAvailable: false, description: 'The sacred grove where Krishna is believed to perform raas leela nightly.' },
];
const _FESTIVALS = [
  { id: 1, name: 'Janmashtami', festivalDate: '2026-09-04', significance: 'Birth of Lord Krishna — midnight celebrations & extended darshan' },
  { id: 2, name: 'Radhashtami', festivalDate: '2026-09-19', significance: 'Birth of Radha Rani — special shringar at all temples' },
  { id: 3, name: 'Sharad Purnima', festivalDate: '2026-10-25', significance: 'Raas Purnima — moonlight raas leela celebrations' },
  { id: 4, name: 'Govardhan Puja', festivalDate: '2026-11-09', significance: 'Annakut feast at ISKCON & Govardhan parikrama' },
  { id: 5, name: 'Holi (Phoolon wali)', festivalDate: '2027-03-13', significance: 'Famous flower & gulal Holi at Banke Bihari' },
];

// In-memory Wellness state (Module 17).
let _wellnessSeq = 0;
const _wellnessBookings = [];
const _WELLNESS_SLOTS = ['06:30', '08:00', '10:00', '12:00', '16:00', '18:00'];
const _THERAPIES = [
  { id: 1, code: 'ABH', name: 'Abhyanga',    icon: '💆', description: 'Full-body warm herbal oil massage', price: 1200, isPackage: false, packageDays: null },
  { id: 2, code: 'SHI', name: 'Shirodhara',  icon: '🪔', description: 'Continuous oil stream on forehead', price: 1500, isPackage: false, packageDays: null },
  { id: 3, code: 'PAN', name: 'Panchakarma', icon: '🌿', description: '7-day Ayurvedic detox',             price: 8000, isPackage: true,  packageDays: 7 },
  { id: 4, code: 'YOG', name: 'Yoga',        icon: '🧘', description: 'Guided yoga session',               price: 500,  isPackage: false, packageDays: null },
  { id: 5, code: 'MED', name: 'Meditation',  icon: '🕉️', description: 'Mindfulness & breathing',           price: 400,  isPackage: false, packageDays: null },
];

// In-memory Mobility state (Module 16).
let _mobBookingSeq = 0;
const _mobBookings = [];
const _MOB_ATTENDANT_FEE = 300;
const _MOBILITY_AIDS = [
  { id: 1, code: 'WC-M', name: 'Manual Wheelchair',      category: 'wheelchair', description: 'Foldable, lightweight',      rentPerDay: 150, buyPrice: 6500,  attendantAvailable: true },
  { id: 2, code: 'WC-E', name: 'Electric Wheelchair',    category: 'wheelchair', description: 'Battery powered, joystick',  rentPerDay: 400, buyPrice: 35000, attendantAvailable: true },
  { id: 3, code: 'SCO',  name: 'Mobility Scooter',        category: 'scooter',    description: '4-wheel, long range',       rentPerDay: 500, buyPrice: 45000, attendantAvailable: false },
  { id: 4, code: 'WLK',  name: 'Foldable Walker',         category: 'walker',     description: 'Height adjustable',         rentPerDay: 50,  buyPrice: 1800,  attendantAvailable: false },
  { id: 5, code: 'STK',  name: 'Adjustable Walking Stick', category: 'support',   description: 'Anti-slip base',            rentPerDay: 20,  buyPrice: 600,   attendantAvailable: false },
  { id: 6, code: 'COM',  name: 'Commode Chair',           category: 'support',    description: 'With armrests',             rentPerDay: 60,  buyPrice: 2200,  attendantAvailable: false },
  { id: 7, code: 'BED',  name: 'Hospital Bed (Manual)',   category: 'bed',        description: 'Adjustable, side rails',    rentPerDay: 300, buyPrice: 22000, attendantAvailable: true },
];

function _mobTotal(aid, mode, days, withAttendant) {
  if (!aid) return 0;
  if (mode === 'buy') return Number(aid.buyPrice) || 0;
  const d = Math.max(1, Number(days) || 1);
  return (Number(aid.rentPerDay) || 0) * d + (withAttendant ? _MOB_ATTENDANT_FEE * d : 0);
}

// In-memory Healthcare state (Module 15).
let _apptSeq = 0;
const _appointments = [];
const _HC_DAY_SLOTS = ['10:00', '11:00', '12:00', '17:00', '18:00', '19:00'];
const _DOCTORS = [
  { id: 1, name: 'Dr. Anjali Mehra', specialty: 'General Physician', experienceYears: 12, fee: 600,  languages: 'Hindi, English',            rating: 4.8, phone: '9830010001' },
  { id: 2, name: 'Dr. Rakesh Gupta', specialty: 'Cardiologist',      experienceYears: 18, fee: 1200, languages: 'Hindi, English',            rating: 4.9, phone: '9830010002' },
  { id: 3, name: 'Dr. Sunita Rao',   specialty: 'Orthopedic',        experienceYears: 15, fee: 1000, languages: 'Hindi, English, Marathi',   rating: 4.7, phone: '9830010003' },
  { id: 4, name: 'Dr. Imran Khan',   specialty: 'Diabetologist',     experienceYears: 10, fee: 900,  languages: 'Hindi, English, Urdu',      rating: 4.6, phone: '9830010004' },
  { id: 5, name: 'Dr. Priya Nair',   specialty: 'Pediatrician',      experienceYears: 14, fee: 800,  languages: 'Hindi, English, Malayalam', rating: 4.8, phone: '9830010005' },
  { id: 6, name: 'Dr. Vikram Joshi', specialty: 'Physiotherapist',   experienceYears: 9,  fee: 700,  languages: 'Hindi, English',            rating: 4.5, phone: '9830010006' },
];

// In-memory Emergency SOS state (Module 14).
let _sosSeq = 0;
const _sos = { contacts: [], bloodGroup: null, medicalNotes: null, lastRequest: null };

// In-memory Meal Ordering state (Module 13).
let _mealOrderSeq = 0;
let _mealSubSeq = 0;
const _mealOrders = [];
const _mealSubs = [];
const _MEAL_MENU = [
  { id: 1, mealType: 'breakfast', name: 'Poha & Chai',             dietType: 'satvik',      price: 60 },
  { id: 2, mealType: 'breakfast', name: 'Aloo Paratha (2) + Curd', dietType: 'regular_veg', price: 80 },
  { id: 3, mealType: 'breakfast', name: 'Sabudana Khichdi',        dietType: 'jain',        price: 70 },
  { id: 4, mealType: 'lunch',     name: 'Satvik Thali',            dietType: 'satvik',      price: 150 },
  { id: 5, mealType: 'lunch',     name: 'Regular Veg Thali',       dietType: 'regular_veg', price: 140 },
  { id: 6, mealType: 'lunch',     name: 'Jain Thali',              dietType: 'jain',        price: 160 },
  { id: 7, mealType: 'dinner',    name: 'Khichdi & Kadhi',         dietType: 'satvik',      price: 120 },
  { id: 8, mealType: 'dinner',    name: 'Roti-Sabzi-Dal',          dietType: 'regular_veg', price: 130 },
  { id: 9, mealType: 'prasadam',  name: 'Panchamrit & Prasad Box', dietType: 'satvik',      price: 100 },
];

export const mockApi = {
  async sendOtp(mobile) {
    await wait(800);
    return { success: true, message: `OTP sent to +91 ${mobile}` };
  },

  async verifyOtp(mobile, otp) {
    await wait(700);
    if (otp !== '123456') {
      const err = new Error('Invalid OTP');
      err.response = { status: 400, data: { message: 'Invalid OTP. Please try again.' } };
      throw err;
    }
    return {
      token: 'mock-jwt-token-' + Date.now(),
      user: {
        id: 'U-1001',
        name: 'Piyush Sharma',
        mobile,
        email: 'piyushb88@gmail.com',
        bookingId: 'BK-2024-00421',
      },
    };
  },

  async getBookingDetails(bookingId) {
    await wait(500);
    return {
      bookingId,
      unitNumber: 'T2-B-1204',
      projectName: 'Vrindavan Heights',
      tower: 'Tower 2',
      floor: '12th Floor',
      area: 1450,
      bookingDate: '2024-03-15',
      agreementValue: 12500000,
      allotteeNames: 'Piyush Sharma + Anita Sharma',
      status: 'Active',
      rmName: 'Kunal Naskar',
      rmPhone: '9876543210',
      rmEmail: 'kunal@yamunainfra.com',
    };
  },

  async getDocuments(bookingId) {
    await wait(500);
    return [
      { id: 1, name: 'Booking Docket.pdf',     category: 'agreement', date: '2024-03-15', size: '1.2 MB', requiresSignature: 0, signedAt: null, status: 'available' },
      { id: 2, name: 'Allotment Letter.pdf',   category: 'agreement', date: '2024-03-18', size: '780 KB', requiresSignature: 0, signedAt: null, status: 'available' },
      { id: 3, name: 'Sale Agreement.pdf',     category: 'agreement', date: '2024-04-02', size: '2.4 MB', requiresSignature: 1, signedAt: null, status: 'pending_signature' },
      { id: 4, name: 'Receipt-1245.pdf',       category: 'receipt',   date: '2024-04-15', size: '320 KB', requiresSignature: 0, signedAt: null, status: 'available' },
      { id: 5, name: 'NOC.pdf',                category: 'noc',       date: '2024-05-10', size: '410 KB', requiresSignature: 0, signedAt: null, status: 'available' },
      { id: 6, name: 'Tax Invoice FY24-25.pdf', category: 'tax',      date: '2024-12-15', size: '290 KB', requiresSignature: 0, signedAt: null, status: 'available' },
    ];
  },

  async getDocument(bookingId, docId) {
    await wait(300);
    const all = await this.getDocuments(bookingId);
    return all.find(d => String(d.id) === String(docId)) || null;
  },

  async getWelcomeKit(bookingId) {
    await wait(500);
    return {
      project: { id: 1, name: 'Vrindavan Heights' },
      items: [
        { id: 1, kind: 'image', title: 'Project Skyline',    caption: 'Twin towers as on 2026',     url: 'https://picsum.photos/seed/yh1/800/500', sortOrder: 1 },
        { id: 2, kind: 'image', title: 'Clubhouse',          caption: 'Premium amenities',          url: 'https://picsum.photos/seed/yh2/800/500', sortOrder: 2 },
        { id: 3, kind: 'image', title: 'Sample Apartment',   caption: '3-BHK ready-to-move sample', url: 'https://picsum.photos/seed/yh3/800/500', sortOrder: 3 },
        { id: 4, kind: 'image', title: 'Wellness Centre',    caption: 'Ayurvedic & Yoga centre',    url: 'https://picsum.photos/seed/yh4/800/500', sortOrder: 4 },
        { id: 5, kind: 'pdf',   title: 'Welcome Kit Brochure', caption: 'Complete project brochure', url: '/files/welcome-kit/welcome.pdf',         sortOrder: 5 },
        { id: 6, kind: 'message', title: 'Welcome Home!',    caption: 'A note from the chairperson',
          url: "Your dream home is shaping up beautifully. We can't wait to hand you the keys.", sortOrder: 6 },
      ],
    };
  },

  async getPaymentSchedule(bookingId) {
    await wait(500);
    return {
      nextDue: { id: 4, label: 'Slab Casting', amount: '1250000.00', lateFee: '0.00', dueDate: '2026-06-25', status: 'due' },
      installments: [
        { id: 1, label: 'Booking Amount', amount: '1000000.00', lateFee: '0.00', dueDate: '2024-03-15', status: 'paid' },
        { id: 2, label: 'Foundation',     amount: '1500000.00', lateFee: '0.00', dueDate: '2024-08-15', status: 'paid' },
        { id: 3, label: 'Plinth',         amount: '1500000.00', lateFee: '0.00', dueDate: '2025-12-15', status: 'paid' },
        { id: 4, label: 'Slab Casting',   amount: '1250000.00', lateFee: '0.00', dueDate: '2026-06-25', status: 'due' },
        { id: 5, label: 'Brickwork',      amount: '1250000.00', lateFee: '0.00', dueDate: '2026-09-25', status: 'upcoming' },
        { id: 6, label: 'Plastering',     amount: '1250000.00', lateFee: '0.00', dueDate: '2026-12-25', status: 'upcoming' },
        { id: 7, label: 'Finishing',      amount: '2000000.00', lateFee: '0.00', dueDate: '2027-03-25', status: 'upcoming' },
        { id: 8, label: 'Possession',     amount: '2750000.00', lateFee: '0.00', dueDate: '2027-06-25', status: 'upcoming' },
      ],
      outstanding: 8500000,
      pendingCount: 5,
    };
  },

  async getPaymentHistory(bookingId) {
    await wait(500);
    return [
      { id: 1, txnId: 'TXN-DEMO-001', amount: '1000000.00', date: '2024-03-15 10:30:00', method: 'NetBanking', status: 'success', remarks: 'Initial booking amount', installmentLabel: 'Booking Amount' },
      { id: 2, txnId: 'TXN-DEMO-002', amount: '1500000.00', date: '2024-08-15 11:15:00', method: 'UPI',        status: 'success', remarks: 'Foundation slab',       installmentLabel: 'Foundation' },
      { id: 3, txnId: 'TXN-DEMO-003', amount: '1500000.00', date: '2025-12-15 09:45:00', method: 'NetBanking', status: 'success', remarks: 'Plinth completion',     installmentLabel: 'Plinth' },
    ];
  },

  async getLedger(bookingId) {
    await wait(500);
    return {
      booking: { bookingId, unitNumber: 'T2-B-1204', projectName: 'Vrindavan Heights', allotteeNames: 'Piyush Sharma + Anita Sharma' },
      summary: { totalAgreementValue: 12500000, totalPaid: 4000000, outstanding: 8500000, progressPct: 32 },
      installments: (await this.getPaymentSchedule(bookingId)).installments,
      payments: await this.getPaymentHistory(bookingId),
    };
  },

  async initiatePayment(payload) {
    await wait(900);
    return {
      orderId: 'MOCK-' + Date.now(),
      paymentLink: 'https://example.invalid/checkout',
      paymentSessionId: 'mock-session',
      amount: payload.amount,
      currency: 'INR',
      environment: 'sandbox',
    };
  },

  async getProjectProgress(projectId) {
    await wait(400);
    const milestones = [
      { id: 1, name: 'Foundation Completion', status: 'completed',   weight: 20, expectedDate: '2024-09-30', completedAt: '2024-09-15 17:00:00', coverPhotoUrl: 'https://picsum.photos/seed/yh-found/800/500', description: 'Excavation, retaining walls and footing completed.',  notificationsEnabled: false, notificationChannels: ['push'] },
      { id: 2, name: 'Structure Completion',  status: 'completed',   weight: 25, expectedDate: '2026-01-30', completedAt: '2026-01-22 16:30:00', coverPhotoUrl: 'https://picsum.photos/seed/yh-struct/800/500', description: 'All 14 floors of structural concrete cast.',         notificationsEnabled: false, notificationChannels: ['push'] },
      { id: 3, name: 'Internal Finishing',    status: 'in_progress', weight: 25, expectedDate: '2026-12-31', completedAt: null,                  coverPhotoUrl: 'https://picsum.photos/seed/yh-fin/800/500',   description: 'Plastering, electricals and plumbing in progress.',   notificationsEnabled: true,  notificationChannels: ['push', 'whatsapp'] },
      { id: 4, name: 'Landscaping',           status: 'pending',     weight: 15, expectedDate: '2027-03-31', completedAt: null,                  coverPhotoUrl: null,                                          description: 'Garden, paths, water bodies and external lighting.',   notificationsEnabled: false, notificationChannels: ['push'] },
      { id: 5, name: 'Possession Readiness',  status: 'pending',     weight: 15, expectedDate: '2027-06-30', completedAt: null,                  coverPhotoUrl: null,                                          description: 'Final inspection, OC and key handover.',               notificationsEnabled: false, notificationChannels: ['push'] },
    ];
    return {
      project: { id: 1, code: 'VH', name: 'Vrindavan Heights' },
      progressPct: 57,
      currentMilestone: milestones[2],
      milestones,
      counts: { completed: 2, in_progress: 1, pending: 2, total: 5 },
    };
  },

  async getProjectUpdates(projectId, limit = 20) {
    await wait(350);
    const all = [
      { id: 1, title: 'Week 22 — Plastering on floors 6–8', description: 'Internal plaster coats progressing.', mediaUrl: 'https://picsum.photos/seed/u22/800/500',  mediaType: 'image', postedAt: '2026-05-31 11:00:00' },
      { id: 2, title: 'Week 21 — Drone tour',               description: 'Latest aerial footage.',              mediaUrl: 'https://picsum.photos/seed/u21d/800/500', mediaType: 'video', postedAt: '2026-05-24 10:00:00' },
      { id: 3, title: 'Week 20 — Tile work begins',         description: 'Sample apartment tiling started.',    mediaUrl: 'https://picsum.photos/seed/u20/800/500',  mediaType: 'image', postedAt: '2026-05-17 10:00:00' },
      { id: 4, title: 'Week 19 — Lift shaft cores done',    description: 'All vertical cores cast.',            mediaUrl: 'https://picsum.photos/seed/u19/800/500',  mediaType: 'image', postedAt: '2026-05-10 10:00:00' },
      { id: 5, title: 'Week 18 — Landscape ducts',          description: 'Civil ducts laid.',                   mediaUrl: 'https://picsum.photos/seed/u18/800/500',  mediaType: 'image', postedAt: '2026-05-03 10:00:00' },
      { id: 6, title: 'Week 17 — Internal partitions',      description: 'Drywall started in sample units.',    mediaUrl: 'https://picsum.photos/seed/u17/800/500',  mediaType: 'image', postedAt: '2026-04-26 10:00:00' },
      { id: 7, title: 'Week 16 — Drone tour',               description: 'Aerial view from 200 ft.',            mediaUrl: 'https://picsum.photos/seed/u16d/800/500', mediaType: 'video', postedAt: '2026-04-19 10:00:00' },
      { id: 8, title: 'Week 15 — Structure topped out!',    description: 'Twin towers reach full height.',      mediaUrl: 'https://picsum.photos/seed/u15/800/500',  mediaType: 'image', postedAt: '2026-04-12 10:00:00' },
    ];
    return all.slice(0, limit);
  },

  async getMilestone(projectId, milestoneId) {
    await wait(300);
    const photos = {
      1: [
        { id: 1, url: 'https://picsum.photos/seed/yh-found-1/800/500', caption: 'Plinth ready',          takenAt: '2024-09-10', sortOrder: 1 },
        { id: 2, url: 'https://picsum.photos/seed/yh-found-2/800/500', caption: 'Excavation done',      takenAt: '2024-08-25', sortOrder: 2 },
        { id: 3, url: 'https://picsum.photos/seed/yh-found-3/800/500', caption: 'Footing reinforcement', takenAt: '2024-09-01', sortOrder: 3 },
      ],
      2: [
        { id: 4, url: 'https://picsum.photos/seed/yh-struct-1/800/500', caption: '14th floor casting',  takenAt: '2026-01-15', sortOrder: 1 },
        { id: 5, url: 'https://picsum.photos/seed/yh-struct-2/800/500', caption: 'Slab work',           takenAt: '2025-08-12', sortOrder: 2 },
        { id: 6, url: 'https://picsum.photos/seed/yh-struct-3/800/500', caption: 'Beam reinforcement',  takenAt: '2025-11-20', sortOrder: 3 },
      ],
      3: [
        { id: 7, url: 'https://picsum.photos/seed/yh-fin-1/800/500',   caption: 'Plastering on floor 8', takenAt: '2026-05-10', sortOrder: 1 },
        { id: 8, url: 'https://picsum.photos/seed/yh-fin-2/800/500',   caption: 'Electrical conduits',   takenAt: '2026-05-25', sortOrder: 2 },
      ],
    };
    const p = await this.getProjectProgress(projectId);
    const m = p.milestones.find(x => String(x.id) === String(milestoneId));
    if (!m) return null;
    return { ...m, photos: photos[milestoneId] || [] };
  },

  async getSiteVisitSlots(projectId, date) {
    await wait(250);
    const d = new Date(date + 'T00:00:00Z');
    if (d.getUTCDay() === 0) {
      return { date, blackedOut: false, blocked: true, reason: 'Sundays are closed for site visits', slots: [] };
    }
    const blackouts = ['2026-08-15', '2026-10-02', '2026-11-08', '2026-12-25', '2027-01-26', '2027-03-25'];
    if (blackouts.includes(date)) {
      return { date, blackedOut: true, reason: 'Public holiday', slots: [] };
    }
    return {
      date,
      blackedOut: false,
      slots: [
        { slotId: 1, slotTime: '10:00:00', capacity: 8, booked: 2, available: 6, isFull: false },
        { slotId: 2, slotTime: '11:00:00', capacity: 8, booked: 5, available: 3, isFull: false },
        { slotId: 3, slotTime: '14:00:00', capacity: 8, booked: 8, available: 0, isFull: true },
        { slotId: 4, slotTime: '16:00:00', capacity: 8, booked: 1, available: 7, isFull: false },
      ],
    };
  },

  async getVirtualTours(projectId) {
    await wait(200);
    return [
      { id: 1, kind: 'matterport',  label: '360° Virtual Tour',     url: 'https://my.matterport.com/show/?m=demo-vrindavan', sortOrder: 1 },
      { id: 2, kind: '360_video',   label: 'Drone Walkthrough',     url: 'https://example.invalid/drone-walkthrough.mp4',    sortOrder: 2 },
      { id: 3, kind: 'video_call',  label: 'Live Sales Call',       url: 'https://meet.jit.si/YamunaInfra-SalesDesk',        sortOrder: 3 },
      { id: 4, kind: 'maps',        label: 'Open in Google Maps',   url: 'https://maps.google.com/?q=27.5803,77.7000',       sortOrder: 4 },
      { id: 5, kind: 'brochure',    label: 'Project Brochure',      url: '/files/welcome-kit/welcome.pdf',                   sortOrder: 5 },
    ];
  },

  async getMySiteVisits(status) {
    await wait(200);
    const all = [
      { id: 101, projectName: 'Vrindavan Heights', visitDate: '2026-06-25', visitTime: '11:00:00', visitType: 'family',   visitorCount: 4, status: 'booked',      confirmationCode: 'SV-2026-10101' },
      { id: 100, projectName: 'Vrindavan Heights', visitDate: '2026-04-12', visitTime: '10:00:00', visitType: 'personal', visitorCount: 2, status: 'completed',   confirmationCode: 'SV-2026-10100' },
    ];
    return status ? all.filter(v => v.status === status) : all;
  },

  // ---- Module 6: Customer Support ----
  async getSupportTickets(status) {
    await wait(220);
    const list = _supportTickets
      .map(t => ({
        id: t.id, ticketCode: t.ticketCode, category: t.category, subject: t.subject,
        priority: t.priority, status: t.status, assignedAgent: t.assignedAgent, rating: t.rating,
        createdAt: t.createdAt, lastMessageAt: t.lastMessageAt,
        lastMessage: t.messages[t.messages.length - 1]?.body || '',
      }))
      .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
    return status ? list.filter(t => t.status === status) : list;
  },

  async getSupportTicket(ticketId) {
    await wait(200);
    const t = _supportTickets.find(x => x.id === Number(ticketId));
    if (!t) return null;
    return { ...t, messages: [...t.messages], attachments: [...t.attachments] };
  },

  async createSupportTicket(payload) {
    await wait(450);
    const id = _ticketSeq++;
    const ticketCode = `SR-2026-${String(10000 + id).slice(-5)}`;
    const now = new Date().toISOString();
    _supportTickets.unshift({
      id, ticketCode,
      category: payload.category, subject: payload.subject, description: payload.description,
      priority: payload.priority || 'normal', status: 'open',
      assignedAgent: AGENT_BY_CATEGORY[payload.category] || AGENT_BY_CATEGORY.general,
      rating: null, createdAt: now, lastMessageAt: now,
      messages: [{ id: 1, author: 'user', body: payload.description, createdAt: now }],
      attachments: (payload.attachments || []).slice(0, 3),
    });
    return { id, ticketCode };
  },

  async replySupportTicket(ticketId, body) {
    await wait(250);
    const t = _supportTickets.find(x => x.id === Number(ticketId));
    const now = new Date().toISOString();
    const msg = { id: (t?.messages.length || 0) + 1, author: 'user', body, createdAt: now };
    if (t) {
      t.messages.push(msg);
      t.lastMessageAt = now;
      if (['open', 'resolved', 'closed'].includes(t.status)) t.status = 'in_progress';
    }
    return msg;
  },

  async rateSupportTicket(ticketId, rating) {
    await wait(150);
    const t = _supportTickets.find(x => x.id === Number(ticketId));
    if (t) t.rating = rating;
    return { id: Number(ticketId), rating };
  },

  async bookSupportAppointment(payload) {
    await wait(300);
    const agentName = AGENT_BY_CATEGORY[payload.category] || AGENT_BY_CATEGORY.general;
    return { id: Math.floor(Math.random() * 1000), agentName, scheduledAt: payload.scheduledAt, mode: payload.mode || 'call' };
  },

  // ---- Module 7: Digital Possession Dashboard ----
  async getPossessionStatus() {
    await wait(250);
    const status = _derivePossessionStatus();
    const done = _possession.checklist.filter(c => c.completed).length;
    return {
      status,
      statusLabel: _POSSESSION_STATUS_LABEL[status],
      progressPct: Math.round((done / _possession.checklist.length) * 100),
      checklist: _possession.checklist.map(c => ({ ...c })),
      documents: _possession.documents.map(d => ({ ...d })),
      appointment: _possession.appointment ? { ..._possession.appointment } : null,
    };
  },

  async bookPossessionAppointment(payload) {
    await wait(350);
    _possession.appointment = {
      id: Math.floor(Math.random() * 1000),
      appointmentDate: payload.appointmentDate,
      timeSlot: payload.timeSlot,
      attendees: payload.attendees,
      specialRequest: payload.specialRequest || null,
      status: 'scheduled',
    };
    return { ..._possession.appointment };
  },

  // ---- Module 8: Home Inspection & Snag Management ----
  async getSnags(status) {
    await wait(220);
    const list = _snags
      .map(s => ({ ...s, photos: [...s.photos] }))
      .sort((a, b) => (_SEVERITY_RANK[a.severity] - _SEVERITY_RANK[b.severity])
        || (new Date(b.createdAt) - new Date(a.createdAt)));
    return status ? list.filter(s => s.status === status) : list;
  },

  async reportSnag(payload) {
    await wait(400);
    const id = ++_snagSeq;
    const snagCode = `SN-${String(id).padStart(4, '0')}`;
    _snags.unshift({
      id, snagCode,
      location: payload.location, defectType: payload.defectType,
      description: payload.description, severity: payload.severity,
      status: 'open', createdAt: new Date().toISOString(),
      photos: (payload.photos || []).slice(0, 5),
    });
    return { id, snagCode };
  },

  async signoffSnag(snagId) {
    await wait(200);
    const s = _snags.find(x => x.id === Number(snagId));
    if (s && s.status === 'resolved') {
      s.status = 'signed_off';
      s.signedOffAt = new Date().toISOString();
    }
    return { id: Number(snagId), status: 'signed_off' };
  },

  // ---- Module 9: Move-In Assistance ----
  async getShiftingBookings() {
    await wait(200);
    return _shifting.map(s => ({ ...s, itemCategories: [...s.itemCategories] }));
  },

  async bookShifting(payload) {
    await wait(400);
    if (_MOVEIN_VENDOR_BLACKOUTS.includes(payload.moveDate)) {
      const err = new Error('No vendors available');
      err.response = { status: 409, data: { message: 'No vendors available on the selected date. Please try another date.' } };
      throw err;
    }
    const id = ++_shiftingSeq;
    const vendorName = 'PackMasters Logistics';
    _shifting.unshift({
      id, moveDate: payload.moveDate, fromAddress: payload.fromAddress, toUnit: payload.toUnit,
      itemCategories: payload.itemCategories || [], packingRequired: !!payload.packingRequired,
      specialItems: payload.specialItems || null, vendorName, status: 'confirmed',
      createdAt: new Date().toISOString(),
    });
    return { id, vendorName, moveDate: payload.moveDate };
  },

  async getUtilityRequests() {
    await wait(180);
    return _utilities.map(u => ({ ...u }));
  },

  async requestUtility(payload) {
    await wait(300);
    const id = ++_utilitySeq;
    const providerName = _UTILITY_PROVIDER[payload.utilityType] || null;
    const expectedActivation = _addDaysIso(null, 7);
    _utilities.unshift({
      id, utilityType: payload.utilityType, providerName, expectedActivation,
      status: 'submitted', createdAt: new Date().toISOString(),
    });
    return { id, utilityType: payload.utilityType, providerName, expectedActivation, status: 'submitted' };
  },

  async getInteriorPartners() {
    await wait(180);
    return _INTERIOR_PARTNERS.map(p => ({ ...p }));
  },

  async requestInteriorReferral(payload) {
    await wait(250);
    const p = _INTERIOR_PARTNERS.find(x => x.id === Number(payload.partnerId));
    return { id: Math.floor(Math.random() * 1000), partnerId: payload.partnerId, partnerName: p?.name, partnerPhone: p?.phone };
  },

  // ---- Module 10: Home Services (Cleaning) ----
  async getServiceCategories() {
    await wait(150);
    return _SERVICE_CATEGORIES.map(c => ({ ...c }));
  },

  async getServiceProviders(category, genderPref) {
    await wait(220);
    let list = _SERVICE_PROVIDERS.filter(p => !category || p.categoryCode === category);
    if (genderPref && genderPref !== 'any') list = list.filter(p => p.gender === genderPref || p.gender === 'any');
    return list
      .map(p => ({ ...p, offerings: _offeringsFor(p) }))
      .sort((a, b) => b.rating - a.rating);
  },

  async bookService(payload) {
    await wait(380);
    const id = ++_serviceBookingSeq;
    const provider = _SERVICE_PROVIDERS.find(p => p.id === Number(payload.providerId));
    const cat = _SERVICE_CATEGORIES.find(c => c.code === payload.category);
    _serviceBookings.unshift({
      id, categoryCode: payload.category, categoryName: cat?.name || payload.category,
      startDate: payload.startDate, frequency: payload.frequency, preferredTime: payload.preferredTime,
      meals: payload.meals || [], dietType: payload.dietType || null, persons: payload.persons || null,
      specialNotes: payload.specialNotes || null, genderPref: payload.genderPref || 'any',
      status: 'booked', createdAt: new Date().toISOString(),
      providerName: provider?.name || null, providerPhone: provider?.phone || null,
      offeringName: payload.offeringName || null, amount: payload.amount || null,
    });
    return { id, category: payload.category, startDate: payload.startDate, amount: payload.amount || provider?.priceFrom || 0 };
  },

  async getServiceBookings(category) {
    await wait(180);
    const list = _serviceBookings.map(b => ({ ...b }));
    return category ? list.filter(b => b.categoryCode === category) : list;
  },

  // ---- Module 13: Meal Ordering ----
  async getMealMenu(date, dietType) {
    await wait(200);
    let items = _MEAL_MENU.map(m => ({ ...m }));
    if (dietType && dietType !== 'custom') items = items.filter(m => m.dietType === dietType);
    return { date, items };
  },

  async placeMealOrder(payload) {
    await wait(380);
    const id = ++_mealOrderSeq;
    const mealTypes = (payload.mealType || []).slice();
    _mealOrders.unshift({
      id, mealDate: payload.mealDate, mealTypes, dietType: payload.dietType,
      persons: payload.persons, deliveryNote: payload.deliveryNote || null,
      status: 'placed', createdAt: new Date().toISOString(),
    });
    return { id, mealDate: payload.mealDate, mealTypes, status: 'placed' };
  },

  async getMealOrders() {
    await wait(180);
    return _mealOrders.map(o => ({ ...o, mealTypes: [...o.mealTypes] }));
  },

  async subscribeMeal(payload) {
    await wait(320);
    const id = ++_mealSubSeq;
    const days = { daily: 1, weekly: 7, monthly: 30 }[payload.plan] || 30;
    const nextRenewal = _addDaysIso(payload.startDate, days);
    _mealSubs.unshift({
      id, plan: payload.plan, dietType: payload.dietType, persons: payload.persons,
      startDate: payload.startDate, nextRenewal, status: 'active', createdAt: new Date().toISOString(),
    });
    return { id, plan: payload.plan, startDate: payload.startDate, nextRenewal, status: 'active' };
  },

  async getMealSubscriptions() {
    await wait(160);
    return _mealSubs.map(s => ({ ...s }));
  },

  // ---- Module 14: Emergency SOS ----
  async getSosContacts() {
    await wait(160);
    return { contacts: _sos.contacts.map(c => ({ ...c })), bloodGroup: _sos.bloodGroup, medicalNotes: _sos.medicalNotes };
  },

  async saveSosContacts(payload) {
    await wait(280);
    _sos.contacts = (payload.contacts || []).map((c, i) => ({ id: i + 1, ...c, isPrimary: i === 0 }));
    _sos.bloodGroup = payload.bloodGroup || null;
    _sos.medicalNotes = payload.medicalNotes || null;
    return { count: _sos.contacts.length };
  },

  async activateSos(payload) {
    await wait(500);
    const id = ++_sosSeq;
    const eta = 5 + Math.floor(Math.random() * 16);
    _sos.lastRequest = {
      id, requestCode: `SOS-2026-${String(100000 + id).slice(-6)}`,
      status: 'dispatched', etaMinutes: eta, ambulanceLabel: 'Ambulance VRN-07',
      gpsFix: payload?.lat != null && payload?.lng != null,
    };
    return { ..._sos.lastRequest };
  },

  async dispatchSos(payload) {
    await wait(400);
    const contacts = payload?.contacts || [];
    const emailed = contacts.filter(c => c.email).length;
    return {
      notified: contacts.length,
      emailed,
      messaged: contacts.filter(c => c.phone).length,
      channels: ['whatsapp', 'sms', 'email'],
      simulated: true,
    };
  },

  async trackAmbulance(requestId) {
    await wait(200);
    return _sos.lastRequest && _sos.lastRequest.id === Number(requestId)
      ? { ..._sos.lastRequest }
      : { id: Number(requestId), status: 'dispatched', etaMinutes: 8, ambulanceLabel: 'Ambulance VRN-07' };
  },

  // ---- Module 15: Doctor & Healthcare ----
  async getDoctors(specialty) {
    await wait(220);
    const list = _DOCTORS.filter(d => !specialty || d.specialty === specialty);
    return list.map(d => ({ ...d })).sort((a, b) => b.rating - a.rating);
  },

  async getHealthcareSlots(doctorId, date) {
    await wait(180);
    const taken = new Set(
      _appointments.filter(a => a.doctorId === Number(doctorId) && a.date === date).map(a => a.timeSlot),
    );
    return { date, slots: _HC_DAY_SLOTS.filter(s => !taken.has(s)) };
  },

  async bookAppointment(payload) {
    await wait(420);
    const id = ++_apptSeq;
    const doctor = _DOCTORS.find(d => d.id === Number(payload.doctorId));
    const appointmentCode = `APT-2026-${String(10000 + id).slice(-5)}`;
    _appointments.unshift({
      id, appointmentCode, doctorId: Number(payload.doctorId), doctorName: doctor?.name, specialty: doctor?.specialty,
      consultationType: payload.consultationType, patientName: payload.patientName, patientAge: payload.patientAge,
      symptoms: payload.symptoms, date: payload.date, timeSlot: payload.timeSlot,
      scheduledAt: `${payload.date}T${payload.timeSlot}:00`, status: 'booked',
    });
    return { id, appointmentCode, date: payload.date, timeSlot: payload.timeSlot };
  },

  async getMyAppointments() {
    await wait(180);
    return _appointments.map(a => ({ ...a }));
  },

  async orderMedicine() {
    await wait(280);
    return { id: Math.floor(Math.random() * 1000), status: 'placed' };
  },

  // ---- Module 16: Wheelchair & Mobility ----
  async getMobilityAids(category) {
    await wait(200);
    const list = _MOBILITY_AIDS.filter(a => !category || a.category === category);
    return list.map(a => ({ ...a }));
  },

  async bookMobility(payload) {
    await wait(380);
    const id = ++_mobBookingSeq;
    const aid = _MOBILITY_AIDS.find(a => a.id === Number(payload.aidId));
    const total = _mobTotal(aid, payload.mode, payload.days, payload.withAttendant);
    _mobBookings.unshift({
      id, aidName: aid?.name, category: aid?.category, mode: payload.mode,
      startDate: payload.startDate, days: payload.days || 1, withAttendant: !!payload.withAttendant,
      deliveryNote: payload.deliveryNote || null, total, status: 'confirmed', createdAt: new Date().toISOString(),
    });
    return { id, aidName: aid?.name, total, status: 'confirmed' };
  },

  async getMobilityBookings() {
    await wait(170);
    return _mobBookings.map(b => ({ ...b }));
  },

  // ---- Module 17: Ayurvedic Wellness ----
  async getTherapies() {
    await wait(190);
    return _THERAPIES.map(t => ({ ...t }));
  },

  async getWellnessSlots(date) {
    await wait(170);
    const taken = new Set(_wellnessBookings.filter(b => b.visitDate === date).map(b => b.timeSlot));
    return { date, slots: _WELLNESS_SLOTS.filter(s => !taken.has(s)) };
  },

  async bookWellness(payload) {
    await wait(380);
    const id = ++_wellnessSeq;
    const therapy = _THERAPIES.find(t => t.id === Number(payload.therapyId));
    _wellnessBookings.unshift({
      id, therapyName: therapy?.name, icon: therapy?.icon, isPackage: !!therapy?.isPackage, packageDays: therapy?.packageDays,
      durationMin: payload.durationMin, therapistGender: payload.therapistGender || 'any',
      visitDate: payload.date, timeSlot: payload.timeSlot, healthNote: payload.healthNote || null,
      status: 'booked', createdAt: new Date().toISOString(),
    });
    return { id, therapyName: therapy?.name, isPackage: !!therapy?.isPackage, date: payload.date, timeSlot: payload.timeSlot };
  },

  async getWellnessBookings() {
    await wait(160);
    return _wellnessBookings.map(b => ({ ...b }));
  },

  // ---- Modules 18-20: Spiritual / Temple Directory & Darshan ----
  async getTemples() {
    await wait(200);
    return _TEMPLES.map(t => ({ id: t.id, name: t.name, city: t.city, rating: t.rating, crowdStatus: t.crowdStatus, distanceKm: t.distanceKm, imageUrl: t.imageUrl, vipAvailable: t.vipAvailable }));
  },

  async getTemple(templeId) {
    await wait(180);
    const t = _TEMPLES.find(x => x.id === Number(templeId));
    if (!t) return null;
    return { ...t, festivals: _FESTIVALS.map(f => ({ ...f })) };
  },

  async getFestivals() {
    await wait(160);
    return _FESTIVALS.map(f => ({ ...f }));
  },

  async bookDarshan(payload, isVip) {
    await wait(420);
    const id = ++_darshanSeq;
    const bookingCode = `DSN-2026-${String(10000 + id).slice(-5)}`;
    const names = _TEMPLES.filter(t => (payload.templeIds || []).includes(t.id)).map(t => t.name).join(', ');
    _darshanBookings.unshift({
      id, bookingCode, temples: names, visitDate: payload.visitDate, visitTimeSlot: payload.visitTimeSlot,
      transportType: payload.transportType, persons: payload.persons, seniorCitizens: payload.seniorCitizens || 0,
      groupName: payload.groupName || null, specialPuja: payload.specialPuja || null, isVip: !!isVip,
      status: 'booked', createdAt: new Date().toISOString(),
    });
    return { id, bookingCode, isVip: !!isVip };
  },

  async getMyDarshan() {
    await wait(170);
    return _darshanBookings.map(b => ({ ...b }));
  },

  // ---- Modules 21-23: Community / Visitor / Amenity ----
  async getAnnouncements() {
    await wait(170);
    return _ANNOUNCEMENTS.map(a => ({ ...a }));
  },

  async getEvents() {
    await wait(160);
    return _EVENTS.map(e => ({ ...e }));
  },

  async preAuthorizeGuest(payload) {
    await wait(360);
    const id = ++_visitorSeq;
    const qrToken = `GP-2026-${String(100000 + id).slice(-6)}`;
    _visitorPasses.unshift({
      id, qrToken, guestName: payload.guestName, guestPhone: payload.guestPhone,
      visitDate: payload.visitDate, visitPurpose: payload.visitPurpose, validTill: payload.validTill || null,
      vehicleNo: payload.vehicleNo || null, status: 'active', createdAt: new Date().toISOString(),
    });
    return { id, qrToken, guestName: payload.guestName };
  },

  async getVisitorHistory() {
    await wait(170);
    return _visitorPasses.map(v => ({ ...v }));
  },

  async getAmenities() {
    await wait(180);
    // Return categories with their nested facilities (deep-cloned).
    return _AMENITY_CATEGORIES.map(c => ({
      code: c.code,
      name: c.name,
      icon: c.icon,
      blurb: c.blurb,
      facilityCount: c.facilities.length,
      facilities: c.facilities.map(f => ({ ...f, categoryCode: c.code, categoryName: c.name })),
    }));
  },

  async getAmenitySlots(amenityId, date) {
    await wait(170);
    if ((_AMENITY_BLACKOUTS[Number(amenityId)] || []).includes(date)) {
      return { date, slots: [], blocked: true, reason: 'Selected facility is under maintenance on this date.' };
    }
    const taken = new Set(_amenityBookings.filter(b => b.amenityId === Number(amenityId) && b.bookingDate === date).map(b => b.timeSlot));
    return { date, slots: _AMENITY_SLOTS.filter(s => !taken.has(s)) };
  },

  async bookAmenity(payload) {
    await wait(420);
    const id = ++_amenityBookingSeq;
    const amenity = _FACILITIES.find(a => a.id === Number(payload.amenityId));
    const bookingCode = `AMB-2026-${String(10000 + id).slice(-5)}`;
    _amenityBookings.unshift({
      id, bookingCode, amenityId: Number(payload.amenityId), amenityName: amenity?.name, icon: amenity?.icon,
      bookingDate: payload.bookingDate, timeSlot: payload.timeSlot, occasion: payload.occasion,
      extraServices: payload.extraServices || [], guestCount: payload.guestCount, status: 'booked',
    });
    return { id, bookingCode, deposit: amenity?.deposit || 0 };
  },

  async getMyAmenityBookings() {
    await wait(170);
    return _amenityBookings.map(b => ({ ...b }));
  },

  // ---- Modules 24-26: Rewards / Investments / Companion ----
  async getRewardBalance() {
    await wait(150);
    return { points: _rewardPoints };
  },

  async getRewardOffers() {
    await wait(180);
    return _REWARD_OFFERS.map(o => ({ ...o }));
  },

  async redeemReward(offerId) {
    await wait(300);
    const offer = _REWARD_OFFERS.find(o => o.id === Number(offerId));
    if (!offer) { const e = new Error('Offer not found'); e.response = { status: 404, data: { message: 'Offer not found' } }; throw e; }
    if (_rewardPoints < offer.pointsCost) { const e = new Error('Not enough points'); e.response = { status: 400, data: { message: `Not enough points. Need ${offer.pointsCost}, have ${_rewardPoints}.` } }; throw e; }
    _rewardPoints -= offer.pointsCost;
    return { balance: _rewardPoints, offerTitle: offer.title };
  },

  async getInvestments() {
    await wait(190);
    return _INVESTMENTS.map(p => ({ ...p }));
  },

  async submitReferral(payload) {
    await wait(320);
    const id = ++_referralSeq;
    _referrals.unshift({ id, ...payload, status: 'submitted', createdAt: new Date().toISOString() });
    return { id, reward: 25000 };
  },

  async getReferrals() {
    await wait(150);
    return _referrals.map(r => ({ ...r }));
  },

  // Companion
  async getCheckins() {
    await wait(160);
    return _checkins.map(c => ({ ...c }));
  },

  async addCheckin(payload) {
    await wait(300);
    const id = ++_checkinSeq;
    _checkins.unshift({ id, moodScore: payload.moodScore, healthNote: payload.healthNote || null, activities: payload.activities || [], painLevel: payload.painLevel ?? null, createdAt: new Date().toISOString() });
    return { id };
  },

  async getReminders() {
    await wait(150);
    return _reminders.filter(r => r.active).map(r => ({ ...r }));
  },

  async addReminder(payload) {
    await wait(220);
    const id = ++_reminderSeq + 100;
    _reminders.unshift({
      id,
      category: payload.category || 'other',
      title: payload.title,
      note: payload.note || null,
      timeLabel: payload.timeLabel,
      active: true,
    });
    return { id };
  },

  async deleteReminder(id) {
    await wait(150);
    const r = _reminders.find(x => x.id === Number(id));
    if (r) r.active = false;
    return { id: Number(id) };
  },

  async getAiChat() {
    await wait(160);
    return _aiMessages.map(m => ({ ...m }));
  },

  async sendAiChat(message) {
    await wait(450);
    const reply = _aiReplyMock(message);
    _aiMessages.push({ id: _aiMessages.length + 1, role: 'user', content: message, createdAt: new Date().toISOString() });
    _aiMessages.push({ id: _aiMessages.length + 1, role: 'assistant', content: reply, createdAt: new Date().toISOString() });
    return { reply };
  },

  // Persist a real-LLM exchange into the local chat history (used when the
  // reply comes from the live model rather than the rule-based mock).
  recordAiChat(message, reply) {
    _aiMessages.push({ id: _aiMessages.length + 1, role: 'user', content: message, createdAt: new Date().toISOString() });
    _aiMessages.push({ id: _aiMessages.length + 1, role: 'assistant', content: reply, createdAt: new Date().toISOString() });
  },

  async getDailyContent() {
    await wait(150);
    const day = new Date().getUTCDate();
    return {
      date: new Date().toISOString().slice(0, 10),
      quote: _DAILY_QUOTES[day % _DAILY_QUOTES.length],
      bhajan: _DAILY_BHAJANS[day % _DAILY_BHAJANS.length],
      templeSuggestion: 'Banke Bihari Temple',
    };
  },

  // Profile (Module 27)
  async getProfile() {
    await wait(160);
    return {
      personal: { ..._profile.personal },
      preferences: { ..._profile.preferences, channels: { ..._profile.preferences.channels } },
      family: _family.map(f => ({ ...f })),
      kyc: { ..._profile.kyc },
    };
  },

  async updatePersonal(payload) {
    await wait(300);
    _profile.personal = { ..._profile.personal, ...payload };
    return { ..._profile.personal };
  },

  async updatePreferences(payload) {
    await wait(250);
    _profile.preferences = {
      ..._profile.preferences,
      ...payload,
      channels: { ..._profile.preferences.channels, ...(payload.channels || {}) },
    };
    return { ..._profile.preferences, channels: { ..._profile.preferences.channels } };
  },

  async addFamilyMember(payload) {
    await wait(250);
    const id = ++_familySeq;
    _family.push({ id, name: payload.name, relation: payload.relation, age: payload.age ?? null, phone: payload.phone || '' });
    return { id };
  },

  async updateFamilyMember(id, payload) {
    await wait(220);
    const m = _family.find(x => x.id === Number(id));
    if (m) Object.assign(m, { name: payload.name, relation: payload.relation, age: payload.age ?? null, phone: payload.phone || '' });
    return { id: Number(id) };
  },

  async removeFamilyMember(id) {
    await wait(180);
    const i = _family.findIndex(x => x.id === Number(id));
    if (i >= 0) _family.splice(i, 1);
    return { id: Number(id) };
  },

  async submitKyc(payload) {
    await wait(400);
    const tail = String(payload.idNumber || '').replace(/\s+/g, '').slice(-4);
    _profile.kyc = {
      status: 'pending', idType: payload.idType,
      idNumberMasked: `XXXX-XXXX-${tail}`,
      submittedAt: new Date().toISOString(), verifiedAt: null,
    };
    return { ..._profile.kyc };
  },

  // App Settings (Module 30)
  async getSettings() {
    await wait(140);
    return {
      language: _settings.language,
      notifications: { ..._settings.notifications },
      privacy: { ..._settings.privacy },
    };
  },

  async updateSettings(payload) {
    await wait(200);
    if (payload.language) _settings.language = payload.language;
    if (payload.notifications) _settings.notifications = { ..._settings.notifications, ...payload.notifications };
    if (payload.privacy) _settings.privacy = { ..._settings.privacy, ...payload.privacy };
    return {
      language: _settings.language,
      notifications: { ..._settings.notifications },
      privacy: { ..._settings.privacy },
    };
  },

  // Transport / Darshan cab (Module 34)
  async getTransportPlaces(query) {
    await wait(120);
    const q = String(query || '').trim().toLowerCase();
    const list = q
      ? _VRINDAVAN_PLACES.filter(p => p.name.toLowerCase().includes(q) || p.area.toLowerCase().includes(q))
      : _VRINDAVAN_PLACES;
    return list.map(p => ({ ...p }));
  },

  async getVehicleEstimates({ pickup, drop } = {}) {
    await wait(260);
    const km = pickup && drop ? haversineKm(pickup, drop) : 5;
    return { distanceKm: roundKm(km), options: estimateOptions(km) };
  },

  async bookRide(payload) {
    await wait(420);
    const id = ++_rideSeq;
    const v = vehicleByType(payload.vehicleType);
    const km = roundKm(payload.distanceKm != null ? payload.distanceKm : 5);
    const fare = payload.fare != null ? payload.fare : fareFor(v, km);
    const ride = {
      id,
      code: `RIDE-2026-${String(1000 + id).slice(-4)}`,
      pickupName: payload.pickupName || 'Pickup',
      dropName: payload.dropName || 'Drop',
      vehicleType: payload.vehicleType,
      vehicleLabel: v?.label || payload.vehicleType,
      distanceKm: km,
      fare,
      etaMin: v?.etaMin || 5,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };
    _rides.unshift(ride);
    return { ...ride };
  },

  async getMyRides() {
    await wait(150);
    return _rides.map(r => ({ ...r }));
  },

  // Notifications feed (Module 36)
  async getNotifications() {
    await wait(150);
    return [
      { id: 1, type: 'payment',  icon: '💳', title: 'Installment due soon', body: 'Your Slab Casting installment of ₹12,50,000 is due on 25 Jun.', time: '2026-06-09T08:30:00Z', read: false },
      { id: 2, type: 'community', icon: '📢', title: 'Water supply maintenance', body: 'Tower 2 water off Sat 10 AM–1 PM for tank cleaning.', time: '2026-06-09T06:00:00Z', read: false },
      { id: 3, type: 'reminder', icon: '⏰', title: 'Reminder set', body: 'Banke Bihari morning darshan at 6:30 AM.', time: '2026-06-08T18:00:00Z', read: true },
      { id: 4, type: 'service',  icon: '🧹', title: 'Cleaning confirmed', body: 'Sparkle Home Services arrives tomorrow, 8–10 AM.', time: '2026-06-08T12:15:00Z', read: true },
      { id: 5, type: 'event',    icon: '🎉', title: 'Janmashtami celebration', body: 'Join the decoration drive at the community hall this weekend.', time: '2026-06-07T09:00:00Z', read: true },
    ];
  },

  // Food ordering (Module 35)
  async getFoodCategories() {
    await wait(150);
    return _FOOD_CATEGORIES.map(c => ({ ...c, itemCount: _FOOD_ITEMS.filter(i => i.categoryCode === c.code).length }));
  },

  async getFoodItems(categoryCode) {
    await wait(180);
    return _FOOD_ITEMS.filter(i => !categoryCode || i.categoryCode === categoryCode).map(i => ({ ...i }));
  },

  async placeFoodOrder(payload) {
    await wait(420);
    const id = ++_foodOrderSeq;
    const items = payload.items || [];
    const total = payload.total != null ? payload.total : items.reduce((s, i) => s + i.price * i.qty, 0);
    const order = {
      id,
      code: `FOOD-2026-${String(1000 + id).slice(-4)}`,
      items: items.map(i => ({ name: i.name, qty: i.qty, price: i.price })),
      itemCount: items.reduce((n, i) => n + i.qty, 0),
      total,
      status: 'preparing',
      placedAt: new Date().toISOString(),
    };
    _foodOrders.unshift(order);
    return { ...order };
  },

  async getFoodOrders() {
    await wait(150);
    return _foodOrders.map(o => ({ ...o }));
  },
};
