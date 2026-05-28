// 4HGS Application Hub - Core Logic & State Management
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile, updateEmail, updatePassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

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
  { id: 'user-tech', name: 'Dave Miller', role: 'Technician', email: 'dave@4hgs.com' }
];

const DEFAULT_PERMISSIONS = {
  'XSGpEYIjdaTjxxAuuTZ6chMbe1I2': ['inventory', 'repairs', 'orders', 'crm', 'catalog', 'invoicing', 'ai-troubleshoot', 'folder-ops'],
  'user-sales': ['orders', 'crm', 'catalog', 'folder-ops'], 
  'user-tech': ['inventory', 'repairs', 'catalog', 'ai-troubleshoot', 'folder-ops']
};

const DEFAULT_BROADCASTS = [
  { id: 'b-1', title: 'Daily technician briefing', body: 'All repair dispatches must log parts inventory before 8:00 AM.', time: '08:15 AM' },
  { id: 'b-2', title: 'Parker Hydraulic Update', body: 'The new Parker hydraulic pump lists are now active in Catalog Search.', time: 'Yesterday' },
  { id: 'b-3', title: 'Sunday Maintenance Window', body: 'CRM Database and billing portals offline Sunday 1:00 AM to 4:00 AM EST.', time: 'May 24' }
];

// Active State
let state = {
  apps: [],
  users: [],
  permissions: {},
  broadcasts: [],
  activeUserId: null, // Null indicates no authenticated Firebase session!
  isEditing: false,
  activeFolderId: null,
  theme: 'dark' 
};

// Database Persistence Helpers
function initDatabase() {
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
  if (!localStorage.getItem('HGS_THEME')) {
    localStorage.setItem('HGS_THEME', 'dark');
  }

  // Load from Storage to memory State
  state.apps = JSON.parse(localStorage.getItem('HGS_APPS'));
  state.users = JSON.parse(localStorage.getItem('HGS_USERS'));
  state.permissions = JSON.parse(localStorage.getItem('HGS_PERMISSIONS'));
  state.broadcasts = JSON.parse(localStorage.getItem('HGS_BROADCASTS'));
  state.theme = localStorage.getItem('HGS_THEME');
  
  // Migration: Remove the old seed admin 'user-admin' and establish 'XSGpEYIjdaTjxxAuuTZ6chMbe1I2' as the sole Admin
  state.users = state.users.filter(u => u.id !== 'user-admin');
  delete state.permissions['user-admin'];

  // Check if our active Admin profile is in the list
  const activeAdminId = 'XSGpEYIjdaTjxxAuuTZ6chMbe1I2';
  let activeAdmin = state.users.find(u => u.id === activeAdminId || u.email === 'cole@4hgs.com');
  
  if (activeAdmin) {
    activeAdmin.id = activeAdminId;
    activeAdmin.email = 'cole@4hgs.com';
    activeAdmin.role = 'Admin';
  } else {
    activeAdmin = {
      id: activeAdminId,
      name: 'Cole Ankney',
      role: 'Admin',
      email: 'cole@4hgs.com'
    };
    state.users.push(activeAdmin);
  }

  // Ensure they have full permissions
  state.permissions[activeAdminId] = state.apps.map(a => a.id);
  
  // Clean up any remaining duplicate profiles with email cole@4hgs.com that aren't the main one
  state.users = state.users.filter(u => u.id === activeAdminId || u.email !== 'cole@4hgs.com');
  
  saveDatabase();
  
  applyTheme();
}

function saveDatabase() {
  localStorage.setItem('HGS_APPS', JSON.stringify(state.apps));
  localStorage.setItem('HGS_USERS', JSON.stringify(state.users));
  localStorage.setItem('HGS_PERMISSIONS', JSON.stringify(state.permissions));
  localStorage.setItem('HGS_BROADCASTS', JSON.stringify(state.broadcasts));
  localStorage.setItem('HGS_THEME', state.theme);
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
    const role = activeUser ? activeUser.role : 'Guest';
    
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
}

