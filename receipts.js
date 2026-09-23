// 4HGS Receipt Vault - Dedicated Standalone Web App
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, deleteDoc, updateDoc, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDUo8yzIcUAxNL8rMuSAaBhZBVhyYvkYm8",
  authDomain: "hghub-20865.firebaseapp.com",
  projectId: "hghub-20865",
  storageBucket: "hghub-20865.firebasestorage.app",
  messagingSenderId: "258182779688",
  appId: "1:258182779688:web:69c2a7c111c0b1ae9df61d",
  measurementId: "G-HTBWW8C0QD"
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);

// Application State
const state = {
  user: null,
  activeView: 'capture', // 'capture', 'upload', 'preview', 'captured-receipts'
  capturedBlob: null,
  capturedDataUrl: null,
  capturedDate: '',
  capturedNotes: '',
  receipts: [],
  selectedReceiptId: null,
  selectedForBatch: new Set(),
  finderLayout: 'grid',
  filterYear: 'all',
  filterMonth: 'all',
  searchQuery: '',
  isUploading: false,
  unsubscribeReceipts: null
};

// Utilities
function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getTodayISODate() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isMobileOrTablet() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (window.innerWidth <= 880);
}

function showToast(message, isSuccess = true) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${isSuccess ? 'toast-success' : 'toast-error'}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

// Compress Image using HTML Canvas
function compressImageToBlob(source, quality = 0.75, maxDimension = 1280) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Canvas compression returned empty blob.'));
          return;
        }
        resolve({
          blob: blob,
          dataUrl: canvas.toDataURL('image/jpeg', quality)
        });
      }, 'image/jpeg', quality);
    };
    img.onerror = reject;

    if (typeof source === 'string') {
      img.src = source;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => { img.src = e.target.result; };
      reader.onerror = reject;
      reader.readAsDataURL(source);
    }
  });
}

async function handleReceiptFileInput(file) {
  try {
    const { blob, dataUrl } = await compressImageToBlob(file, 0.75, 1280);
    state.capturedBlob = blob;
    state.capturedDataUrl = dataUrl;
    state.capturedDate = getTodayISODate();
    state.capturedNotes = '';
    state.activeView = 'preview';
    renderApp();
  } catch (err) {
    console.error('File load error:', err);
    showToast('Failed to load image file.', false);
  }
}

// Format date helper: "2026-09-23" -> "Sep 23, 2026"
function formatReceiptDate(isoStr) {
  if (!isoStr) return 'No Date';
  try {
    const [y, m, d] = isoStr.split('-');
    if (!y || !m || !d) return isoStr;
    const dateObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch (e) {
    return isoStr;
  }
}

// --- Auth Observers ---
onAuthStateChanged(auth, (user) => {
  state.user = user;
  if (user) {
    subscribeToReceipts();
  } else {
    if (state.unsubscribeReceipts) {
      state.unsubscribeReceipts();
      state.unsubscribeReceipts = null;
    }
    state.receipts = [];
  }
  renderApp();
});

// Realtime Firestore Listener
function subscribeToReceipts() {
  if (state.unsubscribeReceipts || !state.user) return;

  try {
    const cached = localStorage.getItem('HGS_RECEIPTS_LOCAL');
    if (cached) {
      const parsed = JSON.parse(cached);
      const seen = new Set();
      state.receipts = (Array.isArray(parsed) ? parsed : []).filter(p => p && p.id && !seen.has(p.id) && seen.add(p.id));
    }
  } catch (e) {}

  const receiptsCol = collection(db, "receipts");
  const q = query(receiptsCol, where("userId", "==", state.user.uid));

  state.unsubscribeReceipts = onSnapshot(q, (snapshot) => {
    const seen = new Set();
    const items = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      data.id = docSnap.id;
      if (!seen.has(data.id)) {
        seen.add(data.id);
        items.push(data);
      }
    });

    state.receipts = items;
    try {
      localStorage.setItem('HGS_RECEIPTS_LOCAL', JSON.stringify(items.slice(0, 15)));
    } catch (e) {}

    renderApp();
  }, (err) => {
    console.warn('Receipts listener warning:', err);
  });
}

