import { NextRequest, NextResponse } from 'next/server';

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

    // Merge server-level Vercel environment variables if configured
    const envOdoo = {
      baseUrl: process.env.ODOO_BASE_URL || process.env.NEXT_PUBLIC_ODOO_BASE_URL,
      database: process.env.ODOO_DB || process.env.NEXT_PUBLIC_ODOO_DB,
      username: process.env.ODOO_LOGIN || process.env.NEXT_PUBLIC_ODOO_LOGIN,
      apiKey: process.env.ODOO_API_KEY || process.env.NEXT_PUBLIC_ODOO_API_KEY,
    };
    const envUnifi = {
      baseUrl: process.env.UNIFI_IP || process.env.NEXT_PUBLIC_UNIFI_IP,
      apiKey: process.env.UNIFI_API_KEY || process.env.NEXT_PUBLIC_UNIFI_API_KEY,
      consoleId: process.env.UNIFI_CONSOLE_ID || process.env.NEXT_PUBLIC_UNIFI_CONSOLE_ID,
      rtspHost: process.env.UNIFI_RTSP_HOST || process.env.NEXT_PUBLIC_UNIFI_RTSP_HOST,
    };

    if (envOdoo.apiKey || envOdoo.baseUrl) {
      parsed.odooConfig = {
        ...parsed.odooConfig,
        baseUrl: parsed.odooConfig?.baseUrl || envOdoo.baseUrl || '',
        database: parsed.odooConfig?.database || envOdoo.database || '',
        username: parsed.odooConfig?.username || envOdoo.username || '',
        apiKey: parsed.odooConfig?.apiKey || envOdoo.apiKey || '',
      };
    }

    if (envUnifi.apiKey || envUnifi.baseUrl) {
      parsed.unifiConfig = {
        ...parsed.unifiConfig,
        baseUrl: parsed.unifiConfig?.baseUrl || envUnifi.baseUrl || '',
        apiKey: parsed.unifiConfig?.apiKey || envUnifi.apiKey || '',
        consoleId: parsed.unifiConfig?.consoleId || envUnifi.consoleId || '',
        rtspHost: parsed.unifiConfig?.rtspHost || envUnifi.rtspHost || '',
      };
    }

    return NextResponse.json({
      success: true,
      data: parsed,
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

    const now = new Date().toISOString();
    const payloadStr = JSON.stringify(state);

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
