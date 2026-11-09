import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { sanitizeTwinStateForPersistence } from '@/lib/storage-sanitizer';

const FIRESTORE_API_KEY =
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
  'AIzaSyBNK-y7b0wZYtMoDqPhafOJ1FnzW4vZaLI';
const FIRESTORE_PROJECT_ID =
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'workbalance-7e94e';
const FIRESTORE_BASE_URL = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/(default)/documents/inv_metadata`;

const BASELINE_DOC_URL = `${FIRESTORE_BASE_URL}/warehouse_twin_baseline_defaults?key=${FIRESTORE_API_KEY}`;
const STATE_DOC_URL = `${FIRESTORE_BASE_URL}/warehouse_twin_state?key=${FIRESTORE_API_KEY}`;

export async function GET() {
  try {
    // 1. Try fetching authoritative baseline defaults from Firestore
    const res = await fetch(BASELINE_DOC_URL, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    if (res.ok) {
      const doc = await res.json();
      const payloadStr = doc.fields?.payload?.stringValue;
      const updatedAt = doc.fields?.updatedAt?.stringValue || null;
      if (payloadStr) {
        const parsed = JSON.parse(payloadStr);
        if (Array.isArray(parsed.blueprintItems)) {
          parsed.blueprintItems = parsed.blueprintItems.map((b: any) => ({
            ...b,
            visible: b.visible !== false,
          }));
        }
        if (Array.isArray(parsed.markers)) {
          const legacyBinIds = new Set(['BIN-101', 'BIN-102', 'BIN-103', 'BIN-104', 'BIN-105']);
          parsed.markers = parsed.markers.filter((m: any) => m && !legacyBinIds.has(m.id));
        }
        return NextResponse.json({
          success: true,
          data: parsed,
          updatedAt,
          source: 'cloud',
        });
      }
    }

    // 2. Fall back to local file if Firestore baseline doesn't exist yet
    const localPath = path.join(process.cwd(), 'lib', 'baseline-warehouse-defaults.json');
    if (fs.existsSync(localPath)) {
      const raw = fs.readFileSync(localPath, 'utf-8');
      return NextResponse.json({
        success: true,
        data: JSON.parse(raw),
        source: 'filesystem',
      });
    }

    return NextResponse.json({ success: false, error: 'No baseline defaults found.' }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Unknown error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { state, deviceId } = body || {};

    if (!state || typeof state !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid warehouse state payload provided.' },
        { status: 400 }
      );
    }

    const clean = sanitizeTwinStateForPersistence(state);

    // Safeguard: Ensure blueprint items and markers are present
    const localFallbackPath = path.join(process.cwd(), 'lib', 'baseline-warehouse-defaults.json');
    let fallbackData: any = {};
    if (fs.existsSync(localFallbackPath)) {
      try {
        fallbackData = JSON.parse(fs.readFileSync(localFallbackPath, 'utf-8'));
      } catch {}
    }

    if (!Array.isArray(clean.blueprintItems) || clean.blueprintItems.length === 0) {
      clean.blueprintItems = fallbackData.blueprintItems || [];
    }
    clean.blueprintItems = clean.blueprintItems.map((b: any) => ({
      ...b,
      visible: b.visible !== false,
    }));
    if (!Array.isArray(clean.markers)) {
      clean.markers = fallbackData.markers || [];
    }

    const now = new Date().toISOString();
    const payloadWithMeta = {
      ...clean,
      savedAt: now,
    };
    const payloadStr = JSON.stringify(payloadWithMeta, null, 2);

    // 1. Persist directly to local codebase file so builds and git preserve it
    const localPaths = [
      path.join(process.cwd(), 'lib', 'baseline-warehouse-defaults.json'),
      '/Users/coleankney-4hgs/Documents/Development/3D Warehouse/lib/baseline-warehouse-defaults.json',
      '/Users/coleankney-4hgs/.gemini/antigravity/scratch/4HGhub/3d-warehouse/lib/baseline-warehouse-defaults.json',
    ];

    for (const p of localPaths) {
      try {
        if (fs.existsSync(path.dirname(p))) {
          fs.writeFileSync(p, payloadStr, 'utf-8');
        }
      } catch (fileErr) {
        console.warn(`Could not write baseline file to ${p}:`, fileErr);
      }
    }

    // 2. Persist to Firestore as permanent master baseline defaults
    const firestoreBody = {
      fields: {
        payload: { stringValue: JSON.stringify(payloadWithMeta) },
        updatedAt: { stringValue: now },
        deviceId: { stringValue: String(deviceId || 'admin-lock') },
      },
    };

    // Save to baseline_defaults document
    await fetch(BASELINE_DOC_URL, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(firestoreBody),
      cache: 'no-store',
    });

    // Also update current active state in Firestore
    await fetch(STATE_DOC_URL, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(firestoreBody),
      cache: 'no-store',
    });

    return NextResponse.json({
      success: true,
      message: 'Current warehouse layout, shelves, markers, and settings successfully locked as master baseline default.',
      savedAt: now,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to save baseline default.' },
      { status: 500 }
    );
  }
}
