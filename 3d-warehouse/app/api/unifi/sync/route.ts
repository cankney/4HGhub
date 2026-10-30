import { NextRequest, NextResponse } from 'next/server';
import https from 'node:https';
import http from 'node:http';
import { URL } from 'node:url';

export interface UnifiCameraChannel {
  id: number;
  name: string;
  enabled: boolean;
  isRtspEnabled: boolean;
  rtspAlias?: string;
  width?: number;
  height?: number;
  fps?: number;
  rtspUrl?: string;
}

export interface DiscoveredUnifiCamera {
  id: string;
  name: string;
  model: string;
  ip: string;
  mac?: string;
  state: 'online' | 'warning' | 'offline';
  streamUrl?: string;
  rtspHigh?: string;
  rtspMedium?: string;
  rtspLow?: string;
  channels: UnifiCameraChannel[];
}

interface UnifiSyncPayload {
  baseUrl: string;
  apiKey: string;
  username?: string;
  password?: string;
  allowSelfSigned?: boolean;
  testOnly?: boolean;
}

function cleanUnifiUrl(rawUrl: string): string {
  let str = (rawUrl || '').trim();
  if (!str) return '';
  if (!/^https?:\/\//i.test(str)) {
    str = `https://${str}`;
  }
  return str.replace(/\/+$/, '');
}

/**
 * Execute HTTP/HTTPS request to UniFi Console or api.ui.com with self-signed SSL tolerance
 */
function makeUnifiRequest(
  urlStr: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    allowSelfSigned?: boolean;
    timeoutMs?: number;
  }
): Promise<{ statusCode: number; headers: http.IncomingHttpHeaders; body: string }> {
  return new Promise((resolve, reject) => {
    try {
      const parsed = new URL(urlStr);
      const isHttps = parsed.protocol === 'https:';
      const lib = isHttps ? https : http;

      const agent = isHttps
        ? new https.Agent({
            rejectUnauthorized: !options.allowSelfSigned,
          })
        : undefined;

      const req = lib.request(
        parsed,
        {
          method: options.method || 'GET',
          headers: options.headers || {},
          agent,
          timeout: options.timeoutMs || 15000,
        },
        (res) => {
          let chunks: Buffer[] = [];
          res.on('data', (c) => chunks.push(Buffer.from(c)));
          res.on('end', () => {
            const body = Buffer.concat(chunks).toString('utf-8');
            resolve({
              statusCode: res.statusCode || 200,
              headers: res.headers,
              body,
            });
          });
        }
      );

      req.on('timeout', () => {
        req.destroy(
          new Error(`Connection timed out (${options.timeoutMs || 15000}ms)`)
        );
      });

      req.on('error', (err) => {
        reject(err);
      });

      if (options.body) {
        req.write(options.body);
      }
      req.end();
    } catch (err) {
      reject(err);
    }
  });
}