// Master Render Router
function renderApp() {
  const root = document.getElementById('receipt-app-root');
  if (!root) return;

  if (!state.user) {
    renderLoginView(root);
    return;
  }

  const receiptCount = state.receipts.length;
  const isCapturedView = state.activeView === 'captured-receipts';
  const isMobile = isMobileOrTablet();
  const entryTabLabel = isMobile ? 'Capture' : 'Upload';

  root.innerHTML = `
    <!-- Top Nav Header -->
    <div class="view-nav-header receipt-nav-header" style="max-width: 1000px; margin: 0 auto; width: 100%; box-sizing: border-box;">
      <div class="view-nav-actions-left">
        <a href="index.html" class="btn-ios" id="btn-back-hub" title="Go to Hub">
          &larr; Hub
        </a>
        <span class="view-badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;display:inline-block;vertical-align:middle;margin-right:4px;"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"></path><line x1="16" y1="8" x2="8" y2="8"></line><line x1="16" y1="12" x2="8" y2="12"></line><line x1="13" y1="16" x2="8" y2="16"></line></svg>
          Receipt Vault
        </span>
      </div>

      <!-- Segmented Control Switcher -->
      <div class="receipt-segmented-control">
        <button type="button" class="receipt-segment-btn ${!isCapturedView ? 'active' : ''}" id="btn-tab-capture">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
          ${entryTabLabel}
        </button>
        <button type="button" class="receipt-segment-btn ${isCapturedView ? 'active' : ''}" id="btn-tab-captured-receipts">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
          Captured Receipts (${receiptCount})
        </button>
      </div>

      <div class="view-nav-actions-right">
        <span class="receipt-user-pill" title="Signed in as ${escapeHTML(state.user.email)}">
          ${escapeHTML(state.user.displayName || state.user.email.split('@')[0])}
        </span>
        <button type="button" class="btn-ios-small" id="btn-app-logout" title="Sign Out">
          Sign Out
        </button>
      </div>
    </div>

    <!-- Active View Area -->
    <div id="receipt-vault-view-container" class="receipt-vault-view-container" style="max-width: 1000px; margin: 0 auto; width: 100%; box-sizing: border-box;">
      <!-- Populated below -->
    </div>

    <!-- Full Image Zoom Modal -->
    <div id="receipt-zoom-modal" class="forklift-checklist-modal-overlay receipt-zoom-overlay" style="display: none;" aria-modal="true" role="dialog">
      <div class="receipt-zoom-content">
        <div class="receipt-zoom-header">
          <span id="receipt-zoom-title" class="receipt-zoom-title">Receipt Photo</span>
          <button type="button" class="btn-ios" id="btn-close-zoom-modal">&times; Close</button>
        </div>
        <div class="receipt-zoom-body">
          <img id="receipt-zoom-image" src="" alt="Full receipt preview" class="receipt-zoom-img">
        </div>
      </div>
    </div>
  `;

  // Nav Event Listeners
  document.getElementById('btn-tab-capture')?.addEventListener('click', () => {
    state.activeView = state.capturedBlob ? 'preview' : (isMobile ? 'capture' : 'upload');
    renderApp();
  });

  document.getElementById('btn-tab-captured-receipts')?.addEventListener('click', () => {
    state.activeView = 'captured-receipts';
    renderApp();
  });

  document.getElementById('btn-app-logout')?.addEventListener('click', () => {
    signOut(auth).then(() => showToast('Signed out.'));
  });

  document.getElementById('btn-close-zoom-modal')?.addEventListener('click', closeReceiptZoomModal);
  document.getElementById('receipt-zoom-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'receipt-zoom-modal') closeReceiptZoomModal();
  });

  // Render Subview
  if (state.activeView === 'capture') {
    if (isMobile) {
      renderMobileCaptureChoiceView();
    } else {
      renderReceiptUploadView();
    }
  } else if (state.activeView === 'upload') {
    renderReceiptUploadView();
  } else if (state.activeView === 'preview') {
    renderReceiptPreviewView();
  } else {
    renderCapturedReceiptsView();
  }
}

// --- Login View for Standalone App ---
function renderLoginView(container) {
  container.innerHTML = `
    <div class="receipt-mobile-capture-shell" style="padding-top: 3rem;">
      <div class="receipt-mobile-card" style="max-width: 400px;">
        <div class="receipt-mobile-icon-circle">
          <img src="assets/4hgs_logo.png" alt="4HGS Logo" style="width: 42px; height: 42px; border-radius: 8px;">
        </div>
        <h3 class="receipt-mobile-title">Receipt Vault</h3>
        <p class="receipt-mobile-subtitle">
          Sign in with your 4HGS account to capture and access company receipts.
        </p>

        <form id="receipt-login-form" style="width: 100%; display: flex; flex-direction: column; gap: 0.85rem; text-align: left;">
          <div>
            <label style="font-size: 0.82rem; font-weight: 600; color: var(--text-primary); display: block; margin-bottom: 4px;">Email</label>
            <input type="email" id="login-email" class="form-control" placeholder="name@4hgs.com" required style="width: 100%; box-sizing: border-box;">
          </div>
          <div>
            <label style="font-size: 0.82rem; font-weight: 600; color: var(--text-primary); display: block; margin-bottom: 4px;">Password</label>
            <input type="password" id="login-password" class="form-control" placeholder="••••••••" required style="width: 100%; box-sizing: border-box;">
          </div>
          <div id="login-error-msg" style="display: none; color: #ef4444; font-size: 0.82rem; font-weight: 500; margin-top: 4px;"></div>
          <button type="submit" id="btn-login-submit" class="btn-ios btn-ios-accent" style="width: 100%; justify-content: center; padding: 0.85rem; margin-top: 0.5rem; font-size: 0.95rem;">
            Sign In to Receipts
          </button>
        </form>

        <a href="index.html" style="margin-top: 1.5rem; font-size: 0.82rem; color: var(--text-secondary); text-decoration: none;">
          &larr; Return to 4HGS Hub
        </a>
      </div>
    </div>
  `;

  const form = document.getElementById('receipt-login-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      const errorDiv = document.getElementById('login-error-msg');
      const submitBtn = document.getElementById('btn-login-submit');

      errorDiv.style.display = 'none';
      submitBtn.disabled = true;
      submitBtn.textContent = 'Signing In...';

      signInWithEmailAndPassword(auth, email, password)
        .then(() => {
          showToast('✓ Welcome to Receipt Vault!');
        })
        .catch((error) => {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Sign In to Receipts';
          errorDiv.textContent = error.message.includes('credential') || error.message.includes('password')
            ? 'Invalid email or password.'
            : error.message;
          errorDiv.style.display = 'block';
        });
    });
  }
}

