import { NextRequest, NextResponse } from 'next/server';
import https from 'node:https';
import http from 'node:http';
import { URL } from 'node:url';
import { NetworkClientStation, SwitchPortInfo, ApRadioInfo, NetworkDeviceStats } from '@/lib/markers';

export interface DiscoveredNetworkDevice {
  id: string;
  name: string;
  model: string;
  shortname?: string;
  type: string;
  ip: string;
  mac: string;
  status: 'online' | 'offline' | 'warning';
  firmwareVersion?: string;
  uptime?: string;
  networkStats?: Partial<NetworkDeviceStats>;
  lastSeen?: string;
}

export interface UnifiSiteSummary {
  consoleName: string;
  consoleId: string;
  isOnline: boolean;
  ip: string;
  wanIp?: string;
  wanStatus?: 'connected' | 'disconnected';
  wanLatencyMs?: number;
  ispName?: string;
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  totalClients: number;
  wirelessClients: number;
  wiredClients: number;
  controllers: { name: string; status: 'running' | 'stopped'; version?: string }[];
  lastUpdated: string;
}

interface CacheEntry {
  data: {
    summary: UnifiSiteSummary;
    devices: DiscoveredNetworkDevice[];
    clients: NetworkClientStation[];
  };
  timestamp: number;
}

let inMemoryCache: CacheEntry | null = null;
const CACHE_TTL_MS = 10000; // 10 seconds

function cleanUnifiUrl(rawUrl: string): string {
  let str = (rawUrl || '').trim();
  if (!str) return '';
  if (!/^https?:\/\//i.test(str)) {
    str = `https://${str}`;
  }
  return str.replace(/\/+$/, '');
}

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
          timeout: options.timeoutMs || 10000,
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
        req.destroy(new Error(`Connection timed out (${options.timeoutMs || 10000}ms)`));
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

