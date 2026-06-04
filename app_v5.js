// 4HGS Application Hub - Core Logic & State Management
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile, updateEmail, updatePassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, deleteDoc, updateDoc, writeBatch, query, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

  // Theme Toggle Icons
  sun: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`,
  moon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`,
  
  // Favicon placeholder SVG (globe)
  favicon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`
};

// Seed Data definition
const DEFAULT_APPS = [
  { id: 'inventory', name: 'Inventory Manager', link: 'https://inventory.4hgs.com/', icon: 'box', order: 0, type: 'app' },
  { id: 'repairs', name: 'Repairs Dispatch', link: 'https://repairs.4hgs.com/', icon: 'wrench', order: 1, type: 'app' },
  { id: 'orders', name: 'Order Tracker', link: 'https://orders.4hgs.com/', icon: 'truck', order: 2, type: 'app' },
  { id: 'crm', name: 'CRM Database', link: 'https://crm.4hgs.com/', icon: 'users', order: 3, type: 'app' },
  { id: 'catalog', name: 'Catalog Search', link: 'https://catalog.4hgs.com/', icon: 'search-book', order: 4, type: 'app' },
  { id: 'invoicing', name: 'Invoicing Portal', link: 'https://billing.4hgs.com/', icon: 'dollar-sign', order: 5, type: 'app' },
  { id: 'ai-troubleshoot', name: 'Troubleshooting AI', link: 'https://ai.4hgs.com/', icon: 'brain', order: 6, type: 'app' },
  // Folder containing Ops apps
  { id: 'folder-ops', name: 'Operations', icon: 'folder', order: 7, type: 'folder', appIds: ['inventory', 'repairs', 'orders'] }
];

const DEFAULT_USERS = [
  { id: 'XSGpEYIjdaTjxxAuuTZ6chMbe1I2', name: 'Cole Ankney', role: 'Admin', email: 'cole@4hgs.com' },
  { id: 'user-sales', name: 'John Smith', role: 'Sales', email: 'john@4hgs.com' },
  { id: 'user-shipping', name: 'Dave Miller', role: 'Shipping', email: 'dave@4hgs.com' }
];

const DEFAULT_PERMISSIONS = {
  'XSGpEYIjdaTjxxAuuTZ6chMbe1I2': ['inventory', 'repairs', 'orders', 'crm', 'catalog', 'invoicing', 'ai-troubleshoot', 'folder-ops'],
  'user-sales': ['orders', 'crm', 'catalog', 'folder-ops'], 
  'user-shipping': ['inventory', 'repairs', 'catalog', 'ai-troubleshoot', 'folder-ops']
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
  { id: 'default', name: '4HGS Apps', order: 0 }
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
  activeUserId: null, // Null indicates no authenticated Firebase session!
  isEditing: false,
  activeFolderId: null,
  theme: 'dark' 
};

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
  state.users = DEFAULT_USERS;
  state.permissions = DEFAULT_PERMISSIONS;
  
  state.apps.forEach(app => {
    if (!app.sectionId) app.sectionId = 'default';
  });
}

function saveDatabase() {
  localStorage.setItem('HGS_APPS', JSON.stringify(state.apps));
  localStorage.setItem('HGS_USERS', JSON.stringify(state.users));
  localStorage.setItem('HGS_PERMISSIONS', JSON.stringify(state.permissions));
  localStorage.setItem('HGS_BROADCASTS', JSON.stringify(state.broadcasts));
  localStorage.setItem('HGS_SECTIONS', JSON.stringify(state.sections));
  localStorage.setItem('HGS_POLLS', JSON.stringify(state.polls));
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

  state.apps = JSON.parse(localStorage.getItem('HGS_APPS'));
  state.users = JSON.parse(localStorage.getItem('HGS_USERS'));
  state.permissions = JSON.parse(localStorage.getItem('HGS_PERMISSIONS'));
  state.broadcasts = JSON.parse(localStorage.getItem('HGS_BROADCASTS'));
  state.sections = JSON.parse(localStorage.getItem('HGS_SECTIONS')) || DEFAULT_SECTIONS;
  state.polls = JSON.parse(localStorage.getItem('HGS_POLLS')) || DEFAULT_POLLS;
  
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

    // 4. Fetch polls
    const pollsSnapshot = await getDocs(collection(db, "polls"));
    const pollsList = [];
    pollsSnapshot.forEach(doc => {
      pollsList.push(doc.data());
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
    state.polls = pollsList.length > 0 ? pollsList : DEFAULT_POLLS;

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

    // Apply migrations/sanity checks
    state.apps.forEach(app => {
      if (!app.sectionId) app.sectionId = 'default';
    });

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
    return ['orders', 'crm', 'catalog', 'folder-ops'];
  } else if (r.includes('ship')) {
    return ['inventory', 'repairs', 'catalog', 'ai-troubleshoot', 'folder-ops'];
  }
  return ['catalog', 'ai-troubleshoot'];
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
    return 'https://4hgs.com/wp-content/uploads/2025/10/4HGS-Circle-Logo.pdf-2.png';
  }
  
  const lowerDomain = domain.toLowerCase();
  // Brand Intelligence: For any corporate domain, intranet subdomain, or sharepoint portal,
  // directly serve the gorgeous official 4HG Source circle logo instead of generic fallback globes.
  if (lowerDomain.endsWith('4hgs.com') || lowerDomain.endsWith('4hghub.com') || lowerDomain.includes('4hgsource')) {
    return 'https://4hgs.com/wp-content/uploads/2025/10/4HGS-Circle-Logo.pdf-2.png';
  }
  
  // Try loading the favicon DIRECTLY from the target site first!
  // This is highly robust and crucial for intranet/private/local network sites 
  // where external crawlers (Google/DuckDuckGo) cannot reach.
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
  if (item.icon === 'favicon') {
    const directFavicon = getFaviconUrl(item.link);
    const finalCorporateFallback = `https://4hgs.com/wp-content/uploads/2025/10/4HGS-Circle-Logo.pdf-2.png`;
    
    // Direct network load + immediate high-res corporate fallback.
    // Bypasses public crawlers (Google s2) completely to eliminate default "weird globe" images.
    return `<img src="${directFavicon}" class="app-favicon-img" alt="" onerror="this.onerror=null; this.src='${finalCorporateFallback}';">`;
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
          <span class="user-profile-name">${user.email}</span>
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
  
  if (isSettingsOpen) {
    mainGrid.style.display = 'none';
    if (subsequentContainer) subsequentContainer.style.display = 'none';
    document.getElementById('ios-toolbar').style.display = 'none';
  } else {
    mainGrid.style.display = 'grid';
    if (subsequentContainer) subsequentContainer.style.display = 'block';
    document.getElementById('ios-toolbar').style.display = 'flex';
  }

  // Prepare and create all subsequent grids and headers in DOM
  const sortedSections = [...state.sections].sort((a, b) => a.order - b.order);
  const gridsMap = {};
  
  // The first section in sortedSections belongs to the mainGrid
  if (sortedSections.length > 0) {
    const firstSec = sortedSections[0];
    gridsMap[firstSec.id] = mainGrid;
    
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
  }

  // Create grid containers for subsequent sections
  for (let i = 1; i < sortedSections.length; i++) {
    const section = sortedSections[i];
    
    // Create Toolbar Header
    const toolbar = document.createElement('div');
    toolbar.className = 'ios-toolbar subsequent-section-header';
    toolbar.style.marginTop = '2.5rem'; // Premium vertical spacing between sections
    
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
    
    // Create App Grid
    const sectionGrid = document.createElement('div');
    sectionGrid.className = 'app-grid';
    sectionGrid.id = `grid-section-${section.id}`;
    sectionGrid.style.display = isSettingsOpen ? 'none' : 'grid';
    
    // Append to subsequent sections container
    if (subsequentContainer) {
      subsequentContainer.appendChild(toolbar);
      subsequentContainer.appendChild(sectionGrid);
    }
    
    gridsMap[section.id] = sectionGrid;
  }

  // Group and render applications
  const sortedApps = [...state.apps].sort((a, b) => a.order - b.order);
  
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
            showToast(`Opening ${item.name}...`);
            setTimeout(() => window.open(item.link, '_blank'), 800);
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
        showToast(`Opening ${app.name}...`);
        setTimeout(() => window.open(app.link, '_blank'), 800);
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