// --- SUBVIEW 1M: MOBILE CAPTURE CHOICE SCREEN ---
function renderMobileCaptureChoiceView() {
  const container = document.getElementById('receipt-vault-view-container');
  if (!container) return;

  const receiptCount = state.receipts.length;
  const isStandalone = Boolean(window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches);

  container.innerHTML = `
    <div class="receipt-mobile-capture-shell">
      <div class="receipt-mobile-card">
        <div class="receipt-mobile-icon-circle">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:32px;height:32px;color:var(--accent-green);"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
        </div>
        <h3 class="receipt-mobile-title">Capture Receipt</h3>
        <p class="receipt-mobile-subtitle">
          Snap a receipt photo with your iPhone camera or select from your library.
        </p>

        <div class="receipt-mobile-button-stack">
          <!-- Button 1: Native Camera Launch -->
          <label for="mobile-native-camera-input" class="btn-mobile-action btn-mobile-camera">
            <span class="btn-action-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="width:26px;height:26px;"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
            </span>
            <span class="btn-action-text">
              <span class="btn-action-primary">Take Receipt Photo</span>
              <span class="btn-action-sub">Opens device camera</span>
            </span>
          </label>
          <input type="file" id="mobile-native-camera-input" accept="image/*" capture="environment" style="display: none;">

          <!-- Button 2: Upload from Photos / Files -->
          <label for="mobile-gallery-input" class="btn-mobile-action btn-mobile-gallery">
            <span class="btn-action-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:26px;height:26px;color:var(--accent-green);"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
            </span>
            <span class="btn-action-text">
              <span class="btn-action-primary">Upload from Photos / Files</span>
              <span class="btn-action-sub">Choose from photo library or files</span>
            </span>
          </label>
          <input type="file" id="mobile-gallery-input" accept="image/*" style="display: none;">
        </div>

        <button type="button" class="btn-link-captured" id="btn-mobile-goto-captured">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
          View Captured Receipts (${receiptCount})
        </button>

        ${!isStandalone ? `
          <div class="receipt-mobile-pwa-banner">
            <div class="pwa-banner-text">
              <strong>Add to Home Screen</strong><br>
              Install as iPhone App for 1-tap camera access
            </div>
            <button type="button" class="btn-pwa-banner" id="btn-show-vault-install">
              How to Install
            </button>
          </div>
        ` : ''}
      </div>
    </div>
  `;

  document.getElementById('mobile-native-camera-input')?.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) handleReceiptFileInput(e.target.files[0]);
  });

  document.getElementById('mobile-gallery-input')?.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) handleReceiptFileInput(e.target.files[0]);
  });

  document.getElementById('btn-mobile-goto-captured')?.addEventListener('click', () => {
    state.activeView = 'captured-receipts';
    renderApp();
  });

  document.getElementById('btn-show-vault-install')?.addEventListener('click', openIosInstallModal);
}