function formatUptime(seconds?: number): string | undefined {
  if (!seconds || seconds <= 0) return undefined;
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function classifyDeviceType(model: string = '', name: string = '', shortname: string = ''): string {
  const combined = `${model} ${name} ${shortname}`.toLowerCase();
  if (combined.includes('u7') || combined.includes('u6') || combined.includes('ap') || combined.includes('access point') || combined.includes('wifi')) {
    return 'network_ap';
  }
  if (combined.includes('switch') || combined.includes('usw') || combined.includes('poe') || combined.includes('flex')) {
    return 'network_switch';
  }
  if (combined.includes('gateway') || combined.includes('uxg') || combined.includes('udm') || combined.includes('router')) {
    return 'network_gateway';
  }
  if (combined.includes('cloudkey') || combined.includes('uck') || combined.includes('console')) {
    return 'network_cloudkey';
  }
  if (combined.includes('ups') || combined.includes('smartpower') || combined.includes('usp')) {
    return 'network_ups';
  }
  if (combined.includes('superlink') || combined.includes('bridge') || combined.includes('sensor')) {
    return 'network_superlink';
  }
  if (combined.includes('camera') || combined.includes('uvc') || combined.includes('bullet') || combined.includes('dome') || combined.includes('g5') || combined.includes('g6')) {
    return 'camera';
  }
  return 'network_switch';
}

async function fetchRealUnifiData(cleanKey: string, cleanOrigin: string, allowSelfSigned: boolean) {
  const now = Date.now();
  if (inMemoryCache && now - inMemoryCache.timestamp < CACHE_TTL_MS) {
    return inMemoryCache.data;
  }

  const authHeaders: Record<string, string> = {
    Accept: 'application/json',
    'User-Agent': 'WareTrack-3D/1.0',
    'X-API-KEY': cleanKey,
    'X-API-Key': cleanKey,
  };

  let summary: UnifiSiteSummary = {
    consoleName: '4HG CloudKey+',
    consoleId: '',
    isOnline: true,
    ip: '192.168.2.9',
    wanIp: undefined,
    wanStatus: 'connected',
    wanLatencyMs: undefined,
    ispName: undefined,
    totalDevices: 0,
    onlineDevices: 0,
    offlineDevices: 0,
    totalClients: 0,
    wirelessClients: 0,
    wiredClients: 0,
    controllers: [],
    lastUpdated: new Date().toISOString(),
  };

  let devices: DiscoveredNetworkDevice[] = [];
  let clients: NetworkClientStation[] = [];
  let hostConsoleId = '';

  // 1. Query Official Site Manager Hosts API (api.ui.com/v1/hosts)
  try {
    const hostsRes = await makeUnifiRequest('https://api.ui.com/v1/hosts', {
      method: 'GET',
      headers: authHeaders,
      timeoutMs: 10000,
    });

    if (hostsRes.statusCode === 200) {
      const parsed = JSON.parse(hostsRes.body);
      const hostsList: any[] = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed.data)
        ? parsed.data
        : [];

      if (hostsList.length > 0) {
        const host = hostsList[0];
        hostConsoleId = host.id || '';
        const rep = host.reportedState || {};

        summary.consoleName = host.name || rep.name || '4HG CloudKey+';
        summary.consoleId = hostConsoleId;
        summary.isOnline = Boolean(host.isOnline ?? rep.isOnline ?? true);
        summary.ip = rep.ip || host.ip || '192.168.2.9';
        summary.wanIp = rep.wanIp || host.wanIp;
        summary.ispName = rep.isp || host.isp || rep.organization || host.organization;

        // Controllers running (Network, Protect, Access, Talk, etc.)
        const apps = rep.apps || host.apps || [];
        if (Array.isArray(apps)) {
          summary.controllers = apps.map((app: any) => ({
            name: app.name === 'network' ? 'UniFi Network' : app.name === 'protect' ? 'UniFi Protect' : String(app.name),
            status: app.state === 'running' || app.status === 'running' ? 'running' : 'stopped',
            version: app.version || app.installedVersion,
          }));
        }
      }
    }
  } catch (err: any) {
    console.warn('[UniFi Network] Site Manager hosts query error:', err.message);
  }

  // 2. Query Official Site Manager Devices API (api.ui.com/v1/devices)
  try {
    const devRes = await makeUnifiRequest('https://api.ui.com/v1/devices', {
      method: 'GET',
      headers: authHeaders,
      timeoutMs: 12000,
    });

    if (devRes.statusCode === 200) {
      const parsed = JSON.parse(devRes.body);
      const rawDevs: any[] = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed.data)
        ? parsed.data
        : [];

      if (rawDevs.length > 0) {
        devices = rawDevs.map((d: any) => {
          const devName = d.name || d.modelKey || d.shortname || d.model || 'UniFi Device';
          const devModel = d.model || d.modelKey || d.shortname || 'UniFi';
          const devType = classifyDeviceType(devModel, devName, d.shortname || '');
          const isOnline = d.state === 'online' || d.state === 'CONNECTED' || d.isOnline === true;

          const stats: Partial<NetworkDeviceStats> = {
            mac: d.mac,
            gatewayIp: d.gatewayIp || summary.ip,
            firmwareVersion: d.firmwareVersion || d.version,
            uptime: formatUptime(d.uptime),
            cpuUsagePct: typeof d.cpuUsage === 'number' ? Math.round(d.cpuUsage) : undefined,
            memoryUsagePct: typeof d.memoryUsage === 'number' ? Math.round(d.memoryUsage) : undefined,
            temperatureC: d.temperature,
            throughputRxMbps: typeof d.rxRateMbps === 'number' ? d.rxRateMbps : 0,
            throughputTxMbps: typeof d.txRateMbps === 'number' ? d.txRateMbps : 0,
          };

          return {
            id: String(d.id || d.mac || ''),
            name: devName,
            model: devModel,
            shortname: d.shortname,
            type: devType,
            ip: d.ip || summary.ip,
            mac: d.mac || '',
            status: isOnline ? 'online' : 'offline',
            firmwareVersion: d.firmwareVersion || d.version,
            uptime: formatUptime(d.uptime),
            networkStats: stats,
            lastSeen: d.lastSeen,
          };
        });

        summary.totalDevices = devices.length;
        summary.onlineDevices = devices.filter((d) => d.status === 'online').length;
        summary.offlineDevices = summary.totalDevices - summary.onlineDevices;
      }
    }
  } catch (err: any) {
    console.warn('[UniFi Network] Site Manager devices query error:', err.message);
  }

  // 3. Query Site Manager Sites Overview (api.ui.com/v1/sites) for client metrics
  try {
    const sitesRes = await makeUnifiRequest('https://api.ui.com/v1/sites', {
      method: 'GET',
      headers: authHeaders,
      timeoutMs: 8000,
    });

    if (sitesRes.statusCode === 200) {
      const parsed = JSON.parse(sitesRes.body);
      const sitesList: any[] = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed.data)
        ? parsed.data
        : [];

      if (sitesList.length > 0) {
        const site = sitesList[0];
        const stats = site.statistics || site.reportedState || {};
        if (typeof stats.clientsCount === 'number') {
          summary.totalClients = stats.clientsCount;
        } else if (typeof site.clientsCount === 'number') {
          summary.totalClients = site.clientsCount;
        }
        if (typeof stats.wirelessClientsCount === 'number') {
          summary.wirelessClients = stats.wirelessClientsCount;
        }
        if (typeof stats.wiredClientsCount === 'number') {
          summary.wiredClients = stats.wiredClientsCount;
        }
        if (summary.totalClients > 0 && summary.wirelessClients === 0 && summary.wiredClients === 0) {
          summary.wirelessClients = summary.totalClients;
        }
      }
    }
  } catch (err: any) {
    console.warn('[UniFi Network] Site Manager sites query error:', err.message);
  }

  // 4. Try Cloud Connector for detailed real-time Network Integration data if consoleId is available
  if (hostConsoleId) {
    try {
      const connBase = `https://api.ui.com/v1/connector/consoles/${hostConsoleId}/proxy/network/integration/v1`;
      const netSitesRes = await makeUnifiRequest(`${connBase}/sites`, {
        method: 'GET',
        headers: authHeaders,
        timeoutMs: 8000,
      });

      if (netSitesRes.statusCode === 200) {
        const sitesData = JSON.parse(netSitesRes.body);
        const sites = Array.isArray(sitesData)
          ? sitesData
          : Array.isArray(sitesData.data)
          ? sitesData.data
          : [{ id: 'default' }];
        const siteId = sites[0]?.id || 'default';

        // Fetch detailed network devices (ports, radios, PoE)
        const detailedDevRes = await makeUnifiRequest(`${connBase}/sites/${siteId}/devices`, {
          method: 'GET',
          headers: authHeaders,
          timeoutMs: 10000,
        });

        if (detailedDevRes.statusCode === 200) {
          const dData = JSON.parse(detailedDevRes.body);
          const detailedList: any[] = Array.isArray(dData)
            ? dData
            : Array.isArray(dData.data)
            ? dData.data
            : [];

          for (const d of detailedList) {
            const matchIdx = devices.findIndex(
              (dev) => dev.id === d.id || dev.mac.toLowerCase() === (d.mac || '').toLowerCase()
            );

            const stats: Partial<NetworkDeviceStats> = {
              mac: d.mac,
              firmwareVersion: d.firmwareVersion || d.version,
              uptime: formatUptime(d.uptime),
              cpuUsagePct: typeof d.cpuUsage === 'number' ? Math.round(d.cpuUsage) : undefined,
              memoryUsagePct: typeof d.memoryUsage === 'number' ? Math.round(d.memoryUsage) : undefined,
              temperatureC: d.temperature,
            };

            // Switch ports if reported
            if (Array.isArray(d.ports)) {
              stats.ports = d.ports.map((p: any) => ({
                portNumber: p.portNumber || p.index || 0,
                name: p.name || `Port ${p.portNumber || p.index}`,
                up: Boolean(p.up || p.isUp),
                speed: p.speed ? `${p.speed} Mbps` : '1 Gbps',
                poePowerWatts: p.poePower,
                poeClass: p.poeClass,
                connectedDevice: p.connectedDeviceName || p.connectedDevice,
              }));
              const totalPoe = d.ports.reduce((sum: number, p: any) => sum + (p.poePower || 0), 0);
              if (totalPoe > 0) stats.poeTotalWatts = Math.round(totalPoe * 10) / 10;
            }

            // AP Radios if reported
            if (Array.isArray(d.radios)) {
              stats.radios = d.radios.map((r: any) => ({
                band: r.band === 'na' || r.band === '5g' ? '5GHz' : r.band === '6g' ? '6GHz' : '2.4GHz',
                channel: r.channel || 0,
                channelWidth: r.channelWidth ? `HE${r.channelWidth}` : 'HE80',
                utilizationPct: r.utilization || 0,
                txPowerDbm: r.txPower || 20,
              }));
            }

            if (matchIdx >= 0) {
              devices[matchIdx] = {
                ...devices[matchIdx],
                networkStats: {
                  ...devices[matchIdx].networkStats,
                  ...stats,
                },
              };
            } else {
              devices.push({
                id: String(d.id || d.mac || ''),
                name: d.name || d.model || 'UniFi Device',
                model: d.model || 'UniFi',
                type: classifyDeviceType(d.model, d.name),
                ip: d.ip || summary.ip,
                mac: d.mac || '',
                status: 'online',
                networkStats: stats,
              });
            }
          }
        }

        // Fetch connected client stations
        const clientRes = await makeUnifiRequest(`${connBase}/sites/${siteId}/clients`, {
          method: 'GET',
          headers: authHeaders,
          timeoutMs: 8000,
        });

        if (clientRes.statusCode === 200) {
          const cData = JSON.parse(clientRes.body);
          const rawClients: any[] = Array.isArray(cData)
            ? cData
            : Array.isArray(cData.data)
            ? cData.data
            : [];

          clients = rawClients.map((c: any) => ({
            mac: c.mac,
            ip: c.ip || '',
            hostname: c.hostname || c.name || `Client ${c.mac.slice(-5)}`,
            signalDbm: c.signalDbm || -50,
            wifiExperiencePct: c.wifiExperience || 98,
            radio: c.radio === '6g' ? '6GHz' : c.radio === '5g' ? '5GHz' : '2.4GHz',
            channel: c.channel || 0,
            rxRateMbps: c.rxRateMbps || 0,
            txRateMbps: c.txRateMbps || 0,
            uptimeSeconds: c.uptime || 0,
          }));

          summary.totalClients = clients.length;
          summary.wirelessClients = clients.filter((c) => c.signalDbm !== undefined).length;
          summary.wiredClients = summary.totalClients - summary.wirelessClients;
        }
      }
    } catch (cErr: any) {
      console.warn('[UniFi Network] Cloud Connector proxy query error:', cErr.message);
    }
  }

  // If local gateway was specified and is reachable, enrich/merge
  if (cleanOrigin && !cleanOrigin.includes('api.ui.com')) {
    try {
      const localSitesRes = await makeUnifiRequest(`${cleanOrigin}/proxy/network/integration/v1/sites`, {
        method: 'GET',
        headers: authHeaders,
        allowSelfSigned,
        timeoutMs: 4000,
      });
      if (localSitesRes.statusCode === 200) {
        summary.ip = cleanOrigin.replace(/^https?:\/\//i, '').split(':')[0];
      }
    } catch {}
  }

  const result = { summary, devices, clients };
  inMemoryCache = { data: result, timestamp: Date.now() };
  return result;
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const type = url.searchParams.get('type') || '';
    const id = url.searchParams.get('id') || '';
    const mac = url.searchParams.get('mac') || '';

    const cleanKey = (
      process.env.UNIFI_API_KEY ||
      process.env.NEXT_PUBLIC_UNIFI_API_KEY ||
      ''
    ).trim();

    const cleanOrigin = cleanUnifiUrl(
      process.env.UNIFI_BASE_URL ||
      process.env.NEXT_PUBLIC_UNIFI_BASE_URL ||
      ''
    );

    if (!cleanKey) {
      return NextResponse.json({
        success: false,
        error: 'No UniFi API Key configured. Please verify UNIFI_API_KEY in Vercel.',
      });
    }

    const { summary, devices, clients } = await fetchRealUnifiData(cleanKey, cleanOrigin, true);

    // If an overview was requested (no specific id or id is 'overview' or 'summary')
    if (!id || id === 'overview' || id === 'summary') {
      return NextResponse.json({
        success: true,
        summary,
        devices,
        clientsCount: summary.totalClients,
        timestamp: new Date().toISOString(),
      });
    }

    // Match specific device
    const matchedDevice = devices.find((d) => {
      if (mac && d.mac.toLowerCase() === mac.toLowerCase()) return true;
      if (d.id === id) return true;
      if (id && d.name.toLowerCase().includes(id.toLowerCase())) return true;
      if (type && d.type === type) return true;
      return false;
    });

    const telemetry = matchedDevice?.networkStats || {
      mac: matchedDevice?.mac,
      firmwareVersion: matchedDevice?.firmwareVersion,
      uptime: matchedDevice?.uptime,
      wanIp: summary.wanIp,
      wanStatus: summary.wanStatus,
      ispName: summary.ispName,
    };

    return NextResponse.json({
      success: true,
      device: matchedDevice || null,
      telemetry,
      summary,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message || 'Internal error fetching live UniFi network telemetry.',
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    let payload: any = {};
    try {
      payload = await req.json();
    } catch {}

    const cleanKey = (
      process.env.UNIFI_API_KEY ||
      process.env.NEXT_PUBLIC_UNIFI_API_KEY ||
      payload.apiKey ||
      ''
    ).trim();

    const cleanOrigin = cleanUnifiUrl(
      process.env.UNIFI_BASE_URL ||
      process.env.NEXT_PUBLIC_UNIFI_BASE_URL ||
      payload.baseUrl ||
      ''
    );

    const allowSelfSigned = payload.allowSelfSigned !== false;

    if (!cleanKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing UniFi API Key. Ensure UNIFI_API_KEY is configured in Vercel.',
      });
    }

    const { summary, devices, clients } = await fetchRealUnifiData(cleanKey, cleanOrigin, allowSelfSigned);

    return NextResponse.json({
      success: true,
      summary,
      devices,
      clients,
      message: `Discovered ${devices.length} real UniFi network device(s) and ${clients.length} active client station(s) from ${summary.consoleName}.`,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message || 'Internal error connecting to UniFi Network API.',
    });
  }
}
