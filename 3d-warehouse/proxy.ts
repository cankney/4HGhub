import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const FIREBASE_API_KEY = 'AIzaSyDUo8yzIcUAxNL8rMuSAaBhZBVhyYvkYm8';
const AUTH_COOKIE_NAME = 'hgs_id_token';

// Cache verified tokens in memory for 5 minutes to keep telemetry & camera snapshots instant
const verifiedTokenCache = new Map<string, number>();

async function verifyFirebaseIdToken(idToken: string): Promise<boolean> {
  if (!idToken || idToken.length < 40) return false;

  const now = Date.now();
  const cachedExpiry = verifiedTokenCache.get(idToken);
  if (cachedExpiry && cachedExpiry > now) {
    return true;
  }

  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      }
    );

    if (!res.ok) return false;
    const data = await res.json();
    if (Array.isArray(data.users) && data.users.length > 0 && data.users[0].localId) {
      verifiedTokenCache.set(idToken, now + 5 * 60 * 1000);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const cookieToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const authHeader = request.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : undefined;

  const token = cookieToken ? decodeURIComponent(cookieToken) : bearerToken;

  if (!token) {
    return NextResponse.json(
      {
        success: false,
        error: 'Unauthorized: Active 4HG Hub login session required.',
      },
      { status: 401 }
    );
  }

  const isValid = await verifyFirebaseIdToken(token);
  if (!isValid) {
    return NextResponse.json(
      {
        success: false,
        error: 'Unauthorized: Invalid or expired 4HG Hub session.',
      },
      { status: 401 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