// --- SUBVIEW 1D: DESKTOP UPLOAD VIEW ---
function renderReceiptUploadView() {
  const container = document.getElementById('receipt-vault-view-container');
  if (!container) return;

  container.innerHTML = `
    <div class="receipt-desktop-upload-shell">
      <div class="receipt-upload-card" id="receipt-drop-zone">
        <div class="receipt-upload-icon-circle">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" style="width:40px;height:40px;color:var(--accent-green);"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
        </div>
        <h3 class="receipt-upload-title">Upload Receipt Photo</h3>
        <p class="receipt-upload-subtitle">
          Drag and drop your receipt image here, or browse from your computer.
        </p>

        <label for="receipt-file-picker-desktop" class="btn-ios btn-ios-accent receipt-upload-cta">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
          Choose Receipt Photo
        </label>
        <input type="file" id="receipt-file-picker-desktop" accept="image/*" style="display: none;">

        <div class="receipt-upload-footer">
          <span>Supports JPEG, PNG, HEIC, WebP</span>
        </div>
      </div>
    </div>
  `;

  document.getElementById('receipt-file-picker-desktop')?.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) handleReceiptFileInput(e.target.files[0]);
  });

  const dropZone = document.getElementById('receipt-drop-zone');
  if (dropZone) {
    ['dragenter', 'dragover'].forEach(name => {
      dropZone.addEventListener(name, (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
    });
    ['dragleave', 'drop'].forEach(name => {
      dropZone.addEventListener(name, (e) => { e.preventDefault(); dropZone.classList.remove('drag-over'); });
    });
    dropZone.addEventListener('drop', (e) => {
      const files = e.dataTransfer?.files;
      if (files && files[0] && files[0].type.startsWith('image/')) handleReceiptFileInput(files[0]);
    });
  }
}

// --- SUBVIEW 2: CAPTURE REVIEW & METADATA FORM ---
function renderReceiptPreviewView() {
  const container = document.getElementById('receipt-vault-view-container');
  if (!container) return;

  const dataUrl = state.capturedDataUrl || '';
  const dateVal = state.capturedDate || getTodayISODate();
  const notesVal = state.capturedNotes || '';

  container.innerHTML = `
    <div class="receipt-preview-shell">
      <!-- 1. Captured Photo Preview -->
      <div class="receipt-preview-media">
        <img src="${dataUrl}" alt="Captured receipt preview" class="receipt-preview-img" id="receipt-preview-img">
        <button type="button" class="receipt-expand-btn" id="btn-expand-preview" title="Expand Preview">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>
        </button>
      </div>

      <!-- 2. Immediate Action Buttons: Save / Discard / Re-take -->
      <div class="receipt-actions-row">
        <button type="button" class="btn-ios btn-ios-accent receipt-save-btn" id="btn-receipt-save" ${state.isUploading ? 'disabled' : ''}>
          ${state.isUploading ? 'Saving Receipt...' : '✓ Save Receipt'}
        </button>
        <button type="button" class="btn-ios receipt-retake-btn" id="btn-receipt-retake" ${state.isUploading ? 'disabled' : ''}>
          ↺ Re-take
        </button>
        <button type="button" class="btn-ios btn-ios-danger receipt-discard-btn" id="btn-receipt-discard" ${state.isUploading ? 'disabled' : ''}>
          ✕ Discard
        </button>
      </div>

      <!-- 3. Below Options: Date Adjustment & Optional Notes Section -->
      <div class="receipt-meta-card">
        <div class="form-group receipt-form-group">
          <label for="receipt-date-input" class="receipt-input-label">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            Receipt Date (Tweak if needed)
          </label>
          <input type="date" id="receipt-date-input" class="form-control receipt-date-field" value="${dateVal}">
        </div>

        <div class="form-group receipt-form-group" style="margin-top: 1rem;">
          <label for="receipt-notes-input" class="receipt-input-label">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
            Notes (Optional)
          </label>
          <textarea id="receipt-notes-input" class="form-control receipt-notes-field" rows="3" placeholder="Vendor, purchase total, parts or job #...">${escapeHTML(notesVal)}</textarea>
        </div>
      </div>
    </div>
  `;

  document.getElementById('receipt-date-input')?.addEventListener('change', (e) => {
    state.capturedDate = e.target.value;
  });

  document.getElementById('receipt-notes-input')?.addEventListener('input', (e) => {
    state.capturedNotes = e.target.value;
  });

  document.getElementById('btn-expand-preview')?.addEventListener('click', () => {
    openReceiptZoomModal({
      downloadUrl: state.capturedDataUrl,
      receiptDate: state.capturedDate,
      notes: state.capturedNotes
    });
  });

  document.getElementById('btn-receipt-save')?.addEventListener('click', saveCurrentReceipt);

  document.getElementById('btn-receipt-retake')?.addEventListener('click', () => {
    state.capturedBlob = null;
    state.capturedDataUrl = null;
    state.activeView = isMobileOrTablet() ? 'capture' : 'upload';
    renderApp();
  });

  document.getElementById('btn-receipt-discard')?.addEventListener('click', () => {
    state.capturedBlob = null;
    state.capturedDataUrl = null;
    state.capturedNotes = '';
    state.activeView = isMobileOrTablet() ? 'capture' : 'upload';
    renderApp();
    showToast('Receipt discarded.');
  });
}

// Save Receipt to Firestore/Storage
async function saveCurrentReceipt() {
  if (state.isUploading || (!state.capturedBlob && !state.capturedDataUrl) || !state.user) return;

  const dateVal = document.getElementById('receipt-date-input')?.value || state.capturedDate || getTodayISODate();
  const notesVal = document.getElementById('receipt-notes-input')?.value || state.capturedNotes || '';

  state.isUploading = true;
  const saveBtn = document.getElementById('btn-receipt-save');
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = `Saving...`;
  }

  try {
    const docId = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    let downloadUrl = state.capturedDataUrl;
    let storagePath = 'firestore_direct';

    try {
      if (storage && state.capturedBlob) {
        const potentialPath = `receipts/${state.user.uid}/${docId}.jpg`;
        const imgRef = storageRef(storage, potentialPath);
        const res = await uploadBytes(imgRef, state.capturedBlob, { contentType: 'image/jpeg' });
        downloadUrl = await getDownloadURL(res.ref);
        storagePath = potentialPath;
      }
    } catch (storageErr) {
      downloadUrl = state.capturedDataUrl;
      storagePath = 'firestore_direct';
    }

    const fileSize = state.capturedBlob ? state.capturedBlob.size : Math.round((downloadUrl.length * 3) / 4);

    const receiptDoc = {
      id: docId,
      userId: state.user.uid,
      userEmail: state.user.email || '',
      userName: state.user.displayName || state.user.email.split('@')[0],
      receiptDate: dateVal,
      notes: notesVal.trim(),
      storagePath: storagePath,
      downloadUrl: downloadUrl,
      fileSize: fileSize,
      createdAt: new Date().toISOString()
    };

    await setDoc(doc(db, "receipts", docId), receiptDoc);

    const existingIdx = state.receipts.findIndex(r => r.id === docId);
    if (existingIdx === -1) {
      state.receipts.unshift(receiptDoc);
    } else {
      state.receipts[existingIdx] = receiptDoc;
    }

    try {
      const local = JSON.parse(localStorage.getItem('HGS_RECEIPTS_LOCAL')) || [];
      const filtered = local.filter(r => r.id !== docId);
      filtered.unshift(receiptDoc);
      localStorage.setItem('HGS_RECEIPTS_LOCAL', JSON.stringify(filtered.slice(0, 15)));
    } catch (e) {}

    showToast('✓ Receipt photo saved successfully!');

    state.capturedBlob = null;
    state.capturedDataUrl = null;
    state.capturedNotes = '';
    state.isUploading = false;
    state.activeView = 'captured-receipts';
    state.selectedReceiptId = docId;
    renderApp();

  } catch (error) {
    console.error('Failed to save receipt:', error);
    state.isUploading = false;
    showToast(`Failed to save receipt: ${error.message || 'Database error'}`, false);
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = '✓ Save Receipt';
    }
  }
}

