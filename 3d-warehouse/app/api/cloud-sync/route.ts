import { NextRequest, NextResponse } from 'next/server';
import { sanitizeTwinStateForPersistence } from '@/lib/storage-sanitizer';
import baselineDefaults from '@/lib/baseline-warehouse-defaults.json';

const FIRESTORE_API_KEY =
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
  'AIzaSyBNK-y7b0wZYtMoDqPhafOJ1FnzW4vZaLI';
const FIRESTORE_PROJECT_ID =
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'workbalance-7e94e';
const FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/(default)/documents/inv_metadata/warehouse_twin_state?key=${FIRESTORE_API_KEY}`;

export async function GET() {
  try {
    const res = await fetch(FIRESTORE_URL, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    if (res.status === 404) {
      return NextResponse.json({ success: true, data: null, updatedAt: null });
    }

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { success: false, error: `Firestore fetch error: ${errText}` },
        { status: res.status }
      );
    }

    const doc = await res.json();
    const payloadStr = doc.fields?.payload?.stringValue;
    const updatedAt = doc.fields?.updatedAt?.stringValue || null;
    const deviceId = doc.fields?.deviceId?.stringValue || null;

    if (!payloadStr) {
      return NextResponse.json({ success: true, data: null, updatedAt });
    }

    const parsed = JSON.parse(payloadStr);

    // Safeguard: if blueprintItems or markers are missing or empty in active state, merge baseline defaults
    if (!Array.isArray(parsed.blueprintItems) || parsed.blueprintItems.length === 0) {
      parsed.blueprintItems = (baselineDefaults as any)?.blueprintItems || [];
    }
    // Normalize visibility
    if (Array.isArray(parsed.blueprintItems)) {
      parsed.blueprintItems = parsed.blueprintItems.map((item: any) => ({
        ...item,
        visible: item.visible !== false,
      }));
    }
    if (!Array.isArray(parsed.markers)) {
      parsed.markers = (baselineDefaults as any)?.markers || [];
    }
    const legacyBinIds = new Set(['BIN-101', 'BIN-102', 'BIN-103', 'BIN-104', 'BIN-105']);
    parsed.markers = parsed.markers.filter((m: any) => m && !legacyBinIds.has(m.id));

    // Merge server-level Vercel environment variables if configured
    const envOdoo = {
      baseUrl:
        process.env.ODOO_BASE_URL ||
        process.env.ODOO_URL ||
        process.env.NEXT_PUBLIC_ODOO_BASE_URL,
      database:
        process.env.ODOO_DB ||
        process.env.ODOO_DATABASE ||
        process.env.NEXT_PUBLIC_ODOO_DB,
      username:
        process.env.ODOO_USERNAME ||
        process.env.ODOO_LOGIN ||
        process.env.NEXT_PUBLIC_ODOO_USERNAME ||
        process.env.NEXT_PUBLIC_ODOO_LOGIN,
      apiKey:
        process.env.ODOO_API_KEY ||
        process.env.NEXT_PUBLIC_ODOO_API_KEY,
    };
    const envUnifi = {
      baseUrl:
        process.env.UNIFI_BASE_URL ||
        process.env.UNIFI_IP ||
        process.env.UNIFI_HOST ||
        process.env.NEXT_PUBLIC_UNIFI_BASE_URL ||
        process.env.NEXT_PUBLIC_UNIFI_IP,
      apiKey:
        process.env.UNIFI_API_KEY ||
        process.env.NEXT_PUBLIC_UNIFI_API_KEY,
      consoleId:
        process.env.UNIFI_CONSOLE_ID ||
        process.env.NEXT_PUBLIC_UNIFI_CONSOLE_ID,
      rtspHost:
        process.env.UNIFI_RTSP_HOST ||
        process.env.NEXT_PUBLIC_UNIFI_RTSP_HOST,
    };

    parsed.odooConfig = {
      ...parsed.odooConfig,
      baseUrl: envOdoo.baseUrl || parsed.odooConfig?.baseUrl || 'https://4hg.odoo.com',
      database: envOdoo.database || parsed.odooConfig?.database || '4hg-live',
      username: envOdoo.username || parsed.odooConfig?.username || 'admin@4hg.com',
      apiKey: envOdoo.apiKey || parsed.odooConfig?.apiKey || '',
      stockLocationPrefix:
        parsed.odooConfig?.stockLocationPrefix || 'WH/Stock, WH/Packing Zone',
    };

    parsed.unifiConfig = {
      ...parsed.unifiConfig,
      baseUrl: envUnifi.baseUrl || parsed.unifiConfig?.baseUrl || 'https://192.168.1.1',
      apiKey: envUnifi.apiKey || parsed.unifiConfig?.apiKey || '',
      consoleId: envUnifi.consoleId || parsed.unifiConfig?.consoleId || '',
      rtspHost: envUnifi.rtspHost || parsed.unifiConfig?.rtspHost || '',
      allowSelfSigned: parsed.unifiConfig?.allowSelfSigned ?? true,
    };

    return NextResponse.json({
      success: true,
      data: parsed,
      envConfigured: {
        odoo: Boolean(envOdoo.apiKey),
        unifi: Boolean(envUnifi.apiKey),
      },
      updatedAt,
      deviceId,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { state, deviceId } = body || {};

    if (!state || typeof state !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid state payload provided.' },
        { status: 400 }
      );
    }

    const cleanState = sanitizeTwinStateForPersistence(state);

    // Safeguard: never wipe existing blueprint items if a client pushed an empty blueprintItems array
    if (!Array.isArray(cleanState.blueprintItems) || cleanState.blueprintItems.length === 0) {
      cleanState.blueprintItems = (baselineDefaults as any)?.blueprintItems || [];
    }
    cleanState.blueprintItems = cleanState.blueprintItems.map((item: any) => ({
      ...item,
      visible: item.visible !== false,
    }));

    // Safeguard: never allow an empty client apiKey to delete an existing saved API key in Firestore or Vercel Env
    const envOdooKey =
      process.env.ODOO_API_KEY || process.env.NEXT_PUBLIC_ODOO_API_KEY || '';
    const envUnifiKey =
      process.env.UNIFI_API_KEY || process.env.NEXT_PUBLIC_UNIFI_API_KEY || '';

    if (!cleanState.odooConfig?.apiKey || !cleanState.unifiConfig?.apiKey) {
      let existingOdooKey = '';
      let existingUnifiKey = '';
      try {
        const existingRes = await fetch(FIRESTORE_URL, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
        });
        if (existingRes.ok) {
          const existingDoc = await existingRes.json();
          const existingPayloadStr = existingDoc.fields?.payload?.stringValue;
          if (existingPayloadStr) {
            const existingParsed = JSON.parse(existingPayloadStr);
            existingOdooKey = existingParsed?.odooConfig?.apiKey || '';
            existingUnifiKey = existingParsed?.unifiConfig?.apiKey || '';
          }
        }
      } catch {}

      cleanState.odooConfig = {
        ...cleanState.odooConfig,
        apiKey: cleanState.odooConfig?.apiKey || envOdooKey || existingOdooKey || '',
      };
      cleanState.unifiConfig = {
        ...cleanState.unifiConfig,
        apiKey: cleanState.unifiConfig?.apiKey || envUnifiKey || existingUnifiKey || '',
      };
    }

    const now = new Date().toISOString();
    const payloadStr = JSON.stringify(cleanState);

    const firestoreBody = {
      fields: {
        payload: { stringValue: payloadStr },
        updatedAt: { stringValue: now },
        deviceId: { stringValue: String(deviceId || 'unknown') },
      },
    };

    const res = await fetch(FIRESTORE_URL, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(firestoreBody),
      cache: 'no-store',
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { success: false, error: `Firestore save error: ${errText}` },
        { status: res.status }
      );
    }

    return NextResponse.json({
      success: true,
      updatedAt: now,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
