import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

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

(() => {
  'use strict';

  /**
   * Optional custom MP3 audio configuration.
   * Drop MP3 files into an /audio folder and set their paths here
   * to override the default Web Speech API voice synthesis.
   */
  const AUDIO_FILES = {
    sixEggs: null,        // e.g. 'audio/six-eggs.mp3'
    outOfEggs: null,      // e.g. 'audio/out-of-eggs.mp3'
    buyPrompt: null,      // e.g. 'audio/buy-prompt.mp3'
    nowHave80: null,      // e.g. 'audio/now-have-80.mp3'
    nowHave40: null,      // e.g. 'audio/now-have-40.mp3'
    nudeEgg: null         // e.g. 'audio/nude-egg.mp3'
  };

  const VOICE_LINES = {
    sixEggs: 'Six eggs.',
    outOfEggs: "You're out of eggs.",
    buyPrompt: 'Dude, you ran out of eggs. Would you like to buy an 80-pack of eggs?',
    nowHave80: 'You now have 80 eggs.',
    nowHave40: 'You now have 40 eggs.',
    nudeEgg: "Congrats, big boy. You're looking at a nude egg."
  };

  const params = new URLSearchParams(window.location.search);
  const FAST_MODE = params.get('fast') === '1';

  // DOM Elements
  const stage = document.getElementById('stage');
  const eggCharacter = document.getElementById('egg-character');
  const sprites = Array.from(eggCharacter.querySelectorAll('.sprite'));
  const mouthTarget = document.getElementById('mouth-target');
  const basketHitbox = document.getElementById('basket-hitbox');
  const eggCounterEl = document.getElementById('egg-counter');

  const dragEggEl = document.getElementById('drag-egg');
  const ghost1El = document.getElementById('ghost-egg-1');
  const ghost2El = document.getElementById('ghost-egg-2');
  const handCursorEl = document.getElementById('hand-cursor');

  const popupBox = document.getElementById('popup-box');
  const popupText = document.getElementById('popup-text');
  const popupWarning = document.getElementById('popup-warning');

  const purchaseModal = document.getElementById('purchase-modal');
  const purchasePrompt = document.getElementById('purchase-prompt');
  const purchaseForm = document.getElementById('purchase-form');
  const purchaseInput = document.getElementById('purchase-input');

  const restartModal = document.getElementById('restart-modal');
  const restartText = document.getElementById('restart-text');
  const restartBtn = document.getElementById('restart-btn');

  // Game State
  const state = {
    phase: 'FEED_PRE', // FEED_PRE | SIX | FEED_MID | OUT | ASK | FEED_COUNT | PANTS | MOON | FINAL | RESTART
    eatenInPhase: 0,
    basketEggs: 40,
    firstPostPurchaseFed: false,
    refusalCount: 0,
    isDragging: false,
    inputLocked: false,
    targets: {
      preSix: 5,
      midEggs: 5,
      postBuy: 12
    },
    trail: []
  };

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Cross-dissolve sprite switcher
   */
  function setSprite(frameName) {
    for (const img of sprites) {
      if (img.dataset.frame === frameName) {
        img.classList.add('active');
      } else {
        img.classList.remove('active');
      }
    }
  }

  /**
   * Speak a line via custom MP3 (if configured) or Web Speech API.
   * Resolves when finished (with a safety timeout so gameplay never hangs).
   */
  function speak(key) {
    const text = VOICE_LINES[key] || '';
    const customUrl = AUDIO_FILES[key];

    if (customUrl) {
      return new Promise((resolve) => {
        const audio = new Audio(customUrl);
        let settled = false;
        const done = () => {
          if (!settled) {
            settled = true;
            resolve();
          }
        };
        audio.addEventListener('ended', done, { once: true });
        audio.addEventListener('error', done, { once: true });
        setTimeout(done, 6000);
        audio.play().catch(done);
      });
    }

    return new Promise((resolve) => {
      if (!('speechSynthesis' in window) || !text) {
        setTimeout(resolve, 700);
        return;
      }
      try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.rate = 0.96;
        utter.pitch = 0.92;
        let settled = false;
        const done = () => {
          if (!settled) {
            settled = true;
            resolve();
          }
        };
        utter.onend = done;
        utter.onerror = done;
        setTimeout(done, Math.max(1600, text.length * 95));
        window.speechSynthesis.speak(utter);
      } catch {
        setTimeout(resolve, 700);
      }
    });
  }

  /**
   * Popup helper
   */
  function showPopup({ text = '', warning = false, topPos = false, alertSize = false }) {
    popupBox.classList.remove('hidden', 'top-pos', 'alert-size');
    if (topPos) popupBox.classList.add('top-pos');
    if (alertSize) popupBox.classList.add('alert-size');

    if (warning) {
      popupWarning.classList.remove('hidden');
    } else {
      popupWarning.classList.add('hidden');
    }

    if (text) {
      popupText.innerHTML = text;
      popupText.classList.remove('hidden');
    } else {
      popupText.textContent = '';
      popupText.classList.add('hidden');
    }
  }

  function hidePopup() {
    popupBox.classList.add('hidden');
  }

  function updateCounterUI() {
    eggCounterEl.textContent = `EGGS:${state.basketEggs}`;
  }

  /**
   * Initialize / Reset Game
   */
  function initGame() {
    document.body.classList.remove('alert-theme');
    eggCharacter.classList.remove('centered');
    setSprite('open');

    hidePopup();
    purchaseModal.classList.add('hidden');
    restartModal.classList.add('hidden');
    eggCounterEl.classList.add('hidden');

    state.phase = 'FEED_PRE';
    state.eatenInPhase = 0;
    state.basketEggs = 80;
    state.firstPostPurchaseFed = false;
    state.refusalCount = 0;
    state.isDragging = false;
    state.inputLocked = false;

    state.targets = FAST_MODE
      ? { preSix: 2, midEggs: 2, postBuy: 3 }
      : {
          preSix: randInt(3, 10),
          midEggs: randInt(4, 10),
          postBuy: randInt(10, 25)
        };
  }

  /**
   * Animate the egg mouth closing & chewing with a cross-dissolve
   */
  async function animateChew() {
    setSprite('closed');
    await delay(420);
    setSprite('open');
    await delay(180);
  }

  /**
   * Step 2: "6 EGGS" window + voice line
   */
  async function triggerSixEggs() {
    state.phase = 'SIX';
    state.inputLocked = true;
    showPopup({ text: '6 EGGS' });
    await speak('sixEggs');
    await delay(750);
    hidePopup();
    state.phase = 'FEED_MID';
    state.eatenInPhase = 0;
    state.inputLocked = false;
  }

  /**
   * Step 3 & 4: Red Alert ("You're out of eggs") -> Purchase 80-pack prompt
   */
  async function triggerOutOfEggs() {
    state.phase = 'OUT';
    state.inputLocked = true;

    document.body.classList.add('alert-theme');
    showPopup({
      text: "YOU'RE OUT OF EGGS",
      warning: true,
      alertSize: false
    });
    await speak('outOfEggs');
    await delay(900);

    // Return to black & white and show purchase prompt (Step 4)
    document.body.classList.remove('alert-theme');
    hidePopup();
    await showPurchasePrompt();
  }

  async function showPurchasePrompt() {
    state.phase = 'ASK';
    state.inputLocked = true;
    purchasePrompt.innerHTML =
      'Dude, you ran out of eggs.<br />Would you like to buy<br />an 80 pack of eggs?';
    purchaseInput.value = '';
    purchaseModal.classList.remove('hidden');
    purchaseInput.focus();

    await speak('buyPrompt');
    purchaseInput.focus();
  }

  /**
   * Handle user submission in Step 4 purchase dialog
   */
  purchaseForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (state.phase !== 'ASK') return;

    const answer = purchaseInput.value.trim().toLowerCase();
    if (answer === 'yes') {
      purchaseModal.classList.add('hidden');
      await startPostPurchasePhase();
      return;
    }

    // First refusal -> prompt again; second refusal -> game ends
    state.refusalCount += 1;
    if (state.refusalCount === 1) {
      purchaseInput.value = '';
      await speak('buyPrompt');
      purchaseInput.focus();
    } else {
      purchaseModal.classList.add('hidden');
      triggerGameOver('GAME OVER');
    }
  });

  /**
   * Step 5: Player typed "yes" -> show counter EGGS:80 + popup "You now have 80 eggs."
   */
  async function startPostPurchasePhase() {
    state.phase = 'FEED_COUNT';
    state.eatenInPhase = 0;
    state.basketEggs = 80;
    state.firstPostPurchaseFed = false;

    updateCounterUI();
    eggCounterEl.classList.remove('hidden');

    showPopup({ text: 'You now have 80 eggs.' });
    await speak('nowHave80');
    await delay(750);
    hidePopup();

    state.inputLocked = false;
  }

  /**
   * Step 7, 8, 9, 10: Pants drop -> Mooning -> "You're looking at a nude egg." -> Restart
   */
  async function triggerNudeEggSequence() {
    state.phase = 'PANTS';
    state.inputLocked = true;

    // Move egg character to center stage
    eggCharacter.classList.add('centered');
    const pantsFrames = ['pants-1', 'pants-2', 'pants-3', 'pants-4', 'pants-5'];
    for (const frame of pantsFrames) {
      setSprite(frame);
      await delay(650);
    }

    // Pause between the pants drop and mooning sequence
    await delay(1200);

    // Step 8: Mooning animation
    state.phase = 'MOON';
    const moonFrames = ['moon-1', 'moon-2', 'moon-3', 'moon-4', 'moon-5', 'moon-6'];
    for (const frame of moonFrames) {
      setSprite(frame);
      await delay(650);
    }

    // Step 9: Final Nude Egg popup & voice line
    state.phase = 'FINAL';
    showPopup({
      text: "You're looking<br />at a nude egg.",
      topPos: true
    });
    await speak('nudeEgg');
    await delay(1100);

    // Step 10: Prompt user to restart the game
    hidePopup();
    triggerGameOver('PLAY AGAIN?');
  }

  function triggerGameOver(message) {
    state.phase = 'RESTART';
    state.inputLocked = true;
    restartText.textContent = message;
    restartModal.classList.remove('hidden');
  }

  restartBtn.addEventListener('click', () => {
    initGame();
  });

  /**
   * Handle feeding an egg into the character's mouth
   */
  async function onEggFed() {
    state.inputLocked = true;
    await animateChew();

    if (state.phase === 'FEED_PRE') {
      state.eatenInPhase += 1;
      if (state.eatenInPhase >= state.targets.preSix) {
        await triggerSixEggs();
        return;
      }
      state.inputLocked = false;
    } else if (state.phase === 'FEED_MID') {
      state.eatenInPhase += 1;
      if (state.eatenInPhase >= state.targets.midEggs) {
        await triggerOutOfEggs();
        return;
      }
      state.inputLocked = false;
    } else if (state.phase === 'FEED_COUNT') {
      state.eatenInPhase += 1;

      // Step 5: First egg fed after purchase reduces basket from 80 to 40
      if (!state.firstPostPurchaseFed) {
        state.firstPostPurchaseFed = true;
        state.basketEggs = 40;
        updateCounterUI();
        showPopup({ text: 'You now have 40 eggs.' });
        await speak('nowHave40');
        await delay(750);
        hidePopup();
      } else {
        state.basketEggs = Math.max(0, state.basketEggs - 1);
        updateCounterUI();
      }

      if (state.eatenInPhase >= state.targets.postBuy) {
        await triggerNudeEggSequence();
        return;
      }

      state.inputLocked = false;
    }
  }

  /**
   * Pointer / Drag Mechanics & Custom Hand Cursor
   */
  function stageCoords(clientX, clientY) {
    const rect = stage.getBoundingClientRect();
    const xPct = ((clientX - rect.left) / rect.width) * 100;
    const yPct = ((clientY - rect.top) / rect.height) * 100;
    return { xPct, yPct };
  }

  function setEggPosition(el, xPct, yPct) {
    el.style.left = `${xPct}%`;
    el.style.top = `${yPct}%`;
  }

  function updateHandCursor(clientX, clientY) {
    const { xPct, yPct } = stageCoords(clientX, clientY);
    handCursorEl.classList.remove('hidden');
    handCursorEl.style.left = `${xPct}%`;
    handCursorEl.style.top = `${yPct}%`;
  }

  function setHandGrab(grabbing) {
    handCursorEl.src = grabbing ? '/nude-egg-game/assets/hand-grab.svg' : '/nude-egg-game/assets/hand-open.svg';
  }

  stage.addEventListener('pointermove', (e) => {
    updateHandCursor(e.clientX, e.clientY);

    if (!state.isDragging) return;
    const { xPct, yPct } = stageCoords(e.clientX, e.clientY);

    state.trail.unshift({ xPct, yPct });
    if (state.trail.length > 8) state.trail.pop();

    setEggPosition(dragEggEl, xPct, yPct);

    if (state.trail[3]) {
      ghost1El.classList.remove('hidden');
      setEggPosition(ghost1El, state.trail[3].xPct, state.trail[3].yPct);
    }
    if (state.trail[6]) {
      ghost2El.classList.remove('hidden');
      setEggPosition(ghost2El, state.trail[6].xPct, state.trail[6].yPct);
    }
  });

  stage.addEventListener('pointerleave', () => {
    handCursorEl.classList.add('hidden');
  });

  basketHitbox.addEventListener('pointerdown', (e) => {
    if (state.inputLocked) return;
    if (!['FEED_PRE', 'FEED_MID', 'FEED_COUNT'].includes(state.phase)) return;

    e.preventDefault();
    state.isDragging = true;
    state.trail = [];
    setHandGrab(true);

    const { xPct, yPct } = stageCoords(e.clientX, e.clientY);
    setEggPosition(dragEggEl, xPct, yPct);
    dragEggEl.classList.remove('hidden');
  });

  window.addEventListener('pointerup', (e) => {
    setHandGrab(false);
    if (!state.isDragging) return;

    state.isDragging = false;
    dragEggEl.classList.add('hidden');
    ghost1El.classList.add('hidden');
    ghost2El.classList.add('hidden');
    state.trail = [];

    // Check if dropped inside the egg character's open mouth
    const mouthRect = mouthTarget.getBoundingClientRect();
    const charRect = eggCharacter.getBoundingClientRect();

    const inMouth =
      e.clientX >= mouthRect.left - 18 &&
      e.clientX <= mouthRect.right + 18 &&
      e.clientY >= mouthRect.top - 18 &&
      e.clientY <= mouthRect.bottom + 18;

    const inCharBody =
      e.clientX >= charRect.left &&
      e.clientX <= charRect.right &&
      e.clientY >= charRect.top &&
      e.clientY <= charRect.bottom;

    if (inMouth || inCharBody) {
      onEggFed();
    }
  });

  // Elements for Auth Gate
  const authGateOverlay = document.getElementById('auth-gate-overlay');
  const authGateLoading = document.getElementById('auth-gate-loading');
  const authGateDenied = document.getElementById('auth-gate-denied');

  function setupAuthProtection() {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        // Authenticated user: remove the gate overlay and initialize
        if (authGateOverlay) authGateOverlay.classList.add('hidden');
        initGame();
      } else {
        // Unauthenticated: show Access Denied card with Hub login link
        state.inputLocked = true;
        if (authGateLoading) authGateLoading.classList.add('hidden');
        if (authGateDenied) authGateDenied.classList.remove('hidden');
        if (authGateOverlay) authGateOverlay.classList.remove('hidden');
      }
    });
  }

  setupAuthProtection();
})();