export async function POST(req: NextRequest) {
  try {
    const payload: UnifiSyncPayload = await req.json();
    const {
      baseUrl,
      apiKey,
      username,
      password,
      allowSelfSigned = true,
      testOnly = false,
    } = payload;

    const cleanOrigin = cleanUnifiUrl(
      baseUrl || process.env.UNIFI_IP || process.env.NEXT_PUBLIC_UNIFI_IP || ''
    );
    const cleanKey = (
      apiKey || process.env.UNIFI_API_KEY || process.env.NEXT_PUBLIC_UNIFI_API_KEY || ''
    ).trim();
    const cleanUser = (username || '').trim();
    const cleanPass = (password || '').trim();

    if (!cleanOrigin && !cleanKey) {
      return NextResponse.json({
        success: false,
        error: 'Please enter a valid UniFi Console URL (e.g. https://192.168.2.9 or https://api.ui.com).',
      });
    }

    if (!cleanKey && (!cleanUser || !cleanPass)) {
      return NextResponse.json({
        success: false,
        error: 'Please enter either a UniFi API Key or local administrator credentials.',
      });
    }

    const hostOnly = cleanOrigin.replace(/^https?:\/\//i, '').split(':')[0];

    // Standard headers per Ubiquiti developer docs (developer.ui.com)
    let authHeaders: Record<string, string> = {
      Accept: 'application/json',
      'User-Agent': 'WareTrack-3D/1.0',
    };

    if (cleanKey) {
      authHeaders['X-API-KEY'] = cleanKey;
      authHeaders['X-API-Key'] = cleanKey;
    }

    let rawCameras: any[] = [];
    let nvrName = 'UniFi Console';
    let authSucceeded = false;
    let authSource: string | null = null;
    let isMfaRequired = false;

    // =========================================================================
    // Tier 1: Local Official Protect Integration API (developer.ui.com/protect)
    // =========================================================================
    if (cleanKey && cleanOrigin && !cleanOrigin.includes('api.ui.com')) {
      try {
        const protectIntegrationRes = await makeUnifiRequest(
          `${cleanOrigin}/proxy/protect/integration/v1/cameras`,
          {
            method: 'GET',
            headers: authHeaders,
            allowSelfSigned,
            timeoutMs: 8000,
          }
        );

        if (protectIntegrationRes.statusCode === 200) {
          const parsed = JSON.parse(protectIntegrationRes.body);
          if (Array.isArray(parsed)) {
            rawCameras = parsed;
            authSucceeded = true;
            authSource = 'Local Protect Integration API';

            try {
              const metaRes = await makeUnifiRequest(
                `${cleanOrigin}/proxy/protect/integration/v1/meta/info`,
                { method: 'GET', headers: authHeaders, allowSelfSigned, timeoutMs: 5000 }
              );
              if (metaRes.statusCode === 200) {
                const meta = JSON.parse(metaRes.body);
                nvrName = meta.name || meta.nvr?.name || 'UniFi Protect Console';
              }
            } catch {}
          }
        }
      } catch (err: any) {
        console.warn('[UniFi Sync] Local Protect integration check failed:', err.message);
      }
    }

    // =========================================================================
    // Tier 2: Local Official Network Integration API (developer.ui.com/network)
    // =========================================================================
    if (!authSucceeded && cleanKey && cleanOrigin && !cleanOrigin.includes('api.ui.com')) {
      try {
        const netInfoRes = await makeUnifiRequest(
          `${cleanOrigin}/proxy/network/integration/v1/info`,
          {
            method: 'GET',
            headers: authHeaders,
            allowSelfSigned,
            timeoutMs: 8000,
          }
        );

        if (netInfoRes.statusCode === 200) {
          authSucceeded = true;
          authSource = 'Local Network Integration API';
          nvrName = 'UniFi Gateway Console';

          const sitesRes = await makeUnifiRequest(
            `${cleanOrigin}/proxy/network/integration/v1/sites`,
            {
              method: 'GET',
              headers: authHeaders,
              allowSelfSigned,
              timeoutMs: 8000,
            }
          );

          if (sitesRes.statusCode === 200) {
            const sitesData = JSON.parse(sitesRes.body);
            const sites = Array.isArray(sitesData)
              ? sitesData
              : Array.isArray(sitesData.data)
              ? sitesData.data
              : [{ id: 'default' }];

            for (const site of sites) {
              const siteId = site.id || site.name || 'default';
              const devRes = await makeUnifiRequest(
                `${cleanOrigin}/proxy/network/integration/v1/sites/${siteId}/devices`,
                {
                  method: 'GET',
                  headers: authHeaders,
                  allowSelfSigned,
                  timeoutMs: 10000,
                }
              );

              if (devRes.statusCode === 200) {
                const devData = JSON.parse(devRes.body);
                const devices = Array.isArray(devData)
                  ? devData
                  : Array.isArray(devData.data)
                  ? devData.data
                  : [];

                const cameraDevices = devices.filter((d: any) => {
                  const modelKey = (d.modelKey || '').toLowerCase();
                  const type = (d.type || '').toLowerCase();
                  const model = (d.model || '').toUpperCase();
                  const name = (d.name || '').toLowerCase();
                  return (
                    modelKey === 'camera' ||
                    type.includes('camera') ||
                    model.startsWith('UVC') ||
                    name.includes('camera') ||
                    name.includes('cam')
                  );
                });

                if (cameraDevices.length > 0) {
                  rawCameras = cameraDevices;
                  break;
                }
              }
            }
          }
        }
      } catch (err: any) {
        console.warn('[UniFi Sync] Network integration check failed:', err.message);
      }
    }

    // =========================================================================
    // Tier 3: Ubiquiti Official Site Manager Cloud API (api.ui.com)
    // Keys generated at unifi.ui.com authenticate at api.ui.com
    // =========================================================================
    if (!authSucceeded && cleanKey) {
      try {
        const cloudHostsRes = await makeUnifiRequest('https://api.ui.com/v1/hosts', {
          method: 'GET',
          headers: authHeaders,
          timeoutMs: 10000,
        });

        if (cloudHostsRes.statusCode === 200) {
          const hostsData = JSON.parse(cloudHostsRes.body);
          const hosts = Array.isArray(hostsData)
            ? hostsData
            : Array.isArray(hostsData.data)
            ? hostsData.data
            : [];

          if (hosts.length > 0) {
            authSucceeded = true;
            authSource = 'UniFi Site Manager Cloud API (unifi.ui.com)';

            // Match host by local IP if available, or take first online host
            const targetHost =
              hosts.find(
                (h: any) =>
                  h.ip === hostOnly ||
                  h.reportedState?.ip === hostOnly ||
                  h.isOnline
              ) || hosts[0];

            nvrName = targetHost.name || targetHost.reportedState?.name || 'UniFi Cloud Gateway';
            const consoleId = targetHost.id;

            // Query Protect cameras via official Cloud Connector
            try {
              const cloudCamRes = await makeUnifiRequest(
                `https://api.ui.com/v1/connector/consoles/${consoleId}/proxy/protect/integration/v1/cameras`,
                { method: 'GET', headers: authHeaders, timeoutMs: 12000 }
              );
              if (cloudCamRes.statusCode === 200) {
                const cData = JSON.parse(cloudCamRes.body);
                if (Array.isArray(cData)) {
                  rawCameras = cData;
                }
              }
            } catch (cErr: any) {
              console.warn('[UniFi Sync] Cloud connector Protect cameras error:', cErr.message);
            }

            // Fallback: list adopted devices from Site Manager
            if (rawCameras.length === 0) {
              try {
                const cloudDevRes = await makeUnifiRequest(
                  'https://api.ui.com/v1/devices',
                  { method: 'GET', headers: authHeaders, timeoutMs: 12000 }
                );
                if (cloudDevRes.statusCode === 200) {
                  const devData = JSON.parse(cloudDevRes.body);
                  const devs = Array.isArray(devData)
                    ? devData
                    : Array.isArray(devData.data)
                    ? devData.data
                    : [];
                  rawCameras = devs.filter((d: any) => {
                    const modelKey = (d.modelKey || '').toLowerCase();
                    const type = (d.type || '').toLowerCase();
                    const model = (d.model || '').toUpperCase();
                    const name = (d.name || '').toLowerCase();
                    return (
                      modelKey === 'camera' ||
                      type.includes('camera') ||
                      model.startsWith('UVC') ||
                      name.includes('camera') ||
                      name.includes('cam')
                    );
                  });
                }
              } catch (dErr: any) {
                console.warn('[UniFi Sync] Site Manager devices fallback error:', dErr.message);
              }
            }
          }
        }
      } catch (cloudErr: any) {
        console.warn('[UniFi Sync] Cloud API check error:', cloudErr.message);
      }
    }

    // =========================================================================
    // Tier 4: Local Session Login (POST /api/auth/login)
    // Used when username and password are provided
    // =========================================================================
    if (!authSucceeded && cleanUser && cleanPass && cleanOrigin && !cleanOrigin.includes('api.ui.com')) {
      try {
        const loginRes = await makeUnifiRequest(`${cleanOrigin}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            username: cleanUser,
            password: cleanPass,
            token: '',
          }),
          allowSelfSigned,
          timeoutMs: 10000,
        });

        // Check if UniFi rejected with 2FA requirement
        if (
          loginRes.body.includes('mfa') ||
          loginRes.body.includes('2fa') ||
          loginRes.body.includes('verification') ||
          loginRes.statusCode === 403
        ) {
          isMfaRequired = true;
        }

        if (loginRes.statusCode === 200) {
          const rawCookies = loginRes.headers['set-cookie'];
          if (rawCookies && rawCookies.length > 0) {
            const cookieStr = rawCookies.map((c) => c.split(';')[0]).join('; ');
            const sessionHeaders: Record<string, string> = {
              Accept: 'application/json',
              'User-Agent': 'WareTrack-3D/1.0',
              Cookie: cookieStr,
            };

            const bRes = await makeUnifiRequest(
              `${cleanOrigin}/proxy/protect/api/bootstrap`,
              {
                method: 'GET',
                headers: sessionHeaders,
                allowSelfSigned,
                timeoutMs: 12000,
              }
            );

            if (bRes.statusCode === 200) {
              const bData = JSON.parse(bRes.body);
              if (Array.isArray(bData.cameras)) {
                rawCameras = bData.cameras;
                authSucceeded = true;
                authSource = 'Local Session Login';
                if (bData.nvr?.name) nvrName = bData.nvr.name;
              }
            } else {
              const cRes = await makeUnifiRequest(
                `${cleanOrigin}/proxy/protect/api/cameras`,
                {
                  method: 'GET',
                  headers: sessionHeaders,
                  allowSelfSigned,
                  timeoutMs: 12000,
                }
              );
              if (cRes.statusCode === 200) {
                const cData = JSON.parse(cRes.body);
                if (Array.isArray(cData)) {
                  rawCameras = cData;
                  authSucceeded = true;
                  authSource = 'Local Session Login';
                }
              }
            }
          }
        }
      } catch (loginErr: any) {
        console.warn('[UniFi Sync] Local session login error:', loginErr.message);
      }
    }

    // Diagnostics if authentication failed
    if (!authSucceeded) {
      if (isMfaRequired) {
        return NextResponse.json({
          success: false,
          error:
            'Login failed because account "' +
            cleanUser +
            '" has 2-Factor Authentication (2FA) enabled. For password login, use a "Local Access Only" account without 2FA, or generate a Local API Key on your console.',
        });
      }

      return NextResponse.json({
        success: false,
        error:
          'Could not authenticate with UniFi. A key from unifi.ui.com is a Cloud Key, while https://192.168.2.9 requires a Local API Key (generated inside https://192.168.2.9 > UniFi OS Settings > Admins & Users > API Keys). Alternatively, change the host to https://api.ui.com.',
      });
    }

    // Format discovered cameras
    const discoveredCameras: DiscoveredUnifiCamera[] = rawCameras.map((cam: any) => {
      let channels: UnifiCameraChannel[] = [];

      if (Array.isArray(cam.channels)) {
        channels = cam.channels.map((ch: any) => {
          const rtspUrl = ch.rtspAlias
            ? `rtsps://${hostOnly}:7441/${ch.rtspAlias}?enableSsl=false`
            : undefined;
          return {
            id: ch.id ?? 0,
            name: ch.name || (ch.id === 0 ? 'High' : ch.id === 1 ? 'Medium' : 'Low'),
            enabled: Boolean(ch.enabled),
            isRtspEnabled: Boolean(ch.isRtspEnabled || ch.rtspAlias),
            rtspAlias: ch.rtspAlias,
            width: ch.width,
            height: ch.height,
            fps: ch.fps,
            rtspUrl,
          };
        });
      }

      const highCh = channels.find((c) => c.id === 0 && c.rtspUrl);
      const medCh = channels.find((c) => c.id === 1 && c.rtspUrl);
      const lowCh = channels.find((c) => c.id === 2 && c.rtspUrl);
      let primaryStream =
        highCh?.rtspUrl ||
        medCh?.rtspUrl ||
        lowCh?.rtspUrl ||
        (cam.rtspsStream ? cam.rtspsStream : '');

      if (!primaryStream && cam.id) {
        primaryStream = `rtsps://${hostOnly}:7441/${cam.id}?enableSsl=false`;
      }

      const isConnected =
        cam.state === 'CONNECTED' ||
        cam.state === 'connected' ||
        cam.connectionState === 'CONNECTED' ||
        cam.status === 'connected' ||
        cam.status === 'online';

      return {
        id: String(cam.id || cam._id || ''),
        name: cam.name || cam.marketName || `Camera ${cam.id}`,
        model: cam.type || cam.marketName || cam.model || 'UniFi Camera',
        ip: cam.host || cam.ip || hostOnly,
        mac: cam.mac || '',
        state: isConnected ? 'online' : 'offline',
        streamUrl: primaryStream,
        rtspHigh: highCh?.rtspUrl || primaryStream,
        rtspMedium: medCh?.rtspUrl,
        rtspLow: lowCh?.rtspUrl,
        channels,
      };
    });

    if (testOnly) {
      return NextResponse.json({
        success: true,
        message: `Connected successfully to ${nvrName} via ${authSource}! Found ${discoveredCameras.length} camera(s).`,
        cameraCount: discoveredCameras.length,
      });
    }

    return NextResponse.json({
      success: true,
      nvrName,
      cameras: discoveredCameras,
      message: `Discovered and mapped ${discoveredCameras.length} camera(s) from ${nvrName} (${authSource}).`,
    });
  } catch (err: any) {
    console.error('[UniFi Sync] Exception:', err);
    return NextResponse.json({
      success: false,
      error: err.message || 'Internal error connecting to UniFi.',
    });
  }
}