// --- SUBVIEW 3: CAPTURED RECEIPTS VIEWER ---
function renderCapturedReceiptsView() {
  const container = document.getElementById('receipt-vault-view-container');
  if (!container) return;

  const isMobile = isMobileOrTablet();
  if (isMobile && state.finderLayout !== 'grid') state.finderLayout = 'grid';

  const seenIds = new Set();
  const seenSignatures = new Set();
  let receiptsList = [];

  for (const r of state.receipts) {
    if (!r || !r.id || seenIds.has(r.id)) continue;
    const sig = `${r.userId || ''}_${r.receiptDate || ''}_${r.fileSize || 0}_${(r.notes || '').trim()}`;
    if (r.fileSize && seenSignatures.has(sig)) continue;
    seenIds.add(r.id);
    if (r.fileSize) seenSignatures.add(sig);
    receiptsList.push(r);
  }

  const years = Array.from(new Set(receiptsList.map(r => (r.receiptDate || '').substring(0, 4)).filter(Boolean))).sort().reverse();
  const currentYear = new Date().getFullYear().toString();
  if (!years.includes(currentYear)) years.unshift(currentYear);

  if (state.filterYear !== 'all') {
    receiptsList = receiptsList.filter(r => (r.receiptDate || '').startsWith(state.filterYear));
  }

  if (state.filterMonth !== 'all') {
    receiptsList = receiptsList.filter(r => {
      const parts = (r.receiptDate || '').split('-');
      return parts.length >= 2 && parts[1] === state.filterMonth;
    });
  }

  if (state.searchQuery.trim()) {
    const q = state.searchQuery.toLowerCase().trim();
    receiptsList = receiptsList.filter(r => 
      (r.notes || '').toLowerCase().includes(q) ||
      (r.receiptDate || '').includes(q)
    );
  }

  receiptsList.sort((a, b) => (b.receiptDate || '').localeCompare(a.receiptDate || '') || (b.createdAt || '').localeCompare(a.createdAt || ''));

  if (receiptsList.length > 0 && (!state.selectedReceiptId || !receiptsList.some(r => r.id === state.selectedReceiptId))) {
    state.selectedReceiptId = receiptsList[0].id;
  } else if (receiptsList.length === 0) {
    state.selectedReceiptId = null;
  }

  const selectedReceipt = receiptsList.find(r => r.id === state.selectedReceiptId) || null;
  const selectedBatchCount = state.selectedForBatch.size;

  container.innerHTML = `
    <div class="receipts-viewer-wrap">
      <!-- Toolbar -->
      <div class="receipts-toolbar">
        <div class="receipts-view-toggle">
          <button type="button" class="receipts-toggle-btn ${state.finderLayout === 'grid' ? 'active' : ''}" id="btn-finder-grid" title="Grid View">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
          </button>
          <button type="button" class="receipts-toggle-btn ${state.finderLayout === 'list' ? 'active' : ''}" id="btn-finder-list" title="List View">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
          </button>
        </div>

        <div class="receipts-filters-row">
          <select id="finder-filter-year" class="receipts-select" title="Filter by Year">
            <option value="all" ${state.filterYear === 'all' ? 'selected' : ''}>All Years</option>
            ${years.map(y => `<option value="${y}" ${state.filterYear === y ? 'selected' : ''}>${y}</option>`).join('')}
          </select>

          <select id="finder-filter-month" class="receipts-select" title="Filter by Month">
            <option value="all" ${state.filterMonth === 'all' ? 'selected' : ''}>All Months</option>
            <option value="01" ${state.filterMonth === '01' ? 'selected' : ''}>Jan</option>
            <option value="02" ${state.filterMonth === '02' ? 'selected' : ''}>Feb</option>
            <option value="03" ${state.filterMonth === '03' ? 'selected' : ''}>Mar</option>
            <option value="04" ${state.filterMonth === '04' ? 'selected' : ''}>Apr</option>
            <option value="05" ${state.filterMonth === '05' ? 'selected' : ''}>May</option>
            <option value="06" ${state.filterMonth === '06' ? 'selected' : ''}>Jun</option>
            <option value="07" ${state.filterMonth === '07' ? 'selected' : ''}>Jul</option>
            <option value="08" ${state.filterMonth === '08' ? 'selected' : ''}>Aug</option>
            <option value="09" ${state.filterMonth === '09' ? 'selected' : ''}>Sep</option>
            <option value="10" ${state.filterMonth === '10' ? 'selected' : ''}>Oct</option>
            <option value="11" ${state.filterMonth === '11' ? 'selected' : ''}>Nov</option>
            <option value="12" ${state.filterMonth === '12' ? 'selected' : ''}>Dec</option>
          </select>

          <div class="receipts-search-wrap">
            <input type="search" id="finder-search-input" class="receipts-search-input" placeholder="Search notes, date..." value="${escapeHTML(state.searchQuery)}">
          </div>
        </div>

        <div class="receipts-batch-actions">
          <button type="button" class="btn-ios receipts-select-all-btn" id="btn-finder-select-all">
            ${selectedBatchCount === receiptsList.length && receiptsList.length > 0 ? 'Deselect All' : 'Select All'}
          </button>
          <button type="button" class="btn-ios btn-ios-accent receipts-export-btn" id="btn-batch-export" ${receiptsList.length === 0 ? 'disabled' : ''}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;margin-right:4px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Export ZIP ${selectedBatchCount > 0 ? `(${selectedBatchCount})` : ''}
          </button>
        </div>
      </div>

      <!-- Main Layout -->
      <div class="receipts-viewer-body">
        <div class="receipts-content-pane">
          ${receiptsList.length === 0 ? `
            <div class="receipts-empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="empty-icon"><rect x="4" y="2" width="16" height="20" rx="2"></rect><line x1="8" y1="6" x2="16" y2="6"></line><line x1="8" y1="10" x2="16" y2="10"></line><line x1="8" y1="14" x2="12" y2="14"></line></svg>
              <h4>No Captured Receipts Found</h4>
              <p>No receipts match the filters or search.</p>
              <button type="button" class="btn-ios btn-ios-accent" id="btn-empty-snap">
                + Capture First Receipt
              </button>
            </div>
          ` : state.finderLayout === 'grid' ? `
            <div class="receipts-grid">
              ${receiptsList.map(r => {
                const isSelected = r.id === state.selectedReceiptId;
                const isChecked = state.selectedForBatch.has(r.id);
                const dateDisplay = formatReceiptDate(r.receiptDate);
                const notesPreview = r.notes ? r.notes.substring(0, 36) + (r.notes.length > 36 ? '...' : '') : 'No notes';

                return `
                  <div class="receipt-card-item ${isSelected ? 'active-selection' : ''}" data-id="${r.id}">
                    <div class="receipt-card-check-wrap">
                      <input type="checkbox" class="finder-item-checkbox" data-id="${r.id}" ${isChecked ? 'checked' : ''} aria-label="Select receipt">
                    </div>
                    <div class="receipt-card-thumb-wrap">
                      <img src="${escapeHTML(r.downloadUrl)}" alt="Receipt thumbnail" class="receipt-card-thumb-img" loading="lazy">
                    </div>
                    <div class="receipt-card-meta">
                      <span class="receipt-card-date">${escapeHTML(dateDisplay)}</span>
                      <span class="receipt-card-notes">${escapeHTML(notesPreview)}</span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          ` : `
            <div class="receipts-table-wrap">
              <table class="receipts-table">
                <thead>
                  <tr>
                    <th style="width: 38px;"></th>
                    <th style="width: 50px;">Photo</th>
                    <th>Date</th>
                    <th>Notes</th>
                    <th>Size</th>
                  </tr>
                </thead>
                <tbody>
                  ${receiptsList.map(r => {
                    const isSelected = r.id === state.selectedReceiptId;
                    const isChecked = state.selectedForBatch.has(r.id);
                    const dateDisplay = formatReceiptDate(r.receiptDate);
                    const sizeKB = r.fileSize ? Math.round(r.fileSize / 1024) + ' KB' : '—';

                    return `
                      <tr class="receipts-table-row ${isSelected ? 'active-selection' : ''}" data-id="${r.id}">
                        <td onclick="event.stopPropagation();">
                          <input type="checkbox" class="finder-item-checkbox" data-id="${r.id}" ${isChecked ? 'checked' : ''} aria-label="Select receipt">
                        </td>
                        <td>
                          <img src="${escapeHTML(r.downloadUrl)}" class="receipts-table-thumb" alt="thumbnail" loading="lazy">
                        </td>
                        <td class="receipts-table-date">${escapeHTML(dateDisplay)}</td>
                        <td class="receipts-table-notes">${escapeHTML(r.notes || '—')}</td>
                        <td class="receipts-table-size">${escapeHTML(sizeKB)}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>

        <!-- Inspector for Desktop -->
        <div class="receipts-inspector-pane" id="finder-inspector-pane">
          ${selectedReceipt ? renderInspectorHTML(selectedReceipt) : `
            <div class="inspector-empty"><p>Select a receipt to view details</p></div>
          `}
        </div>
      </div>
    </div>
  `;

  // Toolbar events
  document.getElementById('finder-filter-year')?.addEventListener('change', (e) => {
    state.filterYear = e.target.value;
    renderCapturedReceiptsView();
  });

  document.getElementById('finder-filter-month')?.addEventListener('change', (e) => {
    state.filterMonth = e.target.value;
    renderCapturedReceiptsView();
  });

  document.getElementById('finder-search-input')?.addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    renderCapturedReceiptsView();
  });

  document.getElementById('btn-finder-grid')?.addEventListener('click', () => {
    state.finderLayout = 'grid';
    renderCapturedReceiptsView();
  });

  document.getElementById('btn-finder-list')?.addEventListener('click', () => {
    state.finderLayout = 'list';
    renderCapturedReceiptsView();
  });

  document.getElementById('btn-empty-snap')?.addEventListener('click', () => {
    state.activeView = isMobileOrTablet() ? 'capture' : 'upload';
    renderApp();
  });

  document.getElementById('btn-batch-export')?.addEventListener('click', () => {
    exportSelectedReceiptsAsZip(receiptsList);
  });

  document.getElementById('btn-finder-select-all')?.addEventListener('click', () => {
    const allSelected = state.selectedForBatch.size === receiptsList.length && receiptsList.length > 0;
    if (allSelected) {
      state.selectedForBatch.clear();
    } else {
      state.selectedForBatch = new Set(receiptsList.map(r => r.id));
    }
    renderCapturedReceiptsView();
  });

  // Card/row click handlers
  container.querySelectorAll('.receipt-card-item, .receipts-table-row').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.dataset.id;
      if (!id) return;
      state.selectedReceiptId = id;
      container.querySelectorAll('.receipt-card-item, .receipts-table-row').forEach(c => c.classList.remove('active-selection'));
      el.classList.add('active-selection');
      const r = receiptsList.find(item => item.id === id);

      if (isMobileOrTablet()) {
        if (r) openMobileReceiptDetailModal(r);
      } else {
        const inspector = document.getElementById('finder-inspector-pane');
        if (inspector && r) {
          inspector.innerHTML = renderInspectorHTML(r);
          attachInspectorListeners(r);
        }
      }
    });
  });

  // Checkbox toggle handlers
  container.querySelectorAll('.finder-item-checkbox').forEach(cb => {
    cb.addEventListener('click', (e) => e.stopPropagation());
    cb.addEventListener('change', () => {
      const id = cb.dataset.id;
      if (cb.checked) {
        state.selectedForBatch.add(id);
      } else {
        state.selectedForBatch.delete(id);
      }
      const exportBtn = document.getElementById('btn-batch-export');
      const count = state.selectedForBatch.size;
      if (exportBtn) {
        exportBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;margin-right:4px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> Export ZIP ${count > 0 ? `(${count})` : ''}`;
      }
    });
  });

  if (selectedReceipt) {
    attachInspectorListeners(selectedReceipt);
  }
}

