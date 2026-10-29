interface DocumentWithFullscreen extends Document {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
}

interface HTMLElementWithFullscreen extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void> | void;
}

export const isBrowserFullscreen = (): boolean => {
  if (typeof document === 'undefined') return false;
  const doc = document as DocumentWithFullscreen;
  return !!(doc.fullscreenElement || doc.webkitFullscreenElement);
};

export async function enterBrowserFullscreen(): Promise<boolean> {
  if (typeof document === 'undefined') return false;
  const docEl = document.documentElement as HTMLElementWithFullscreen;
  try {
    if (docEl.requestFullscreen) {
      await docEl.requestFullscreen();
      return true;
    } else if (docEl.webkitRequestFullscreen) {
      await docEl.webkitRequestFullscreen();
      return true;
    }
  } catch {
    // Rejected by browser policy or user
    return false;
  }
  return false;
}

export async function exitBrowserFullscreen(): Promise<void> {
  if (typeof document === 'undefined') return;
  const doc = document as DocumentWithFullscreen;
  try {
    if (doc.exitFullscreen) {
      await doc.exitFullscreen();
    } else if (doc.webkitExitFullscreen) {
      await doc.webkitExitFullscreen();
    }
  } catch {
    // Ignore error
  }
}

export function onFullscreenChange(cb: () => void): () => void {
  if (typeof document === 'undefined') return () => {};
  document.addEventListener('fullscreenchange', cb);
  document.addEventListener('webkitfullscreenchange', cb);
  return () => {
    document.removeEventListener('fullscreenchange', cb);
    document.removeEventListener('webkitfullscreenchange', cb);
  };
}