// Render main app grid based on permissions and folders
function renderAppGrid() {
  const grid = document.getElementById('main-app-grid');
  grid.innerHTML = '';

  const activeUser = getActiveUser();
  const isAdmin = activeUser && activeUser.role === 'Admin';
  
  // Show / Hide Settings trigger in header
  const btnAdmin = document.getElementById('btn-admin-portal');
  if (state.activeUserId) {
    btnAdmin.style.display = 'inline-flex';
  } else {
    btnAdmin.style.display = 'none';
  }

  // Handle Logged Out State: Show a beautiful placeholder lock screen card!
  if (!state.activeUserId) {
    grid.style.display = 'block'; // break grid layout
    grid.innerHTML = `
      <section class="widget" style="text-align: center; padding: 3rem 2rem; max-width: 440px; margin: 2rem auto; background: var(--glass-bg); border-radius: 16px; border: 1px solid var(--glass-border); box-shadow: var(--shadow-premium);">
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
      </section>
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

  // Restore Grid CSS Display (only if Settings panel is NOT currently active!)
  const adminPanel = document.getElementById('admin-panel-inline');
  if (adminPanel && adminPanel.style.display === 'flex') {
    grid.style.display = 'none';
  } else {
    grid.style.display = 'grid';
  }

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

    grid.appendChild(appItem);
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
    if (activeUser && activeUser.role === 'Admin') {
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
  document.getElementById('admin-panel-inline').style.display = 'flex';
  
  // Pre-fill profile settings
  loadProfileIntoForm();

  // Render tab controls based on role (Admin gets all tabs, non-Admin only gets 'My Account')
  const activeUser = getActiveUser();
  const isAdmin = activeUser && activeUser.role === 'Admin';
  
  const adminTabs = ['tab-btn-apps', 'tab-btn-permissions', 'tab-btn-users', 'tab-btn-broadcasts'];
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
  }
}

function closeAdminPortal() {
  document.getElementById('admin-panel-inline').style.display = 'none';
  document.getElementById('main-app-grid').style.display = 'grid';
  document.getElementById('ios-toolbar').style.display = 'flex';
  
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
        <span style="font-size:0.75rem; color:var(--text-secondary);">${user.email || 'No email registered'}</span>
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
      const isLockedAdmin = user.role === 'Admin'; 
      
      row.innerHTML += `
        <td>
          <label class="checkbox-custom">
            <input type="checkbox" data-user="${user.id}" data-app="${app.id}" ${isPermitted ? 'checked' : ''} ${isLockedAdmin ? 'disabled' : ''}>
            <span class="checkbox-checkmark"></span>
          </label>
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
      showToast('Application updated successfully');
    }
  } else {
    // CREATING NEW APP
    const newApp = {
      id: `app-${Date.now()}`,
      name: name,
      link: link,
      icon: icon,
      order: state.apps.length,
      type: 'app'
    };
    state.apps.push(newApp);
    
    // Auto grant access to all Admins
    state.users.forEach(u => {
      if (u.role === 'Admin') {
        if (!state.permissions[u.id]) state.permissions[u.id] = [];
        if (!state.permissions[u.id].includes(newApp.id)) {
          state.permissions[u.id].push(newApp.id);
        }
      }
    });
    showToast('New Application Added Successfully!');
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
  
  if (!name || !role) return;

  if (editId) {
    // Editing an existing user
    const userIndex = state.users.findIndex(u => u.id === editId);
    if (userIndex !== -1) {
      state.users[userIndex].name = name;
      state.users[userIndex].email = email;
      state.users[userIndex].role = role;
      showToast(`Updated Profile: ${name}`);
    }
  } else {
    // Creating a new user
    const userId = `user-${Date.now()}`;
    const newUser = { id: userId, name: name, role: role, email: email };
    state.users.push(newUser);
    
    let initialPerms = ['catalog', 'ai-troubleshoot'];
    if (role === 'Admin') {
      initialPerms = state.apps.map(a => a.id);
    } else if (role === 'Sales') {
      initialPerms = ['orders', 'crm', 'catalog', 'folder-ops'];
    } else if (role === 'Technician') {
      initialPerms = ['inventory', 'repairs', 'catalog', 'ai-troubleshoot', 'folder-ops'];
    }
    state.permissions[userId] = initialPerms;
    showToast(`Created Profile: ${name}`);
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
  document.getElementById('new-user-role').value = user.role || 'Guest';
  document.getElementById('btn-save-user').textContent = 'Update Employee Profile';
}

function resetUserForm() {
  document.getElementById('user-creator-form').reset();
  document.getElementById('edit-user-id').value = '';
  document.getElementById('btn-save-user').textContent = 'Create Employee Profile';
}

// Active Profile Self Management Forms
function loadProfileIntoForm() {
  const user = auth.currentUser;
  const activeUser = getActiveUser();
  if (!user || !activeUser) return;

  document.getElementById('profile-name').value = activeUser.name || '';
  document.getElementById('profile-role').value = activeUser.role || 'Guest';
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
    if (user.role !== 'Admin') {
      state.permissions[user.id] = [];
    }
  });

  checkboxes.forEach(chk => {
    const userId = chk.dataset.user;
    const appId = chk.dataset.app;
    const userObj = state.users.find(u => u.id === userId);
    const userRole = userObj ? userObj.role : 'Guest';
    
    if (chk.checked && userRole !== 'Admin') {
      state.permissions[userId].push(appId);
    }
  });

  saveDatabase();
  renderAppGrid();
  showToast('Employee Permissions Saved!');
  closeAdminPortal();
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
  }

  saveDatabase();
  resetBroadcastForm();
  renderWidgets();
  renderBroadcastList();
}

function deleteBroadcast(id) {
  state.broadcasts = state.broadcasts.filter(b => b.id !== id);
  saveDatabase();
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

  // Forms submissions hooks
  document.getElementById('app-curator-form').addEventListener('submit', handleAppSubmit);
  document.getElementById('user-creator-form').addEventListener('submit', handleUserSubmit);
  document.getElementById('profile-settings-form').addEventListener('submit', handleProfileSubmit);
  document.getElementById('broadcast-curator-form').addEventListener('submit', handleBroadcastSubmit);
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

  setupDialogTabs();
}

// --- Firebase Authentication Observer Integration ---
function initFirebaseAuth() {
  onAuthStateChanged(auth, (firebaseUser) => {
    if (firebaseUser) {
      // Find matching employee by email address
      let localUser = state.users.find(u => u.email && u.email.toLowerCase() === firebaseUser.email.toLowerCase());
      
      // Auto-assign very first user (Cole) or matching name to Admin, else dynamic register as Guest
      if (!localUser) {
        const isCole = firebaseUser.email.toLowerCase().includes('cole') || (firebaseUser.displayName && firebaseUser.displayName.toLowerCase().includes('cole'));
        
        localUser = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
          email: firebaseUser.email.toLowerCase(),
          role: isCole ? 'Admin' : 'Guest'
        };
        
        state.users.push(localUser);
        
        // Seed standard permissions
        if (localUser.role === 'Admin') {
          state.permissions[localUser.id] = state.apps.map(a => a.id);
        } else {
          state.permissions[localUser.id] = ['catalog', 'ai-troubleshoot']; // Default guest privileges
        }
        
        saveDatabase();
      }
      
      state.activeUserId = localUser.id;
      saveDatabase();
      
      // Render logged in UI
      renderAuthHeader(firebaseUser);
      renderAppGrid();
      showToast(`Logged in: ${localUser.name}`);
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
