// 4HGS Application Hub - Core Logic & State Management
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile, updateEmail, updatePassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, deleteDoc, updateDoc, writeBatch, query, where, onSnapshot, arrayUnion } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDUo8yzIcUAxNL8rMuSAaBhZBVhyYvkYm8",
  authDomain: "hghub-20865.firebaseapp.com",
  projectId: "hghub-20865",
  storageBucket: "hghub-20865.firebasestorage.app",
  messagingSenderId: "258182779688",
  appId: "1:258182779688:web:69c2a7c111c0b1ae9df61d",
  measurementId: "G-HTBWW8C0QD"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

// Global HTML sanitization helper
function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeHtml(str) {
  return escapeHTML(str);
}

// Icon SVGs library
const SVG_ICONS = {
  box: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>`,
  wrench: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>`,
  truck: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>`,
  users: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`,
  'search-book': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>`,
  'dollar-sign': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>`,
  brain: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1 0-3.12 3 3 0 0 1 0-4.88 2.5 2.5 0 0 1 0-3.12A2.5 2.5 0 0 1 9.5 2zM14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 0-3.12 3 3 0 0 0 0-4.88 2.5 2.5 0 0 0 0-3.12A2.5 2.5 0 0 0 14.5 2z"></path></svg>`,
  gear: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`,
  folder: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`,
  home: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 0 0 1 1h3m10-11l2 2m-2-2v10a1 1 0 0 1-1 1h-3m-6 0a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1m-6 0h6"></path></svg>`,
  lock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`,
  
  // Premium React-style standard vector icons (Lucide / Feather)
  database: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"></path></svg>`,
  shield: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`,
  activity: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>`,
  'shopping-cart': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>`,
  calendar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`,
  'message-square': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`,
  terminal: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>`,
  'credit-card': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>`,
  'bar-chart': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>`,
  'life-buoy': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="4"></circle><line x1="4.93" y1="4.93" x2="9.17" y2="9.17"></line><line x1="14.83" y1="14.83" x2="19.07" y2="19.07"></line><line x1="14.83" y1="9.17" x2="19.07" y2="4.93"></line><line x1="4.93" y1="19.07" x2="9.17" y2="14.83"></line></svg>`,
  briefcase: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>`,
  'file-text': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>`,
  'alert-triangle': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
  forklift: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="18" r="2.5"></circle><circle cx="17" cy="18" r="2.5"></circle><path d="M3 18h0.5M8.5 18H14.5M19.5 18H21"></path><path d="M5 15.5L8 7h6l2 8.5"></path><path d="M19 18V5h2"></path><path d="M21 15h3"></path></svg>`,

  // Theme Toggle Icons
  sun: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`,
  moon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`,
  
  // Favicon placeholder SVG (globe)
  favicon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`
};

// Seed Data definition
const DEFAULT_APPS = [
  { id: 'inventory', name: 'Inventory Manager', link: 'https://inventory.4hgsource.com/', icon: 'box', order: 0, type: 'app', sectionId: 'default' },
  { id: 'repairs', name: 'Repairs Dispatch', link: 'https://repairs.4hgsource.com/', icon: 'wrench', order: 1, type: 'app', sectionId: 'default' },
  { id: 'orders', name: 'Order Tracker', link: 'https://orders.4hgsource.com/', icon: 'truck', order: 2, type: 'app', sectionId: 'default' },
  { id: 'crm', name: 'CRM Database', link: 'https://crm.4hgsource.com/', icon: 'users', order: 3, type: 'app', sectionId: 'default' },
  { id: 'catalog', name: 'Catalog Search', link: 'https://catalog.4hgsource.com/', icon: 'search-book', order: 4, type: 'app', sectionId: 'default' },
  { id: 'invoicing', name: 'Invoicing Portal', link: 'https://billing.4hgsource.com/', icon: 'dollar-sign', order: 5, type: 'app', sectionId: 'default' },
  { id: 'ai-troubleshoot', name: 'Troubleshooting AI', link: 'https://ai.4hgsource.com/', icon: 'brain', order: 6, type: 'app', sectionId: 'default' },
  // Folder containing Ops apps
  { id: 'folder-ops', name: 'Operations', icon: 'folder', order: 7, type: 'folder', appIds: ['inventory', 'repairs', 'orders'], sectionId: 'default' },
  { id: 'gif-screenshot-maker', name: 'GIF Screenshot Maker', link: 'apps/gif-screenshot-maker/', icon: 'apps/gif-screenshot-maker/app_icon.png', order: 8, type: 'app', sectionId: 'default' },
  // Useful Links Section Apps (Visible to All Users)
  { id: 'health-benefits', name: 'Health Benefits', icon: 'shield', order: 0, type: 'app', sectionId: 'useful-links', allUsers: true },
  { id: 'benefits-docs', name: 'Benefits Documents', icon: 'file-text', order: 1, type: 'app', sectionId: 'useful-links', allUsers: true },
  { id: 'forklift-safety', name: 'Forklift Safety', icon: 'alert-triangle', order: 2, type: 'app', sectionId: 'useful-links', allUsers: true }
];

const DEFAULT_FORKLIFT_CONFIG = {
  model: 'Toyota 8FGU25',
  serialNo: '90434',
  mast: 'FSV',
  attachment: 'SSFP',
  backTilt: '6°',
  truckWeight: '8,870 lb (4,020 kg) ±5%',
  frontTread: '43.1 in (1095 mm)',
  tireFr: '7.00-12 / Solid',
  tireRr: '6.00-9 / Solid',
  fuel: 'Liquid Propane Gas (LP)',
  standardCapacity: '4,500 lbs @ 24" Load Center (189" Lift)',
  reducedCapacity: '4,000 lbs @ 30" Load Center (189" Lift)',
  manualPath: 'assets/forklift/Toyota_Forklift_Operators_Manual.pdf',
  operators: [
    {
      id: 'op-1',
      name: 'Cole Ankney',
      role: 'Operator Trainer',
      status: 'Certified',
      certDate: '2025-06-15',
      notes: 'Certified Forklift Operator Trainer — ANSI/ITSDF B56.1 & OSHA 29 CFR 1910.178 certified evaluator'
    },
    {
      id: 'op-2',
      name: 'John Smith',
      role: 'Trainee',
      status: 'In Progress',
      certDate: '',
      notes: 'Currently undergoing OSHA-compliant warehouse training and driving evaluation'
    },
    {
      id: 'op-3',
      name: 'Dave Miller',
      role: 'Trainee',
      status: 'In Progress',
      certDate: '',
      notes: 'Currently undergoing OSHA-compliant warehouse training and driving evaluation'
    },
    {
      id: 'op-4',
      name: 'Warehouse Operator 4',
      role: 'Trainee',
      status: 'In Progress',
      certDate: '',
      notes: 'Enrolled in certification training under Operator Trainer'
    }
  ]
};

const DEFAULT_USERS = [
  { id: 'XSGpEYIjdaTjxxAuuTZ6chMbe1I2', name: 'Cole Ankney', role: 'Admin', email: 'cole@4hgs.com' },
  { id: 'user-sales', name: 'John Smith', role: 'Sales', email: 'john@4hgs.com' },
  { id: 'user-shipping', name: 'Dave Miller', role: 'Shipping', email: 'dave@4hgs.com' }
];

const DEFAULT_PERMISSIONS = {
  'XSGpEYIjdaTjxxAuuTZ6chMbe1I2': ['inventory', 'repairs', 'orders', 'crm', 'catalog', 'invoicing', 'ai-troubleshoot', 'folder-ops', 'gif-screenshot-maker', 'health-benefits', 'benefits-docs', 'forklift-safety'],
  'user-sales': ['orders', 'crm', 'catalog', 'folder-ops', 'gif-screenshot-maker', 'health-benefits', 'benefits-docs', 'forklift-safety'], 
  'user-shipping': ['inventory', 'repairs', 'catalog', 'ai-troubleshoot', 'folder-ops', 'gif-screenshot-maker', 'health-benefits', 'benefits-docs', 'forklift-safety']
};

const DEFAULT_BROADCASTS = [
  { id: 'b-1', title: 'Daily technician briefing', body: 'All repair dispatches must log parts inventory before 8:00 AM.', time: '08:15 AM' },
  { id: 'b-2', title: 'Parker Hydraulic Update', body: 'The new Parker hydraulic pump lists are now active in Catalog Search.', time: 'Yesterday' },
  { id: 'b-3', title: 'Sunday Maintenance Window', body: 'CRM Database and billing portals offline Sunday 1:00 AM to 4:00 AM EST.', time: 'May 24' }
];

const DEFAULT_POLLS = [
  {
    id: 'p-1',
    question: 'Where should we host the 2026 summer company picnic?',
    options: ['Pine Lake Park', 'Sunnyvale Gardens', 'The Beachfront'],
    createdBy: 'XSGpEYIjdaTjxxAuuTZ6chMbe1I2',
    creatorName: 'Cole Ankney',
    createdAt: new Date().toISOString(),
    status: 'active',
    votes: [
      { uid: 'user-sales', name: 'John Smith', optionIndex: 0 },
      { uid: 'user-shipping', name: 'Dave Miller', optionIndex: 1 }
    ]
  }
];

const DEFAULT_SECTIONS = [
  { id: 'default', name: '4HGS Apps', order: 0 },
  { id: 'useful-links', name: 'Useful Links', order: 1 }
];

// Active State
let state = {
  apps: [],
  users: [],
  permissions: {},
  broadcasts: [],
  sections: [],
  polls: [],
  pollsFilter: 'active',
  suggestions: [],
  activeUserId: null, // Null indicates no authenticated Firebase session!
  isEditing: false,
  activeFolderId: null,
  theme: 'dark',
  appSortMode: localStorage.getItem('HGS_APP_SORT') || 'custom',     // 'custom' | 'name-asc' | 'name-desc' | 'recent'
  sectionSortMode: localStorage.getItem('HGS_SECTION_SORT') || 'custom', // 'custom' | 'name-asc' | 'name-desc'
  forkliftConfig: null
};

let pollsUnsubscribe = null;
let suggestionsUnsubscribe = null;

// Database Persistence Helpers
function initDatabase() {
  if (!localStorage.getItem('HGS_THEME')) {
    localStorage.setItem('HGS_THEME', 'dark');
  }
  state.theme = localStorage.getItem('HGS_THEME');
  applyTheme();

  // Instant layout defaults for visual loading
  state.apps = DEFAULT_APPS;
  state.sections = DEFAULT_SECTIONS;
  state.broadcasts = DEFAULT_BROADCASTS;
  state.polls = DEFAULT_POLLS;
  state.suggestions = [];
  state.users = DEFAULT_USERS;
  state.permissions = DEFAULT_PERMISSIONS;
  state.forkliftConfig = JSON.parse(localStorage.getItem('HGS_FORKLIFT_CONFIG')) || DEFAULT_FORKLIFT_CONFIG;
  
  ensureDefaultSectionsAndApps();
  state.apps.forEach(app => {
    if (!app.sectionId) app.sectionId = 'default';
  });
}

function ensureDefaultSectionsAndApps() {
  // 1. Find all sections that match "Useful Links" (case-insensitive or by ID)
  const usefulLinksSections = state.sections.filter(s => 
    (s.name && s.name.trim().toLowerCase() === 'useful links') || s.id === 'useful-links'
  );

  let primaryUsefulSection;
  if (usefulLinksSections.length > 0) {
    // Use the first existing Useful Links section as primary
    primaryUsefulSection = usefulLinksSections[0];
    
    // If there are duplicate Useful Links sections, merge them
    if (usefulLinksSections.length > 1) {
      const duplicateIds = usefulLinksSections.slice(1).map(s => s.id);
      
      // Re-assign all apps from duplicate sections to the primary section
      state.apps.forEach(app => {
        if (duplicateIds.includes(app.sectionId)) {
          app.sectionId = primaryUsefulSection.id;
        }
      });
      
      // Remove duplicate sections from state
      state.sections = state.sections.filter(s => !duplicateIds.includes(s.id));
    }
  } else {
    // Create new Useful Links section if none exists
    const maxOrder = state.sections.length > 0 ? Math.max(...state.sections.map(s => s.order || 0)) : 0;
    primaryUsefulSection = { id: 'useful-links', name: 'Useful Links', order: maxOrder + 1 };
    state.sections.push(primaryUsefulSection);
  }

  // Ensure primaryUsefulSection name is properly formatted
  if (primaryUsefulSection) {
    primaryUsefulSection.name = 'Useful Links';
  }

  const usefulSectionId = primaryUsefulSection.id;

  // 2. Ensure health-benefits app exists (preserve sectionId if already assigned to a valid section)
  const healthBenefitsApp = state.apps.find(a => a.id === 'health-benefits');
  if (!healthBenefitsApp) {
    state.apps.push({
      id: 'health-benefits',
      name: 'Health Benefits',
      icon: 'shield',
      order: 0,
      type: 'app',
      sectionId: usefulSectionId
    });
  } else {
    if (!healthBenefitsApp.sectionId || !state.sections.some(s => s.id === healthBenefitsApp.sectionId)) {
      healthBenefitsApp.sectionId = usefulSectionId;
    }
  }

  // 3. Ensure benefits-docs app exists (preserve sectionId if already assigned to a valid section)
  const benefitsDocsApp = state.apps.find(a => a.id === 'benefits-docs');
  if (!benefitsDocsApp) {
    state.apps.push({
      id: 'benefits-docs',
      name: 'Benefits Documents',
      icon: 'file-text',
      order: 1,
      type: 'app',
      sectionId: usefulSectionId
    });
  } else {
    if (!benefitsDocsApp.sectionId || !state.sections.some(s => s.id === benefitsDocsApp.sectionId)) {
      benefitsDocsApp.sectionId = usefulSectionId;
    }
  }

  // 4. Ensure forklift-safety app exists (preserve sectionId if already assigned to a valid section)
  const forkliftSafetyApp = state.apps.find(a => a.id === 'forklift-safety');
  if (!forkliftSafetyApp) {
    state.apps.push({
      id: 'forklift-safety',
      name: 'Forklift Safety',
      icon: 'alert-triangle',
      order: 2,
      type: 'app',
      sectionId: usefulSectionId,
      allUsers: true
    });
  } else {
    forkliftSafetyApp.allUsers = true;
    if (!forkliftSafetyApp.sectionId || !state.sections.some(s => s.id === forkliftSafetyApp.sectionId)) {
      forkliftSafetyApp.sectionId = usefulSectionId;
    }
  }

  // 5. Also clean up any other accidental duplicate sections in state.sections by id or name
  const seenNames = new Set();
  state.sections = state.sections.filter(s => {
    const norm = (s.name || '').trim().toLowerCase();
    if (seenNames.has(norm)) return false;
    seenNames.add(norm);
    return true;
  });
}

function saveDatabase() {
  localStorage.setItem('HGS_APPS', JSON.stringify(state.apps));
  localStorage.setItem('HGS_USERS', JSON.stringify(state.users));
  localStorage.setItem('HGS_PERMISSIONS', JSON.stringify(state.permissions));
  localStorage.setItem('HGS_BROADCASTS', JSON.stringify(state.broadcasts));
  localStorage.setItem('HGS_SECTIONS', JSON.stringify(state.sections));
  localStorage.setItem('HGS_POLLS', JSON.stringify(state.polls));
  localStorage.setItem('HGS_SUGGESTIONS', JSON.stringify(state.suggestions));
  localStorage.setItem('HGS_FORKLIFT_CONFIG', JSON.stringify(state.forkliftConfig));
  localStorage.setItem('HGS_THEME', state.theme);
}

function loadDatabaseOfflineFallback() {
  if (!localStorage.getItem('HGS_APPS')) {
    localStorage.setItem('HGS_APPS', JSON.stringify(DEFAULT_APPS));
  }
  if (!localStorage.getItem('HGS_USERS')) {
    localStorage.setItem('HGS_USERS', JSON.stringify(DEFAULT_USERS));
  }
  if (!localStorage.getItem('HGS_PERMISSIONS')) {
    localStorage.setItem('HGS_PERMISSIONS', JSON.stringify(DEFAULT_PERMISSIONS));
  }
  if (!localStorage.getItem('HGS_BROADCASTS')) {
    localStorage.setItem('HGS_BROADCASTS', JSON.stringify(DEFAULT_BROADCASTS));
  }
  if (!localStorage.getItem('HGS_SECTIONS')) {
    localStorage.setItem('HGS_SECTIONS', JSON.stringify(DEFAULT_SECTIONS));
  }
  if (!localStorage.getItem('HGS_POLLS')) {
    localStorage.setItem('HGS_POLLS', JSON.stringify(DEFAULT_POLLS));
  }
  if (!localStorage.getItem('HGS_SUGGESTIONS')) {
    localStorage.setItem('HGS_SUGGESTIONS', JSON.stringify([]));
  }
  if (!localStorage.getItem('HGS_FORKLIFT_CONFIG')) {
    localStorage.setItem('HGS_FORKLIFT_CONFIG', JSON.stringify(DEFAULT_FORKLIFT_CONFIG));
  }

  state.apps = JSON.parse(localStorage.getItem('HGS_APPS'));
  state.users = JSON.parse(localStorage.getItem('HGS_USERS'));
  state.permissions = JSON.parse(localStorage.getItem('HGS_PERMISSIONS'));
  state.broadcasts = JSON.parse(localStorage.getItem('HGS_BROADCASTS'));
  state.sections = JSON.parse(localStorage.getItem('HGS_SECTIONS')) || DEFAULT_SECTIONS;
  state.polls = JSON.parse(localStorage.getItem('HGS_POLLS')) || DEFAULT_POLLS;
  state.suggestions = JSON.parse(localStorage.getItem('HGS_SUGGESTIONS')) || [];
  state.forkliftConfig = JSON.parse(localStorage.getItem('HGS_FORKLIFT_CONFIG')) || DEFAULT_FORKLIFT_CONFIG;
  
  ensureDefaultSectionsAndApps();
  state.apps.forEach(app => {
    if (!app.sectionId) app.sectionId = 'default';
  });

  renderWidgets();
  renderAuthHeader(auth.currentUser);
  renderAppGrid();
}

async function loadDatabaseFromFirestore() {
  // Theme is device specific, load locally
  if (!localStorage.getItem('HGS_THEME')) {
    localStorage.setItem('HGS_THEME', 'dark');
  }
  state.theme = localStorage.getItem('HGS_THEME');
  applyTheme();

  if (!auth.currentUser) return;

  try {
    // 1. Fetch apps
    const appsSnapshot = await getDocs(collection(db, "apps"));
    const appsList = [];
    appsSnapshot.forEach(doc => {
      appsList.push(doc.data());
    });
    
    // 2. Fetch sections
    const sectionsSnapshot = await getDocs(collection(db, "sections"));
    const sectionsList = [];
    sectionsSnapshot.forEach(doc => {
      sectionsList.push(doc.data());
    });
    
    // 3. Fetch broadcasts
    const broadcastsSnapshot = await getDocs(collection(db, "broadcasts"));
    const broadcastsList = [];
    broadcastsSnapshot.forEach(doc => {
      broadcastsList.push(doc.data());
    });

    const isCole = auth.currentUser.email && (
      auth.currentUser.email.toLowerCase() === 'cole@4hgs.com' ||
      auth.currentUser.email.toLowerCase().includes('cole')
    );

    // Bootstrap seeding check
    if (appsList.length === 0 && isCole) {
      showToast("Seeding empty database...", true);
      await seedFirestoreDatabase();
      return;
    }

    // Auto-register GIF Screenshot Maker if missing from database
    if (isCole && appsList.length > 0 && !appsList.some(a => a.id === 'gif-screenshot-maker')) {
      const newApp = {
        id: 'gif-screenshot-maker',
        name: 'GIF Screenshot Maker',
        link: 'apps/gif-screenshot-maker/',
        icon: 'apps/gif-screenshot-maker/app_icon.png',
        order: appsList.length,
        type: 'app',
        sectionId: 'default'
      };
      try {
        await setDoc(doc(db, "apps", newApp.id), newApp);
        appsList.push(newApp);
        showToast("Auto-registered GIF Screenshot Maker in database!", true);
        
        // Auto-grant permission to Cole
        const colePermRef = doc(db, "permissions", auth.currentUser.uid);
        const colePermSnap = await getDoc(colePermRef);
        if (colePermSnap.exists()) {
          const currentPerms = colePermSnap.data().appIds || [];
          if (!currentPerms.includes('gif-screenshot-maker')) {
            currentPerms.push('gif-screenshot-maker');
            await setDoc(colePermRef, { appIds: currentPerms });
          }
        }
      } catch (err) {
        console.error("Failed to auto-register GIF Screenshot Maker:", err);
      }
    }

    // Try fetching the active user's document directly first to check role
    const activeUserDocRef = doc(db, "users", auth.currentUser.uid);
    const activeUserDocSnap = await getDoc(activeUserDocRef);
    
    let activeUser = null;
    let isAdmin = isCole; // Default to email check for Cole

    if (activeUserDocSnap.exists()) {
      activeUser = activeUserDocSnap.data();
      const r = (activeUser.role || '').toLowerCase();
      const isPrivileged = r.includes('admin') || r.includes('president') || r.includes('boss') || r.includes('executive') || r.includes('chief');
      isAdmin = isCole || isPrivileged;
    } else {
      // First-time signup registration - check if there's a pre-created profile by email
      let preCreatedUser = null;
      let preCreatedPerms = null;
      try {
        const cleanEmail = auth.currentUser.email.toLowerCase().trim();
        const preCreatedId = "email_" + cleanEmail;
        const preCreatedDoc = await getDoc(doc(db, "users", preCreatedId));
        
        if (preCreatedDoc.exists()) {
          preCreatedUser = preCreatedDoc.data();
          preCreatedUser.oldId = preCreatedId;
        } else {
          // Fallback to lookup legacy user- profile by query
          const q = query(collection(db, "users"), where("email", "==", cleanEmail));
          const querySnapshot = await getDocs(q);
          querySnapshot.forEach(doc => {
            if (doc.id !== auth.currentUser.uid) {
              preCreatedUser = doc.data();
              preCreatedUser.oldId = doc.id;
            }
          });
        }

        if (preCreatedUser) {
          // Fetch their pre-created permissions
          const permSnap = await getDoc(doc(db, "permissions", preCreatedUser.oldId));
          if (permSnap.exists()) {
            preCreatedPerms = permSnap.data().appIds;
          }
        }
      } catch (err) {
        console.error("Error looking up pre-created profile:", err);
      }

      if (preCreatedUser) {
        // Migrate pre-created profile to the new Firebase UID
        // We write the correct role immediately, as the new security rule allows this!
        activeUser = {
          id: auth.currentUser.uid,
          name: preCreatedUser.name,
          email: preCreatedUser.email.toLowerCase(),
          role: preCreatedUser.role
        };
        await setDoc(doc(db, "users", activeUser.id), activeUser);

        // Migrate permissions
        const initialPerms = preCreatedPerms || (isCole ? appsList.map(a => a.id) : ['catalog', 'ai-troubleshoot']);
        await setDoc(doc(db, "permissions", activeUser.id), { appIds: initialPerms });

        // Override role and permissions in local memory for active session
        activeUser.role = preCreatedUser.role;
        state.permissions[activeUser.id] = initialPerms;

        // Recalculate isAdmin locally so they inherit admin controls immediately!
        const r = (activeUser.role || '').toLowerCase();
        const isPrivileged = r.includes('admin') || r.includes('president') || r.includes('boss') || r.includes('executive') || r.includes('chief');
        isAdmin = isCole || isPrivileged;

        showToast(`Linked profile for ${activeUser.name}! Welcome to 4HGS Source.`);
      } else {
        // Standard first-time signup registration if no pre-created profile exists
        activeUser = {
          id: auth.currentUser.uid,
          name: auth.currentUser.displayName || auth.currentUser.email.split('@')[0],
          email: auth.currentUser.email.toLowerCase(),
          role: isCole ? 'Admin' : 'Shipping'
        };
        await setDoc(doc(db, "users", activeUser.id), activeUser);

        // Seed standard permissions for new signup
        const initialPerms = isCole ? appsList.map(a => a.id) : ['catalog', 'ai-troubleshoot'];
        await setDoc(doc(db, "permissions", activeUser.id), { appIds: initialPerms });
      }
    }

    // Assign apps, sections, broadcasts, and polls
    state.apps = appsList.length > 0 ? appsList : DEFAULT_APPS;
    state.sections = sectionsList.length > 0 ? sectionsList : DEFAULT_SECTIONS;
    state.broadcasts = broadcastsList;

    // Load users and permissions depending on role
    if (isAdmin) {
      // Admin is allowed to read all users and all permissions
      const usersSnapshot = await getDocs(collection(db, "users"));
      const usersList = [];
      usersSnapshot.forEach(doc => {
        usersList.push(doc.data());
      });
      state.users = usersList;

      const permissionsSnapshot = await getDocs(collection(db, "permissions"));
      const permissionsMap = {};
      permissionsSnapshot.forEach(doc => {
        permissionsMap[doc.id] = doc.data().appIds || [];
      });
      state.permissions = permissionsMap;

      // Ensure every user has a permissions list (fallback to role defaults if not in database)
      state.users.forEach(user => {
        if (!state.permissions[user.id]) {
          state.permissions[user.id] = getRoleDefaultPermissions(user.role);
        }
      });

      // Automatically merge and link duplicate profiles in the background
      await autoMergeUnlinkedUsers();
    } else {
      // Non-admin can only read their own user and permissions documents
      state.users = [activeUser];
      
      const permissionsDocRef = doc(db, "permissions", auth.currentUser.uid);
      const permissionsDocSnap = await getDoc(permissionsDocRef);
      const permissionsMap = {};
      if (permissionsDocSnap.exists()) {
        permissionsMap[auth.currentUser.uid] = permissionsDocSnap.data().appIds || [];
      } else {
        permissionsMap[auth.currentUser.uid] = ['catalog', 'ai-troubleshoot'];
      }
      state.permissions = permissionsMap;
    }

    state.activeUserId = activeUser.id;

    // Load forklift safety configuration from Firestore or cache
    try {
      const forkliftDocRef = doc(db, "forkliftConfig", "main");
      const forkliftDocSnap = await getDoc(forkliftDocRef);
      if (forkliftDocSnap.exists()) {
        state.forkliftConfig = forkliftDocSnap.data();
      } else {
        state.forkliftConfig = JSON.parse(localStorage.getItem('HGS_FORKLIFT_CONFIG')) || DEFAULT_FORKLIFT_CONFIG;
        if (isAdmin) {
          await setDoc(forkliftDocRef, state.forkliftConfig);
        }
      }
    } catch (err) {
      console.warn("Could not load forkliftConfig from Firestore, using local/default:", err);
      state.forkliftConfig = JSON.parse(localStorage.getItem('HGS_FORKLIFT_CONFIG')) || DEFAULT_FORKLIFT_CONFIG;
    }

    // Apply migrations/sanity checks
    ensureDefaultSectionsAndApps();
    state.apps.forEach(app => {
      if (!app.sectionId) app.sectionId = 'default';
    });
 
    // Start real-time polls subscription
    subscribeToPolls();

    // Start real-time suggestions subscription if admin
    if (isAdmin) {
      subscribeToSuggestions();
    } else {
      if (suggestionsUnsubscribe) {
        suggestionsUnsubscribe();
        suggestionsUnsubscribe = null;
      }
      state.suggestions = [];
    }

    renderWidgets();
    renderAuthHeader(auth.currentUser);
    renderAppGrid();

    // Trigger local storage save of current state as cache
    saveDatabase();

  } catch (error) {
    console.error("Firestore database load error:", error);
    showToast("Firestore connection failed. Running offline fallback.", false);
    loadDatabaseOfflineFallback();
  }
}

async function autoMergeUnlinkedUsers() {
  try {
    const usersToMerge = [];
    const legacyToEmailMigrate = [];
    
    const legacyUsers = state.users.filter(u => u.id.startsWith('user-'));
    const activeUIDUsers = state.users.filter(u => !u.id.startsWith('user-') && !u.id.startsWith('email_'));
    const emailUIDUsers = state.users.filter(u => u.id.startsWith('email_'));

    for (const legacyUser of legacyUsers) {
      const activeMatch = activeUIDUsers.find(u => u.email.toLowerCase() === legacyUser.email.toLowerCase());
      if (activeMatch) {
        usersToMerge.push({
          legacy: legacyUser,
          active: activeMatch
        });
      } else {
        // If there is no active UID user, check if there is an email_ format user
        const emailMatch = emailUIDUsers.find(u => u.email.toLowerCase() === legacyUser.email.toLowerCase());
        if (!emailMatch) {
          legacyToEmailMigrate.push(legacyUser);
        }
      }
    }

    // 1. Merge legacy users to active UID users
    if (usersToMerge.length > 0) {
      console.log("Found unlinked user profiles to merge:", usersToMerge);
      for (const pair of usersToMerge) {
        // Copy legacy permissions
        const legacyPermDoc = await getDoc(doc(db, "permissions", pair.legacy.id));
        if (legacyPermDoc.exists()) {
          const legacyPerms = legacyPermDoc.data().appIds || [];
          await setDoc(doc(db, "permissions", pair.active.id), { appIds: legacyPerms });
          state.permissions[pair.active.id] = legacyPerms;
        }

        // Update active user's details (Name and Role) to match pre-created legacy details
        pair.active.name = pair.legacy.name;
        pair.active.role = pair.legacy.role;
        await setDoc(doc(db, "users", pair.active.id), pair.active);

        // Delete legacy documents from Firestore
        await deleteDoc(doc(db, "users", pair.legacy.id));
        await deleteDoc(doc(db, "permissions", pair.legacy.id));

        // Update local state
        state.users = state.users.filter(u => u.id !== pair.legacy.id);
        delete state.permissions[pair.legacy.id];
        
        showToast(`Automatically merged and linked profile for ${pair.legacy.name}!`, true);
      }
    }

    // 2. Migrate legacy user- profiles to email_ profiles for seamless signup
    if (legacyToEmailMigrate.length > 0) {
      console.log("Migrating legacy user- profiles to email_ format:", legacyToEmailMigrate);
      for (const legacyUser of legacyToEmailMigrate) {
        const cleanEmail = legacyUser.email.toLowerCase().trim();
        const newEmailId = "email_" + cleanEmail;
        const emailUser = {
          id: newEmailId,
          name: legacyUser.name,
          role: legacyUser.role,
          email: cleanEmail
        };

        // Copy legacy permissions
        const legacyPermDoc = await getDoc(doc(db, "permissions", legacyUser.id));
        const legacyPerms = legacyPermDoc.exists() ? (legacyPermDoc.data().appIds || []) : getRoleDefaultPermissions(legacyUser.role);

        // Write to new email_ format path
        await setDoc(doc(db, "users", newEmailId), emailUser);
        await setDoc(doc(db, "permissions", newEmailId), { appIds: legacyPerms });
        state.permissions[newEmailId] = legacyPerms;

        // Delete old legacy documents
        await deleteDoc(doc(db, "users", legacyUser.id));
        await deleteDoc(doc(db, "permissions", legacyUser.id));

        // Update local state
        state.users = state.users.map(u => u.id === legacyUser.id ? emailUser : u);
        delete state.permissions[legacyUser.id];

        console.log(`Migrated legacy user- profile ${legacyUser.name} to pre-created format: ${newEmailId}`);
      }
    }
  } catch (err) {
    console.error("Error during automatic user profile merge/migration:", err);
  }
}

function getRoleDefaultPermissions(role) {
  const r = (role || '').toLowerCase();
  if (r.includes('admin') || r.includes('president') || r.includes('boss') || r.includes('executive') || r.includes('chief')) {
    return state.apps.map(a => a.id);
  } else if (r.includes('sale')) {
    return ['orders', 'crm', 'catalog', 'folder-ops', 'gif-screenshot-maker'];
  } else if (r.includes('ship')) {
    return ['inventory', 'repairs', 'catalog', 'ai-troubleshoot', 'folder-ops', 'gif-screenshot-maker'];
  }
  return ['catalog', 'ai-troubleshoot', 'gif-screenshot-maker'];
}

async function seedFirestoreDatabase() {
  try {
    const appsToSeed = DEFAULT_APPS.map(app => {
      if (!app.sectionId) app.sectionId = 'default';
      return app;
    });

    // 1. Apps
    for (const app of appsToSeed) {
      await setDoc(doc(db, "apps", app.id), app);
    }
    
    // 2. Sections
    for (const section of DEFAULT_SECTIONS) {
      await setDoc(doc(db, "sections", section.id), section);
    }
    
    // 3. Broadcasts
    for (const broadcast of DEFAULT_BROADCASTS) {
      await setDoc(doc(db, "broadcasts", broadcast.id), broadcast);
    }
    
    // 3b. Polls
    for (const poll of DEFAULT_POLLS) {
      await setDoc(doc(db, "polls", poll.id), poll);
    }
    
    // 4. Admin Profile
    const adminUser = {
      id: auth.currentUser.uid,
      name: auth.currentUser.displayName || 'Cole Ankney',
      email: auth.currentUser.email.toLowerCase(),
      role: 'Admin'
    };
    await setDoc(doc(db, "users", adminUser.id), adminUser);
    
    // Seed reference users
    const otherUsers = DEFAULT_USERS.filter(u => u.id !== 'XSGpEYIjdaTjxxAuuTZ6chMbe1I2');
    for (const u of otherUsers) {
      await setDoc(doc(db, "users", u.id), u);
    }

    // 5. Permissions
    const allAppIds = appsToSeed.map(a => a.id);
    await setDoc(doc(db, "permissions", adminUser.id), { appIds: allAppIds });
    
    for (const userId of Object.keys(DEFAULT_PERMISSIONS)) {
      if (userId !== 'XSGpEYIjdaTjxxAuuTZ6chMbe1I2') {
        await setDoc(doc(db, "permissions", userId), { appIds: DEFAULT_PERMISSIONS[userId] });
      }
    }
    
    saveDatabase();
    showToast("Database seeded successfully!", true);
    await loadDatabaseFromFirestore();
  } catch (err) {
    console.error("Firestore seeding failed:", err);
    showToast("Seeding failed.", false);
  }
}

// --- Firestore Asynchronous Sync Operators ---

async function syncAppToFirestore(app) {
  try {
    await setDoc(doc(db, "apps", app.id), app);
  } catch (err) {
    console.error("Sync error:", err);
  }
}

async function syncDeleteAppFromFirestore(appId) {
  try {
    await deleteDoc(doc(db, "apps", appId));
  } catch (err) {
    console.error("Sync error:", err);
  }
}

async function syncSectionToFirestore(section) {
  try {
    await setDoc(doc(db, "sections", section.id), section);
  } catch (err) {
    console.error("Sync error:", err);
  }
}

async function syncDeleteSectionFromFirestore(sectionId) {
  try {
    await deleteDoc(doc(db, "sections", sectionId));
  } catch (err) {
    console.error("Sync error:", err);
  }
}

async function syncBroadcastToFirestore(broadcast) {
  try {
    await setDoc(doc(db, "broadcasts", broadcast.id), broadcast);
  } catch (err) {
    console.error("Sync error:", err);
  }
}

async function syncDeleteBroadcastFromFirestore(broadcastId) {
  try {
    await deleteDoc(doc(db, "broadcasts", broadcastId));
  } catch (err) {
    console.error("Sync error:", err);
  }
}

async function syncUserToFirestore(user) {
  try {
    await setDoc(doc(db, "users", user.id), user);
  } catch (err) {
    console.error("Sync error:", err);
  }
}

async function syncDeleteUserFromFirestore(userId) {
  try {
    await deleteDoc(doc(db, "users", userId));
    await deleteDoc(doc(db, "permissions", userId));
  } catch (err) {
    console.error("Sync error:", err);
  }
}

async function syncPermissionToFirestore(userId, appIds) {
  try {
    await setDoc(doc(db, "permissions", userId), { appIds: appIds });
  } catch (err) {
    console.error("Sync error:", err);
  }
}

async function syncPollToFirestore(poll) {
  try {
    await setDoc(doc(db, "polls", poll.id), poll);
  } catch (err) {
    console.error("Sync error:", err);
  }
}

async function syncDeletePollFromFirestore(pollId) {
  try {
    await deleteDoc(doc(db, "polls", pollId));
  } catch (err) {
    console.error("Sync error:", err);
  }
}

async function syncAllAppsOrderToFirestore() {
  try {
    for (const app of state.apps) {
      await updateDoc(doc(db, "apps", app.id), { order: app.order });
    }
  } catch (err) {
    console.error("Sync error:", err);
  }
}

async function syncAllSectionsOrderToFirestore() {
  try {
    for (const section of state.sections) {
      await updateDoc(doc(db, "sections", section.id), { order: section.order });
    }
  } catch (err) {
    console.error("Sync error:", err);
  }
}

// Apply theme helper
function applyTheme() {
  const body = document.body;
  const toggleBtn = document.getElementById('theme-toggle');
  
  if (state.theme === 'light') {
    body.classList.add('light-mode');
    if (toggleBtn) toggleBtn.innerHTML = SVG_ICONS.moon;
  } else {
    body.classList.remove('light-mode');
    if (toggleBtn) toggleBtn.innerHTML = SVG_ICONS.sun;
  }
}

function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  saveDatabase();
  applyTheme();
  showToast(`Switched to ${state.theme === 'dark' ? 'Dark' : 'Light'} Mode`);
}

// Toast notification helper
function showToast(message, isSuccess = true) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast';
  
  const checkSVG = `<svg style="width:16px;height:16px;color:var(--accent-green)" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
  const infoSVG = `<svg style="width:16px;height:16px;color:#ff3b30" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>`;
  
  toast.innerHTML = `${isSuccess ? checkSVG : infoSVG} <span>${message}</span>`;
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'none'; 
    toast.offsetHeight; 
    toast.style.animation = 'toastFadeIn 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) reverse forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Extract domain favicon link
function getFaviconUrl(url) {
  if (!url) return '';
  let cleanedUrl = url.trim();
  
  if (!/^https?:\/\//i.test(cleanedUrl)) {
    cleanedUrl = 'https://' + cleanedUrl;
  }
  
  let domain = '';
  let protocol = 'https:';
  try {
    const parsed = new URL(cleanedUrl);
    domain = parsed.hostname;
    protocol = parsed.protocol;
  } catch (e) {
    const match = cleanedUrl.match(/^(https?:)?\/\/(?:www\.)?([^\/\s\?#:]+)/i);
    if (match) {
      protocol = match[1] || 'https:';
      domain = match[2];
    } else {
      const simpleMatch = cleanedUrl.match(/(?:www\.)?([^\/\s\?#:]+)/i);
      domain = (simpleMatch && simpleMatch[1]) ? simpleMatch[1] : '';
    }
  }
  
  if (!domain) {
    return 'assets/4hgs_logo.png';
  }
  
  const lowerDomain = domain.toLowerCase();
  // Brand Intelligence: For any corporate domain, intranet subdomain, or sharepoint portal,
  // directly serve the gorgeous official 4HG Source circle logo instead of generic fallback globes.
  if (lowerDomain.endsWith('4hgs.com') || lowerDomain.endsWith('4hghub.com') || lowerDomain.includes('4hgsource')) {
    return 'assets/4hgs_logo.png';
  }
  
  // Try loading the favicon DIRECTLY from the target site first!
  return `${protocol}//${domain}/favicon.ico`;
}

// User Permission evaluator
function activeUserHasAccess(appId) {
  if (!state.activeUserId) return false;
  const permitted = state.permissions[state.activeUserId] || [];
  return permitted.includes(appId);
}

function getActiveUser() {
  if (!state.activeUserId) return null;
  return state.users.find(u => u.id === state.activeUserId) || null;
}

// Dynamic Icon rendering helper
function getIconMarkup(item) {
  if (item.icon && (item.icon.startsWith('http') || item.icon.startsWith('/') || item.icon.includes('.') || item.icon.includes('/'))) {
    // Custom icon path/URL - render full size with fallback if broken
    const fallbackSvg = SVG_ICONS[item.fallbackIcon] || SVG_ICONS.box;
    return `
      <img src="${item.icon}" class="app-custom-icon-img" style="width: 100%; height: 100%; object-fit: cover; position: absolute; top: 0; left: 0;" alt="" onerror="this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='flex';">
      <div class="app-icon-fallback" style="display:none; width:100%; height:100%; align-items:center; justify-content:center; position:absolute; top:0; left:0;">${fallbackSvg}</div>
    `.trim();
  }
  if (item.icon === 'favicon') {
    const directFavicon = getFaviconUrl(item.link);
    const fallbackSvg = SVG_ICONS.favicon || SVG_ICONS.box;
    
    return `
      <img src="${directFavicon}" class="app-favicon-img" alt="" onerror="this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='flex';">
      <div class="app-icon-fallback" style="display:none; width:100%; height:100%; align-items:center; justify-content:center; position:absolute; top:0; left:0;">${fallbackSvg}</div>
    `.trim();
  }
  return SVG_ICONS[item.icon] || SVG_ICONS.box;
}

// --- DOM Rendering Engine ---

// Render active Firebase User state in Header Controls
function renderAuthHeader(user) {
  const container = document.getElementById('auth-container');
  container.innerHTML = '';
  
  if (user) {
    // Logged In: profile card + Sign Out button
    const activeUser = getActiveUser();
    const role = activeUser ? activeUser.role : 'Shipping';
    
    container.innerHTML = `
      <div class="user-profile-widget">
        <div class="user-profile-info">
          <span class="user-profile-name">${activeUser ? activeUser.name : (user.displayName || user.email)}</span>
          <span class="user-profile-role">${role}</span>
        </div>
        <button id="btn-logout" class="btn-ios" type="button" style="padding: 0.4rem 0.8rem; font-size: 0.75rem;">
          Sign Out
        </button>
      </div>
    `;
    
    document.getElementById('btn-logout').addEventListener('click', () => {
      signOut(auth).then(() => {
        showToast('Successfully signed out.');
      });
    });
  } else {
    // Logged Out State indicator
    container.innerHTML = `
      <span style="font-size: 0.8rem; color: var(--text-secondary); display: flex; align-items: center; gap: 0.35rem; padding: 0.4rem 0.8rem; background: rgba(255,255,255,0.03); border-radius: 6px; border: 1px dashed var(--glass-border);">
        <svg style="width:12px; height:12px; color: var(--text-secondary);" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
        Secured Portal
      </span>
    `;
  }
}

// Render Left Sidebar Widgets
function renderWidgets() {
  const feed = document.getElementById('widget-alerts');
  feed.innerHTML = '';
  state.broadcasts.forEach(broadcast => {
    const alert = document.createElement('article');
    alert.className = 'alert-item';
    alert.innerHTML = `
      <div class="alert-header">
        <span class="alert-title">${broadcast.title}</span>
        <span class="alert-time">${broadcast.time}</span>
      </div>
      <p class="alert-body">${broadcast.body}</p>
    `;
    feed.appendChild(alert);
  });
  renderPolls();
  renderSuggestionBox();
}

// --- Sort helpers for employee layout preferences ---

function getSortedAppsForDisplay(apps) {
  const copy = [...apps];
  switch (state.appSortMode) {
    case 'name-asc':  return copy.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
    case 'name-desc': return copy.sort((a, b) => b.name.toLowerCase().localeCompare(a.name.toLowerCase()));
    case 'recent':    return copy.sort((a, b) => b.order - a.order);
    default:          return copy.sort((a, b) => a.order - b.order);
  }
}

function getSortedSectionsForDisplay(sections) {
  const copy = [...sections];
  // Default section always pinned first
  const defaultSec = copy.find(s => s.id === 'default');
  const rest = copy.filter(s => s.id !== 'default');
  switch (state.sectionSortMode) {
    case 'name-asc':
      rest.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
      break;
    case 'name-desc':
      rest.sort((a, b) => b.name.toLowerCase().localeCompare(a.name.toLowerCase()));
      break;
    default:
      rest.sort((a, b) => a.order - b.order);
  }
  return defaultSec ? [defaultSec, ...rest] : rest;
}

// --- Section drag-and-drop (admin edit mode on live dashboard) ---
let draggedSectionId = null;

function setupSectionDragDrop(headerEl, sectionId) {
  headerEl.setAttribute('draggable', 'true');

  headerEl.addEventListener('dragstart', (e) => {
    draggedSectionId = sectionId;
    headerEl.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  });

  headerEl.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  });

  headerEl.addEventListener('dragenter', (e) => {
    e.preventDefault();
    if (sectionId !== draggedSectionId) {
      headerEl.classList.add('drag-over');
    }
  });

  headerEl.addEventListener('dragleave', () => {
    headerEl.classList.remove('drag-over');
  });

  headerEl.addEventListener('drop', (e) => {
    e.preventDefault();
    headerEl.classList.remove('drag-over');
    if (draggedSectionId && sectionId !== draggedSectionId && sectionId !== 'default' && draggedSectionId !== 'default') {
      const dragSec = state.sections.find(s => s.id === draggedSectionId);
      const dropSec = state.sections.find(s => s.id === sectionId);
      if (dragSec && dropSec) {
        const tmp = dragSec.order;
        dragSec.order = dropSec.order;
        dropSec.order = tmp;
        saveDatabase();
        syncAllSectionsOrderToFirestore();
        renderAppGrid();
        showToast('Section order updated');
      }
    }
  });

  headerEl.addEventListener('dragend', () => {
    headerEl.classList.remove('dragging');
    draggedSectionId = null;
  });
}

// Render main app grid based on permissions and folders
function renderAppGrid() {

  const mainGrid = document.getElementById('main-app-grid');
  mainGrid.innerHTML = '';
  
  const subsequentContainer = document.getElementById('subsequent-sections-container');
  if (subsequentContainer) {
    subsequentContainer.innerHTML = '';
  }

  const activeUser = getActiveUser();
  const r = activeUser ? (activeUser.role || '').toLowerCase() : '';
  const isPrivileged = r.includes('admin') || r.includes('president') || r.includes('boss') || r.includes('executive') || r.includes('chief');
  const isAdmin = activeUser && isPrivileged;
  
  // Show / Hide Settings trigger in header
  const btnAdmin = document.getElementById('btn-admin-portal');
  if (state.activeUserId) {
    btnAdmin.style.display = 'inline-flex';
    document.body.classList.remove('logged-out');
  } else {
    btnAdmin.style.display = 'none';
    document.body.classList.add('logged-out');
  }

  // Handle Logged Out State: Show a beautiful placeholder lock screen card!
  if (!state.activeUserId) {
    mainGrid.style.display = 'block'; // break grid layout
    if (subsequentContainer) subsequentContainer.style.display = 'none';
    document.getElementById('ios-toolbar').style.display = 'none';
    mainGrid.innerHTML = `
      <div style="text-align: center; padding: 1rem 0.5rem; max-width: 440px; margin: 0 auto;">
        <div style="background: rgba(141,220,4,0.08); width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem;">
          <svg style="width: 32px; height: 32px; color: var(--accent-green);" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>
        <h3 style="font-size: 1.4rem; margin-bottom: 0.5rem; font-weight: 800; color: var(--text-primary);">4HGS Secure Portal</h3>
        <p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 2rem; line-height: 1.5;">
          Authenticate with your corporate credentials to access applications and dispatches.
        </p>
        
        <form id="portal-login-form" style="text-align: left; display: flex; flex-direction: column; gap: 1.25rem;">
          <div class="form-group">
            <label for="login-email" style="font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-secondary);">Corporate Email</label>
            <input type="email" id="login-email" class="form-control" placeholder="name@4hgs.com" required autocomplete="username">
          </div>
          <div class="form-group" style="margin-bottom: 0.5rem;">
            <label for="login-password" style="font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-secondary);">Password</label>
            <input type="password" id="login-password" class="form-control" placeholder="••••••••" required autocomplete="current-password">
          </div>
          
          <div id="login-error-msg" style="color: #ff3b30; font-size: 0.85rem; font-weight: 600; display: none; text-align: center; background: rgba(255,59,48,0.08); padding: 0.6rem; border-radius: 6px; border: 1px solid rgba(255,59,48,0.15);"></div>
          
          <button type="submit" id="btn-login-submit" class="btn-ios btn-ios-accent" style="width: 100%; padding: 0.85rem; font-size: 0.95rem; font-weight: 700; display: flex; align-items: center; gap: 0.5rem; justify-content: center; margin-top: 0.5rem;">
            <svg style="width: 16px; height: 16px;" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h16.5a1.5 1.5 0 001.5-1.5V9.75a1.5 1.5 0 00-1.5-1.5H3.75a1.5 1.5 0 00-1.5 1.5v10.5a1.5 1.5 0 001.5 1.5z"></path></svg>
            Secure Login
          </button>
        </form>
      </div>
    `;
    
    const loginForm = document.getElementById('portal-login-form');
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      const errorDiv = document.getElementById('login-error-msg');
      const submitBtn = document.getElementById('btn-login-submit');
      
      errorDiv.style.display = 'none';
      submitBtn.disabled = true;
      submitBtn.innerHTML = `Signing In...`;
      
      signInWithEmailAndPassword(auth, email, password)
        .then((result) => {
          showToast(`Welcome back!`);
        })
        .catch((error) => {
          submitBtn.disabled = false;
          submitBtn.innerHTML = `<svg style="width: 16px; height: 16px;" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h16.5a1.5 1.5 0 001.5-1.5V9.75a1.5 1.5 0 00-1.5-1.5H3.75a1.5 1.5 0 00-1.5 1.5v10.5a1.5 1.5 0 001.5 1.5z"></path></svg> Secure Login`;
          
          let customError = error.message;
          if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
            customError = 'Invalid email or password. Please try again.';
          } else if (error.code === 'auth/invalid-email') {
            customError = 'Please enter a valid corporate email address.';
          } else if (error.code === 'auth/user-disabled') {
            customError = 'This account has been disabled.';
          }
          
          errorDiv.textContent = customError;
          errorDiv.style.display = 'block';
          showToast(`Sign in failed`, false);
        });
    });
    return;
  }

  // Restore Display Styles
  const adminPanel = document.getElementById('admin-panel-inline');
  const isSettingsOpen = adminPanel && adminPanel.style.display === 'flex';
  const benefitsPanel = document.getElementById('benefits-page-inline');
  const isBenefitsOpen = benefitsPanel && benefitsPanel.style.display === 'flex';
  const benefitsDocsPanel = document.getElementById('benefits-docs-page-inline');
  const isDocsOpen = benefitsDocsPanel && benefitsDocsPanel.style.display === 'flex';
  const forkliftPanel = document.getElementById('forklift-page-inline');
  const isForkliftOpen = forkliftPanel && forkliftPanel.style.display === 'flex';
  const forkliftTrainingPanel = document.getElementById('forklift-training-page-inline');
  const isForkliftTrainingOpen = forkliftTrainingPanel && forkliftTrainingPanel.style.display === 'flex';
  const topActions = document.getElementById('top-actions-bar');
  const isAnyModalOpen = isSettingsOpen || isBenefitsOpen || isDocsOpen || isForkliftOpen || isForkliftTrainingOpen;
  
  if (isAnyModalOpen) {
    mainGrid.style.display = 'none';
    if (subsequentContainer) subsequentContainer.style.display = 'none';
    document.getElementById('ios-toolbar').style.display = 'none';
    if (topActions) topActions.style.display = 'none';
  } else {
    mainGrid.style.display = 'grid';
    if (subsequentContainer) subsequentContainer.style.display = 'block';
    document.getElementById('ios-toolbar').style.display = 'flex';
    if (topActions) topActions.style.display = 'block';
  }

  // Prepare and create all subsequent grids and headers in DOM
  const sortedSections = getSortedSectionsForDisplay(state.sections);
  const gridsMap = {};
  
  // The first section in sortedSections belongs to the mainGrid
  if (sortedSections.length > 0) {
    const firstSec = sortedSections[0];
    gridsMap[firstSec.id] = mainGrid;
    if (state.isEditing && isAdmin) {
      setupGridContainerDragDrop(mainGrid, firstSec.id);
    }
    
    // Update the title of the first section dynamically!
    const mainToolbarTitle = document.querySelector('#ios-toolbar .ios-view-title');
    if (mainToolbarTitle) {
      // Split the title on spaces for the gradient styling
      const parts = firstSec.name.split(' ');
      if (parts.length > 1) {
        const lastWord = parts.pop();
        mainToolbarTitle.innerHTML = `${parts.join(' ')} <span>${lastWord}</span>`;
      } else {
        mainToolbarTitle.innerHTML = `${firstSec.name}`;
      }
    }

    // Employee sort controls (non-admin, logged-in, not editing)
    const mainToolbar = document.getElementById('ios-toolbar');
    const existingSortCtrl = mainToolbar ? mainToolbar.querySelector('.sort-controls') : null;
    if (existingSortCtrl) existingSortCtrl.remove();

    if (state.activeUserId && !isAdmin && !state.isEditing && mainToolbar) {
      const sortCtrl = document.createElement('div');
      sortCtrl.className = 'sort-controls';
      sortCtrl.innerHTML = `
        <label class="sort-label">Apps:
          <select id="app-sort-select" class="sort-select">
            <option value="custom"${state.appSortMode === 'custom' ? ' selected' : ''}>Default</option>
            <option value="name-asc"${state.appSortMode === 'name-asc' ? ' selected' : ''}>A → Z</option>
            <option value="name-desc"${state.appSortMode === 'name-desc' ? ' selected' : ''}>Z → A</option>
            <option value="recent"${state.appSortMode === 'recent' ? ' selected' : ''}>Recently Added</option>
          </select>
        </label>
        <label class="sort-label">Sections:
          <select id="section-sort-select" class="sort-select">
            <option value="custom"${state.sectionSortMode === 'custom' ? ' selected' : ''}>Default</option>
            <option value="name-asc"${state.sectionSortMode === 'name-asc' ? ' selected' : ''}>A → Z</option>
            <option value="name-desc"${state.sectionSortMode === 'name-desc' ? ' selected' : ''}>Z → A</option>
          </select>
        </label>
      `;
      mainToolbar.appendChild(sortCtrl);

      sortCtrl.querySelector('#app-sort-select').addEventListener('change', (e) => {
        state.appSortMode = e.target.value;
        localStorage.setItem('HGS_APP_SORT', state.appSortMode);
        renderAppGrid();
      });
      sortCtrl.querySelector('#section-sort-select').addEventListener('change', (e) => {
        state.sectionSortMode = e.target.value;
        localStorage.setItem('HGS_SECTION_SORT', state.sectionSortMode);
        renderAppGrid();
      });
    }
  }

  // Create grid containers for subsequent sections
  for (let i = 1; i < sortedSections.length; i++) {
    const section = sortedSections[i];
    
    // Create Toolbar Header
    const toolbar = document.createElement('div');
    toolbar.className = 'ios-toolbar subsequent-section-header';
    toolbar.style.marginTop = '2.5rem'; // Premium vertical spacing between sections

    // Admin edit mode: drag handle + section controls
    if (state.isEditing && isAdmin) {
      const dragHandle = document.createElement('span');
      dragHandle.className = 'section-drag-handle';
      dragHandle.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>`;
      toolbar.appendChild(dragHandle);
      setupSectionDragDrop(toolbar, section.id);
    }

    const title = document.createElement('h2');
    title.className = 'ios-view-title';
    const parts = section.name.split(' ');
    if (parts.length > 1) {
      const lastWord = parts.pop();
      title.innerHTML = `${parts.join(' ')} <span>${lastWord}</span>`;
    } else {
      title.innerHTML = `${section.name}`;
    }
    toolbar.appendChild(title);

    // Admin edit mode: section controls (remove)
    if (state.isEditing && isAdmin) {
      const sectionControls = document.createElement('div');
      sectionControls.className = 'section-edit-controls';
      sectionControls.innerHTML = `<button class="section-remove-btn" data-id="${section.id}" type="button" title="Remove section">✕ Remove</button>`;
      sectionControls.querySelector('.section-remove-btn').addEventListener('click', () => {
        if (confirm(`Remove section "${section.name}"? All its apps will move to the default section.`)) {
          deleteSection(section.id);
        }
      });
      toolbar.appendChild(sectionControls);
    }
    
    // Create App Grid
    const sectionGrid = document.createElement('div');
    sectionGrid.className = 'app-grid';
    sectionGrid.id = `grid-section-${section.id}`;
    sectionGrid.style.display = isAnyModalOpen ? 'none' : 'grid';
    
    // Append to subsequent sections container
    if (subsequentContainer) {
      subsequentContainer.appendChild(toolbar);
      subsequentContainer.appendChild(sectionGrid);
    }
    
    gridsMap[section.id] = sectionGrid;
    if (state.isEditing && isAdmin) {
      setupGridContainerDragDrop(sectionGrid, section.id);
    }
  }

  // Admin edit mode: "Add Section" button appended after all section grids
  if (state.isEditing && isAdmin && subsequentContainer) {
    const addSectionBtn = document.createElement('button');
    addSectionBtn.className = 'section-add-btn';
    addSectionBtn.type = 'button';
    addSectionBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
      Add Section
    `;
    addSectionBtn.addEventListener('click', () => {
      toggleEditMode(false);
      openAdminPortal();
      setTimeout(() => {
        const tabBtn = document.querySelector('.dialog-tab-btn[data-tab="tab-sections"]');
        if (tabBtn) tabBtn.click();
      }, 50);
    });
    subsequentContainer.appendChild(addSectionBtn);
  }

  // Group and render applications
  const sortedApps = state.isEditing ? [...state.apps].sort((a, b) => a.order - b.order) : getSortedAppsForDisplay(state.apps);
  

  sortedApps.forEach(item => {
    // Hide sub-apps inside folders from main view
    const isSubApp = state.apps.some(a => a.type === 'folder' && a.appIds && a.appIds.includes(item.id));
    if (isSubApp && item.type === 'app') return;

    const appItem = document.createElement('div');
    appItem.className = 'app-item';
    if (item.type === 'folder') appItem.classList.add('folder-item');
    appItem.dataset.id = item.id;
    
    // Support drag and drop HTML5 APIs in edit mode
    if (state.isEditing) {
      appItem.setAttribute('draggable', 'true');
      setupDragDropEvents(appItem);
    }

    const hasAccess = activeUserHasAccess(item.id);
    
    // FOLDERS
    if (item.type === 'folder') {
      const accessibleSubApps = item.appIds.filter(subId => activeUserHasAccess(subId));
      const hasFolderAccess = accessibleSubApps.length > 0 || isAdmin;
      
      if (!hasFolderAccess && !state.isEditing) return;

      appItem.innerHTML = `
        <div class="app-icon-wrapper">
          <div class="app-icon folder-icon">
            ${item.appIds.slice(0, 4).map(subId => {
              const subApp = state.apps.find(a => a.id === subId);
              if (!subApp) return '';
              
              return `
                <div class="folder-mini-icon">
                  ${getIconMarkup(subApp)}
                </div>
              `;
            }).join('')}
          </div>
        </div>
        <div class="app-title">${item.name}</div>
      `;

      if (!hasFolderAccess) {
        appItem.classList.add('locked');
      } else {
        appItem.addEventListener('click', (e) => {
          if (!state.isEditing) openFolderDrawer(item.id);
        });
      }
    } else {
      // Regular Application
      if (!hasAccess && !state.isEditing) return; 

      appItem.innerHTML = `
        <div class="app-icon-wrapper">
          <div class="app-icon">
            ${getIconMarkup(item)}
          </div>
        </div>
        <div class="app-title">${item.name}</div>
      `;

      if (!hasAccess) {
        appItem.classList.add('locked');
        appItem.addEventListener('click', () => {
          showToast(`Access Restricted: Contact Admin for ${item.name} privileges.`, false);
        });
      } else {
        appItem.addEventListener('click', () => {
          if (!state.isEditing) {
            if (item.id === 'health-benefits') {
              openBenefitsPage();
            } else if (item.id === 'benefits-docs') {
              openBenefitsDocsPage();
            } else if (item.id === 'forklift-safety') {
              openForkliftSafetyPage();
            } else if (item.link) {
              showToast(`Opening ${item.name}...`);
              setTimeout(() => window.open(item.link, '_blank'), 800);
            }
          }
        });
      }
    }

    // Edit Mode delete/edit buttons
    if (state.isEditing) {
      const wrapper = appItem.querySelector('.app-icon-wrapper');
      
      wrapper.innerHTML += `
        <button class="app-delete-btn" type="button" aria-label="Delete App">&minus;</button>
        ${item.type !== 'folder' ? `<button class="app-edit-btn" type="button" aria-label="Edit App">&#9998;</button>` : ''}
      `;
      
      wrapper.querySelector('.app-delete-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
          deleteApp(item.id);
        }
      });
      
      const editBtn = wrapper.querySelector('.app-edit-btn');
      if (editBtn) {
        editBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          loadAppIntoForm(item);
        });
      }
    }

    // Append to the correct grid based on sectionId (falls back to the first section id if not matching)
    const targetSectionId = item.sectionId || 'default';
    const targetGrid = gridsMap[targetSectionId] || mainGrid;
    targetGrid.appendChild(appItem);
  });

  // When not in edit mode, hide empty subsequent sections so users don't see headers for sections with no accessible apps
  if (!state.isEditing) {
    for (let i = 1; i < sortedSections.length; i++) {
      const sec = sortedSections[i];
      const grid = gridsMap[sec.id];
      if (grid && grid.children.length === 0) {
        grid.style.display = 'none';
        const header = grid.previousElementSibling;
        if (header && header.classList.contains('subsequent-section-header')) {
          header.style.display = 'none';
        }
      }
    }
  }
}

// iOS Folder Drawer Overlay Controller
function openFolderDrawer(folderId) {
  state.activeFolderId = folderId;
  const folder = state.apps.find(a => a.id === folderId);
  if (!folder) return;

  const overlay = document.getElementById('folder-overlay');
  const titleInput = document.getElementById('folder-drawer-title');
  const folderGrid = document.getElementById('folder-app-grid');

  titleInput.value = folder.name;
  
  const activeUser = getActiveUser();
  titleInput.readOnly = !activeUser || activeUser.role !== 'Admin';

  folderGrid.innerHTML = '';
  
  folder.appIds.forEach(subId => {
    const app = state.apps.find(a => a.id === subId);
    if (!app) return;
    
    const hasAccess = activeUserHasAccess(app.id);
    if (!hasAccess && (!activeUser || activeUser.role !== 'Admin')) return; 

    const appItem = document.createElement('div');
    appItem.className = 'app-item';
    appItem.dataset.id = app.id;
    appItem.innerHTML = `
      <div class="app-icon-wrapper">
        <div class="app-icon">
          ${getIconMarkup(app)}
        </div>
      </div>
      <div class="app-title">${app.name}</div>
    `;

    if (!hasAccess) {
      appItem.classList.add('locked');
      appItem.addEventListener('click', () => {
        showToast(`Access Restricted: Contact Admin for ${app.name} privileges.`, false);
      });
    } else {
      appItem.addEventListener('click', () => {
        closeFolderDrawer();
        if (app.id === 'health-benefits') {
          openBenefitsPage();
        } else if (app.id === 'benefits-docs') {
          openBenefitsDocsPage();
        } else if (app.id === 'forklift-safety') {
          openForkliftSafetyPage();
        } else if (app.link) {
          showToast(`Opening ${app.name}...`);
          setTimeout(() => window.open(app.link, '_blank'), 800);
        }
      });
    }

    folderGrid.appendChild(appItem);
  });

  overlay.classList.add('active');
}

function closeFolderDrawer() {
  const overlay = document.getElementById('folder-overlay');
  overlay.classList.remove('active');
  state.activeFolderId = null;
}

// Rename folder logic
function handleFolderRename(e) {
  if (!state.activeFolderId) return;
  const folder = state.apps.find(a => a.id === state.activeFolderId);
  if (folder && e.target.value.trim()) {
    folder.name = e.target.value.trim();
    saveDatabase();
    syncAppToFirestore(folder);
    renderAppGrid();
  }
}

// --- Drag & Drop Reordering Logic (HTML5 DnD APIs) ---
let draggedElement = null;
let dragGhostEl = null;

function setupDragDropEvents(element) {
  element.addEventListener('dragstart', (e) => {
    draggedElement = element;
    element.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';

    // Build ghost clone with glow + position badge
    dragGhostEl = element.cloneNode(true);
    dragGhostEl.classList.add('drag-ghost');
    dragGhostEl.classList.remove('dragging');

    // Compute position badge (position among visible sortable items)
    const allVisible = Array.from(document.querySelectorAll('.app-grid .app-item'));
    const pos = allVisible.indexOf(element) + 1;
    const badge = document.createElement('div');
    badge.className = 'drag-position-badge';
    badge.textContent = `${pos} of ${allVisible.length}`;
    dragGhostEl.style.position = 'relative';
    dragGhostEl.appendChild(badge);

    document.body.appendChild(dragGhostEl);
    e.dataTransfer.setDragImage(dragGhostEl, dragGhostEl.offsetWidth / 2, dragGhostEl.offsetHeight / 2);
  });

  element.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  });

  element.addEventListener('dragenter', (e) => {
    e.preventDefault();
    if (element !== draggedElement) {
      element.classList.add('drag-over');
      element.classList.add('drag-target-pulse');
      setTimeout(() => element.classList.remove('drag-target-pulse'), 300);
    }
  });

  element.addEventListener('dragleave', () => {
    element.classList.remove('drag-over');
  });

  element.addEventListener('drop', (e) => {
    e.preventDefault();
    element.classList.remove('drag-over');
    
    if (element !== draggedElement) {
      const draggedId = draggedElement.dataset.id;
      const targetId = element.dataset.id;
      
      const draggedIndex = state.apps.findIndex(a => a.id === draggedId);
      const targetIndex = state.apps.findIndex(a => a.id === targetId);
      
      if (draggedIndex !== -1 && targetIndex !== -1) {
        const dragApp = state.apps[draggedIndex];
        const targetApp = state.apps[targetIndex];
        
        // Folders creation grouping on drag-over (only when in the same section)
        if (dragApp.type === 'app' && targetApp.type === 'app' && dragApp.sectionId === targetApp.sectionId) {
          if (confirm(`Combine "${dragApp.name}" and "${targetApp.name}" into a folder?`)) {
            const folderId = `folder-${Date.now()}`;
            const newFolder = {
              id: folderId,
              name: 'New Folder',
              icon: 'folder',
              order: targetApp.order,
              type: 'folder',
              appIds: [targetApp.id, dragApp.id],
              sectionId: targetApp.sectionId || 'default'
            };
            
            state.apps.push(newFolder);
            saveDatabase();
            syncAppToFirestore(newFolder);
            showToast('New Folder Created!');
            renderAppGrid();
            return;
          }
        }

        // If moved across sections, update sectionId
        if (dragApp.sectionId !== targetApp.sectionId) {
          dragApp.sectionId = targetApp.sectionId || 'default';
          syncAppToFirestore(dragApp);
        }

        // Swap reordering
        const tempOrder = state.apps[draggedIndex].order;
        state.apps[draggedIndex].order = state.apps[targetIndex].order;
        state.apps[targetIndex].order = tempOrder;
        
        saveDatabase();
        syncAllAppsOrderToFirestore();
        renderAppGrid();
        showToast('App layout updated');
      }
    }
  });

  element.addEventListener('dragend', () => {
    element.classList.remove('dragging');
    draggedElement = null;
    if (dragGhostEl) {
      dragGhostEl.remove();
      dragGhostEl = null;
    }
  });
}

function setupGridContainerDragDrop(gridEl, sectionId) {
  gridEl.dataset.sectionId = sectionId;

  gridEl.addEventListener('dragover', (e) => {
    if (state.isEditing && draggedElement) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    }
  });

  gridEl.addEventListener('dragenter', (e) => {
    if (state.isEditing && draggedElement) {
      gridEl.classList.add('grid-drag-over');
    }
  });

  gridEl.addEventListener('dragleave', (e) => {
    if (!gridEl.contains(e.relatedTarget)) {
      gridEl.classList.remove('grid-drag-over');
    }
  });

  gridEl.addEventListener('drop', (e) => {
    gridEl.classList.remove('grid-drag-over');
    if (!state.isEditing || !draggedElement) return;

    // If dropped directly on an app-item child, the app-item's own drop handler will handle it
    if (e.target.closest('.app-item')) return;

    e.preventDefault();
    const draggedId = draggedElement.dataset.id;
    const dragApp = state.apps.find(a => a.id === draggedId);
    if (!dragApp) return;

    if (dragApp.sectionId !== sectionId) {
      dragApp.sectionId = sectionId;
      const sectionApps = state.apps.filter(a => a.sectionId === sectionId && a.id !== dragApp.id);
      const maxOrder = sectionApps.length > 0 ? Math.max(...sectionApps.map(a => a.order || 0)) : -1;
      dragApp.order = maxOrder + 1;

      saveDatabase();
      syncAppToFirestore(dragApp);
      syncAllAppsOrderToFirestore();
      renderAppGrid();
      showToast(`Moved "${dragApp.name}" to section`);
    }
  });
}


// Edit Mode controller
function toggleEditMode(forceState = null) {
  state.isEditing = forceState !== null ? forceState : !state.isEditing;
  const shell = document.getElementById('ios-shell');
  const btn = document.getElementById('btn-edit-grid');
  const btnAdd = document.getElementById('btn-add-app');

  if (state.isEditing) {
    shell.classList.add('editing');
    btn.innerHTML = `
      <svg style="width: 14px; height: 14px;" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"></path></svg>
      Done
    `;
    btn.classList.add('btn-ios-accent');
    
    const activeUser = getActiveUser();
    const r = activeUser ? (activeUser.role || '').toLowerCase() : '';
    const isPrivileged = r.includes('admin') || r.includes('president') || r.includes('boss') || r.includes('executive') || r.includes('chief');
    if (activeUser && isPrivileged) {
      btnAdd.style.display = 'block';
    }
  } else {
    shell.classList.remove('editing');
    btn.innerHTML = `
      <svg style="width: 14px; height: 14px;" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"></path></svg>
      Edit Layout
    `;
    btn.classList.remove('btn-ios-accent');
    btnAdd.style.display = 'none';
  }
  
  renderAppGrid();
}

function deleteApp(appId) {
  const appIndex = state.apps.findIndex(a => a.id === appId);
  if (appIndex === -1) return;
  
  state.apps.splice(appIndex, 1);
  saveDatabase();
  syncDeleteAppFromFirestore(appId);
  renderAppGrid();
  renderAppsPanelList();
  showToast('Application deleted successfully');
}

// --- Inline Admin Navigation Controller (Replaces popup dialog!) ---

function openAdminPortal() {
  if (state.isEditing) toggleEditMode(false);
  closeBenefitsPage(false);
  closeBenefitsDocsPage(false);
  closeForkliftSafetyPage(false);
  closeForkliftTrainingPage(false);

  // Switch display elements
  document.getElementById('main-app-grid').style.display = 'none';
  document.getElementById('ios-toolbar').style.display = 'none';
  
  const subsequentContainer = document.getElementById('subsequent-sections-container');
  if (subsequentContainer) subsequentContainer.style.display = 'none';
  
  const topActions = document.getElementById('top-actions-bar');
  if (topActions) topActions.style.display = 'none';
  
  document.getElementById('admin-panel-inline').style.display = 'flex';
  
  // Pre-fill profile settings
  loadProfileIntoForm();

  // Render tab controls based on role (Admin gets all tabs, non-Admin only gets 'My Account')
  const activeUser = getActiveUser();
  const r = activeUser ? (activeUser.role || '').toLowerCase() : '';
  const isPrivileged = r.includes('admin') || r.includes('president') || r.includes('boss') || r.includes('executive') || r.includes('chief');
  const isAdmin = activeUser && isPrivileged;
  
  const adminTabs = ['tab-btn-apps', 'tab-btn-sections', 'tab-btn-permissions', 'tab-btn-users', 'tab-btn-broadcasts', 'tab-btn-forklift', 'tab-btn-suggestions'];
  adminTabs.forEach(tabId => {
    const tabBtn = document.getElementById(tabId);
    if (tabBtn) {
      tabBtn.style.display = isAdmin ? 'inline-block' : 'none';
    }
  });

  // Switch to 'My Account' tab initially
  document.querySelector('.dialog-tab-btn[data-tab="tab-account"]').click();
  
  if (isAdmin) {
    renderIconSelector();
    renderPermissionsMatrix();
    renderUsersList();
    renderBroadcastList();
    renderAppsPanelList();
    renderSectionsPanelList();
    renderAppSectionSelect();
    renderSuggestionsPanelList();
    renderForkliftAdminTab();
  }
}

function closeAdminPortal() {
  document.getElementById('admin-panel-inline').style.display = 'none';
  document.getElementById('main-app-grid').style.display = 'grid';
  document.getElementById('ios-toolbar').style.display = 'flex';
  
  const subsequentContainer = document.getElementById('subsequent-sections-container');
  if (subsequentContainer) subsequentContainer.style.display = 'block';
  
  renderAppGrid();
}

// --- Health Benefits & Benefits Documents Controllers & Catalogs ---

const BENEFITS_DOCUMENTS = [
  {
    id: 'doc-allied-proposal',
    title: 'Allied Health HSA Freedom Traditional $4,000 Proposal',
    category: 'health',
    categoryLabel: 'Health Plan',
    tag: 'Primary Insurance Proposal',
    description: 'Complete medical plan proposal, underwriting details, benefit schedule, and deductible rules from Allied Health.',
    file: 'assets/benefits/Allied_HSA_Freedom_Traditional_4000_Proposal.pdf',
    fileName: 'Allied_HSA_Freedom_Traditional_4000_Proposal.pdf'
  },
  {
    id: 'doc-sec125-spd',
    title: 'Section 125 Summary Plan Description (SPD)',
    category: 'sec125',
    categoryLabel: 'Section 125 Plan',
    tag: 'Plan Guide',
    description: 'Comprehensive employee explanation of the 4HGS Section 125 Pre-Tax Cafeteria Plan rules, rights, and eligibility.',
    file: 'assets/benefits/UnifiedSPD.pdf',
    fileName: 'UnifiedSPD.pdf'
  },
  {
    id: 'doc-sec125-doc',
    title: 'Section 125 Flexible Benefits Plan Document',
    category: 'sec125',
    categoryLabel: 'Section 125 Plan',
    tag: 'Official Plan Document',
    description: 'Formal written legal plan document establishing the provisions and tax compliance for our Flexible Benefits Plan.',
    file: 'assets/benefits/UnifiedDOC.pdf',
    fileName: 'UnifiedDOC.pdf'
  },
  {
    id: 'doc-sec125-enrollment',
    title: 'Section 125 Employee Enrollment Form',
    category: 'forms',
    categoryLabel: 'Forms & Waivers',
    tag: 'Enrollment Form',
    description: 'Official form for employees to enroll and elect pre-tax benefit deductions for healthcare coverage.',
    file: 'assets/benefits/UnifiedEnrollment.pdf',
    fileName: 'UnifiedEnrollment.pdf'
  },
  {
    id: 'doc-sec125-waiver',
    title: 'Section 125 Election & Compensation Reduction Waiver',
    category: 'forms',
    categoryLabel: 'Forms & Waivers',
    tag: 'Salary Reduction Waiver',
    description: 'Agreement to reduce salary on a pre-tax basis for benefit premiums or waive participation in the plan.',
    file: 'assets/benefits/FlexElectionWaiver.pdf',
    fileName: 'FlexElectionWaiver.pdf'
  },
  {
    id: 'doc-sec125-status',
    title: 'Section 125 Qualifying Change of Status Event Form',
    category: 'forms',
    categoryLabel: 'Forms & Waivers',
    tag: 'Status Change Form',
    description: 'Required form to update or change pre-tax elections mid-year due to qualifying life events (marriage, birth, loss of coverage).',
    file: 'assets/benefits/FlexChangeOfStatus.pdf',
    fileName: 'FlexChangeOfStatus.pdf'
  },
  {
    id: 'doc-sec125-revocation',
    title: 'Section 125 Revocation of Election Form',
    category: 'forms',
    categoryLabel: 'Forms & Waivers',
    tag: 'Revocation Form',
    description: 'Form to revoke existing pre-tax salary reduction elections when permitted by Section 125 IRS regulations.',
    file: 'assets/benefits/FlexRevocation.pdf',
    fileName: 'FlexRevocation.pdf'
  },
  {
    id: 'doc-sec125-resolution',
    title: 'Section 125 Corporate Resolution',
    category: 'sec125',
    categoryLabel: 'Section 125 Plan',
    tag: 'Corporate Authorization',
    description: 'Corporate resolution formally adopting the 4HG Source LLC Section 125 Flexible Benefits Plan.',
    file: 'assets/benefits/UnifiedCorporateResolution.pdf',
    fileName: 'UnifiedCorporateResolution.pdf'
  }
];

let currentDocsFilter = 'all';
let currentDocsSearch = '';

function openBenefitsPage() {
  if (state.isEditing) toggleEditMode(false);
  const adminPanel = document.getElementById('admin-panel-inline');
  if (adminPanel) adminPanel.style.display = 'none';
  closeBenefitsDocsPage(false);
  closeForkliftSafetyPage(false);
  closeForkliftTrainingPage(false);

  document.getElementById('main-app-grid').style.display = 'none';
  document.getElementById('ios-toolbar').style.display = 'none';
  
  const subsequentContainer = document.getElementById('subsequent-sections-container');
  if (subsequentContainer) subsequentContainer.style.display = 'none';
  
  const topActions = document.getElementById('top-actions-bar');
  if (topActions) topActions.style.display = 'none';
  
  const benefitsPanel = document.getElementById('benefits-page-inline');
  if (benefitsPanel) {
    benefitsPanel.style.display = 'flex';
    renderBenefitsPage();
    const shell = document.querySelector('.ios-screen-content');
    if (shell) shell.scrollTop = 0;
  }
}

function closeBenefitsPage(restoreGrid = true) {
  const benefitsPanel = document.getElementById('benefits-page-inline');
  if (benefitsPanel) benefitsPanel.style.display = 'none';

  if (restoreGrid) {
    document.getElementById('main-app-grid').style.display = 'grid';
    document.getElementById('ios-toolbar').style.display = 'flex';
    
    const subsequentContainer = document.getElementById('subsequent-sections-container');
    if (subsequentContainer) subsequentContainer.style.display = 'block';
    
    renderAppGrid();
  }
}

function openBenefitsDocsPage(initialFilter = 'all') {
  if (state.isEditing) toggleEditMode(false);
  const adminPanel = document.getElementById('admin-panel-inline');
  if (adminPanel) adminPanel.style.display = 'none';
  closeBenefitsPage(false);
  closeForkliftSafetyPage(false);
  closeForkliftTrainingPage(false);

  document.getElementById('main-app-grid').style.display = 'none';
  document.getElementById('ios-toolbar').style.display = 'none';
  
  const subsequentContainer = document.getElementById('subsequent-sections-container');
  if (subsequentContainer) subsequentContainer.style.display = 'none';
  
  const topActions = document.getElementById('top-actions-bar');
  if (topActions) topActions.style.display = 'none';
  
  const docsPanel = document.getElementById('benefits-docs-page-inline');
  if (docsPanel) {
    docsPanel.style.display = 'flex';
    currentDocsFilter = initialFilter;
    currentDocsSearch = '';
    renderBenefitsDocsPage();
    const shell = document.querySelector('.ios-screen-content');
    if (shell) shell.scrollTop = 0;
  }
}

function closeBenefitsDocsPage(restoreGrid = true) {
  const docsPanel = document.getElementById('benefits-docs-page-inline');
  if (docsPanel) docsPanel.style.display = 'none';

  if (restoreGrid) {
    document.getElementById('main-app-grid').style.display = 'grid';
    document.getElementById('ios-toolbar').style.display = 'flex';
    
    const subsequentContainer = document.getElementById('subsequent-sections-container');
    if (subsequentContainer) subsequentContainer.style.display = 'block';
    
    renderAppGrid();
  }
}

function renderBenefitsPage() {
  const container = document.getElementById('benefits-page-inline');
  if (!container) return;

  container.innerHTML = `
    <!-- Top Nav Header -->
    <div class="view-nav-header">
      <div class="view-nav-actions-left">
        <button class="btn-ios" id="btn-back-from-benefits" type="button">
          <svg style="width: 14px; height: 14px;" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"></path></svg>
          Back to Dashboard
        </button>
        <span class="view-badge">
          <svg style="width: 12px; height: 12px;" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          Active Plan • 2026
        </span>
      </div>
      <div class="view-nav-actions-right">
        <button class="btn-ios btn-ios-accent" id="btn-benefits-to-docs" type="button">
          <svg style="width: 14px; height: 14px;" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
          Benefits Documents (8 PDFs) &rarr;
        </button>
      </div>
    </div>

    <!-- Hero Card -->
    <div class="benefits-hero-card">
      <div class="benefits-hero-content">
        <div class="benefits-hero-header">
          <div class="benefits-hero-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
          </div>
          <div class="benefits-hero-title-group">
            <h1>4HGS Health Benefits Plan</h1>
            <p>Allied Health &bull; HSA Freedom Traditional $4,000 Plan &bull; Plan Year 2026</p>
          </div>
        </div>
        <p style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.5;">
          4HG Source provides comprehensive, high-quality medical coverage coupled with a tax-advantaged Health Savings Account (HSA) and Section 125 Pre-Tax Cafeteria Plan. Below is a complete visual breakdown of your coverage, cost-sharing, and savings opportunities.
        </p>
        <div class="benefits-hero-actions">
          <a href="assets/benefits/Allied_HSA_Freedom_Traditional_4000_Proposal.pdf" target="_blank" rel="noopener noreferrer" class="btn-hero-primary">
            <svg style="width: 16px; height: 16px;" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
            Download Official Allied Benefits Proposal (PDF)
          </a>
          <button type="button" class="btn-hero-secondary" id="btn-hero-view-docs">
            <svg style="width: 16px; height: 16px;" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"></path></svg>
            All Plan & Section 125 Documents
          </button>
        </div>
      </div>
    </div>

    <!-- Key Plan Metrics Grid -->
    <div class="benefits-section-header">
      <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 14.25l6-6m4.5-3.75l-6 6m0 0l-3-3m3 3l3 3M3 21l6-6m0 0l-3-3m3 3l3 3"></path></svg>
      <h2>Key Plan Parameters & Cost Protection</h2>
    </div>

    <div class="benefits-metrics-grid">
      <!-- Deductible Card -->
      <div class="metric-card">
        <div class="metric-card-header">
          <span class="metric-card-label">Annual Deductible</span>
          <div class="metric-card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
          </div>
        </div>
        <div class="metric-card-value">$4,000 <span style="font-size: 1rem; color: var(--text-secondary); font-weight: 500;">/ $8,000</span></div>
        <div class="metric-card-sub"><strong>$4,000</strong> Individual Limit embedded in <strong>$8,000</strong> Family Limit. Integrated for Medical & Rx.</div>
      </div>

      <!-- Coinsurance Card -->
      <div class="metric-card">
        <div class="metric-card-header">
          <span class="metric-card-label">Plan Coinsurance</span>
          <div class="metric-card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
          </div>
        </div>
        <div class="metric-card-value highlight-green">0% <span style="font-size: 1rem; color: var(--text-secondary); font-weight: 500;">Coinsurance</span></div>
        <div class="metric-card-sub">Plan pays <strong>100%</strong> of covered in-network medical costs after your deductible is reached ($0 coinsurance).</div>
      </div>

      <!-- Total Out of Pocket (TOOP) Card -->
      <div class="metric-card">
        <div class="metric-card-header">
          <span class="metric-card-label">Out-of-Pocket Max</span>
          <div class="metric-card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          </div>
        </div>
        <div class="metric-card-value">$4,000 <span style="font-size: 1rem; color: var(--text-secondary); font-weight: 500;">/ $8,000</span></div>
        <div class="metric-card-sub"><strong>$4,000</strong> Individual / <strong>$8,000</strong> Family maximum liability cap per plan year. Complete financial security.</div>
      </div>

      <!-- HSA Triple Tax Status Card -->
      <div class="metric-card">
        <div class="metric-card-header">
          <span class="metric-card-label">HSA Status</span>
          <div class="metric-card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          </div>
        </div>
        <div class="metric-card-value highlight-green" style="font-size: 1.45rem;">HSA Eligible</div>
        <div class="metric-card-sub">Qualified High-Deductible Health Plan (HDHP) with <strong>Triple Tax Advantage</strong> for your healthcare dollars.</div>
      </div>
    </div>

    <!-- Prescription Drug Coverage -->
    <div class="benefits-section-header">
      <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3"></path></svg>
      <h2>Prescription Drug (Rx) Coverage Tiers</h2>
    </div>
    
    <div style="background: rgba(141, 220, 4, 0.05); border: 1px solid rgba(141, 220, 4, 0.15); border-radius: 10px; padding: 0.75rem 1rem; font-size: 0.85rem; color: var(--text-secondary);">
      <strong style="color: var(--accent-green);">Rx Deductible:</strong> Integrated with Medical Deductible ($4,000 Individual / $8,000 Family). Once deductible is satisfied, copays apply as follows:
    </div>

    <div class="benefits-rx-grid">
      <div class="rx-tier-card">
        <span class="rx-tier-badge">Tier 0</span>
        <div class="rx-tier-price">$3</div>
        <div class="rx-tier-name">Preventive Care Rx</div>
        <div class="rx-tier-note">Value preventive medications</div>
      </div>

      <div class="rx-tier-card">
        <span class="rx-tier-badge">Tier 1</span>
        <div class="rx-tier-price">$10</div>
        <div class="rx-tier-name">Generic Medications</div>
        <div class="rx-tier-note">High quality, low cost formulas</div>
      </div>

      <div class="rx-tier-card">
        <span class="rx-tier-badge">Tier 2</span>
        <div class="rx-tier-price">$30</div>
        <div class="rx-tier-name">Preferred Brand</div>
        <div class="rx-tier-note">Formulary brand medications</div>
      </div>

      <div class="rx-tier-card">
        <span class="rx-tier-badge">Tier 3</span>
        <div class="rx-tier-price">$50</div>
        <div class="rx-tier-name">Non-Preferred Brand</div>
        <div class="rx-tier-note">Non-formulary brand medications</div>
      </div>

      <div class="rx-tier-card">
        <span class="rx-tier-badge">Tier 4</span>
        <div class="rx-tier-price">10% – 50%</div>
        <div class="rx-tier-name">Specialty Medications</div>
        <div class="rx-tier-note">Complex biologics & injectables</div>
      </div>
    </div>

    <!-- Medical Services Coverage Breakdown Grid -->
    <div class="benefits-section-header">
      <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"></path></svg>
      <h2>Medical Services & In-Network Coverage</h2>
    </div>

    <div class="benefits-coverage-grid">
      <!-- Preventive -->
      <div class="coverage-card">
        <div>
          <div class="coverage-card-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            Preventive & Wellness Care
          </div>
          <p class="coverage-card-desc">Annual routine checkups, standard immunizations, mammograms, colonoscopies, and well-child visits.</p>
        </div>
        <span class="coverage-card-badge badge-green">100% Covered (No Deductible)</span>
      </div>

      <!-- Primary Care -->
      <div class="coverage-card">
        <div>
          <div class="coverage-card-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            Primary Care Physician (PCP)
          </div>
          <p class="coverage-card-desc">Office visits with your regular primary care doctor for general illness, exams, and treatment.</p>
        </div>
        <span class="coverage-card-badge">0% Coinsurance (After Deductible)</span>
      </div>

      <!-- Specialist -->
      <div class="coverage-card">
        <div>
          <div class="coverage-card-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
            Specialist Office Visits
          </div>
          <p class="coverage-card-desc">Consultations with certified specialists (cardiology, orthopedics, neurology, dermatology, etc.).</p>
        </div>
        <span class="coverage-card-badge">0% Coinsurance (After Deductible)</span>
      </div>

      <!-- Urgent Care -->
      <div class="coverage-card">
        <div>
          <div class="coverage-card-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>
            Urgent Care Centers
          </div>
          <p class="coverage-card-desc">Immediate walk-in medical clinics for non-life-threatening illnesses, minor sprains, stitches, or infections.</p>
        </div>
        <span class="coverage-card-badge">0% Coinsurance (After Deductible)</span>
      </div>

      <!-- Emergency Room -->
      <div class="coverage-card">
        <div>
          <div class="coverage-card-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
            Emergency Room Services
          </div>
          <p class="coverage-card-desc">Hospital emergency department evaluation and treatment for acute life-threatening conditions.</p>
        </div>
        <span class="coverage-card-badge">0% Coinsurance (After Deductible)</span>
      </div>

      <!-- Inpatient Hospital -->
      <div class="coverage-card">
        <div>
          <div class="coverage-card-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
            Hospital Inpatient & Surgery
          </div>
          <p class="coverage-card-desc">Hospital room & board, surgical suite, anesthesia, inpatient physician care, and operating room expenses.</p>
        </div>
        <span class="coverage-card-badge">0% Coinsurance (After Deductible)</span>
      </div>

      <!-- Diagnostic Labs & Imaging -->
      <div class="coverage-card">
        <div>
          <div class="coverage-card-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            Diagnostic Labs & Imaging
          </div>
          <p class="coverage-card-desc">Diagnostic blood tests, pathology, routine X-rays, MRI, CT scans, and advanced clinical imaging.</p>
        </div>
        <span class="coverage-card-badge">0% Coinsurance (After Deductible)</span>
      </div>

      <!-- Maternity -->
      <div class="coverage-card">
        <div>
          <div class="coverage-card-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path></svg>
            Maternity & Newborn Care
          </div>
          <p class="coverage-card-desc">Prenatal doctor visits, labor, hospital delivery, postpartum care, and newborn nursery care.</p>
        </div>
        <span class="coverage-card-badge">0% Coinsurance (After Deductible)</span>
      </div>
    </div>

    <!-- HSA Explainer Card -->
    <div class="benefits-feature-card">
      <div class="benefits-section-header" style="margin-top: 0;">
        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <h2>Health Savings Account (HSA) — Triple-Tax Advantages</h2>
      </div>

      <div class="feature-steps-row">
        <div class="feature-step-box">
          <span class="feature-step-num">Advantage 01</span>
          <div class="feature-step-title">100% Tax-Free In</div>
          <div class="feature-step-desc">Contributions directly from payroll lower your gross taxable income dollar-for-dollar.</div>
        </div>

        <div class="feature-step-box">
          <span class="feature-step-num">Advantage 02</span>
          <div class="feature-step-title">100% Tax-Free Growth</div>
          <div class="feature-step-desc">Your balance earns interest or investment returns without any capital gains or income taxes.</div>
        </div>

        <div class="feature-step-box">
          <span class="feature-step-num">Advantage 03</span>
          <div class="feature-step-title">100% Tax-Free Out</div>
          <div class="feature-step-desc">Withdraw anytime for medical, dental, vision, prescription copays, and eligible healthcare expenses.</div>
        </div>
      </div>

      <div class="feature-callout-box">
        <div class="feature-callout-text">
          <strong>2026 IRS Annual HSA Limits:</strong> Individual Coverage: <strong>$4,300/yr</strong> &bull; Family Coverage: <strong>$8,550/yr</strong> &bull; Catch-up (55+): <strong>+$1,000/yr</strong>
        </div>
        <span style="font-size: 0.8rem; color: var(--text-secondary); font-weight: 600;">*HSA funds roll over year-to-year & belong to you forever.</span>
      </div>
    </div>

    <!-- Section 125 Plan Card -->
    <div class="benefits-feature-card">
      <div class="benefits-section-header" style="margin-top: 0;">
        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"></path></svg>
        <h2>Section 125 Cafeteria Plan — Pre-Tax Savings</h2>
      </div>

      <p style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.5;">
        4HG Source has implemented an IRS Section 125 Cafeteria Plan to maximize your take-home pay. Under Section 125, employee healthcare contributions and premiums are deducted from your paycheck <strong>before taxes are calculated</strong>, eliminating Federal Income Tax, State Income Tax, and 7.65% Social Security & Medicare (FICA) taxes on those amounts.
      </p>

      <div class="feature-callout-box" style="background: rgba(0, 198, 255, 0.08); border-color: rgba(0, 198, 255, 0.25);">
        <div class="feature-callout-text">
          <strong style="color: #00c6ff;">Need Section 125 Forms?</strong> Access all plan descriptions, enrollment election forms, status change requests, and waivers on our Documents Hub.
        </div>
        <button type="button" class="btn-ios btn-ios-accent" id="btn-sec125-view-docs" style="padding: 0.45rem 1rem; font-size: 0.8rem;">
          View Section 125 Documents (7 Files) &rarr;
        </button>
      </div>
    </div>

    <!-- Bottom Actions -->
    <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--glass-border); padding-top: 1.25rem; flex-wrap: wrap; gap: 1rem;">
      <button class="btn-ios" id="btn-bottom-back-to-dash" type="button">
        &larr; Back to Dashboard
      </button>
      <div style="display: flex; gap: 0.75rem;">
        <a href="assets/benefits/Allied_HSA_Freedom_Traditional_4000_Proposal.pdf" target="_blank" rel="noopener noreferrer" class="btn-ios">
          <svg style="width: 14px; height: 14px;" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
          Allied Proposal PDF
        </a>
        <button class="btn-ios btn-ios-accent" id="btn-bottom-to-docs" type="button">
          Open Benefits Documents &rarr;
        </button>
      </div>
    </div>
  `;

  // Attach event handlers
  document.getElementById('btn-back-from-benefits').addEventListener('click', () => closeBenefitsPage());
  document.getElementById('btn-bottom-back-to-dash').addEventListener('click', () => closeBenefitsPage());
  document.getElementById('btn-benefits-to-docs').addEventListener('click', () => openBenefitsDocsPage('all'));
  document.getElementById('btn-hero-view-docs').addEventListener('click', () => openBenefitsDocsPage('all'));
  document.getElementById('btn-sec125-view-docs').addEventListener('click', () => openBenefitsDocsPage('sec125'));
  document.getElementById('btn-bottom-to-docs').addEventListener('click', () => openBenefitsDocsPage('all'));
}

function renderBenefitsDocsPage() {
  const container = document.getElementById('benefits-docs-page-inline');
  if (!container) return;

  // Filter documents
  const filteredDocs = BENEFITS_DOCUMENTS.filter(doc => {
    const matchesFilter = currentDocsFilter === 'all' || doc.category === currentDocsFilter;
    const query = currentDocsSearch.toLowerCase().trim();
    const matchesSearch = !query || 
      doc.title.toLowerCase().includes(query) || 
      doc.description.toLowerCase().includes(query) || 
      doc.tag.toLowerCase().includes(query);
    return matchesFilter && matchesSearch;
  });

  const countAll = BENEFITS_DOCUMENTS.length;
  const countHealth = BENEFITS_DOCUMENTS.filter(d => d.category === 'health').length;
  const countSec125 = BENEFITS_DOCUMENTS.filter(d => d.category === 'sec125').length;
  const countForms = BENEFITS_DOCUMENTS.filter(d => d.category === 'forms').length;

  container.innerHTML = `
    <!-- Top Nav Header -->
    <div class="view-nav-header">
      <div class="view-nav-actions-left">
        <button class="btn-ios" id="btn-back-to-benefits-from-docs" type="button">
          <svg style="width: 14px; height: 14px;" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"></path></svg>
          Back to Health Benefits
        </button>
        <button class="btn-ios" id="btn-back-to-dash-from-docs" type="button">
          Dashboard
        </button>
        <span class="view-badge">
          <svg style="width: 12px; height: 12px;" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"></path></svg>
          Benefits Documents Library
        </span>
      </div>
      <div class="view-nav-actions-right">
        <span style="font-size: 0.8rem; color: var(--text-secondary); font-weight: 600;">
          Showing ${filteredDocs.length} of ${countAll} Files
        </span>
      </div>
    </div>

    <!-- Documents Page Header -->
    <div style="display: flex; flex-direction: column; gap: 0.35rem;">
      <h1 style="font-size: 1.5rem; font-weight: 800; color: var(--text-primary);">
        Benefits & Section 125 Documents
      </h1>
      <p style="font-size: 0.9rem; color: var(--text-secondary);">
        Direct access to all official healthcare proposals, Section 125 Cafeteria Plan documents, enrollment forms, and election change waivers.
      </p>
    </div>

    <!-- Search & Filters Toolbar -->
    <div class="docs-toolbar">
      <div class="docs-search-wrapper">
        <svg class="docs-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        <input type="text" id="docs-search-input" class="docs-search-input" placeholder="Search benefits documents, forms, or keywords..." value="${currentDocsSearch}" autocomplete="off">
      </div>
      
      <div class="docs-filter-chips">
        <button type="button" class="doc-chip-btn ${currentDocsFilter === 'all' ? 'active' : ''}" data-filter="all">All Documents (${countAll})</button>
        <button type="button" class="doc-chip-btn ${currentDocsFilter === 'health' ? 'active' : ''}" data-filter="health">Health Plan (${countHealth})</button>
        <button type="button" class="doc-chip-btn ${currentDocsFilter === 'sec125' ? 'active' : ''}" data-filter="sec125">Section 125 Plan (${countSec125})</button>
        <button type="button" class="doc-chip-btn ${currentDocsFilter === 'forms' ? 'active' : ''}" data-filter="forms">Forms & Waivers (${countForms})</button>
      </div>
    </div>

    <!-- Cards Grid -->
    <div class="docs-cards-grid" id="docs-cards-grid">
      ${filteredDocs.length > 0 ? filteredDocs.map(doc => `
        <div class="doc-card" data-id="${doc.id}">
          <div>
            <div class="doc-card-header">
              <div class="doc-card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
              </div>
              <div class="doc-card-info">
                <span class="doc-card-tag">${doc.tag}</span>
                <div class="doc-card-title">${doc.title}</div>
              </div>
            </div>
            <p class="doc-card-desc" style="margin-top: 0.75rem;">
              ${doc.description}
            </p>
          </div>

          <div class="doc-card-actions">
            <a href="${doc.file}" target="_blank" rel="noopener noreferrer" class="btn-doc-action btn-doc-open">
              <svg style="width: 14px; height: 14px;" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"></path></svg>
              Open PDF ↗
            </a>
            <a href="${doc.file}" download="${doc.fileName}" class="btn-doc-action btn-doc-download">
              <svg style="width: 14px; height: 14px;" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"></path></svg>
              Download ↓
            </a>
          </div>
        </div>
      `).join('') : `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: var(--text-secondary);">
          <div style="font-size: 1.1rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.5rem;">No documents match your search</div>
          <p style="font-size: 0.85rem;">Try adjusting your keyword search or clicking a different category chip above.</p>
        </div>
      `}
    </div>
  `;

  // Attach nav handlers
  document.getElementById('btn-back-to-benefits-from-docs').addEventListener('click', () => openBenefitsPage());
  document.getElementById('btn-back-to-dash-from-docs').addEventListener('click', () => closeBenefitsDocsPage());

  // Search input handler
  const searchInput = document.getElementById('docs-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentDocsSearch = e.target.value;
      renderBenefitsDocsPage();
      const inputRef = document.getElementById('docs-search-input');
      if (inputRef) {
        inputRef.focus();
        inputRef.setSelectionRange(inputRef.value.length, inputRef.value.length);
      }
    });
  }

  // Filter chips handler
  document.querySelectorAll('.doc-chip-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentDocsFilter = btn.dataset.filter;
      renderBenefitsDocsPage();
    });
  });
}

// --- Forklift Safety & 3-Year Certification Controller & Views ---

function addThreeYears(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const d = new Date(year, month, day);
  if (isNaN(d.getTime())) return null;
  d.setFullYear(d.getFullYear() + 3);
  return d;
}

function getOperatorRecertData(op) {
  if (op.status !== 'Certified' || !op.certDate) {
    return {
      status: 'in-progress',
      statusText: 'In Progress',
      statusBadgeClass: 'forklift-badge-blue',
      countdownText: 'In Training',
      countdownSub: 'Certification in progress',
      countdownClass: 'blue',
      certFormatted: 'In Training',
      recertFormatted: 'Pending evaluation',
      daysRemaining: null
    };
  }

  const recertDate = addThreeYears(op.certDate);
  if (!recertDate) {
    return {
      status: 'unknown',
      statusText: 'Unknown Date',
      statusBadgeClass: 'forklift-badge-amber',
      countdownText: 'N/A',
      countdownSub: 'Check certification date',
      countdownClass: 'yellow',
      certFormatted: op.certDate,
      recertFormatted: 'N/A',
      daysRemaining: null
    };
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(recertDate.getFullYear(), recertDate.getMonth(), recertDate.getDate());
  const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  const certParts = op.certDate.split('-');
  const certDateObj = new Date(parseInt(certParts[0], 10), parseInt(certParts[1], 10) - 1, parseInt(certParts[2], 10));
  const certFormatted = certDateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  const recertFormatted = recertDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  if (diffDays < 0) {
    return {
      status: 'expired',
      statusText: 'Recert Overdue',
      statusBadgeClass: 'badge-danger',
      countdownText: 'EXPIRED',
      countdownSub: `${Math.abs(diffDays)} days past due`,
      countdownClass: 'red',
      certFormatted,
      recertFormatted,
      daysRemaining: diffDays
    };
  }

  let countdownClass = 'green';
  let statusBadgeClass = 'forklift-badge-green';
  if (diffDays <= 30) {
    countdownClass = 'red';
    statusBadgeClass = 'badge-danger';
  } else if (diffDays <= 180) {
    countdownClass = 'yellow';
    statusBadgeClass = 'forklift-badge-amber';
  }

  return {
    status: 'certified',
    statusText: 'Certified',
    statusBadgeClass,
    countdownText: `${diffDays} Days`,
    countdownSub: 'Until 3-Yr Recertification',
    countdownClass,
    certFormatted,
    recertFormatted,
    daysRemaining: diffDays
  };
}

function openForkliftSafetyPage() {
  if (state.isEditing) toggleEditMode(false);
  const adminPanel = document.getElementById('admin-panel-inline');
  if (adminPanel) adminPanel.style.display = 'none';
  closeBenefitsPage(false);
  closeBenefitsDocsPage(false);
  closeForkliftTrainingPage(false);

  document.getElementById('main-app-grid').style.display = 'none';
  document.getElementById('ios-toolbar').style.display = 'none';
  
  const subsequentContainer = document.getElementById('subsequent-sections-container');
  if (subsequentContainer) subsequentContainer.style.display = 'none';
  
  const topActions = document.getElementById('top-actions-bar');
  if (topActions) topActions.style.display = 'none';
  
  const forkliftPanel = document.getElementById('forklift-page-inline');
  if (forkliftPanel) {
    forkliftPanel.style.display = 'flex';
    renderForkliftSafetyPage();
    const shell = document.querySelector('.ios-screen-content');
    if (shell) shell.scrollTop = 0;
  }
}

function closeForkliftSafetyPage(restoreGrid = true) {
  const forkliftPanel = document.getElementById('forklift-page-inline');
  if (forkliftPanel) forkliftPanel.style.display = 'none';

  const forkliftTrainingPanel = document.getElementById('forklift-training-page-inline');
  if (forkliftTrainingPanel) forkliftTrainingPanel.style.display = 'none';

  if (restoreGrid) {
    document.getElementById('main-app-grid').style.display = 'grid';
    document.getElementById('ios-toolbar').style.display = 'flex';
    
    const subsequentContainer = document.getElementById('subsequent-sections-container');
    if (subsequentContainer) subsequentContainer.style.display = 'block';
    
    renderAppGrid();
  }
}

function renderForkliftSafetyPage() {
  const container = document.getElementById('forklift-page-inline');
  if (!container) return;

  const cfg = state.forkliftConfig || DEFAULT_FORKLIFT_CONFIG;
  const operators = (cfg.operators && cfg.operators.length > 0) ? cfg.operators : DEFAULT_FORKLIFT_CONFIG.operators;

  container.innerHTML = `
    <!-- Top Nav Header -->
    <div class="view-nav-header">
      <div class="view-nav-actions-left">
        <button class="btn-ios" id="btn-back-from-forklift" type="button">
          <svg style="width: 14px; height: 14px;" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"></path></svg>
          Back to Dashboard
        </button>
        <span class="view-badge forklift-badge-amber">
          <svg style="width: 12px; height: 12px;" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          ${escapeHTML(cfg.model || 'Toyota 8FGU25')} • S/N ${escapeHTML(cfg.serialNo || '90434')}
        </span>
      </div>
      <div class="view-nav-actions-right">
        <button class="btn-ios btn-ios-accent" id="btn-forklift-to-training" type="button" style="background: rgba(59, 130, 246, 0.15); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.35);">
          <svg style="width: 14px; height: 14px;" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"></path></svg>
          Operator Training Program &rarr;
        </button>
        <a href="assets/forklift/Toyota_Forklift_Operators_Manual.pdf" target="_blank" rel="noopener noreferrer" class="btn-ios">
          <svg style="width: 14px; height: 14px;" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
          Operators Manual (PDF) ↗
        </a>
      </div>
    </div>

    <!-- Hero Card -->
    <div class="forklift-hero-card">
      <div class="benefits-hero-content">
        <div class="benefits-hero-header">
          <div class="benefits-hero-icon" style="background: rgba(245, 158, 11, 0.15); border-color: rgba(245, 158, 11, 0.35);">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #f59e0b;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          </div>
          <div class="benefits-hero-title-group">
            <h1 style="color: var(--text-primary); font-size: 1.5rem; margin: 0;">Toyota 8FGU25 Forklift Safety & Operation</h1>
            <p style="color: var(--text-secondary); margin: 0.25rem 0 0 0; font-size: 0.9rem;">OSHA 29 CFR 1910.178 Powered Industrial Truck Standards • 4HGS Warehouse Protocols</p>
          </div>
        </div>
        <p style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.5; margin: 0;">
          Safe forklift operation protects our team, prevents severe tip-overs, and guarantees warehouse integrity. This portal houses verified machine technical data plate specifications, active operator certifications with a 3-year renewal countdown, essential safety rules from the official Toyota Operator's Manual, and daily pre-shift inspection checklists.
        </p>
        <div class="benefits-hero-actions">
          <button class="btn-hero-primary" id="btn-hero-to-training" type="button" style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; border: none; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 0.5rem;">
            <svg style="width: 16px; height: 16px;" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"></path></svg>
            OSHA Operator Training Program &rarr;
          </button>
          <a href="assets/forklift/Toyota_Forklift_Operators_Manual.pdf" target="_blank" rel="noopener noreferrer" class="btn-hero-secondary" style="background: rgba(245, 158, 11, 0.15); color: #f59e0b; border-color: rgba(245, 158, 11, 0.35);">
            <svg style="width: 16px; height: 16px;" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
            Toyota Manual (PDF)
          </a>
          <a href="#forklift-operators-section" class="btn-hero-secondary" id="btn-hero-scroll-operators">
            <svg style="width: 16px; height: 16px;" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"></path></svg>
            View Operator Certifications
          </a>
        </div>
      </div>
    </div>

    <!-- Machine Data Plate & Technical Specs Card -->
    <div class="benefits-section-header">
      <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
      <h2>Machine Data Plate & Technical Specifications</h2>
    </div>

    <div class="dataplate-card">
      <div class="dataplate-rivet tl"></div>
      <div class="dataplate-rivet tr"></div>
      <div class="dataplate-rivet bl"></div>
      <div class="dataplate-rivet br"></div>

      <div class="dataplate-header">
        <div class="dataplate-brand">TOYOTA FORKLIFT TRUCK • DATA PLATE</div>
        <div style="font-size: 0.75rem; color: #a1a1aa; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">
          F2 ENGLISH 57846-U2173-71
        </div>
      </div>

      <div class="dataplate-grid">
        <div class="dataplate-item">
          <div class="dataplate-item-label">Model</div>
          <div class="dataplate-item-value">8FGU25</div>
        </div>
        <div class="dataplate-item">
          <div class="dataplate-item-label">Serial Number</div>
          <div class="dataplate-item-value">90434</div>
        </div>
        <div class="dataplate-item">
          <div class="dataplate-item-label">Mast Type</div>
          <div class="dataplate-item-value">FSV <span style="font-size: 0.72rem; color: #a1a1aa; font-weight: normal;">(3-Stage Free-Lift)</span></div>
        </div>
        <div class="dataplate-item">
          <div class="dataplate-item-label">Attachment</div>
          <div class="dataplate-item-value">SSFP <span style="font-size: 0.72rem; color: #a1a1aa; font-weight: normal;">(Side-Shift Positioner)</span></div>
        </div>
        <div class="dataplate-item">
          <div class="dataplate-item-label">Truck Weight (±5%)</div>
          <div class="dataplate-item-value">8,870 lb <span style="font-size: 0.75rem; color: #a1a1aa; font-weight: 500;">/ 4,020 kg</span></div>
        </div>
        <div class="dataplate-item">
          <div class="dataplate-item-label">Fuel / Power Type</div>
          <div class="dataplate-item-value">LP <span style="font-size: 0.72rem; color: #a1a1aa; font-weight: normal;">(Liquid Propane)</span></div>
        </div>
        <div class="dataplate-item">
          <div class="dataplate-item-label">Front Tread</div>
          <div class="dataplate-item-value">43.1 in <span style="font-size: 0.75rem; color: #a1a1aa; font-weight: 500;">/ 1095 mm</span></div>
        </div>
        <div class="dataplate-item">
          <div class="dataplate-item-label">Back Tilt Angle</div>
          <div class="dataplate-item-value">6° Back Tilt</div>
        </div>
        <div class="dataplate-item">
          <div class="dataplate-item-label">Front Tire Size</div>
          <div class="dataplate-item-value">7.00-12 / Solid</div>
        </div>
        <div class="dataplate-item">
          <div class="dataplate-item-label">Rear Tire Size</div>
          <div class="dataplate-item-value">6.00-9 / Solid</div>
        </div>
      </div>

      <!-- Capacity Load Chart Table -->
      <div style="font-size: 0.78rem; font-weight: 700; color: #fafafa; margin-bottom: 0.35rem; text-transform: uppercase; letter-spacing: 0.04em;">
        Rated Capacity with Vertical Mast Equipped at Max Lift Height 'C' (189.0 in / 4800 mm)
      </div>
      
      <div class="capacity-table-wrap">
        <table class="capacity-table">
          <thead>
            <tr>
              <th>Load Center (A & B)</th>
              <th>Max Lift Height (C)</th>
              <th>Rated Capacity</th>
              <th>Stability & Operational Condition</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>24 in</strong> (600 mm)</td>
              <td><strong>189.0 in</strong> (4800 mm)</td>
              <td class="capacity-highlight">4,500 lb (2,040 kg)</td>
              <td>Standard rated capacity with vertical mast & centered load</td>
            </tr>
            <tr>
              <td><strong>30 in</strong> (760 mm)</td>
              <td><strong>189.0 in</strong> (4800 mm)</td>
              <td class="capacity-highlight">4,000 lb (1,815 kg)</td>
              <td>Extended load center capacity (reduced by 500 lbs)</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style="margin-top: 0.9rem; font-size: 0.75rem; color: #d97706; background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: 6px; padding: 0.5rem 0.75rem; line-height: 1.4;">
        <strong>WARNING:</strong> IMPROPER OPERATION OR MAINTENANCE COULD RESULT IN INJURY OR DEATH. TRAINED OPERATORS ONLY. READ OPERATOR'S MANUAL FIRST. THIS FORKLIFT TRUCK MEETS OR EXCEEDS DESIGN SPECIFICATIONS OF ANSI/ITSDF B56.1 IN EFFECT ON THE DATE OF MANUFACTURE.
      </div>
    </div>

    <!-- Operator Certification & 3-Year Recertification Section -->
    <div class="benefits-section-header" id="forklift-operators-section">
      <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
      <h2>Operator Certification & 3-Year Recertification Tracker</h2>
    </div>

    <div style="background: rgba(59, 130, 246, 0.05); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 10px; padding: 0.75rem 1rem; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.5rem;">
      <strong style="color: #60a5fa;">OSHA 29 CFR 1910.178(l)(4)(iii) Mandate:</strong> An evaluation of each powered industrial truck operator's performance must be conducted at least once every <strong>3 years</strong>. 4HGS maintains active certified operators, trainees currently in certification, and an Operator Trainer.
    </div>

    <div class="cert-tracker-grid">
      ${operators.map(op => {
        const data = getOperatorRecertData(op);
        const isTrainer = op.role === 'Operator Trainer';
        const cardClass = isTrainer ? 'trainer' : (data.status === 'certified' ? 'certified' : (data.status === 'expired' ? 'expiring' : 'in-progress'));
        const initials = op.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'OP';

        return `
          <div class="cert-operator-card ${cardClass}">
            <div class="cert-card-header">
              <div class="cert-op-info">
                <div class="cert-op-avatar ${isTrainer ? 'trainer-avatar' : ''}">
                  ${isTrainer ? '★' : initials}
                </div>
                <div>
                  <h3 class="cert-op-title">${escapeHTML(op.name)}</h3>
                  <div class="cert-op-role-tag">
                    ${isTrainer ? '<span style="color:#f59e0b; font-weight:700;">Operator Trainer</span>' : escapeHTML(op.role || 'Operator')}
                  </div>
                </div>
              </div>
              <span class="view-badge ${data.statusBadgeClass}" style="font-size: 0.7rem; padding: 0.2rem 0.55rem;">
                ${escapeHTML(data.statusText)}
              </span>
            </div>

            <!-- Countdown Box -->
            <div class="cert-countdown-box">
              <div>
                <div class="countdown-label">3-Year Recertification</div>
                <div class="countdown-digits ${data.countdownClass}">${data.countdownText}</div>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 0.75rem; color: var(--text-secondary);">${data.countdownSub}</div>
                ${data.daysRemaining !== null && data.daysRemaining >= 0 ? `
                  <div style="font-size: 0.7rem; color: var(--text-secondary); margin-top: 0.15rem;">Rule: Hardcoded 3 Yrs</div>
                ` : ''}
              </div>
            </div>

            <!-- Meta dates -->
            <div class="cert-meta-row">
              <div class="cert-meta-item">
                Certified: <strong>${escapeHTML(data.certFormatted)}</strong>
              </div>
              <div class="cert-meta-item">
                Next Due: <strong>${escapeHTML(data.recertFormatted)}</strong>
              </div>
            </div>

            ${op.notes ? `
              <div style="font-size: 0.75rem; color: var(--text-secondary); background: rgba(255,255,255,0.02); padding: 0.4rem 0.6rem; border-radius: 6px; border: 1px solid var(--glass-border);">
                ${escapeHTML(op.notes)}
              </div>
            ` : ''}
          </div>
        `;
      }).join('')}
    </div>

    <!-- Toyota 8-Series Critical Safety Rules Grid -->
    <div class="benefits-section-header" style="margin-top: 1.5rem;">
      <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"></path></svg>
      <h2>Core Safety Rules (Toyota Operator's Manual & OSHA)</h2>
    </div>

    <div class="safety-rules-grid">
      <!-- Rule 1: Toyota SAS -->
      <div class="safety-rule-card">
        <div class="safety-rule-header">
          <div class="safety-rule-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 8v8M8 12h8"></path></svg>
          </div>
          Toyota System of Active Stability (SAS)
        </div>
        <p class="safety-rule-desc">
          The 8FGU25 includes Toyota's patented SAS: active control rear stabilizer cylinder locks the swing axle during sharp turns to resist lateral tip-over, and active mast front tilt angle/speed controls automatically limit forward tilt with heavy loads. Never rely solely on SAS to overcome reckless driving.
        </p>
      </div>

      <!-- Rule 2: Stability Triangle -->
      <div class="safety-rule-card">
        <div class="safety-rule-header">
          <div class="safety-rule-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 22 22 22"></polygon></svg>
          </div>
          Stability Triangle & Center of Gravity
        </div>
        <p class="safety-rule-desc">
          The forklift's center of gravity shifts upward and forward as a load is elevated. Always travel with forks <strong>6 to 8 inches off the ground</strong> and mast tilted back. Elevating a load while traveling, turning, or on an incline dramatically destabilizes the truck and invites instant rollover.
        </p>
      </div>

      <!-- Rule 3: Load Center & Capacity -->
      <div class="safety-rule-card">
        <div class="safety-rule-header">
          <div class="safety-rule-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
          </div>
          Load Center & SSFP Attachment Limit
        </div>
        <p class="safety-rule-desc">
          Rated for <strong>4,500 lbs at 24" load center</strong>. If a load extends beyond 24" (e.g. 30"), maximum capacity drops to <strong>4,000 lbs</strong>. Side-shifting (SSFP attachment) off-center also shifts the lateral center of gravity; always re-center forks before traveling.
        </p>
      </div>

      <!-- Rule 4: Seatbelt & Tip-Over Survival -->
      <div class="safety-rule-card">
        <div class="safety-rule-header">
          <div class="safety-rule-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
          </div>
          Mandatory Seatbelt & Tip-Over Survival
        </div>
        <p class="safety-rule-desc">
          Seatbelts must be buckled before engine ignition. In a tip-over: <strong>NEVER JUMP</strong>. The overhead guard will crush operators who jump. Hold tightly to the steering wheel, brace your feet firmly against the floorboard, and lean away from the point of impact inside the cage.
        </p>
      </div>

      <!-- Rule 5: Strict No Riders -->
      <div class="safety-rule-card">
        <div class="safety-rule-header">
          <div class="safety-rule-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="18" y1="8" x2="23" y2="13"></line><line x1="23" y1="8" x2="18" y2="13"></line></svg>
          </div>
          Zero Passengers / No Riders Permitted
        </div>
        <p class="safety-rule-desc">
          The Toyota 8FGU25 is designed exclusively for a single operator. Riding on forks, pallets, side steps, or the rear counterweight is strictly prohibited under OSHA 1910.178(m)(3). Never lift personnel with forks unless utilizing an approved, securely tethered safety platform.
        </p>
      </div>

      <!-- Rule 6: Ramps & Inclines -->
      <div class="safety-rule-card">
        <div class="safety-rule-header">
          <div class="safety-rule-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="1" y1="20" x2="23" y2="4"></line><polyline points="8 4 23 4 23 19"></polyline></svg>
          </div>
          Ramps, Grades & Travel Direction
        </div>
        <p class="safety-rule-desc">
          When carrying a load on any slope, grade, or truck dock ramp: <strong>Forks must always point uphill</strong>. Drive forward up grades; descend in reverse with mast tilted back. When unladen, forks point downhill. Never turn or travel across a ramp diagonally.
        </p>
      </div>

      <!-- Rule 7: Pedestrian & Blind Spots -->
      <div class="safety-rule-card">
        <div class="safety-rule-header">
          <div class="safety-rule-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
          </div>
          Pedestrian Right-of-Way & Horn Sounding
        </div>
        <p class="safety-rule-desc">
          Pedestrians always have absolute right-of-way. Always sound horn before entering doorways, blind corners, and cross-aisles. Maintain a minimum distance of 3 truck lengths behind other warehouse equipment. If a forward load blocks visibility, travel in reverse.
        </p>
      </div>

      <!-- Rule 8: LP Gas Safety -->
      <div class="safety-rule-card">
        <div class="safety-rule-header">
          <div class="safety-rule-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg>
          </div>
          LP Gas Cylinder Exchange & Storage
        </div>
        <p class="safety-rule-desc">
          Swap LP tanks only in designated, well-ventilated locations. Shut off engine and turn valve fully closed before disconnecting. Inspect rubber O-ring in coupling for dry rot or cuts. Engage alignment pin on tank bracket to keep pressure relief valve pointing upward at 12 o'clock.
        </p>
      </div>
    </div>

    <!-- Pre-Shift Inspection Checklist Section -->
    <div class="benefits-section-header" style="margin-top: 1.5rem;">
      <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
      <h2>Daily Pre-Shift Inspection Protocol (OSHA 1910.178)</h2>
    </div>

    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1rem;">
      <!-- Cold / Walkaround Inspection -->
      <div class="safety-rule-card">
        <h4 style="margin: 0 0 0.5rem 0; font-size: 0.95rem; color: #fbbf24; display: flex; align-items: center; gap: 0.5rem;">
          <svg style="width: 16px; height: 16px;" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>
          Phase 1: Pre-Start Walkaround (Engine Off)
        </h4>
        <div class="checklist-item">
          <span class="checklist-check">✓</span>
          <div><strong>Solid Tires & Wheels:</strong> Inspect front 7.00-12 and rear 6.00-9 solid tires for deep chunking, bond separation, and missing lug nuts.</div>
        </div>
        <div class="checklist-item">
          <span class="checklist-check">✓</span>
          <div><strong>Forks & Lock Pins:</strong> Check both fork tines for cracks, bending, heel wear, and verify both fork locking pins are fully seated in notch.</div>
        </div>
        <div class="checklist-item">
          <span class="checklist-check">✓</span>
          <div><strong>Mast Chains & Carriage:</strong> Inspect lift chains for equal tension, lubrication, and check hydraulic hoses for weeping or fraying.</div>
        </div>
        <div class="checklist-item">
          <span class="checklist-check">✓</span>
          <div><strong>LP Tank & Bracket:</strong> Verify LP cylinder clamp is tight, indexing pin is engaged, quick-disconnect is hand-tight, and smell for ethyl mercaptan.</div>
        </div>
        <div class="checklist-item">
          <span class="checklist-check">✓</span>
          <div><strong>Fluids & Ground Check:</strong> Check ground beneath forklift for engine oil, hydraulic fluid, or coolant puddles.</div>
        </div>
      </div>

      <!-- Operational Inspection -->
      <div class="safety-rule-card">
        <h4 style="margin: 0 0 0.5rem 0; font-size: 0.95rem; color: #34d399; display: flex; align-items: center; gap: 0.5rem;">
          <svg style="width: 16px; height: 16px;" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
          Phase 2: Operational Systems (Engine Running)
        </h4>
        <div class="checklist-item">
          <span class="checklist-check">✓</span>
          <div><strong>Seatbelt & Interlock:</strong> Confirm seatbelt locks when tugged sharply; verify engine interlock shuts off drive if operator leaves seat.</div>
        </div>
        <div class="checklist-item">
          <span class="checklist-check">✓</span>
          <div><strong>Audio & Visual Alarms:</strong> Test horn button on steering wheel hub; test backup warning beeper and headlights / strobe.</div>
        </div>
        <div class="checklist-item">
          <span class="checklist-check">✓</span>
          <div><strong>Hydraulic Levers:</strong> Actuate lift, tilt, and SSFP side-shifter through full travel. Check for smooth response and no chatter.</div>
        </div>
        <div class="checklist-item">
          <span class="checklist-check">✓</span>
          <div><strong>Service & Parking Brake:</strong> Check pedal firmness; test forward/reverse inching; verify parking brake holds firm on incline.</div>
        </div>
        <div class="checklist-item">
          <span class="checklist-check">✓</span>
          <div><strong>Steering Play:</strong> Confirm power steering turns smoothly lock-to-lock without bind or excessive free play.</div>
        </div>
      </div>
    </div>

    <!-- Dedicated Training Program Banner -->
    <div style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(37, 99, 235, 0.08) 100%); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 14px; padding: 1.25rem 1.5rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-top: 1.5rem;">
      <div style="display: flex; align-items: center; gap: 1rem;">
        <div style="width: 44px; height: 44px; border-radius: 10px; background: rgba(59, 130, 246, 0.2); display: flex; align-items: center; justify-content: center; color: #60a5fa; flex-shrink: 0;">
          <svg style="width: 24px; height: 24px;" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"></path></svg>
        </div>
        <div>
          <h4 style="margin: 0; font-size: 1rem; color: var(--text-primary);">OSHA Forklift Operator Training Program Writeup</h4>
          <p style="margin: 0.2rem 0 0 0; font-size: 0.82rem; color: var(--text-secondary);">Access our complete 4-module training curriculum tailored for our 2020 Toyota 8FGU25, covering SAS, LPG safety, tip-over protocols, and OSHA 1910.178 compliance.</p>
        </div>
      </div>
      <button class="btn-ios btn-ios-accent" id="btn-bottom-to-training" type="button" style="background: #2563eb; color: #ffffff; border: none; font-weight: 700; white-space: nowrap;">
        Open Training Program &rarr;
      </button>
    </div>

    <!-- Manual Download Banner -->
    <div style="background: linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(217, 119, 6, 0.08) 100%); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 14px; padding: 1.25rem 1.5rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-top: 1rem;">
      <div style="display: flex; align-items: center; gap: 1rem;">
        <div style="width: 44px; height: 44px; border-radius: 10px; background: rgba(245, 158, 11, 0.2); display: flex; align-items: center; justify-content: center; color: #f59e0b; flex-shrink: 0;">
          <svg style="width: 24px; height: 24px;" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
        </div>
        <div>
          <h4 style="margin: 0; font-size: 1rem; color: var(--text-primary);">Need Full Maintenance or Operational Specifications?</h4>
          <p style="margin: 0.2rem 0 0 0; font-size: 0.82rem; color: var(--text-secondary);">The complete 200+ page factory manual covers maintenance schedules, fuse boxes, SAS diagnostic codes, and hydraulic specs.</p>
        </div>
      </div>
      <a href="assets/forklift/Toyota_Forklift_Operators_Manual.pdf" target="_blank" rel="noopener noreferrer" class="btn-ios btn-ios-accent" style="white-space: nowrap;">
        Download Operators Manual (PDF) &rarr;
      </a>
    </div>
  `;

  // Attach nav handlers
  const btnBack = document.getElementById('btn-back-from-forklift');
  if (btnBack) {
    btnBack.addEventListener('click', () => closeForkliftSafetyPage());
  }

  const btnForkliftToTraining = document.getElementById('btn-forklift-to-training');
  if (btnForkliftToTraining) {
    btnForkliftToTraining.addEventListener('click', () => openForkliftTrainingPage());
  }

  const btnHeroToTraining = document.getElementById('btn-hero-to-training');
  if (btnHeroToTraining) {
    btnHeroToTraining.addEventListener('click', () => openForkliftTrainingPage());
  }

  const btnBottomToTraining = document.getElementById('btn-bottom-to-training');
  if (btnBottomToTraining) {
    btnBottomToTraining.addEventListener('click', () => openForkliftTrainingPage());
  }

  const btnScrollOps = document.getElementById('btn-hero-scroll-operators');
  if (btnScrollOps) {
    btnScrollOps.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.getElementById('forklift-operators-section');
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  }
}

// --- Forklift Training Program Page Controllers ---

function openForkliftTrainingPage() {
  if (state.isEditing) toggleEditMode(false);
  const adminPanel = document.getElementById('admin-panel-inline');
  if (adminPanel) adminPanel.style.display = 'none';
  closeBenefitsPage(false);
  closeBenefitsDocsPage(false);
  closeForkliftSafetyPage(false);

  document.getElementById('main-app-grid').style.display = 'none';
  document.getElementById('ios-toolbar').style.display = 'none';
  
  const subsequentContainer = document.getElementById('subsequent-sections-container');
  if (subsequentContainer) subsequentContainer.style.display = 'none';
  
  const topActions = document.getElementById('top-actions-bar');
  if (topActions) topActions.style.display = 'none';
  
  const trainingPanel = document.getElementById('forklift-training-page-inline');
  if (trainingPanel) {
    trainingPanel.style.display = 'flex';
    renderForkliftTrainingPage();
    const shell = document.querySelector('.ios-screen-content');
    if (shell) shell.scrollTop = 0;
  }
}

function closeForkliftTrainingPage(restoreGrid = true) {
  const trainingPanel = document.getElementById('forklift-training-page-inline');
  if (trainingPanel) trainingPanel.style.display = 'none';

  if (restoreGrid) {
    document.getElementById('main-app-grid').style.display = 'grid';
    document.getElementById('ios-toolbar').style.display = 'flex';
    
    const subsequentContainer = document.getElementById('subsequent-sections-container');
    if (subsequentContainer) subsequentContainer.style.display = 'block';
    
    renderAppGrid();
  }
}

function renderForkliftTrainingPage() {
  const container = document.getElementById('forklift-training-page-inline');
  if (!container) return;

  container.innerHTML = `
    <!-- Top Nav Header -->
    <div class="view-nav-header">
      <div class="view-nav-actions-left">
        <button class="btn-ios" id="btn-back-to-forklift-from-training" type="button">
          <svg style="width: 14px; height: 14px;" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"></path></svg>
          Forklift Safety Portal
        </button>
        <button class="btn-ios" id="btn-back-to-dash-from-training" type="button">
          Dashboard
        </button>
        <span class="view-badge" style="background: rgba(59, 130, 246, 0.12); color: #60a5fa; border-color: rgba(59, 130, 246, 0.3);">
          <svg style="width: 12px; height: 12px;" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          OSHA 29 CFR 1910.178 • 2020 Toyota 8FGU25
        </span>
      </div>
      <div class="view-nav-actions-right">
        <a href="assets/forklift/Toyota_Forklift_Operators_Manual.pdf" target="_blank" rel="noopener noreferrer" class="btn-ios btn-ios-accent">
          <svg style="width: 14px; height: 14px;" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
          Toyota Manual (PDF) ↗
        </a>
      </div>
    </div>

    <!-- Hero Card -->
    <div class="training-hero-card">
      <div class="benefits-hero-content">
        <div class="benefits-hero-header">
          <div class="benefits-hero-icon" style="background: rgba(59, 130, 246, 0.18); border-color: rgba(59, 130, 246, 0.4);">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #60a5fa;"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path><line x1="9" y1="7" x2="15" y2="7"></line><line x1="9" y1="11" x2="13" y2="11"></line></svg>
          </div>
          <div class="benefits-hero-title-group">
            <h1 style="color: var(--text-primary); font-size: 1.5rem; margin: 0;">OSHA Operator Training Program: 2020 Toyota 8FGU25</h1>
            <p style="color: var(--text-secondary); margin: 0.25rem 0 0 0; font-size: 0.9rem;">Powered Industrial Truck (PIT) Theoretical Instruction, Safe Work Protocols & Mandated Competency</p>
          </div>
        </div>
        <p class="training-section-desc">
          Under OSHA Standard <strong>29 CFR 1910.178</strong>, operator certification requires a mandatory tripartite curriculum: <strong>formal instruction</strong>, <strong>practical hands-on training</strong>, and <strong>site-specific evaluation</strong> of operator competency. This document establishes the core operational knowledge, propane fuel precautions, tip-over survival protocols, and machine dynamics for our 2020 Toyota 8FGU25.
        </p>

        <!-- Quick Jump Navigation Pills -->
        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.25rem;">
          <a href="#prog-intro" class="btn-ios" style="font-size: 0.78rem; padding: 0.35rem 0.75rem;">1. Framework &amp; Risks</a>
          <a href="#prog-mod1" class="btn-ios" style="font-size: 0.78rem; padding: 0.35rem 0.75rem;">2. Module 1: Truck &amp; Propane</a>
          <a href="#prog-mod2" class="btn-ios" style="font-size: 0.78rem; padding: 0.35rem 0.75rem;">3. Module 2: Inspections &amp; Tip-Over</a>
          <a href="#prog-mod3" class="btn-ios" style="font-size: 0.78rem; padding: 0.35rem 0.75rem;">4. Module 3: Maneuvering &amp; Mast</a>
          <a href="#prog-mod4" class="btn-ios" style="font-size: 0.78rem; padding: 0.35rem 0.75rem;">5. Module 4: Evaluation &amp; OSHA</a>
        </div>
      </div>
    </div>

    <!-- Section 1: Program Introduction and Regulatory Framework -->
    <div class="training-module-card" id="prog-intro">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
        <span class="training-module-badge">OSHA Regulatory Framework</span>
        <span style="font-size: 0.75rem; color: var(--text-secondary);">29 CFR 1910.178 Mandate</span>
      </div>
      <h2 class="training-module-title">1. Program Introduction &amp; Regulatory Framework</h2>
      <p class="training-section-desc">
        The implementation of a rigorous training program for Powered Industrial Trucks (PIT) is a strategic mandate essential for ensuring workplace safety and regulatory adherence. In accordance with <strong>OSHA standard 29 CFR 1910.178</strong>, this program serves as the theoretical foundation for safe operation. However, this written guide is only one component of a mandatory, tripartite certification process:
      </p>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 0.75rem;">
        <div style="background: rgba(59, 130, 246, 0.06); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 10px; padding: 1rem;">
          <div style="font-weight: 700; color: #60a5fa; font-size: 0.9rem; margin-bottom: 0.3rem;">1. Formal Instruction</div>
          <div style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.45;">Classroom training, curriculum study, video instruction, written materials, and operational testing.</div>
        </div>
        <div style="background: rgba(141, 220, 4, 0.06); border: 1px solid rgba(141, 220, 4, 0.2); border-radius: 10px; padding: 1rem;">
          <div style="font-weight: 700; color: var(--accent-green); font-size: 0.9rem; margin-bottom: 0.3rem;">2. Practical Training</div>
          <div style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.45;">Hands-on demonstrations performed by our Operator Trainer and exercises performed by the trainee.</div>
        </div>
        <div style="background: rgba(245, 158, 11, 0.06); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: 10px; padding: 1rem;">
          <div style="font-weight: 700; color: #f59e0b; font-size: 0.9rem; margin-bottom: 0.3rem;">3. Site-Specific Evaluation</div>
          <div style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.45;">Direct observation and evaluation of operator competency inside the actual 4HGS warehouse environment.</div>
        </div>
      </div>

      <!-- OSHA Compliance Responsibilities Table -->
      <div style="margin-top: 0.5rem;">
        <h3 style="font-size: 0.95rem; color: var(--text-primary); margin: 0 0 0.6rem 0;">OSHA Compliance Standards: Training Responsibilities</h3>
        <div class="capacity-table-wrap">
          <table class="capacity-table">
            <thead>
              <tr>
                <th style="width: 250px;">Resource Provider</th>
                <th>Training &amp; Compliance Components</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Online E-Learning / Program Guide</strong></td>
                <td>Operating rules, safe work practices, vehicle fundamentals, stability physics, and general hazard awareness.</td>
              </tr>
              <tr>
                <td><strong>Employer On-Site Requirement</strong></td>
                <td>Hands-on training, practical evaluation of operator skills, workplace-specific hazard orientation, and final certification of competency.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Critical Risk Analysis Callout -->
      <div style="background: rgba(239, 68, 68, 0.06); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: 10px; padding: 1rem; margin-top: 0.25rem;">
        <h4 style="margin: 0 0 0.4rem 0; color: #f87171; font-size: 0.9rem; display: flex; align-items: center; gap: 0.5rem;">
          <svg style="width: 16px; height: 16px;" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polygon points="12 2 2 22 22 22"></polygon><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          Critical Risk Analysis: High-Lift Rider vs. Low-Lift Equipment
        </h4>
        <p style="font-size: 0.83rem; color: var(--text-secondary); line-height: 1.5; margin: 0;">
          The 2020 Toyota 8FGU25 is a <strong>High-Lift Rider truck</strong>, presenting significantly higher risk profiles than motorized hand trucks or pallet jacks. While a hand truck operates on a flat plane with a low center of gravity, the 8FGU25's mast height creates a volatile <strong>"Stability Triangle."</strong> As the load is raised, the center of gravity moves upward and closer to the tipping line. The dynamic forces of travel speed and elevation transform this 4,000-lb rated vehicle into an immediate rollover pivot if stability physics are ignored.
        </p>
      </div>
    </div>

    <!-- Section 2: Module 1: Truck Fundamentals & Propane Safety -->
    <div class="training-module-card" id="prog-mod1">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
        <span class="training-module-badge">Module 1</span>
        <span style="font-size: 0.75rem; color: var(--text-secondary);">Toyota 8FGU25 Engineering &amp; Fueling</span>
      </div>
      <h2 class="training-module-title">2. Module 1: Truck Fundamentals &amp; Propane Safety</h2>
      <p class="training-section-desc">
        Mastering vehicle-specific engineering is a strategic necessity to prevent mechanical failure and fuel-related catastrophes. Operators who fail to respect the technical statistics and power systems of the 8FGU25 risk both equipment damage and life-threatening exposure.
      </p>

      <!-- Technical Specifications Table -->
      <div>
        <h3 style="font-size: 0.95rem; color: var(--text-primary); margin: 0 0 0.6rem 0;">Technical Specifications &amp; Differentiators</h3>
        <div class="capacity-table-wrap">
          <table class="capacity-table">
            <thead>
              <tr>
                <th style="width: 220px;">Feature</th>
                <th>Specification</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Model</strong></td>
                <td>8FGU25 (Internal Combustion / Liquid Propane Gas)</td>
              </tr>
              <tr>
                <td><strong>Rated Capacity</strong></td>
                <td>4,000 lbs at 24-in load center (with SSFP attachment) &bull; 4,500 lbs standard rating</td>
              </tr>
              <tr>
                <td><strong>Tires</strong></td>
                <td>Solid Pneumatic (Front: 7.00-12, Rear: 6.00-9)</td>
              </tr>
              <tr>
                <td><strong>Mast Type</strong></td>
                <td>FSV (Full-Free Lift Three-Stage Mast, Max Lift 189.0 in / 4800 mm)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Toyota-Specific Safety Systems -->
      <div style="margin-top: 0.5rem;">
        <h3 style="font-size: 0.95rem; color: var(--text-primary); margin: 0 0 0.6rem 0;">Toyota-Specific Safety Systems: SAS and OPSS</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 0.75rem;">
          <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--glass-border); border-radius: 10px; padding: 1rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.35rem;">
              <span style="background: #3b82f6; color: white; border-radius: 4px; padding: 0.1rem 0.45rem; font-weight: 800; font-size: 0.72rem;">SAS</span>
              <strong style="color: var(--text-primary); font-size: 0.88rem;">System of Active Stability</strong>
            </div>
            <p style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.5; margin: 0;">
              Monitors vehicle dynamics and lateral acceleration. When cornering forces threaten rollover, the patented rear axle <strong>swing-lock cylinder</strong> locks instantly, turning the swinging steer axle into a rigid, broad platform to prevent lateral tip-over.
            </p>
          </div>
          <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--glass-border); border-radius: 10px; padding: 1rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.35rem;">
              <span style="background: #10b981; color: white; border-radius: 4px; padding: 0.1rem 0.45rem; font-weight: 800; font-size: 0.72rem;">OPSS</span>
              <strong style="color: var(--text-primary); font-size: 0.88rem;">Operator Presence Sensing System</strong>
            </div>
            <p style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.5; margin: 0;">
              Utilizes an electronic switch built into the driver's seat cushion. If the operator unseats or shifts position for more than 2 seconds, OPSS automatically disengages transmission drive and locks all hydraulic mast lift/lower/tilt functions.
            </p>
          </div>
        </div>
      </div>

      <!-- Internal Combustion & Propane (LPG) Protocols -->
      <div style="margin-top: 0.5rem;">
        <h3 style="font-size: 0.95rem; color: var(--text-primary); margin: 0 0 0.6rem 0;">Internal Combustion &amp; Propane (LPG) Safety Protocols</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 0.75rem;">
          <div style="background: rgba(245, 158, 11, 0.05); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: 10px; padding: 1rem;">
            <h4 style="margin: 0 0 0.4rem 0; color: #fbbf24; font-size: 0.85rem;">Hazard Evaluation</h4>
            <div class="checklist-item">
              <span class="checklist-check" style="background: #f59e0b; color: #18181b;">!</span>
              <div><strong>Cryogenic Burns:</strong> Liquid propane boils at -44°F. Mandatory PPE: <strong>gauntlet gloves</strong> and <strong>face shield</strong> must be worn during cylinder changeouts.</div>
            </div>
            <div class="checklist-item">
              <span class="checklist-check" style="background: #f59e0b; color: #18181b;">!</span>
              <div><strong>Carbon Monoxide (CO):</strong> Black exhaust smoke signals incomplete combustion and toxic CO buildup. Never operate in unventilated spaces.</div>
            </div>
            <div class="checklist-item">
              <span class="checklist-check" style="background: #f59e0b; color: #18181b;">!</span>
              <div><strong>Leak Detection:</strong> Test fittings using a soapy water solution; active bubbling confirms a dangerous leak. Never use an open flame.</div>
            </div>
          </div>
          <div style="background: rgba(59, 130, 246, 0.05); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 10px; padding: 1rem;">
            <h4 style="margin: 0 0 0.4rem 0; color: #60a5fa; font-size: 0.85rem;">Refueling Requirements</h4>
            <div class="checklist-item">
              <span class="checklist-check">✓</span>
              <div><strong>Cylinder Exchange:</strong> Always turn off the forklift engine and completely close the cylinder service valve before disconnecting.</div>
            </div>
            <div class="checklist-item">
              <span class="checklist-check">✓</span>
              <div><strong>Thermal Expansion:</strong> Never fill tanks past 80% maximum capacity. LPG expands as ambient temperature rises and can release through relief valves.</div>
            </div>
            <div class="checklist-item">
              <span class="checklist-check">✓</span>
              <div><strong>Sediment Prevention:</strong> Always refill the LP tank at the end of each day. This eliminates overnight condensation and stops sediment ingestion.</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Section 3: Module 2: Daily Inspections & Sit-Down Tip-Over Protocols -->
    <div class="training-module-card" id="prog-mod2">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
        <span class="training-module-badge">Module 2</span>
        <span style="font-size: 0.75rem; color: var(--text-secondary);">OSHA 1910.178(q)(1) Mandate</span>
      </div>
      <h2 class="training-module-title">3. Module 2: Daily Inspections &amp; Sit-Down Tip-Over Protocols</h2>
      <p class="training-section-desc">
        The pre-operation inspection is the primary line of defense against workplace fatalities. A defective vehicle is a severe legal liability: <strong>any truck not in safe operating condition must be removed from service immediately</strong> under 29 CFR 1910.178(q)(1).
      </p>

      <!-- Pre-Operation Checklist -->
      <div>
        <h3 style="font-size: 0.95rem; color: var(--text-primary); margin: 0 0 0.6rem 0;">Mandatory Pre-Operation Checklist</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 0.6rem;">
          <div class="checklist-item">
            <span class="checklist-check">✓</span>
            <div><strong>Fluids:</strong> Verify engine oil, radiator coolant, and hydraulic fluid levels before startup.</div>
          </div>
          <div class="checklist-item">
            <span class="checklist-check">✓</span>
            <div><strong>Visual Integrity:</strong> Inspect high-pressure hydraulic hoses for cracking, abrasions, or fluid weeping.</div>
          </div>
          <div class="checklist-item">
            <span class="checklist-check">✓</span>
            <div><strong>Mast Safety:</strong> Check mast lift chains for tension. <em style="color: #f87171;">Warning: Never place hands inside mast assembly; use a stick or tool to test tension.</em></div>
          </div>
          <div class="checklist-item">
            <span class="checklist-check">✓</span>
            <div><strong>Forks &amp; Pins:</strong> Inspect for surface stress cracks, bent tines, and verify the top clip retaining pin and heel are locked.</div>
          </div>
          <div class="checklist-item">
            <span class="checklist-check">✓</span>
            <div><strong>Dashboard Gauges:</strong> Ensure warning lights (Oil Pressure, Engine Coolant Temp, Transmission Heat) extinguish after ignition.</div>
          </div>
        </div>
      </div>

      <!-- Sit-Down Tip-Over Response Protocol Callout -->
      <div class="tip-over-callout">
        <div class="tip-over-header">
          <svg style="width: 20px; height: 20px;" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"></path></svg>
          Sit-Down Tip-Over Response: The Six-Step Protocol
        </div>
        <p style="font-size: 0.84rem; color: #fecaca; margin: 0 0 0.85rem 0; line-height: 1.5;">
          If a lateral or forward tip-over occurs, your seatbelt is your life jacket. <strong>DO NOT ATTEMPT TO JUMP.</strong> The overhead guard falls faster than human reaction time, and jumping almost always leads to fatal crushing under the frame. Execute these 6 steps in order:
        </p>
        <div class="tip-over-steps">
          <div class="tip-over-step-item">
            <div class="tip-over-step-num">1</div>
            <div><strong>Stay in the seat:</strong> Seatbelt must already be fastened prior to starting.</div>
          </div>
          <div class="tip-over-step-item">
            <div class="tip-over-step-num">2</div>
            <div><strong>Hold on tight:</strong> Grip the steering wheel firmly with both hands.</div>
          </div>
          <div class="tip-over-step-item">
            <div class="tip-over-step-num">3</div>
            <div><strong>Brace your feet:</strong> Push your feet down hard into the floorboard.</div>
          </div>
          <div class="tip-over-step-item">
            <div class="tip-over-step-num">4</div>
            <div><strong>Lean away:</strong> Lean in the opposite direction from the point of impact.</div>
          </div>
          <div class="tip-over-step-item" style="border-color: #ef4444; background: rgba(239, 68, 68, 0.35);">
            <div class="tip-over-step-num" style="background: #b91c1c;">!</div>
            <div><strong style="color: #ffffff;">DO NOT JUMP:</strong> Stay inside the protective roll cage envelope.</div>
          </div>
          <div class="tip-over-step-item">
            <div class="tip-over-step-num">6</div>
            <div><strong>Lean forward:</strong> Tuck your torso forward to protect your head and spine.</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Section 4: Module 3: Maneuvering, Load Handling & Workplace Hazards -->
    <div class="training-module-card" id="prog-mod3">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
        <span class="training-module-badge">Module 3</span>
        <span style="font-size: 0.75rem; color: var(--text-secondary);">Maneuvering &amp; Mast Operations</span>
      </div>
      <h2 class="training-module-title">4. Module 3: Maneuvering, Load Handling &amp; Workplace Hazards</h2>
      <p class="training-section-desc">
        Environmental awareness and load physics are what separate a certified operator from a liability. Navigating warehouse aisles with elevated loads requires disciplined speed and pedal modulation.
      </p>

      <!-- Safe Traveling & Inching Control -->
      <div>
        <h3 style="font-size: 0.95rem; color: var(--text-primary); margin: 0 0 0.6rem 0;">Safe Traveling and Inching Control</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 0.75rem;">
          <div class="checklist-item">
            <span class="checklist-check">✓</span>
            <div><strong>Speed &amp; Horn:</strong> Maintain speed that allows stopping safely at all times. Sound the horn before blind doorways, intersections, and cross-aisles.</div>
          </div>
          <div class="checklist-item">
            <span class="checklist-check">✓</span>
            <div><strong>Inclines (&gt;10% Grade):</strong> Loaded forklifts must travel with load upgrade (forward uphill, reverse downhill). Forks pointed uphill.</div>
          </div>
          <div class="checklist-item">
            <span class="checklist-check">✓</span>
            <div><strong>Visibility Mandate:</strong> If forward cargo blocks the driver's field of view, reverse travel with load trailing is legally mandatory.</div>
          </div>
        </div>
      </div>

      <!-- Master Trainer Command -->
      <div class="trainer-quote-card">
        <strong>Master Trainer Command for Inching:</strong>
        <p style="margin: 0.35rem 0 0 0; font-size: 0.95rem; font-weight: 600;">
          "Inching is for precision, the brake is for stopping — never ride the inching pedal during high-speed travel."
        </p>
      </div>

      <!-- Mast Dynamics & Hierarchy Table -->
      <div style="margin-top: 0.5rem;">
        <h3 style="font-size: 0.95rem; color: var(--text-primary); margin: 0 0 0.6rem 0;">Mast Dynamics &amp; Hierarchy</h3>
        <div class="capacity-table-wrap">
          <table class="capacity-table">
            <thead>
              <tr>
                <th style="width: 180px;">Mast Type</th>
                <th>Lift Architecture &amp; Operational Envelope</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Simplex</strong></td>
                <td>Single-stage mast with minimal free lift (4–6 in). Outer channels elevate immediately as forks lift.</td>
              </tr>
              <tr>
                <td><strong>Duplex</strong></td>
                <td>Two-stage mast with significant full free lift (50–60 in). Ideal for low doorways and boxcar clearance.</td>
              </tr>
              <tr>
                <td><strong>Triplex (FSV)</strong><br><span style="font-size: 0.7rem; color: #60a5fa; font-weight: 700;">Equipped on 8FGU25</span></td>
                <td>Standard three-stage mast with full free lift cylinder. Reaches 189 inches while keeping low collapsed height for standard door passages.</td>
              </tr>
              <tr>
                <td><strong>Quad</strong></td>
                <td>Four-stage mast designed for extreme ceiling heights; requires advanced derating precautions due to severe capacity reductions aloft.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Attachments and Mandatory Compliance -->
      <div style="background: rgba(245, 158, 11, 0.05); border: 1px solid rgba(245, 158, 11, 0.25); border-radius: 10px; padding: 1rem; margin-top: 0.5rem;">
        <h4 style="margin: 0 0 0.4rem 0; color: #f59e0b; font-size: 0.9rem; display: flex; align-items: center; gap: 0.5rem;">
          <svg style="width: 16px; height: 16px;" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"></path></svg>
          Attachments &amp; Mandatory Compliance (29 CFR 1910.178(a)(4))
        </h4>
        <p style="font-size: 0.83rem; color: var(--text-secondary); line-height: 1.5; margin: 0 0 0.5rem 0;">
          Adding attachments (side-shifters, fork positioners, roll clamps) shifts the load center forward and reduces the truck's effective rating. Under federal standard <strong>29 CFR 1910.178(a)(4)</strong>, modifications or additions that affect capacity or safe operation <strong>shall not be performed without prior written approval from the manufacturer</strong>.
        </p>
        <p style="font-size: 0.83rem; color: var(--text-secondary); line-height: 1.5; margin: 0;">
          <strong>Administrative Requirement:</strong> Data plates, capacity tags, and warning decals must be updated to reflect the new derated capacity. An unloaded forklift operating with an attachment must be treated as "partially loaded."
        </p>
      </div>
    </div>

    <!-- Section 5: Module 4: Practical Demonstration, Evaluation & OSHA Certification -->
    <div class="training-module-card" id="prog-mod4">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
        <span class="training-module-badge">Module 4</span>
        <span style="font-size: 0.75rem; color: var(--text-secondary);">OSHA Certification &amp; Emergency Protocols</span>
      </div>
      <h2 class="training-module-title">5. Module 4: Practical Demonstration, Evaluation &amp; OSHA Certification</h2>
      <p class="training-section-desc">
        Certification is a legal finality. You are moving from theoretical knowledge to demonstrated competency in the actual work environment.
      </p>

      <!-- Administrative Mandates -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 0.75rem;">
        <div style="background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 10px; padding: 1rem;">
          <h4 style="margin: 0 0 0.4rem 0; color: #f87171; font-size: 0.88rem;">Age Restriction (Federal Law)</h4>
          <p style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.5; margin: 0;">
            Federal Department of Labor and OSHA regulations strictly prohibit any individual <strong>under 18 years of age</strong> from operating a powered industrial truck in non-agricultural operations. Zero exceptions.
          </p>
        </div>
        <div style="background: rgba(59, 130, 246, 0.05); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 10px; padding: 1rem;">
          <h4 style="margin: 0 0 0.4rem 0; color: #60a5fa; font-size: 0.88rem;">Re-evaluation &amp; Refresher Triggers</h4>
          <p style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.5; margin: 0;">
            Training is not static. Refresher training and immediate re-evaluation are required if: the operator is observed driving unsafely, is involved in an accident or near-miss, receives an unsatisfactory evaluation, or workplace/equipment conditions change.
          </p>
        </div>
      </div>

      <!-- Workplace Safety & Emergency Response -->
      <div style="margin-top: 0.5rem;">
        <h3 style="font-size: 0.95rem; color: var(--text-primary); margin: 0 0 0.6rem 0;">Workplace Safety &amp; Emergency Response</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 0.6rem;">
          <div class="checklist-item">
            <span class="checklist-check">✓</span>
            <div><strong>Nightly Housekeeping:</strong> Sweeping aisles, clearing pallet debris, and immediately wiping grease/chemical spills are required to prevent loss of tire traction.</div>
          </div>
          <div class="checklist-item">
            <span class="checklist-check" style="background: #3b82f6;">✓</span>
            <div><strong>15-Minute Emergency Flush:</strong> In case of battery acid or liquid propane contact with skin or eyes, flush affected areas with clean water for <strong>at least 15 minutes</strong> and seek emergency medical care.</div>
          </div>
          <div class="checklist-item">
            <span class="checklist-check" style="background: #ef4444;">✓</span>
            <div><strong>Defective Vehicle Tagout:</strong> Any truck emitting hazardous sparks, fuel odor, smoke, or unusual driveline vibration must be tagged out and removed from service immediately.</div>
          </div>
        </div>
      </div>

      <!-- Final Certification Summary -->
      <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 10px; padding: 1.2rem; margin-top: 0.5rem;">
        <h4 style="margin: 0 0 0.35rem 0; color: #34d399; font-size: 0.95rem; display: flex; align-items: center; gap: 0.5rem;">
          <svg style="width: 18px; height: 18px;" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          Final Certification Summary
        </h4>
        <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.55; margin: 0;">
          Professional forklift operation requires constant vigilance. Safety is maintained through rigorous pre-shift inspections, unwavering adherence to load physics, and the immediate refusal to operate any equipment that does not meet 100% of OSHA compliance standards.
        </p>
      </div>

      <!-- Bottom Navigation Controls -->
      <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; margin-top: 0.5rem;">
        <button class="btn-ios btn-ios-accent" id="btn-bottom-return-forklift" type="button">
          &larr; Return to Forklift Safety Portal
        </button>
        <button class="btn-ios" id="btn-bottom-return-dash" type="button">
          Exit to Main Dashboard
        </button>
      </div>
    </div>
  `;

  // Attach nav handlers for training page
  const btnBackForklift = document.getElementById('btn-back-to-forklift-from-training');
  if (btnBackForklift) {
    btnBackForklift.addEventListener('click', () => openForkliftSafetyPage());
  }

  const btnBackDash = document.getElementById('btn-back-to-dash-from-training');
  if (btnBackDash) {
    btnBackDash.addEventListener('click', () => closeForkliftTrainingPage());
  }

  const btnBottomReturnForklift = document.getElementById('btn-bottom-return-forklift');
  if (btnBottomReturnForklift) {
    btnBottomReturnForklift.addEventListener('click', () => openForkliftSafetyPage());
  }

  const btnBottomReturnDash = document.getElementById('btn-bottom-return-dash');
  if (btnBottomReturnDash) {
    btnBottomReturnDash.addEventListener('click', () => closeForkliftTrainingPage());
  }
}

// --- Admin Forklift Settings Tab Controller ---

function renderForkliftAdminTab() {
  const panel = document.getElementById('forklift-operators-panel-list');
  const badge = document.getElementById('forklift-admin-status-badge');
  if (!panel) return;

  const cfg = state.forkliftConfig || DEFAULT_FORKLIFT_CONFIG;
  const ops = cfg.operators || [];

  if (badge) {
    badge.textContent = `${ops.length} Operator${ops.length === 1 ? '' : 's'}`;
  }

  if (ops.length === 0) {
    panel.innerHTML = '<div style="padding: 1.5rem; text-align: center; color: var(--text-secondary); font-size: 0.85rem;">No operators configured. Add an operator using the form below.</div>';
    return;
  }

  panel.innerHTML = ops.map(op => {
    const data = getOperatorRecertData(op);
    const isTrainer = op.role === 'Operator Trainer';
    return `
      <div class="user-item" style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; border-bottom: 1px solid var(--glass-border); gap: 0.75rem;">
        <div style="display: flex; align-items: center; gap: 0.75rem; min-width: 0;">
          <div class="cert-op-avatar ${isTrainer ? 'trainer-avatar' : ''}" style="width: 36px; height: 36px; font-size: 0.8rem;">
            ${isTrainer ? '★' : op.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <div style="min-width: 0;">
            <div style="font-weight: 700; font-size: 0.9rem; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${escapeHTML(op.name)}
              ${isTrainer ? '<span style="font-size:0.7rem; margin-left: 0.4rem; padding: 0.1rem 0.4rem; border-radius: 4px; background: rgba(245,158,11,0.2); color: #f59e0b;">Trainer</span>' : ''}
            </div>
            <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.15rem;">
              Role: <strong>${escapeHTML(op.role || 'Operator')}</strong> &bull; Status: <span class="${data.statusBadgeClass}" style="padding: 0.1rem 0.35rem; border-radius: 4px; font-size: 0.7rem;">${escapeHTML(op.status)}</span>
              ${op.status === 'Certified' && op.certDate ? ` &bull; Cert: <strong>${escapeHTML(data.certFormatted)}</strong> &bull; Recert: <strong>${escapeHTML(data.recertFormatted)}</strong> (${data.countdownText})` : ''}
            </div>
          </div>
        </div>
        <div style="display: flex; gap: 0.4rem; flex-shrink: 0;">
          <button type="button" class="btn-ios btn-edit-forklift-op" data-id="${op.id}" style="padding: 0.3rem 0.6rem; font-size: 0.75rem;">Edit</button>
          <button type="button" class="btn-ios btn-delete-forklift-op" data-id="${op.id}" style="padding: 0.3rem 0.6rem; font-size: 0.75rem; color: #ff3b30; border-color: rgba(255,59,48,0.3);">&times;</button>
        </div>
      </div>
    `;
  }).join('');

  // Attach edit & delete handlers
  panel.querySelectorAll('.btn-edit-forklift-op').forEach(btn => {
    btn.addEventListener('click', () => {
      const opId = btn.dataset.id;
      const op = (state.forkliftConfig && state.forkliftConfig.operators) ? state.forkliftConfig.operators.find(o => o.id === opId) : null;
      if (op) loadForkliftOperatorIntoForm(op);
    });
  });

  panel.querySelectorAll('.btn-delete-forklift-op').forEach(btn => {
    btn.addEventListener('click', () => {
      deleteForkliftOperator(btn.dataset.id);
    });
  });
}

function loadForkliftOperatorIntoForm(op) {
  document.getElementById('edit-forklift-operator-id').value = op.id;
  document.getElementById('forklift-op-name').value = op.name || '';
  document.getElementById('forklift-op-role').value = op.role || 'Certified Operator';
  document.getElementById('forklift-op-status').value = op.status || 'Certified';
  document.getElementById('forklift-op-cert-date').value = op.certDate || '';
  document.getElementById('forklift-op-notes').value = op.notes || '';

  const certGroup = document.getElementById('forklift-cert-date-group');
  if (certGroup) {
    certGroup.style.display = op.status === 'Certified' ? 'block' : 'none';
  }

  const title = document.getElementById('forklift-form-title');
  if (title) title.textContent = `Edit Operator: ${op.name}`;

  const saveBtn = document.getElementById('btn-save-forklift-operator');
  if (saveBtn) saveBtn.textContent = 'Update Operator Record';
}

function resetForkliftOperatorForm() {
  document.getElementById('edit-forklift-operator-id').value = '';
  const form = document.getElementById('forklift-operator-form');
  if (form) form.reset();

  const certGroup = document.getElementById('forklift-cert-date-group');
  if (certGroup) certGroup.style.display = 'block';

  const title = document.getElementById('forklift-form-title');
  if (title) title.textContent = 'Add / Update Operator Record';

  const saveBtn = document.getElementById('btn-save-forklift-operator');
  if (saveBtn) saveBtn.textContent = 'Save Operator Record';
}

async function handleForkliftOperatorSubmit(e) {
  e.preventDefault();
  const editId = document.getElementById('edit-forklift-operator-id').value;
  const name = document.getElementById('forklift-op-name').value.trim();
  const role = document.getElementById('forklift-op-role').value;
  const status = document.getElementById('forklift-op-status').value;
  const certDate = document.getElementById('forklift-op-cert-date').value;
  const notes = document.getElementById('forklift-op-notes').value.trim();

  if (!name) {
    showToast('Please enter an operator name.', false);
    return;
  }

  if (status === 'Certified' && !certDate) {
    showToast('Please enter the initial certification date for certified operators.', false);
    return;
  }

  if (!state.forkliftConfig) {
    state.forkliftConfig = JSON.parse(JSON.stringify(DEFAULT_FORKLIFT_CONFIG));
  }
  if (!state.forkliftConfig.operators) {
    state.forkliftConfig.operators = [];
  }

  if (editId) {
    const idx = state.forkliftConfig.operators.findIndex(o => o.id === editId);
    if (idx !== -1) {
      state.forkliftConfig.operators[idx] = {
        ...state.forkliftConfig.operators[idx],
        name,
        role,
        status,
        certDate: status === 'Certified' ? certDate : '',
        notes
      };
      showToast(`Updated operator record for ${name}`);
    }
  } else {
    const newOp = {
      id: `op-${Date.now()}`,
      name,
      role,
      status,
      certDate: status === 'Certified' ? certDate : '',
      notes
    };
    state.forkliftConfig.operators.push(newOp);
    showToast(`Added operator record for ${name}`);
  }

  saveDatabase();
  await syncForkliftConfigToFirestore();
  resetForkliftOperatorForm();
  renderForkliftAdminTab();

  const forkliftPanel = document.getElementById('forklift-page-inline');
  if (forkliftPanel && forkliftPanel.style.display === 'flex') {
    renderForkliftSafetyPage();
  }
}

async function deleteForkliftOperator(opId) {
  if (!state.forkliftConfig || !state.forkliftConfig.operators) return;
  const op = state.forkliftConfig.operators.find(o => o.id === opId);
  const name = op ? op.name : 'Operator';

  if (!confirm(`Are you sure you want to remove the operator record for "${name}"?`)) {
    return;
  }

  state.forkliftConfig.operators = state.forkliftConfig.operators.filter(o => o.id !== opId);
  saveDatabase();
  await syncForkliftConfigToFirestore();
  renderForkliftAdminTab();

  const forkliftPanel = document.getElementById('forklift-page-inline');
  if (forkliftPanel && forkliftPanel.style.display === 'flex') {
    renderForkliftSafetyPage();
  }

  showToast(`Removed operator record for ${name}`);
}

async function syncForkliftConfigToFirestore() {
  if (!auth.currentUser || !state.forkliftConfig) return;
  try {
    await setDoc(doc(db, "forkliftConfig", "main"), state.forkliftConfig);
  } catch (err) {
    console.error("Failed to sync forkliftConfig to Firestore:", err);
  }
}

// Pre-fill App curator form for Editing Apps
function loadAppIntoForm(app) {
  openAdminPortal();
  document.querySelector('.dialog-tab-btn[data-tab="tab-apps"]').click();
  
  document.getElementById('edit-app-id').value = app.id;
  document.getElementById('app-name').value = app.name;
  
  const heading = document.getElementById('app-form-heading');
  const subheading = document.getElementById('app-form-subheading');
  if (heading) heading.textContent = `Edit: ${app.name}`;
  if (subheading) subheading.textContent = 'Update properties & dashboard section';

  const linkInput = document.getElementById('app-link');
  const linkLabel = document.getElementById('app-link-label') || document.querySelector('label[for="app-link"]');
  const isBuiltIn = (app.id === 'health-benefits' || app.id === 'benefits-docs' || app.id === 'forklift-safety' || !app.link);

  linkInput.value = app.link || '';
  if (isBuiltIn) {
    linkInput.placeholder = 'Built-in Hub Feature (No URL needed)';
    linkInput.required = false;
    if (linkLabel) {
      linkLabel.innerHTML = 'External URL Link <span style="font-size:0.75rem; color:var(--accent-green); font-weight:600; text-transform:none;">(Built-in Hub View)</span>';
    }
  } else {
    linkInput.placeholder = 'https://billing.4hgs.com';
    linkInput.required = true;
    if (linkLabel) {
      linkLabel.innerHTML = 'External URL Link';
    }
  }
  
  // Select icon
  document.querySelectorAll('.icon-option').forEach(el => el.classList.remove('selected'));
  const targetIcon = document.querySelector(`.icon-option[data-icon="${app.icon}"]`);
  if (targetIcon) {
    targetIcon.classList.add('selected');
  }
  
  const select = document.getElementById('app-section');
  if (select) select.value = app.sectionId || 'default';
  
  document.getElementById('btn-save-app').textContent = 'Update Application';

  // Re-render list so the editing item is highlighted
  renderAppsPanelList();
}

// Reset app curator form
function resetAppCuratorForm() {
  document.getElementById('app-curator-form').reset();
  document.getElementById('edit-app-id').value = '';
  document.getElementById('btn-save-app').textContent = 'Save Application';

  const heading = document.getElementById('app-form-heading');
  const subheading = document.getElementById('app-form-subheading');
  if (heading) heading.textContent = 'Add New Application';
  if (subheading) subheading.textContent = 'Configure app details & dashboard section';

  const linkInput = document.getElementById('app-link');
  const linkLabel = document.getElementById('app-link-label') || document.querySelector('label[for="app-link"]');
  if (linkInput) {
    linkInput.placeholder = 'https://billing.4hgs.com';
    linkInput.required = true;
  }
  if (linkLabel) {
    linkLabel.innerHTML = 'External URL Link';
  }
  
  // Select first icon as default
  document.querySelectorAll('.icon-option').forEach(el => el.classList.remove('selected'));
  const firstIcon = document.querySelector('.icon-option');
  if (firstIcon) firstIcon.classList.add('selected');
  
  const select = document.getElementById('app-section');
  if (select) select.value = 'default';

  renderAppsPanelList();
}

// Render dynamic Icon selector grid inside Curator Form
function renderIconSelector() {
  const grid = document.getElementById('icon-selector-grid');
  grid.innerHTML = '';

  const iconOptions = [
    'box', 'wrench', 'truck', 'users', 'search-book', 'dollar-sign', 
    'brain', 'gear', 'folder', 'database', 'shield', 'activity', 
    'shopping-cart', 'calendar', 'message-square', 'terminal', 
    'credit-card', 'bar-chart', 'life-buoy', 'briefcase', 'file-text', 
    'favicon'
  ];
  
  iconOptions.forEach(iconName => {
    const iconBtn = document.createElement('div');
    iconBtn.className = 'icon-option';
    if (iconName === 'favicon') iconBtn.classList.add('favicon-option');
    
    iconBtn.dataset.icon = iconName;
    iconBtn.innerHTML = SVG_ICONS[iconName];
    
    iconBtn.addEventListener('click', () => {
      document.querySelectorAll('.icon-option').forEach(el => el.classList.remove('selected'));
      iconBtn.classList.add('selected');
    });

    grid.appendChild(iconBtn);
  });
  
  const defaultSelected = document.querySelector('.icon-option');
  if (defaultSelected) defaultSelected.classList.add('selected');
}

// Render Applications List with Reorder buttons inside settings
let appsFilterQuery = '';

function renderAppsPanelList() {
  const panel = document.getElementById('apps-panel-list');
  if (!panel) return;
  
  panel.innerHTML = '';
  
  // Sort apps by order
  let sortedApps = [...state.apps].sort((a, b) => a.order - b.order);

  // Total count badge
  const countBadge = document.getElementById('apps-total-count');
  if (countBadge) {
    countBadge.textContent = `${state.apps.length} Apps`;
  }

  // Bind filter input once
  const filterInput = document.getElementById('apps-filter-input');
  if (filterInput && !filterInput.dataset.bound) {
    filterInput.dataset.bound = 'true';
    filterInput.addEventListener('input', (e) => {
      appsFilterQuery = e.target.value.trim().toLowerCase();
      renderAppsPanelList();
    });
  }

  if (appsFilterQuery) {
    sortedApps = sortedApps.filter(a => {
      const nameMatch = a.name.toLowerCase().includes(appsFilterQuery);
      const linkMatch = a.link && a.link.toLowerCase().includes(appsFilterQuery);
      const sectionObj = state.sections.find(s => s.id === a.sectionId);
      const sectionMatch = sectionObj && sectionObj.name.toLowerCase().includes(appsFilterQuery);
      return nameMatch || linkMatch || sectionMatch;
    });
  }

  if (sortedApps.length === 0) {
    panel.innerHTML = `
      <div style="text-align: center; padding: 2.5rem 1rem; color: var(--text-secondary); font-size: 0.85rem;">
        ${appsFilterQuery ? 'No applications match your filter.' : 'No applications configured yet.'}
      </div>
    `;
    return;
  }

  const currentEditId = document.getElementById('edit-app-id')?.value;

  sortedApps.forEach((app, index) => {
    const item = document.createElement('div');
    const isEditing = app.id === currentEditId;
    item.className = 'app-panel-card' + (isEditing ? ' active-edit' : '');
    item.dataset.id = app.id;

    const section = state.sections.find(s => s.id === app.sectionId);
    const sectionName = section ? section.name : 'Default';
    const isFirst = index === 0;
    const isLast = index === sortedApps.length - 1;

    item.innerHTML = `
      <div class="app-panel-card-main">
        <div class="app-panel-card-icon">
          ${getIconMarkup(app)}
        </div>
        <div class="app-panel-card-details">
          <div class="app-panel-card-title-row">
            <span class="app-panel-card-name">${escapeHTML(app.name)}</span>
            <span class="app-panel-section-tag">${escapeHTML(sectionName)}</span>
            ${app.type === 'folder' ? '<span class="app-panel-type-tag">FOLDER</span>' : ''}
            ${isEditing ? '<span class="app-panel-editing-tag">EDITING</span>' : ''}
          </div>
          <span class="app-panel-card-link" title="${escapeHTML(app.link || 'Internal View')}">
            ${app.type === 'folder' ? `Contains ${(app.appIds || []).length} apps` : (escapeHTML(app.link) || 'Internal Hub View')}
          </span>
        </div>
      </div>
      <div class="app-panel-card-actions">
        <button class="btn-reorder-up" data-id="${app.id}" title="Move Up" style="background: rgba(255,255,255,0.05); color: var(--text-primary); border: 1px solid var(--glass-border); padding: 0.25rem 0.45rem; border-radius: 4px; font-size: 0.72rem; cursor: pointer; ${isFirst ? 'opacity: 0.3; cursor: not-allowed;' : ''}" ${isFirst ? 'disabled' : ''}>▲</button>
        <button class="btn-reorder-down" data-id="${app.id}" title="Move Down" style="background: rgba(255,255,255,0.05); color: var(--text-primary); border: 1px solid var(--glass-border); padding: 0.25rem 0.45rem; border-radius: 4px; font-size: 0.72rem; cursor: pointer; ${isLast ? 'opacity: 0.3; cursor: not-allowed;' : ''}" ${isLast ? 'disabled' : ''}>▼</button>
        <button class="btn-icon-edit-app" data-id="${app.id}" style="background: ${isEditing ? 'var(--accent-green)' : 'rgba(141,220,4,0.1)'}; color: ${isEditing ? '#000' : 'var(--accent-green)'}; border: 1px solid rgba(141,220,4,0.3); padding: 0.25rem 0.6rem; border-radius: 4px; font-size: 0.72rem; font-weight: 700; cursor: pointer;">${isEditing ? 'Editing' : 'Edit'}</button>
        <button class="btn-icon-delete-app" data-id="${app.id}" title="Delete Application" style="background: rgba(255,59,48,0.1); color: #ff3b30; border: 1px solid rgba(255,59,48,0.2); padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.72rem; cursor: pointer;">&times;</button>
      </div>
    `;
    
    // Up click handler
    const btnUp = item.querySelector('.btn-reorder-up');
    if (btnUp && !isFirst) {
      btnUp.addEventListener('click', (e) => {
        e.stopPropagation();
        const prevApp = sortedApps[index - 1];
        const tempOrder = app.order;
        app.order = prevApp.order;
        prevApp.order = tempOrder;
        
        saveDatabase();
        syncAllAppsOrderToFirestore();
        renderAppsPanelList();
        renderAppGrid();
        showToast(`Moved "${app.name}" up`);
      });
    }
    
    // Down click handler
    const btnDown = item.querySelector('.btn-reorder-down');
    if (btnDown && !isLast) {
      btnDown.addEventListener('click', (e) => {
        e.stopPropagation();
        const nextApp = sortedApps[index + 1];
        const tempOrder = app.order;
        app.order = nextApp.order;
        nextApp.order = tempOrder;
        
        saveDatabase();
        syncAllAppsOrderToFirestore();
        renderAppsPanelList();
        renderAppGrid();
        showToast(`Moved "${app.name}" down`);
      });
    }
    
    // Edit click handler
    const btnEdit = item.querySelector('.btn-icon-edit-app');
    if (btnEdit) {
      btnEdit.addEventListener('click', (e) => {
        e.stopPropagation();
        loadAppIntoForm(app);
      });
    }
    
    // Delete click handler
    const btnDelete = item.querySelector('.btn-icon-delete-app');
    if (btnDelete) {
      btnDelete.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(`Are you sure you want to delete "${app.name}"?`)) {
          deleteApp(app.id);
          renderAppsPanelList();
        }
      });
    }
    
    panel.appendChild(item);
  });
}

// Render Users List tab inside Admin Panel
function renderUsersList() {
  const userListPanel = document.getElementById('users-panel-list');
  userListPanel.innerHTML = '';
  
  state.users.forEach(user => {
    const div = document.createElement('div');
    div.className = 'user-list-item';
    div.innerHTML = `
      <div class="user-item-info">
        <span class="user-item-name">${user.name}</span>
        <span class="user-item-role">${user.role}</span>
        <span style="font-size:0.75rem; color:var(--text-secondary);">${user.email || 'No email registered'}${(!user.id.startsWith('user-') && !user.id.startsWith('email_')) ? ` | UID: ${user.id}` : ' | Unlinked Profile'}</span>
      </div>
      <div style="display:flex; gap:0.5rem; align-items:center;">
        <button class="btn-icon-edit" data-id="${user.id}" style="background:rgba(255,255,255,0.05); color:var(--text-primary); border:1px solid var(--glass-border); padding:0.25rem 0.5rem; border-radius:4px; font-size:0.7rem; cursor:pointer;">Edit</button>
        ${user.role !== 'Admin' ? `<button class="btn-icon-delete" data-id="${user.id}" style="background:rgba(255,59,48,0.1); color:#ff3b30; border:1px solid rgba(255,59,48,0.15); padding:0.25rem 0.5rem; border-radius:4px; font-size:0.7rem; cursor:pointer;">&times; Delete</button>` : ''}
      </div>
    `;

    const editBtn = div.querySelector('.btn-icon-edit');
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        loadUserIntoForm(user);
      });
    }

    const deleteBtn = div.querySelector('.btn-icon-delete');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        if (confirm(`Remove user "${user.name}" and delete all custom access settings?`)) {
          deleteUser(user.id);
        }
      });
    }

    userListPanel.appendChild(div);
  });
}

function deleteUser(userId) {
  state.users = state.users.filter(u => u.id !== userId);
  delete state.permissions[userId];
  
  if (state.activeUserId === userId) {
    state.activeUserId = null;
  }
  
  saveDatabase();
  syncDeleteUserFromFirestore(userId);
  renderUsersList();
  renderPermissionsMatrix();
  renderAppGrid();
  showToast('Employee profile removed.');
}

// Render permission matrix — user-tab + section-grouped card layout
let matrixActiveUserId = null; // tracks which user tab is selected

function renderPermissionsMatrix() {
  const tabPanel = document.getElementById('tab-permissions');
  if (!tabPanel) return;

  // Keep Save button — find or rebuild the inner matrix wrapper
  let matrixWrapper = tabPanel.querySelector('.matrix-revamp-wrapper');
  if (!matrixWrapper) {
    // On first render, clear the old markup and build from scratch
    const oldDesc = tabPanel.querySelector('p');
    const oldContainer = tabPanel.querySelector('.matrix-container');
    if (oldDesc) oldDesc.remove();
    if (oldContainer) oldContainer.remove();

    matrixWrapper = document.createElement('div');
    matrixWrapper.className = 'matrix-revamp-wrapper';
    // Insert before the Save button
    const saveRow = tabPanel.querySelector('.form-actions');
    tabPanel.insertBefore(matrixWrapper, saveRow || null);
  }
  matrixWrapper.innerHTML = '';

  if (state.users.length === 0) {
    matrixWrapper.innerHTML = '<p style="color:var(--text-secondary);font-size:0.85rem;">No users yet. Add users in the Users tab first.</p>';
    return;
  }

  // Default active user to first user if not set or no longer exists
  if (!matrixActiveUserId || !state.users.find(u => u.id === matrixActiveUserId)) {
    matrixActiveUserId = state.users[0].id;
  }

  const activeUser = state.users.find(u => u.id === matrixActiveUserId);
  const userPerms = state.permissions[matrixActiveUserId] || [];

  // --- User Tab Strip ---
  const tabStrip = document.createElement('div');
  tabStrip.className = 'matrix-user-tabs';
  state.users.forEach(user => {
    const grantedCount = (state.permissions[user.id] || []).length;
    const tab = document.createElement('button');
    tab.className = 'matrix-user-tab' + (user.id === matrixActiveUserId ? ' active' : '');
    tab.type = 'button';
    tab.dataset.uid = user.id;
    tab.innerHTML = `
      ${escapeHTML(user.name)}
      <span class="matrix-summary-chip">${grantedCount}/${state.apps.length}</span>
    `;
    tab.addEventListener('click', () => {
      matrixActiveUserId = user.id;
      renderPermissionsMatrix();
    });
    tabStrip.appendChild(tab);
  });
  matrixWrapper.appendChild(tabStrip);

  // --- Bulk Controls ---
  const bulkRow = document.createElement('div');
  bulkRow.className = 'matrix-bulk-controls';
  bulkRow.innerHTML = `
    <span style="font-size:0.8rem;color:var(--text-secondary);font-weight:600;flex:1;">${escapeHTML(activeUser ? activeUser.name : '')} — ${userPerms.length} of ${state.apps.length} apps granted</span>
    <button type="button" class="btn-ios btn-matrix-grant-all" style="padding:0.3rem 0.75rem;font-size:0.75rem;">Grant All</button>
    <button type="button" class="btn-ios btn-matrix-revoke-all" style="padding:0.3rem 0.75rem;font-size:0.75rem;color:#ff3b30;border-color:rgba(255,59,48,0.3);">Revoke All</button>
  `;
  bulkRow.querySelector('.btn-matrix-grant-all').addEventListener('click', () => {
    state.permissions[matrixActiveUserId] = state.apps.map(a => a.id);
    saveDatabase();
    syncPermissionToFirestore(matrixActiveUserId, state.permissions[matrixActiveUserId]);
    renderAppGrid();
    renderPermissionsMatrix();
  });
  bulkRow.querySelector('.btn-matrix-revoke-all').addEventListener('click', () => {
    state.permissions[matrixActiveUserId] = [];
    saveDatabase();
    syncPermissionToFirestore(matrixActiveUserId, state.permissions[matrixActiveUserId]);
    renderAppGrid();
    renderPermissionsMatrix();
  });
  matrixWrapper.appendChild(bulkRow);

  // --- App rows grouped by section ---
  const sortedSections = [...state.sections].sort((a, b) => a.order - b.order);
  const currentUserPerms = state.permissions[matrixActiveUserId] || [];

  sortedSections.forEach(section => {
    const sectionApps = [...state.apps].sort((a, b) => a.order - b.order).filter(a => a.sectionId === section.id);
    if (sectionApps.length === 0) return;

    const group = document.createElement('div');
    group.className = 'matrix-section-group';

    const label = document.createElement('div');
    label.className = 'matrix-section-label';
    label.textContent = section.name;
    group.appendChild(label);

    sectionApps.forEach(app => {
      const isOn = currentUserPerms.includes(app.id);
      const row = document.createElement('div');
      row.className = 'matrix-app-row';
      row.innerHTML = `
        <div style="display:flex;align-items:center;gap:0.6rem;">
          <div class="matrix-app-icon">${SVG_ICONS[app.icon] || SVG_ICONS.box}</div>
          <span style="font-size:0.85rem;font-weight:600;">${escapeHTML(app.name)}</span>
          ${app.type === 'folder' ? '<span style="font-size:0.65rem;color:var(--accent-green);font-weight:700;padding:0.1rem 0.3rem;border-radius:3px;background:rgba(141,220,4,0.12);">FOLDER</span>' : ''}
        </div>
        <label class="toggle-switch" title="${isOn ? 'Revoke access' : 'Grant access'}">
          <input type="checkbox" class="matrix-toggle" data-user="${matrixActiveUserId}" data-app="${app.id}" ${isOn ? 'checked' : ''}>
          <span class="toggle-slider"></span>
        </label>
      `;
      row.querySelector('.matrix-toggle').addEventListener('change', (e) => {
        if (!state.permissions[matrixActiveUserId]) state.permissions[matrixActiveUserId] = [];
        if (e.target.checked) {
          if (!state.permissions[matrixActiveUserId].includes(app.id)) {
            state.permissions[matrixActiveUserId].push(app.id);
          }
        } else {
          state.permissions[matrixActiveUserId] = state.permissions[matrixActiveUserId].filter(id => id !== app.id);
        }
        saveDatabase();
        syncPermissionToFirestore(matrixActiveUserId, state.permissions[matrixActiveUserId]);
        renderAppGrid();
        renderPermissionsMatrix();
      });
      group.appendChild(row);
    });

    matrixWrapper.appendChild(group);
  });
}

// handlePermissionsSave now reads from state.permissions directly (toggles update it live)


// App form save & EDIT handler
function handleAppSubmit(e) {
  e.preventDefault();
  const editId = document.getElementById('edit-app-id').value;
  const name = document.getElementById('app-name').value.trim();
  const link = document.getElementById('app-link').value.trim();
  const selectedIconEl = document.querySelector('.icon-option.selected');
  const icon = selectedIconEl ? selectedIconEl.dataset.icon : 'box';
  
  const existingApp = editId ? state.apps.find(a => a.id === editId) : null;
  const isBuiltIn = existingApp && (existingApp.id === 'health-benefits' || existingApp.id === 'benefits-docs' || existingApp.id === 'forklift-safety' || !existingApp.link);

  if (!name) return;
  if (!isBuiltIn && !link) {
    showToast('Please provide an external URL link.', false);
    return;
  }

  if (editId) {
    // EDITING EXISTING APP
    const appIndex = state.apps.findIndex(a => a.id === editId);
    if (appIndex !== -1) {
      state.apps[appIndex].name = name;
      if (link || !isBuiltIn) {
        state.apps[appIndex].link = link;
      }
      state.apps[appIndex].icon = icon;
      state.apps[appIndex].sectionId = document.getElementById('app-section').value || 'default';
      showToast('Application updated successfully');
      syncAppToFirestore(state.apps[appIndex]);
    }
  } else {
    // CREATING NEW APP
    const newApp = {
      id: `app-${Date.now()}`,
      name: name,
      link: link,
      icon: icon,
      order: state.apps.length,
      type: 'app',
      sectionId: document.getElementById('app-section').value || 'default'
    };
    state.apps.push(newApp);
    
    // Auto grant access to all Admins and El Presidentes
    state.users.forEach(u => {
      const r = (u.role || '').toLowerCase();
      if (r.includes('admin') || r.includes('president') || r.includes('boss') || r.includes('executive') || r.includes('chief')) {
        if (!state.permissions[u.id]) state.permissions[u.id] = [];
        if (!state.permissions[u.id].includes(newApp.id)) {
          state.permissions[u.id].push(newApp.id);
          syncPermissionToFirestore(u.id, state.permissions[u.id]);
        }
      }
    });
    showToast('New Application Added Successfully!');
    syncAppToFirestore(newApp);
  }

  saveDatabase();
  resetAppCuratorForm();
  renderAppGrid();
  renderPermissionsMatrix();
  renderAppsPanelList();
}

// User form save handler
function handleUserSubmit(e) {
  e.preventDefault();
  const editId = document.getElementById('edit-user-id').value;
  const name = document.getElementById('new-user-name').value.trim();
  const email = document.getElementById('new-user-email').value.trim().toLowerCase();
  const role = document.getElementById('new-user-role').value;
  const newUidInput = document.getElementById('new-user-uid') ? document.getElementById('new-user-uid').value.trim() : '';
  
  if (!name || !role) return;

  if (editId) {
    // Editing an existing user
    const userIndex = state.users.findIndex(u => u.id === editId);
    if (userIndex !== -1) {
      // Check if we are setting or changing a custom Firebase UID
      if (newUidInput && editId !== newUidInput) {
        // We are performing a manual migration/linking!
        const migratedUser = { id: newUidInput, name: name, role: role, email: email };
        
        // Fetch old permissions
        const oldPerms = state.permissions[editId] || [];

        // Save new documents in Firestore
        syncUserToFirestore(migratedUser);
        syncPermissionToFirestore(newUidInput, oldPerms);

        // Delete old legacy documents from Firestore
        syncDeleteUserFromFirestore(editId);

        // Update local state
        state.users[userIndex] = migratedUser;
        state.permissions[newUidInput] = oldPerms;
        delete state.permissions[editId];

        showToast(`Migrated & Linked Profile to UID: ${newUidInput}`);
      } else {
        // Standard profile update without ID change
        state.users[userIndex].name = name;
        state.users[userIndex].email = email;
        state.users[userIndex].role = role;
        showToast(`Updated Profile: ${name}`);
        syncUserToFirestore(state.users[userIndex]);
      }
    }
  } else {
    // Creating a new user
    const userId = newUidInput || `email_${email.trim().toLowerCase()}`;
    const newUser = { id: userId, name: name, role: role, email: email };
    state.users.push(newUser);
    
    let initialPerms = ['catalog', 'ai-troubleshoot'];
    if (role === 'Admin' || role === 'El Presidente') {
      initialPerms = state.apps.map(a => a.id);
    } else if (role === 'Sales') {
      initialPerms = ['orders', 'crm', 'catalog', 'folder-ops'];
    } else if (role === 'Shipping') {
      initialPerms = ['inventory', 'repairs', 'catalog', 'ai-troubleshoot', 'folder-ops'];
    }
    state.permissions[userId] = initialPerms;
    showToast(`Created Profile: ${name}`);
    
    syncUserToFirestore(newUser);
    syncPermissionToFirestore(userId, initialPerms);
  }

  saveDatabase();
  renderUsersList();
  renderPermissionsMatrix();
  resetUserForm();
}

function loadUserIntoForm(user) {
  document.getElementById('edit-user-id').value = user.id;
  document.getElementById('new-user-name').value = user.name || '';
  document.getElementById('new-user-email').value = user.email || '';
  document.getElementById('new-user-role').value = user.role || 'Shipping';
  
  const uidField = document.getElementById('new-user-uid');
  if (uidField) {
    uidField.value = (user.id.startsWith('user-') || user.id.startsWith('email_')) ? '' : user.id;
  }
  document.getElementById('btn-save-user').textContent = 'Update Employee Profile';
}

function resetUserForm() {
  document.getElementById('user-creator-form').reset();
  document.getElementById('edit-user-id').value = '';
  
  const uidField = document.getElementById('new-user-uid');
  if (uidField) {
    uidField.value = '';
  }
  document.getElementById('btn-save-user').textContent = 'Create Employee Profile';
}

// Active Profile Self Management Forms
function loadProfileIntoForm() {
  const user = auth.currentUser;
  const activeUser = getActiveUser();
  if (!user || !activeUser) return;

  document.getElementById('profile-name').value = activeUser.name || '';
  document.getElementById('profile-role').value = activeUser.role || 'Shipping';
  document.getElementById('profile-email').value = user.email || '';
  document.getElementById('profile-password').value = '';
  document.getElementById('profile-confirm-password').value = '';
  document.getElementById('profile-error-msg').style.display = 'none';
}

function handleProfileSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('profile-name').value.trim();
  const email = document.getElementById('profile-email').value.trim().toLowerCase();
  const password = document.getElementById('profile-password').value;
  const confirmPassword = document.getElementById('profile-confirm-password').value;
  const errorDiv = document.getElementById('profile-error-msg');
  const submitBtn = document.getElementById('btn-save-profile');

  errorDiv.style.display = 'none';
  
  if (password && password !== confirmPassword) {
    errorDiv.textContent = "Passwords do not match.";
    errorDiv.style.display = 'block';
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Updating Profile...';

  const promises = [];
  const user = auth.currentUser;
  const activeUser = getActiveUser();

  // Update Display Name
  if (name && name !== activeUser.name) {
    promises.push(
      updateProfile(user, { displayName: name }).then(() => {
        activeUser.name = name;
      })
    );
  }

  // Update Email
  if (email && email !== user.email) {
    promises.push(
      updateEmail(user, email).then(() => {
        activeUser.email = email;
      })
    );
  }

  // Update Password
  if (password) {
    promises.push(updatePassword(user, password));
  }

  Promise.all(promises)
    .then(() => {
      saveDatabase();
      syncUserToFirestore(activeUser);
      renderAuthHeader(auth.currentUser);
      renderAppGrid();
      showToast('Profile updated successfully!');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Update Account Details';
      loadProfileIntoForm();
    })
    .catch((error) => {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Update Account Details';
      
      let msg = error.message;
      if (error.code === 'auth/requires-recent-login') {
        msg = 'Security check: Please log out and log back in to perform email/password changes.';
      }
      
      errorDiv.textContent = msg;
      errorDiv.style.display = 'block';
      showToast('Update failed', false);
    });
}

// Permissions save handler — state.permissions is updated live by toggle switches
function handlePermissionsSave() {
  saveDatabase();
  
  // Sync all users' permissions to Firestore
  state.users.forEach(user => {
    syncPermissionToFirestore(user.id, state.permissions[user.id] || []);
  });
  
  renderAppGrid();
  showToast('Employee Permissions Saved!');
  closeAdminPortal();
}


// --- TAB: Dashboard Sections Management Engine ---

function renderSectionsPanelList() {
  const panel = document.getElementById('sections-panel-list');
  if (!panel) return;
  panel.innerHTML = '';
  const sortedSections = [...state.sections].sort((a, b) => a.order - b.order);
  sortedSections.forEach((section, index) => {
    const item = document.createElement('div');
    item.className = 'user-list-item';
    const isDefault = section.id === 'default';
    const isFirstSubsequent = index === 1;
    const isLastSubsequent = index === sortedSections.length - 1;
    
    item.innerHTML = `
      <div class="user-item-info">
        <span class="user-item-name" style="font-weight: 700;">
          ${section.name}
          ${isDefault ? '<span style="font-size: 0.7rem; font-weight: 600; padding: 0.15rem 0.4rem; border-radius: 4px; background: rgba(141,220,4,0.15); color: var(--accent-green); margin-left: 0.5rem; text-transform: uppercase;">Default</span>' : ''}
        </span>
        <span style="font-size: 0.75rem; color: var(--text-secondary);">
          Apps assigned: ${state.apps.filter(a => a.sectionId === section.id).length}
        </span>
      </div>
      <div style="display: flex; gap: 0.35rem; align-items: center;">
        ${!isDefault ? `
          <button class="btn-reorder-section-up" data-id="${section.id}" title="Move Up" style="background: rgba(255,255,255,0.05); color: var(--text-primary); border: 1px solid var(--glass-border); padding: 0.25rem 0.4rem; border-radius: 4px; font-size: 0.7rem; cursor: pointer; ${isFirstSubsequent ? 'opacity: 0.35; cursor: not-allowed;' : ''}" ${isFirstSubsequent ? 'disabled' : ''}>▲</button>
          <button class="btn-reorder-section-down" data-id="${section.id}" title="Move Down" style="background: rgba(255,255,255,0.05); color: var(--text-primary); border: 1px solid var(--glass-border); padding: 0.25rem 0.4rem; border-radius: 4px; font-size: 0.7rem; cursor: pointer; ${isLastSubsequent ? 'opacity: 0.35; cursor: not-allowed;' : ''}" ${isLastSubsequent ? 'disabled' : ''}>▼</button>
        ` : ''}
        <button class="btn-icon-edit-section" data-id="${section.id}" style="background: rgba(255,255,255,0.05); color: var(--text-primary); border: 1px solid var(--glass-border); padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.7rem; cursor: pointer;">Edit</button>
        ${!isDefault ? `<button class="btn-icon-delete-section" data-id="${section.id}" style="background: rgba(255,59,48,0.1); color: #ff3b30; border: 1px solid rgba(255,59,48,0.15); padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.7rem; cursor: pointer;">&times;</button>` : ''}
      </div>
    `;
    
    const btnUp = item.querySelector('.btn-reorder-section-up');
    if (btnUp && index > 1) {
      btnUp.addEventListener('click', () => {
        const prevSection = sortedSections[index - 1];
        const tempOrder = section.order;
        section.order = prevSection.order;
        prevSection.order = tempOrder;
        saveDatabase();
        syncAllSectionsOrderToFirestore();
        renderSectionsPanelList();
        renderAppGrid();
        showToast('Section order updated.');
      });
    }
    
    const btnDown = item.querySelector('.btn-reorder-section-down');
    if (btnDown && index < sortedSections.length - 1 && index > 0) {
      btnDown.addEventListener('click', () => {
        const nextSection = sortedSections[index + 1];
        const tempOrder = section.order;
        section.order = nextSection.order;
        nextSection.order = tempOrder;
        saveDatabase();
        syncAllSectionsOrderToFirestore();
        renderSectionsPanelList();
        renderAppGrid();
        showToast('Section order updated.');
      });
    }
    
    const btnEdit = item.querySelector('.btn-icon-edit-section');
    if (btnEdit) {
      btnEdit.addEventListener('click', () => {
        document.getElementById('edit-section-id').value = section.id;
        document.getElementById('section-name').value = section.name;
        document.getElementById('btn-save-section').textContent = 'Update Section';
      });
    }
    
    const btnDelete = item.querySelector('.btn-icon-delete-section');
    if (btnDelete) {
      btnDelete.addEventListener('click', () => {
        if (confirm(`Are you sure you want to delete "${section.name}"? All assigned apps will move to the default section.`)) {
          deleteSection(section.id);
        }
      });
    }
    panel.appendChild(item);
  });
}

function deleteSection(id) {
  if (id === 'default') return;
  state.sections = state.sections.filter(s => s.id !== id);
  state.apps.forEach(app => {
    if (app.sectionId === id) {
      app.sectionId = 'default';
      syncAppToFirestore(app);
    }
  });
  saveDatabase();
  syncDeleteSectionFromFirestore(id);
  renderSectionsPanelList();
  renderAppSectionSelect();
  renderAppGrid();
  showToast('Section deleted.');
}

function handleSectionSubmit(e) {
  e.preventDefault();
  const editId = document.getElementById('edit-section-id').value;
  const name = document.getElementById('section-name').value.trim();
  if (!name) return;
  if (editId) {
    const idx = state.sections.findIndex(s => s.id === editId);
    if (idx !== -1) {
      state.sections[idx].name = name;
      showToast('Section updated');
      syncSectionToFirestore(state.sections[idx]);
    }
  } else {
    const newSection = { id: `section-${Date.now()}`, name: name, order: state.sections.length };
    state.sections.push(newSection);
    showToast('Section created');
    syncSectionToFirestore(newSection);
  }
  saveDatabase();
  resetSectionForm();
  renderSectionsPanelList();
  renderAppSectionSelect();
  renderAppGrid();
}

function resetSectionForm() {
  document.getElementById('section-curator-form').reset();
  document.getElementById('edit-section-id').value = '';
  document.getElementById('btn-save-section').textContent = 'Save Section';
}

function renderAppSectionSelect() {
  const select = document.getElementById('app-section');
  if (!select) return;
  select.innerHTML = '';
  const sortedSections = [...state.sections].sort((a, b) => a.order - b.order);
  sortedSections.forEach(section => {
    const opt = document.createElement('option');
    opt.value = section.id;
    opt.textContent = section.name;
    select.appendChild(opt);
  });
}

// --- TAB: Broadcast Curation Engine (Post and Edit Announcements!) ---


function renderBroadcastList() {
  const list = document.getElementById('broadcasts-panel-list');
  list.innerHTML = '';
  
  state.broadcasts.forEach(broadcast => {
    const item = document.createElement('div');
    item.className = 'user-list-item';
    item.innerHTML = `
      <div class="user-item-info">
        <span class="user-item-name">${broadcast.title} <span style="font-size:0.7rem; color:var(--accent-green); margin-left:5px;">(${broadcast.time})</span></span>
        <span class="user-item-role" style="text-transform:none; font-weight:normal; color:var(--text-secondary); margin-top:2px;">${broadcast.body}</span>
      </div>
      <div>
        <button class="btn-icon-edit" style="color:#007aff; background:transparent; border:none; margin-right:10px; cursor:pointer; font-weight:bold;" data-id="${broadcast.id}">Edit</button>
        <button class="btn-icon-delete" data-id="${broadcast.id}">&times; Delete</button>
      </div>
    `;

    item.querySelector('.btn-icon-edit').addEventListener('click', () => {
      loadBroadcastIntoForm(broadcast);
    });

    item.querySelector('.btn-icon-delete').addEventListener('click', () => {
      if (confirm(`Remove broadcast announcement "${broadcast.title}"?`)) {
        deleteBroadcast(broadcast.id);
      }
    });

    list.appendChild(item);
  });
}

function loadBroadcastIntoForm(broadcast) {
  document.getElementById('edit-broadcast-id').value = broadcast.id;
  document.getElementById('broadcast-title').value = broadcast.title;
  document.getElementById('broadcast-time').value = broadcast.time;
  document.getElementById('broadcast-body').value = broadcast.body;
  document.getElementById('btn-save-broadcast').textContent = 'Update Broadcast';
}

function resetBroadcastForm() {
  document.getElementById('broadcast-curator-form').reset();
  document.getElementById('edit-broadcast-id').value = '';
  document.getElementById('btn-save-broadcast').textContent = 'Publish Broadcast';
}

function handleBroadcastSubmit(e) {
  e.preventDefault();
  const editId = document.getElementById('edit-broadcast-id').value;
  const title = document.getElementById('broadcast-title').value.trim();
  const time = document.getElementById('broadcast-time').value.trim();
  const body = document.getElementById('broadcast-body').value.trim();
  
  if (!title || !body || !time) return;

  if (editId) {
    const idx = state.broadcasts.findIndex(b => b.id === editId);
    if (idx !== -1) {
      state.broadcasts[idx].title = title;
      state.broadcasts[idx].time = time;
      state.broadcasts[idx].body = body;
      showToast('Announcement updated');
      syncBroadcastToFirestore(state.broadcasts[idx]);
    }
  } else {
    const newBroadcast = {
      id: `b-${Date.now()}`,
      title: title,
      time: time,
      body: body
    };
    state.broadcasts.unshift(newBroadcast); 
    showToast('New Announcement Posted!');
    syncBroadcastToFirestore(newBroadcast);
  }

  saveDatabase();
  resetBroadcastForm();
  renderWidgets();
  renderBroadcastList();
}

function deleteBroadcast(id) {
  state.broadcasts = state.broadcasts.filter(b => b.id !== id);
  saveDatabase();
  syncDeleteBroadcastFromFirestore(id);
  renderWidgets();
  renderBroadcastList();
  showToast('Announcement deleted.');
}

// Dialog tabs controller
function setupDialogTabs() {
  const tabs = document.querySelectorAll('.dialog-tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      const targetContentId = tab.dataset.tab;
      document.querySelectorAll('.dialog-tab-content').forEach(c => {
        c.classList.remove('active');
      });
      document.getElementById(targetContentId).classList.add('active');
    });
  });
}

// Clock updates
function initClockUpdates() {
  function updateTime() {
    const now = new Date();
    
    let hrs = now.getHours();
    const mins = String(now.getMinutes()).padStart(2, '0');
    const ampm = hrs >= 12 ? 'PM' : 'AM';
    const statusHrs = String(hrs % 12 || 12);
    
    const timeStr = `${statusHrs}:${mins} ${ampm}`;
    
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    const dateStr = now.toLocaleDateString('en-US', options);
    
    const clockTimeEl = document.getElementById('widget-time');
    const clockDateEl = document.getElementById('widget-date');
    if (clockTimeEl) clockTimeEl.textContent = timeStr;
    if (clockDateEl) clockDateEl.textContent = dateStr;
  }
  
  updateTime();
  setInterval(updateTime, 60000); 
}

// Event Bindings
function bindEventHandlers() {
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

  // Edit Layout grid wobble toggle
  document.getElementById('btn-edit-grid').addEventListener('click', () => {
    toggleEditMode();
  });

  // Open settings/admin modal directly
  document.getElementById('btn-admin-portal').addEventListener('click', () => {
    openAdminPortal();
  });

  // Exit Admin Panel Portal back to App Grid
  document.getElementById('btn-close-admin-panel').addEventListener('click', () => {
    closeAdminPortal();
  });

  // Create Application curator trigger
  document.getElementById('btn-add-app').addEventListener('click', () => {
    openAdminPortal();
    document.querySelector('.dialog-tab-btn[data-tab="tab-apps"]').click();
  });

  document.getElementById('btn-reset-app-form').addEventListener('click', resetAppCuratorForm);
  document.getElementById('btn-reset-broadcast-form').addEventListener('click', resetBroadcastForm);
  document.getElementById('btn-reset-user-form').addEventListener('click', resetUserForm);
  document.getElementById('btn-reset-section-form').addEventListener('click', resetSectionForm);

  // Forms submissions hooks
  document.getElementById('app-curator-form').addEventListener('submit', handleAppSubmit);
  document.getElementById('user-creator-form').addEventListener('submit', handleUserSubmit);
  document.getElementById('profile-settings-form').addEventListener('submit', handleProfileSubmit);
  document.getElementById('broadcast-curator-form').addEventListener('submit', handleBroadcastSubmit);
  document.getElementById('section-curator-form').addEventListener('submit', handleSectionSubmit);
  document.getElementById('btn-save-permissions').addEventListener('click', handlePermissionsSave);

  // Forklift safety admin events
  const btnResetForklift = document.getElementById('btn-reset-forklift-form');
  if (btnResetForklift) btnResetForklift.addEventListener('click', resetForkliftOperatorForm);
  const forkliftForm = document.getElementById('forklift-operator-form');
  if (forkliftForm) forkliftForm.addEventListener('submit', handleForkliftOperatorSubmit);
  const forkliftStatusSelect = document.getElementById('forklift-op-status');
  if (forkliftStatusSelect) {
    forkliftStatusSelect.addEventListener('change', (e) => {
      const certGroup = document.getElementById('forklift-cert-date-group');
      if (certGroup) {
        certGroup.style.display = e.target.value === 'Certified' ? 'block' : 'none';
      }
    });
  }

  // Folder modal closure elements
  document.getElementById('btn-close-folder').addEventListener('click', closeFolderDrawer);
  document.getElementById('folder-overlay').addEventListener('click', (e) => {
    if (e.target.id === 'folder-overlay') closeFolderDrawer();
  });
  document.getElementById('folder-drawer-title').addEventListener('blur', handleFolderRename);
  document.getElementById('folder-drawer-title').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.target.blur();
    }
  });

  // Poll events
  const btnTogglePoll = document.getElementById('btn-toggle-create-poll');
  if (btnTogglePoll) {
    btnTogglePoll.addEventListener('click', toggleCreatePollForm);
  }
  const btnCancelPoll = document.getElementById('btn-cancel-create-poll');
  if (btnCancelPoll) {
    btnCancelPoll.addEventListener('click', toggleCreatePollForm);
  }
  const btnAddOption = document.getElementById('btn-add-poll-option');
  if (btnAddOption) {
    btnAddOption.addEventListener('click', addPollOptionInput);
  }
  const formPoll = document.getElementById('poll-creation-form');
  if (formPoll) {
    formPoll.addEventListener('submit', handlePollSubmit);
  }

  // Poll filter tabs
  const tabActive = document.getElementById('tab-polls-active');
  const tabPast = document.getElementById('tab-polls-past');
  if (tabActive && tabPast) {
    tabActive.addEventListener('click', () => {
      tabActive.classList.add('active');
      tabPast.classList.remove('active');
      state.pollsFilter = 'active';
      renderPolls();
    });
    tabPast.addEventListener('click', () => {
      tabPast.classList.add('active');
      tabActive.classList.remove('active');
      state.pollsFilter = 'closed';
      renderPolls();
    });
  }

  setupDialogTabs();
}

// --- Firebase Authentication Observer Integration ---
function initFirebaseAuth() {
  onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      await loadDatabaseFromFirestore();
    } else {
      // Logged Out State
      if (pollsUnsubscribe) {
        pollsUnsubscribe();
        pollsUnsubscribe = null;
      }
      if (suggestionsUnsubscribe) {
        suggestionsUnsubscribe();
        suggestionsUnsubscribe = null;
      }
      state.activeUserId = null;
      state.suggestions = [];
      saveDatabase();
      
      renderAuthHeader(null);
      renderWidgets();
      renderAppGrid();
      closeAdminPortal(); // Exit admin panel if logged out
    }
  });
}

// --- App Initialization Entry Point ---
document.addEventListener('DOMContentLoaded', () => {
  initDatabase();
  renderWidgets();
  initClockUpdates();
  bindEventHandlers();
  initFirebaseAuth(); // Dynamic Firebase login observer

  // Service Worker registration for PWA installability
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('Service Worker registered with scope:', reg.scope))
      .catch(err => console.error('Service Worker registration failed:', err));
  }
});

// --- Employee Polls Widget Functionality ---

function renderPolls() {
  const container = document.getElementById('widget-polls-list');
  if (!container) return;

  // Toggle "+ Create Poll" visibility based on auth
  const btnToggle = document.getElementById('btn-toggle-create-poll');
  if (btnToggle) {
    btnToggle.style.display = state.activeUserId ? 'inline-flex' : 'none';
  }

  // Filter polls
  const pollsToRender = state.polls.filter(poll => {
    if (state.pollsFilter === 'active') {
      return poll.status === 'active';
    } else {
      return poll.status === 'closed';
    }
  });

  // Sort by createdAt descending
  pollsToRender.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  container.innerHTML = '';

  if (!state.activeUserId) {
    container.innerHTML = `<div style="color: var(--text-secondary); font-size: 0.8rem; text-align: center; padding: 1rem 0;">Please log in to view and vote on polls.</div>`;
    return;
  }

  if (pollsToRender.length === 0) {
    container.innerHTML = `<div style="color: var(--text-secondary); font-size: 0.8rem; text-align: center; padding: 1rem 0;">No ${state.pollsFilter} polls found.</div>`;
    return;
  }

  const activeUser = getActiveUser();
  const r = activeUser ? (activeUser.role || '').toLowerCase() : '';
  const isAdmin = r.includes('admin') || r.includes('president') || r.includes('boss') || r.includes('executive') || r.includes('chief');

  pollsToRender.forEach(poll => {
    const pollItem = document.createElement('article');
    pollItem.className = 'poll-item';

    // Meta details
    const dateStr = new Date(poll.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' });
    const creatorMeta = `<div class="poll-creator-meta"><span>By ${poll.creatorName || 'Employee'}</span><span>${dateStr}</span></div>`;

    // Question
    const questionEl = `<div class="poll-question">${poll.question}</div>`;

    // Check if current user already voted
    const votesList = poll.votes || [];
    const userVote = votesList.find(v => v.uid === state.activeUserId);
    const hasVoted = !!userVote;
    const isClosed = poll.status === 'closed';

    let contentHtml = '';

    if (isClosed || hasVoted) {
      // Show results (percentages and voter names)
      const totalVotes = votesList.length;

      // Group votes by optionIndex
      const voteCounts = {};
      poll.options.forEach((_, idx) => { voteCounts[idx] = 0; });
      votesList.forEach(v => {
        if (voteCounts[v.optionIndex] !== undefined) {
          voteCounts[v.optionIndex]++;
        }
      });

      let optionsHtml = '';
      poll.options.forEach((option, idx) => {
        const count = voteCounts[idx];
        const percent = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
        const votedForThis = userVote && userVote.optionIndex === idx;

        // Find voters for this option
        const votersForThis = votesList.filter(v => v.optionIndex === idx).map(v => v.name);
        const votersText = votersForThis.length > 0 ? `Voters: ${votersForThis.join(', ')}` : 'No votes yet';

        optionsHtml += `
          <div class="poll-result-bar-wrapper">
            <div class="poll-result-bar-label">
              <span>${option}${votedForThis ? ' <span class="poll-result-user-voted">My Vote</span>' : ''}</span>
              <span class="poll-result-count">${count} (${percent}%)</span>
            </div>
            <div class="poll-result-bar-track">
              <div class="poll-result-bar-fill" style="width: ${percent}%"></div>
            </div>
            <div class="poll-voter-list-text">${votersText}</div>
          </div>
        `;
      });
      contentHtml = `<div class="poll-options-list">${optionsHtml}</div>`;
    } else {
      // Show voting buttons
      let optionsHtml = '';
      poll.options.forEach((option, idx) => {
        optionsHtml += `
          <button type="button" class="btn-poll-vote-option" data-poll-id="${poll.id}" data-option-idx="${idx}">
            <span>${option}</span>
            <svg style="width:14px;height:14px;opacity:0.6;" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"></path></svg>
          </button>
        `;
      });
      contentHtml = `<div class="poll-options-list">${optionsHtml}</div>`;
    }

    // Admin/Creator controls
    let footerHtml = '';
    const isCreator = poll.createdBy === state.activeUserId;
    if (isAdmin || isCreator) {
      footerHtml = `
        <div class="poll-footer-actions">
          ${!isClosed ? `<button type="button" class="btn-poll-action btn-close-poll" data-poll-id="${poll.id}">Close Poll</button>` : ''}
          <button type="button" class="btn-poll-action btn-poll-action-danger btn-delete-poll" data-poll-id="${poll.id}">Delete</button>
        </div>
      `;
    }

    pollItem.innerHTML = creatorMeta + questionEl + contentHtml + footerHtml;

    // Attach vote listeners
    pollItem.querySelectorAll('.btn-poll-vote-option').forEach(btn => {
      btn.addEventListener('click', () => {
        const pollId = btn.dataset.pollId;
        const optionIdx = parseInt(btn.dataset.optionIdx);
        submitVote(pollId, optionIdx);
      });
    });

    // Attach close listener
    const closeBtn = pollItem.querySelector('.btn-close-poll');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        closePoll(poll.id);
      });
    }

    // Attach delete listener
    const deleteBtn = pollItem.querySelector('.btn-delete-poll');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete this poll?')) {
          deletePoll(poll.id);
        }
      });
    }

    container.appendChild(pollItem);
  });
}

function toggleCreatePollForm() {
  const form = document.getElementById('poll-creation-form');
  if (!form) return;
  const isHidden = form.style.display === 'none';
  form.style.display = isHidden ? 'block' : 'none';
  
  if (isHidden) {
    // Reset options inputs
    document.getElementById('poll-question-input').value = '';
    const container = document.getElementById('poll-options-inputs-container');
    container.innerHTML = `
      <input type="text" class="form-control poll-option-input" style="padding: 0.4rem 0.6rem; font-size: 0.85rem;" placeholder="Option 1" required autocomplete="off">
      <input type="text" class="form-control poll-option-input" style="padding: 0.4rem 0.6rem; font-size: 0.85rem;" placeholder="Option 2" required autocomplete="off">
    `;
  }
}

function addPollOptionInput() {
  const container = document.getElementById('poll-options-inputs-container');
  const count = container.querySelectorAll('.poll-option-input').length;
  if (count >= 4) {
    showToast('Maximum of 4 options allowed.', false);
    return;
  }
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'form-control poll-option-input';
  input.style.padding = '0.4rem 0.6rem';
  input.style.fontSize = '0.85rem';
  input.placeholder = `Option ${count + 1}`;
  input.required = true;
  input.autocomplete = 'off';
  container.appendChild(input);
}

async function handlePollSubmit(e) {
  e.preventDefault();
  const question = document.getElementById('poll-question-input').value.trim();
  const optionInputs = document.querySelectorAll('.poll-option-input');
  const options = Array.from(optionInputs).map(input => input.value.trim()).filter(v => v);

  if (options.length < 2) {
    showToast('A poll requires at least 2 options.', false);
    return;
  }

  const activeUser = getActiveUser();
  if (!activeUser) {
    showToast('You must be logged in to create a poll.', false);
    return;
  }

  const newPoll = {
    id: `poll-${Date.now()}`,
    question: question,
    options: options,
    createdBy: activeUser.id,
    creatorName: activeUser.name,
    createdAt: new Date().toISOString(),
    status: 'active',
    votes: []
  };

  state.polls.push(newPoll);
  saveDatabase();
  syncPollToFirestore(newPoll);
  toggleCreatePollForm();
  renderPolls();
  showToast('Poll published successfully!');
}

async function submitVote(pollId, optionIndex) {
  const activeUser = getActiveUser();
  if (!activeUser) {
    showToast('Please log in to vote.', false);
    return;
  }
 
  const poll = state.polls.find(p => p.id === pollId);
  if (!poll) return;
 
  // Prevent double vote
  if (poll.votes.some(v => v.uid === activeUser.id)) {
    showToast('You have already voted on this poll.', false);
    return;
  }
 
  const newVote = {
    uid: activeUser.id,
    name: activeUser.name,
    optionIndex: optionIndex
  };
 
  // Optimistically update local state and UI for instant response
  poll.votes.push(newVote);
  saveDatabase();
  renderPolls();
 
  // Atomically append vote to document in database
  try {
    await updateDoc(doc(db, "polls", pollId), {
      votes: arrayUnion(newVote)
    });
    showToast('Your vote has been counted!');
  } catch (err) {
    console.error("Failed to submit vote atomically:", err);
    showToast('Failed to lock in your vote. Please try again.', false);
    // Rollback local state if write fails
    poll.votes = poll.votes.filter(v => v.uid !== activeUser.id);
    saveDatabase();
    renderPolls();
  }
}

async function closePoll(pollId) {
  const poll = state.polls.find(p => p.id === pollId);
  if (!poll) return;

  poll.status = 'closed';
  saveDatabase();
  syncPollToFirestore(poll);
  renderPolls();
  showToast('Poll has been closed.');
}

async function deletePoll(pollId) {
  state.polls = state.polls.filter(p => p.id !== pollId);
  saveDatabase();
  syncDeletePollFromFirestore(pollId);
  renderPolls();
  showToast('Poll has been deleted.');
}
 
function subscribeToPolls() {
  if (pollsUnsubscribe) {
    pollsUnsubscribe();
    pollsUnsubscribe = null;
  }
 
  try {
    const pollsCollection = collection(db, "polls");
    pollsUnsubscribe = onSnapshot(pollsCollection, (snapshot) => {
      const pollsList = [];
      snapshot.forEach(doc => {
        pollsList.push(doc.data());
      });
      state.polls = pollsList.length > 0 ? pollsList : DEFAULT_POLLS;
      saveDatabase();
      renderPolls();
    }, (error) => {
      console.error("Polls real-time subscription error:", error);
    });
  } catch (err) {
    console.error("Failed to start polls subscription:", err);
  }
}

// --- Suggestion Box Widget & Inbox Functionality ---

function renderSuggestionBox() {
  const container = document.getElementById('widget-suggestion-container');
  if (!container) return;

  if (!state.activeUserId) {
    container.innerHTML = `<div style="color: var(--text-secondary); font-size: 0.8rem; text-align: center; padding: 1rem 0;">Please log in to submit suggestions.</div>`;
    return;
  }

  container.innerHTML = `
    <form id="suggestion-form" style="display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.5rem;">
      <div class="form-group-small" style="margin-bottom: 0;">
        <textarea id="suggestion-input" class="form-control" style="resize: none; min-height: 80px; font-size: 0.85rem; padding: 0.5rem 0.6rem; width: 100%;" placeholder="Share your feedback..." required autocomplete="off"></textarea>
      </div>
      <button type="submit" class="btn-ios btn-ios-accent" style="width: 100%; justify-content: center; padding: 0.4rem 0.6rem; font-size: 0.8rem; font-weight: 700;">Submit Suggestion</button>
    </form>
  `;

  document.getElementById('suggestion-form').addEventListener('submit', handleSuggestionSubmit);
}

async function handleSuggestionSubmit(e) {
  e.preventDefault();
  const input = document.getElementById('suggestion-input');
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;

  const activeUser = getActiveUser();
  if (!activeUser) {
    showToast('You must be logged in to submit a suggestion.', false);
    return;
  }

  const suggestionId = 'sug-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  const suggestion = {
    id: suggestionId,
    text: text,
    userId: activeUser.id,
    userName: activeUser.name,
    userEmail: activeUser.email,
    createdAt: new Date().toISOString()
  };

  const submitBtn = e.target.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
  }

  try {
    await setDoc(doc(db, "suggestions", suggestionId), suggestion);
    showToast('Thank you for your suggestion!');
    input.value = '';
  } catch (error) {
    console.error('Failed to submit suggestion:', error);
    showToast('Failed to submit suggestion. Please try again.', false);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Suggestion';
    }
  }
}

function subscribeToSuggestions() {
  if (suggestionsUnsubscribe) {
    suggestionsUnsubscribe();
    suggestionsUnsubscribe = null;
  }

  try {
    const suggestionsCollection = collection(db, "suggestions");
    suggestionsUnsubscribe = onSnapshot(suggestionsCollection, (snapshot) => {
      const suggestionsList = [];
      snapshot.forEach(doc => {
        suggestionsList.push(doc.data());
      });
      state.suggestions = suggestionsList;
      saveDatabase();
      renderSuggestionsPanelList();
    }, (error) => {
      console.error("Suggestions real-time subscription error:", error);
    });
  } catch (err) {
    console.error("Failed to start suggestions subscription:", err);
  }
}

function renderSuggestionsPanelList() {
  const container = document.getElementById('suggestions-panel-list');
  if (!container) return;

  const sortedSuggestions = [...state.suggestions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  container.innerHTML = '';

  if (sortedSuggestions.length === 0) {
    container.innerHTML = `<div style="color: var(--text-secondary); font-size: 0.85rem; text-align: center; padding: 1.5rem 0;">No suggestions found.</div>`;
    return;
  }

  sortedSuggestions.forEach(suggestion => {
    const dateStr = new Date(suggestion.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const item = document.createElement('div');
    item.className = 'user-list-item suggestion-item';
    item.style.flexDirection = 'column';
    item.style.alignItems = 'flex-start';
    item.style.gap = '0.5rem';
    item.style.padding = '0.75rem';

    item.innerHTML = `
      <div style="display: flex; justify-content: space-between; width: 100%; align-items: center;">
        <div class="user-item-info">
          <span class="user-item-name">${suggestion.userName || 'Anonymous'}</span>
          <span style="font-size: 0.75rem; color: var(--text-secondary);">${suggestion.userEmail || ''}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span style="font-size: 0.7rem; color: var(--text-muted);">${dateStr}</span>
          <button class="btn-icon-delete btn-delete-suggestion" data-id="${suggestion.id}" aria-label="Delete Suggestion" style="font-size: 1.25rem; padding: 0 0.5rem; background: transparent; border: none; color: #ff3b30; cursor: pointer;">&times;</button>
        </div>
      </div>
      <div style="font-size: 0.85rem; color: var(--text-primary); line-height: 1.4; width: 100%; word-break: break-word; background: rgba(0,0,0,0.15); padding: 0.6rem; border-radius: 6px; border: 1px solid var(--glass-border); white-space: pre-wrap;">${escapeHTML(suggestion.text)}</div>
    `;

    item.querySelector('.btn-delete-suggestion').addEventListener('click', () => {
      if (confirm('Are you sure you want to delete this suggestion?')) {
        deleteSuggestion(suggestion.id);
      }
    });

    container.appendChild(item);
  });
}

async function deleteSuggestion(id) {
  state.suggestions = state.suggestions.filter(s => s.id !== id);
  saveDatabase();
  try {
    await deleteDoc(doc(db, "suggestions", id));
    showToast('Suggestion deleted successfully.');
    renderSuggestionsPanelList();
  } catch (error) {
    console.error('Failed to delete suggestion:', error);
    showToast('Failed to delete suggestion.', false);
  }
}