// Inspector HTML (Desktop)
function renderInspectorHTML(receipt) {
  const dateFormatted = formatReceiptDate(receipt.receiptDate);
  const sizeKB = receipt.fileSize ? Math.round(receipt.fileSize / 1024) + ' KB' : '—';

  return `
    <div class="inspector-card">
      <div class="inspector-preview-wrap" id="btn-zoom-inspector">
        <img src="${escapeHTML(receipt.downloadUrl)}" alt="Receipt inspector view" class="inspector-img">
        <span class="inspector-zoom-hint">Click to enlarge</span>
      </div>

      <div class="inspector-info-group">
        <div class="inspector-meta-row">
          <label class="inspector-label">Date</label>
          <div class="inspector-inline-edit">
            <input type="date" id="inspector-date-input" class="form-control inspector-date-field" value="${escapeHTML(receipt.receiptDate || '')}">
            <button type="button" class="btn-ios-small" id="btn-save-inspector-date">Update</button>
          </div>
        </div>

        <div class="inspector-meta-row" style="margin-top: 0.85rem;">
          <label class="inspector-label">Notes</label>
          <textarea id="inspector-notes-input" class="form-control inspector-notes-field" rows="3" placeholder="Add notes...">${escapeHTML(receipt.notes || '')}</textarea>
          <button type="button" class="btn-ios-small" id="btn-save-inspector-notes" style="align-self: flex-end; margin-top: 4px;">Update Notes</button>
        </div>

        <div class="inspector-details-table">
          <div class="detail-row">
            <span class="detail-key">File Size</span>
            <span class="detail-val">${sizeKB}</span>
          </div>
          <div class="detail-row">
            <span class="detail-key">Uploaded At</span>
            <span class="detail-val">${new Date(receipt.createdAt || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>

        <div class="inspector-actions">
          <a href="${escapeHTML(receipt.downloadUrl)}" target="_blank" download="receipt_${receipt.receiptDate}_${receipt.id}.jpg" class="btn-ios inspector-btn-download">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;margin-right:4px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Download JPEG
          </a>
          <button type="button" class="btn-ios btn-ios-danger inspector-btn-delete" id="btn-delete-receipt" data-id="${receipt.id}">
            Delete Receipt
          </button>
        </div>
      </div>
    </div>
  `;
}