function setupDragDropEvents(element) {
  element.addEventListener('dragstart', (e) => {
    draggedElement = element;
    element.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  });

  element.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  });

  element.addEventListener('dragenter', () => {
    if (element !== draggedElement) {
      element.classList.add('drag-over');
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
        
        // Folders creation grouping on drag-over
        if (dragApp.type === 'app' && targetApp.type === 'app') {
          if (confirm(`Combine "${dragApp.name}" and "${targetApp.name}" into a folder?`)) {
            const folderId = `folder-${Date.now()}`;
            const newFolder = {
              id: folderId,
              name: 'New Folder',
              icon: 'folder',
              order: targetApp.order,
              type: 'folder',
              appIds: [targetApp.id, dragApp.id]
            };
            
            state.apps.push(newFolder);
            saveDatabase();
            syncAppToFirestore(newFolder);
            showToast('New Folder Created!');
            renderAppGrid();
            return;
          }
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

  // Switch display elements
  document.getElementById('main-app-grid').style.display = 'none';
  document.getElementById('ios-toolbar').style.display = 'none';
  
  const subsequentContainer = document.getElementById('subsequent-sections-container');
  if (subsequentContainer) subsequentContainer.style.display = 'none';
  
  document.getElementById('admin-panel-inline').style.display = 'flex';
  
  // Pre-fill profile settings
  loadProfileIntoForm();

  // Render tab controls based on role (Admin gets all tabs, non-Admin only gets 'My Account')
  const activeUser = getActiveUser();
  const r = activeUser ? (activeUser.role || '').toLowerCase() : '';
  const isPrivileged = r.includes('admin') || r.includes('president') || r.includes('boss') || r.includes('executive') || r.includes('chief');
  const isAdmin = activeUser && isPrivileged;
  
  const adminTabs = ['tab-btn-apps', 'tab-btn-sections', 'tab-btn-permissions', 'tab-btn-users', 'tab-btn-broadcasts'];
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

// Pre-fill App curator form for Editing Apps
function loadAppIntoForm(app) {
  openAdminPortal();
  document.querySelector('.dialog-tab-btn[data-tab="tab-apps"]').click();
  
  document.getElementById('edit-app-id').value = app.id;
  document.getElementById('app-name').value = app.name;
  document.getElementById('app-link').value = app.link;
  
  // Select icon
  document.querySelectorAll('.icon-option').forEach(el => el.classList.remove('selected'));
  const targetIcon = document.querySelector(`.icon-option[data-icon="${app.icon}"]`);
  if (targetIcon) {
    targetIcon.classList.add('selected');
  }
  
  const select = document.getElementById('app-section');
  if (select) select.value = app.sectionId || 'default';
  
  document.getElementById('btn-save-app').textContent = 'Update Application';
}

// Reset app curator form
function resetAppCuratorForm() {
  document.getElementById('app-curator-form').reset();
  document.getElementById('edit-app-id').value = '';
  document.getElementById('btn-save-app').textContent = 'Save Application';
  
  // Select first icon as default
  document.querySelectorAll('.icon-option').forEach(el => el.classList.remove('selected'));
  const firstIcon = document.querySelector('.icon-option');
  if (firstIcon) firstIcon.classList.add('selected');
  
  const select = document.getElementById('app-section');
  if (select) select.value = 'default';
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
function renderAppsPanelList() {
  const panel = document.getElementById('apps-panel-list');
  if (!panel) return;
  
  panel.innerHTML = '';
  
  // Sort apps by order
  const sortedApps = [...state.apps].sort((a, b) => a.order - b.order);
  
  sortedApps.forEach((app, index) => {
    const item = document.createElement('div');
    item.className = 'user-list-item';
    item.innerHTML = `
      <div class="user-item-info">
        <span class="user-item-name" style="font-weight: 700;">
          ${app.name} 
          <span style="font-size: 0.7rem; font-weight: 600; padding: 0.15rem 0.4rem; border-radius: 4px; background: ${app.type === 'folder' ? 'rgba(141,220,4,0.15)' : 'rgba(255,255,255,0.06)'}; color: ${app.type === 'folder' ? 'var(--accent-green)' : 'var(--text-secondary)'}; margin-left: 0.5rem; text-transform: uppercase;">
            ${app.type}
          </span>
        </span>
        <span style="font-size: 0.75rem; color: var(--text-secondary); text-overflow: ellipsis; overflow: hidden; max-width: 250px; white-space: nowrap;">
          ${app.type === 'folder' ? `Contains: ${(app.appIds || []).length} apps` : app.link}
        </span>
      </div>
      <div style="display: flex; gap: 0.35rem; align-items: center;">
        <button class="btn-reorder-up" data-id="${app.id}" title="Move Up" style="background: rgba(255,255,255,0.05); color: var(--text-primary); border: 1px solid var(--glass-border); padding: 0.25rem 0.4rem; border-radius: 4px; font-size: 0.7rem; cursor: pointer; ${index === 0 ? 'opacity: 0.35; cursor: not-allowed;' : ''}">▲</button>
        <button class="btn-reorder-down" data-id="${app.id}" title="Move Down" style="background: rgba(255,255,255,0.05); color: var(--text-primary); border: 1px solid var(--glass-border); padding: 0.25rem 0.4rem; border-radius: 4px; font-size: 0.7rem; cursor: pointer; ${index === sortedApps.length - 1 ? 'opacity: 0.35; cursor: not-allowed;' : ''}">▼</button>
        <button class="btn-icon-edit-app" data-id="${app.id}" style="background: rgba(255,255,255,0.05); color: var(--text-primary); border: 1px solid var(--glass-border); padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.7rem; cursor: pointer;">Edit</button>
        <button class="btn-icon-delete-app" data-id="${app.id}" style="background: rgba(255,59,48,0.1); color: #ff3b30; border: 1px solid rgba(255,59,48,0.15); padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.7rem; cursor: pointer;">&times;</button>
      </div>
    `;
    
    // Up click handler
    const btnUp = item.querySelector('.btn-reorder-up');
    if (btnUp && index > 0) {
      btnUp.addEventListener('click', () => {
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
    if (btnDown && index < sortedApps.length - 1) {
      btnDown.addEventListener('click', () => {
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
      btnEdit.addEventListener('click', () => {
        loadAppIntoForm(app);
      });
    }
    
    // Delete click handler
    const btnDelete = item.querySelector('.btn-icon-delete-app');
    if (btnDelete) {
      btnDelete.addEventListener('click', () => {
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

// Render permission grid table rows dynamically
function renderPermissionsMatrix() {
  const table = document.getElementById('permissions-matrix-table');
  table.innerHTML = '';
  
  const headerRow = document.createElement('tr');
  headerRow.innerHTML = `<th>Application Name</th>`;
  
  state.users.forEach(user => {
    headerRow.innerHTML += `<th>${user.name}</th>`;
  });
  table.appendChild(headerRow);

  state.apps.forEach(app => {
    const row = document.createElement('tr');
    row.innerHTML = `<td><strong>${app.name}</strong> ${app.type === 'folder' ? '📁' : ''}</td>`;
    
    state.users.forEach(user => {
      const isPermitted = state.permissions[user.id] && state.permissions[user.id].includes(app.id);
      const isLockedAdmin = false; // Allow editing checkboxes for Admins and El Presidentes
      
      row.innerHTML += `
        <td style="text-align: center;">
          <input type="checkbox" data-user="${user.id}" data-app="${app.id}" ${isPermitted ? 'checked' : ''} ${isLockedAdmin ? 'disabled' : ''} style="width: 20px; height: 20px; cursor: pointer;">
        </td>
      `;
    });
    table.appendChild(row);
  });
}

// App form save & EDIT handler
function handleAppSubmit(e) {
  e.preventDefault();
  const editId = document.getElementById('edit-app-id').value;
  const name = document.getElementById('app-name').value.trim();
  const link = document.getElementById('app-link').value.trim();
  const selectedIconEl = document.querySelector('.icon-option.selected');
  const icon = selectedIconEl ? selectedIconEl.dataset.icon : 'box';
  
  if (!name || !link) return;

  if (editId) {
    // EDITING EXISTING APP
    const appIndex = state.apps.findIndex(a => a.id === editId);
    if (appIndex !== -1) {
      state.apps[appIndex].name = name;
      state.apps[appIndex].link = link;
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

// Permissions save matrix handler
function handlePermissionsSave() {
  const checkboxes = document.querySelectorAll('#permissions-matrix-table input[type="checkbox"]');
  
  state.users.forEach(user => {
    state.permissions[user.id] = [];
  });

  checkboxes.forEach(chk => {
    const userId = chk.dataset.user;
    const appId = chk.dataset.app;
    
    if (chk.checked) {
      state.permissions[userId].push(appId);
    }
  });

  saveDatabase();
  
  // Sync changed user permissions to Firestore for all users
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
      state.activeUserId = null;
      saveDatabase();
      
      renderAuthHeader(null);
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
});

// --- Employee Polls Widget Functionality ---

function renderPolls() {
  const container = document.getElementById('widget-polls-list');
  if (!container) return;

  // Toggle "+ Create Poll" visibility based on auth
  const btnToggle = document.getElementById('btn-toggle-create-poll');
  if (btnToggle) {
    btnToggle.style.display = state.activeUserId ? 'block' : 'none';
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

  poll.votes.push(newVote);
  saveDatabase();
  syncPollToFirestore(poll);
  renderPolls();
  showToast('Your vote has been counted!');
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
