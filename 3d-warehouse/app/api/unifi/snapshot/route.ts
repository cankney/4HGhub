import { NextRequest, NextResponse } from 'next/server';
import https from 'node:https';
import http from 'node:http';
import { URL } from 'node:url';

// In-memory cache of consoleId by apiKey to avoid re-querying /v1/hosts on every snapshot
let cachedConsoleId: string | null = '6C63F87AF3F700000000091F2C0C00000000099C30EF00000000682F238C:58244400';

interface CachedSnapshot {
  buffer: Buffer;
  contentType: string;
  timestamp: number;
}

// In-memory image cache (1.5s fresh TTL) to avoid hammering Cloud Connector
const snapshotCache = new Map<string, CachedSnapshot>();

// Request collapsing: avoid concurrent duplicate upstream fetches for the same camera
const inFlightRequests = new Map<
  string,
  Promise<{ statusCode: number; contentType: string; buffer: Buffer } | null>
>();

function fetchSnapshotBuffer(
  urlStr: string,
  apiKey: string,
  allowSelfSigned: boolean
): Promise<{ statusCode: number; contentType: string; buffer: Buffer } | null> {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(urlStr);
      const isHttps = parsed.protocol === 'https:';
      const lib = isHttps ? https : http;

      const agent = isHttps
        ? new https.Agent({
            rejectUnauthorized: !allowSelfSigned,
          })
        : undefined;

      const request = lib.request(
        parsed,
        {
          method: 'GET',
          headers: {
            'X-API-KEY': apiKey,
            'X-API-Key': apiKey,
            Accept: 'image/jpeg, image/*',
            'User-Agent': 'WareTrack-3D/1.0',
          },
          agent,
          timeout: 10000,
        },
        (res) => {
          if (res.statusCode && res.statusCode >= 400) {
            resolve({
              statusCode: res.statusCode,
              contentType: 'text/plain',
              buffer: Buffer.from([]),
            });
            return;
          }

          const chunks: Buffer[] = [];
          res.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
          res.on('end', () => {
            const imageBuffer = Buffer.concat(chunks);
            const contentType =
              (res.headers['content-type'] as string) || 'image/jpeg';
            resolve({
              statusCode: res.statusCode || 200,
              contentType,
              buffer: imageBuffer,
            });
          });
        }
      );

      request.on('timeout', () => {
        request.destroy();
        resolve(null);
      });

      request.on('error', () => {
        resolve(null);
      });

      request.end();
    } catch {
      resolve(null);
    }
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cameraId = searchParams.get('id');
  const host = searchParams.get('host');
  const apiKey = searchParams.get('apiKey');
  const queryConsoleId = searchParams.get('consoleId');
  const allowSelfSigned = searchParams.get('allowSelfSigned') !== 'false';

  if (!cameraId || !apiKey) {
    return new NextResponse('Missing required parameters: id, apiKey', {
      status: 400,
    });
  }

  const cleanHost = (host || '').trim().replace(/\/+$/, '');

  // 1. Check in-memory fresh cache (1.5s TTL)
  const now = Date.now();
  const cached = snapshotCache.get(cameraId);
  if (cached && now - cached.timestamp < 1500) {
    return new NextResponse(new Uint8Array(cached.buffer), {
      status: 200,
      headers: {
        'Content-Type': cached.contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Length': String(cached.buffer.length),
        'X-Snapshot-Cache': 'HIT',
      },
    });
  }

  // 2. Request deduplication: join existing in-flight request if one is already running
  let fetchPromise = inFlightRequests.get(cameraId);

  if (!fetchPromise) {
    fetchPromise = (async () => {
      // 1. Try Cloud Connector (api.ui.com) if we have consoleId or if host is cloud
      let activeConsoleId = queryConsoleId || cachedConsoleId;

      if (!activeConsoleId) {
        try {
          const hostsRes = await fetchSnapshotBuffer(
            'https://api.ui.com/v1/hosts',
            apiKey,
            false
          );
          if (hostsRes && hostsRes.statusCode === 200 && hostsRes.buffer.length > 0) {
            const parsed = JSON.parse(hostsRes.buffer.toString('utf-8'));
            const hostsList = Array.isArray(parsed)
              ? parsed
              : Array.isArray(parsed.data)
              ? parsed.data
              : [];
            if (hostsList.length > 0) {
              activeConsoleId = hostsList[0].id;
              cachedConsoleId = activeConsoleId;
            }
          }
        } catch {}
      }

      // If we have a consoleId, query snapshot via Cloud Connector
      if (activeConsoleId) {
        const cloudSnapshotUrl = `https://api.ui.com/v1/connector/consoles/${activeConsoleId}/proxy/protect/integration/v1/cameras/${cameraId}/snapshot`;
        const cloudResult = await fetchSnapshotBuffer(cloudSnapshotUrl, apiKey, false);
        if (cloudResult && cloudResult.statusCode === 200 && cloudResult.buffer.length > 0) {
          return cloudResult;
        }
      }

      // 2. Try direct local origin if provided
      if (cleanHost && !cleanHost.includes('api.ui.com')) {
        const localIntegrationUrl = `${cleanHost}/proxy/protect/integration/v1/cameras/${cameraId}/snapshot`;
        const localResult = await fetchSnapshotBuffer(localIntegrationUrl, apiKey, allowSelfSigned);
        if (localResult && localResult.statusCode === 200 && localResult.buffer.length > 0) {
          return localResult;
        }

        // Fallback legacy local
        const legacyUrl = `${cleanHost}/proxy/protect/api/cameras/${cameraId}/snapshot`;
        const legacyResult = await fetchSnapshotBuffer(legacyUrl, apiKey, allowSelfSigned);
        if (legacyResult && legacyResult.statusCode === 200 && legacyResult.buffer.length > 0) {
          return legacyResult;
        }
      }

      return null;
    })();

    inFlightRequests.set(cameraId, fetchPromise);
  }

  let result: { statusCode: number; contentType: string; buffer: Buffer } | null = null;
  try {
    result = await fetchPromise;
  } finally {
    inFlightRequests.delete(cameraId);
  }

  if (result && result.statusCode === 200 && result.buffer.length > 0) {
    snapshotCache.set(cameraId, {
      buffer: result.buffer,
      contentType: result.contentType,
      timestamp: Date.now(),
    });

    return new NextResponse(new Uint8Array(result.buffer), {
      status: 200,
      headers: {
        'Content-Type': result.contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Length': String(result.buffer.length),
        'X-Snapshot-Cache': 'MISS',
      },
    });
  }

  // 3. Resilient fallback: If live fetch failed/timed out, serve the most recent cached frame
  // rather than failing with 502 to keep the detector alive
  if (cached && cached.buffer.length > 0) {
    return new NextResponse(new Uint8Array(cached.buffer), {
      status: 200,
      headers: {
        'Content-Type': cached.contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Length': String(cached.buffer.length),
        'X-Snapshot-Cache': 'STALE',
      },
    });
  }

  return new NextResponse('Snapshot unavailable', { status: 502 });
}