function attachInspectorListeners(receipt) {
  document.getElementById('btn-zoom-inspector')?.addEventListener('click', () => openReceiptZoomModal(receipt));

  document.getElementById('btn-save-inspector-date')?.addEventListener('click', async () => {
    const newDate = document.getElementById('inspector-date-input')?.value;
    if (newDate) await updateReceiptMetadata(receipt.id, { receiptDate: newDate });
  });

  document.getElementById('btn-save-inspector-notes')?.addEventListener('click', async () => {
    const newNotes = document.getElementById('inspector-notes-input')?.value || '';
    await updateReceiptMetadata(receipt.id, { notes: newNotes.trim() });
  });

  document.getElementById('btn-delete-receipt')?.addEventListener('click', () => {
    if (confirm('Are you sure you want to permanently delete this receipt?')) {
      deleteReceiptRecord(receipt.id, receipt.storagePath);
    }
  });
}

// --- Mobile Detail Sheet Modal ---
function openMobileReceiptDetailModal(receipt) {
  const existing = document.getElementById('receipt-mobile-detail-modal');
  if (existing) existing.remove();

  const dateFormatted = formatReceiptDate(receipt.receiptDate);
  const sizeKB = receipt.fileSize ? Math.round(receipt.fileSize / 1024) + ' KB' : '—';

  const modal = document.createElement('div');
  modal.id = 'receipt-mobile-detail-modal';
  modal.className = 'receipt-mobile-detail-overlay';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');

  modal.innerHTML = `
    <div class="receipt-mobile-detail-sheet">
      <div class="receipt-mobile-detail-header">
        <div class="detail-header-info">
          <h4 class="detail-header-title">Receipt Details</h4>
          <span class="detail-header-date">${escapeHTML(dateFormatted)}</span>
        </div>
        <button type="button" class="btn-close-detail" id="btn-close-mobile-detail" aria-label="Close">&times;</button>
      </div>
      <div class="receipt-mobile-detail-body">
        <div class="inspector-card" style="border: none; background: transparent; padding: 0;">
          <div class="inspector-preview-wrap" id="mobile-detail-zoom-trigger">
            <img src="${escapeHTML(receipt.downloadUrl)}" alt="Receipt photo" class="inspector-img">
            <span class="inspector-zoom-hint">Tap photo to view full size</span>
          </div>

          <div class="inspector-info-group" style="padding-top: 0.5rem;">
            <div class="inspector-meta-row">
              <label class="inspector-label">Receipt Date</label>
              <div class="inspector-inline-edit">
                <input type="date" id="mobile-detail-date-input" class="form-control inspector-date-field" value="${escapeHTML(receipt.receiptDate || '')}">
                <button type="button" class="btn-ios-small" id="btn-mobile-save-date">Save Date</button>
              </div>
            </div>

            <div class="inspector-meta-row" style="margin-top: 0.85rem;">
              <label class="inspector-label">Notes</label>
              <textarea id="mobile-detail-notes-input" class="form-control inspector-notes-field" rows="3" placeholder="Add notes...">${escapeHTML(receipt.notes || '')}</textarea>
              <button type="button" class="btn-ios-small" id="btn-mobile-save-notes" style="align-self: flex-end; margin-top: 4px;">Save Notes</button>
            </div>

            <div class="inspector-details-table">
              <div class="detail-row">
                <span class="detail-key">File Size</span>
                <span class="detail-val">${sizeKB}</span>
              </div>
              <div class="detail-row">
                <span class="detail-key">Uploaded At</span>
                <span class="detail-val">${new Date(receipt.createdAt || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>

            <div class="inspector-actions">
              <a href="${escapeHTML(receipt.downloadUrl)}" target="_blank" download="receipt_${receipt.receiptDate}_${receipt.id}.jpg" class="btn-ios inspector-btn-download">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;margin-right:4px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                Download JPEG
              </a>
              <button type="button" class="btn-ios btn-ios-danger inspector-btn-delete" id="btn-mobile-delete-receipt" data-id="${receipt.id}">
                Delete Receipt
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  const closeModal = () => modal.remove();

  document.getElementById('btn-close-mobile-detail')?.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  document.getElementById('mobile-detail-zoom-trigger')?.addEventListener('click', () => {
    openReceiptZoomModal(receipt);
  });

  document.getElementById('btn-mobile-save-date')?.addEventListener('click', async () => {
    const newDate = document.getElementById('mobile-detail-date-input')?.value;
    if (newDate) {
      await updateReceiptMetadata(receipt.id, { receiptDate: newDate });
      receipt.receiptDate = newDate;
      const el = modal.querySelector('.detail-header-date');
      if (el) el.textContent = formatReceiptDate(newDate);
    }
  });

  document.getElementById('btn-mobile-save-notes')?.addEventListener('click', async () => {
    const newNotes = document.getElementById('mobile-detail-notes-input')?.value || '';
    await updateReceiptMetadata(receipt.id, { notes: newNotes.trim() });
    receipt.notes = newNotes.trim();
  });

  document.getElementById('btn-mobile-delete-receipt')?.addEventListener('click', async () => {
    if (confirm('Are you sure you want to permanently delete this receipt?')) {
      closeModal();
      await deleteReceiptRecord(receipt.id, receipt.storagePath);
    }
  });
}

// Update metadata in Firestore
async function updateReceiptMetadata(receiptId, updateFields) {
  try {
    const receiptRef = doc(db, "receipts", receiptId);
    await updateDoc(receiptRef, updateFields);

    const idx = state.receipts.findIndex(r => r.id === receiptId);
    if (idx !== -1) Object.assign(state.receipts[idx], updateFields);

    showToast('✓ Receipt details updated.');
    renderCapturedReceiptsView();
  } catch (err) {
    console.error('Update error:', err);
    showToast('Failed to update receipt.', false);
  }
}

// Delete receipt document and storage file
async function deleteReceiptRecord(receiptId, storagePath) {
  try {
    await deleteDoc(doc(db, "receipts", receiptId));

    if (storagePath && storagePath.startsWith('receipts/')) {
      try {
        const fileRef = storageRef(storage, storagePath);
        await deleteObject(fileRef);
      } catch (e) {}
    }

    state.receipts = state.receipts.filter(r => r.id !== receiptId);
    state.selectedForBatch.delete(receiptId);
    if (state.selectedReceiptId === receiptId) {
      state.selectedReceiptId = state.receipts[0]?.id || null;
    }

    showToast('Receipt deleted successfully.');
    renderCapturedReceiptsView();
  } catch (err) {
    console.error('Delete error:', err);
    showToast('Failed to delete receipt.', false);
  }
}

// Lightbox Zoom Modal
function openReceiptZoomModal(receipt) {
  const modal = document.getElementById('receipt-zoom-modal');
  const img = document.getElementById('receipt-zoom-image');
  const title = document.getElementById('receipt-zoom-title');
  if (!modal || !img) return;

  img.src = receipt.downloadUrl;
  if (title) title.textContent = `${formatReceiptDate(receipt.receiptDate)} - ${receipt.notes || 'Receipt Photo'}`;
  modal.style.display = 'flex';
}

function closeReceiptZoomModal() {
  const modal = document.getElementById('receipt-zoom-modal');
  if (modal) modal.style.display = 'none';
}

// Batch Export Receipts as ZIP of JPEGs
async function exportSelectedReceiptsAsZip(filteredReceiptsList) {
  let toExport = state.selectedForBatch.size > 0 
    ? filteredReceiptsList.filter(r => state.selectedForBatch.has(r.id)) 
    : [...filteredReceiptsList];

  if (toExport.length === 0) {
    showToast('No receipts to export.', false);
    return;
  }

  if (typeof window.JSZip === 'undefined') {
    showToast('Export library loading... please wait.', false);
    return;
  }

  const exportBtn = document.getElementById('btn-batch-export');
  const originalHtml = exportBtn ? exportBtn.innerHTML : '';
  if (exportBtn) {
    exportBtn.disabled = true;
    exportBtn.innerHTML = `Packaging ZIP...`;
  }

  try {
    const zip = new window.JSZip();
    const folder = zip.folder("receipts");
    let csvManifest = "Filename,ReceiptDate,Notes,CapturedBy,SizeBytes,DownloadUrl\n";

    for (let i = 0; i < toExport.length; i++) {
      const receipt = toExport[i];
      const safeDate = (receipt.receiptDate || 'nodate').replace(/[^a-zA-Z0-9_-]/g, '');
      const safeId = (receipt.id || `rec_${i}`).replace(/[^a-zA-Z0-9_-]/g, '');
      const filename = `receipt_${safeDate}_${safeId}.jpg`;

      try {
        const response = await fetch(receipt.downloadUrl);
        const imageBlob = await response.blob();
        folder.file(filename, imageBlob);
      } catch (e) {}

      const safeNotes = `"${(receipt.notes || '').replace(/"/g, '""')}"`;
      const safeUser = `"${(receipt.userName || '').replace(/"/g, '""')}"`;
      csvManifest += `${filename},${receipt.receiptDate || ''},${safeNotes},${safeUser},${receipt.fileSize || 0},${receipt.downloadUrl || ''}\n`;
    }

    zip.file("receipts_manifest.csv", csvManifest);
    const zipBlob = await zip.generateAsync({ type: 'blob' });

    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = URL.createObjectURL(zipBlob);
    downloadAnchor.download = `4HGS_Receipts_${getTodayISODate()}.zip`;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
    setTimeout(() => URL.revokeObjectURL(downloadAnchor.href), 15000);

    showToast(`✓ Exported ${toExport.length} receipts into ZIP!`);
  } catch (err) {
    console.error('Export error:', err);
    showToast('Failed to export receipts archive.', false);
  } finally {
    if (exportBtn) {
      exportBtn.disabled = false;
      exportBtn.innerHTML = originalHtml;
    }
  }
}

// iOS PWA Install Guide Modal
function openIosInstallModal() {
  const modal = document.getElementById('ios-install-modal');
  if (modal) modal.style.display = 'flex';
}

function closeIosInstallModal() {
  const modal = document.getElementById('ios-install-modal');
  if (modal) modal.style.display = 'none';
}

document.getElementById('btn-close-ios-install')?.addEventListener('click', closeIosInstallModal);
document.getElementById('btn-dismiss-ios-install')?.addEventListener('click', closeIosInstallModal);
document.getElementById('ios-install-modal')?.addEventListener('click', (e) => {
  if (e.target.id === 'ios-install-modal') closeIosInstallModal();
});

// Prevent iOS Standalone link hijacking
if (window.navigator.standalone) {
  document.addEventListener('click', (e) => {
    const anchor = e.target.closest('a');
    if (anchor) {
      const href = anchor.getAttribute('href');
      if (href && !href.startsWith('http') && !href.startsWith('mailto:') && anchor.getAttribute('target') !== '_blank') {
        e.preventDefault();
        window.location.href = href;
      }
    }
  }, false);
}
