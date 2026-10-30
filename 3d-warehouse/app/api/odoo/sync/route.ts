import { NextRequest, NextResponse } from 'next/server';

interface OdooSyncPayload {
  baseUrl: string;
  database: string;
  username: string;
  apiKey: string;
  stockLocationPrefix?: string;
  testOnly?: boolean;
}

interface OdooRpcRequest {
  jsonrpc: '2.0';
  method: 'call';
  params: {
    service: string;
    method: string;
    args: any[];
  };
  id: number;
}

function cleanOdooUrl(rawUrl: string): string {
  let str = (rawUrl || '').trim();
  if (!str) return '';
  if (!/^https?:\/\//i.test(str)) {
    str = `https://${str}`;
  }
  try {
    const parsed = new URL(str);
    return parsed.origin;
  } catch {
    return str.replace(/\/+$/, '');
  }
}

async function callOdooRpc(
  baseUrl: string,
  service: string,
  method: string,
  args: any[]
): Promise<any> {
  const origin = cleanOdooUrl(baseUrl);
  if (!origin) {
    throw new Error('Please enter a valid Odoo Instance URL in Settings.');
  }

  const url = `${origin}/jsonrpc`;
  const body: OdooRpcRequest = {
    jsonrpc: '2.0',
    method: 'call',
    params: {
      service,
      method,
      args,
    },
    id: Math.floor(Math.random() * 100000),
  };

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': 'WareTrack-3D/1.0',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });
  } catch (fetchErr: any) {
    console.error(`[Odoo Sync] Network error connecting to ${url}:`, fetchErr.message);
    throw new Error(
      `Unable to reach Odoo at "${origin}" (${fetchErr.message}). Check your internet connection and verify that this domain exists.`
    );
  }

  const responseText = await res.text();

  // Detect Odoo domain typo redirection or database not found
  if (
    responseText.includes('typo?domain=') ||
    responseText.includes('window.location = `https://www.odoo.com/typo') ||
    responseText.includes('Database not found')
  ) {
    console.warn(`[Odoo Sync] Odoo instance domain or database error at ${origin}`);
    throw new Error(
      `The Odoo instance at "${origin}" does not exist. Please check your Odoo Instance URL in Settings (e.g. your-company.odoo.com).`
    );
  }

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(
        `Odoo instance not found at "${origin}" (HTTP 404). Please verify your exact Odoo URL in Settings.`
      );
    }
    throw new Error(`HTTP ${res.status} from Odoo at ${url}`);
  }

  let json: any;
  try {
    json = JSON.parse(responseText);
  } catch {
    console.error(`[Odoo Sync] Non-JSON response received from ${url}:`, responseText.slice(0, 160));
    throw new Error(
      `Odoo at "${origin}" returned an HTML page instead of JSON. Ensure your Odoo URL is your main web address.`
    );
  }

  if (json.error) {
    const errData = json.error.data;
    const msg =
      errData?.message ||
      errData?.name ||
      json.error.message ||
      'Odoo RPC Error';
    console.warn(`[Odoo Sync] Odoo RPC error:`, json.error);
    throw new Error(msg);
  }

  return json.result;
}

export async function POST(req: NextRequest) {
  try {
    const payload: OdooSyncPayload = await req.json();
    const { baseUrl, database, username, apiKey, stockLocationPrefix = 'WH/Stock', testOnly } = payload;

    const cleanBaseUrl = cleanOdooUrl(
      baseUrl || process.env.ODOO_BASE_URL || process.env.NEXT_PUBLIC_ODOO_BASE_URL || ''
    );
    const cleanDb = (
      database || process.env.ODOO_DB || process.env.NEXT_PUBLIC_ODOO_DB || ''
    ).trim();
    const cleanUser = (
      username || process.env.ODOO_LOGIN || process.env.NEXT_PUBLIC_ODOO_LOGIN || ''
    ).trim();
    const cleanApiKey = (
      apiKey || process.env.ODOO_API_KEY || process.env.NEXT_PUBLIC_ODOO_API_KEY || ''
    ).trim();

    if (!cleanBaseUrl || !cleanDb || !cleanUser || !cleanApiKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing required Odoo credentials. Please fill in URL, Database, Username, and API Key in Settings or set ODOO_API_KEY in Vercel.',
      });
    }

    // Step 1: Authenticate with Odoo
    let uid: number | false = false;
    try {
      uid = await callOdooRpc(cleanBaseUrl, 'common', 'authenticate', [
        cleanDb,
        cleanUser,
        cleanApiKey,
        {},
      ]);
    } catch (authErr: any) {
      console.error('[Odoo Sync] Auth connection error:', authErr.message);
      return NextResponse.json({
        success: false,
        error: `Failed to connect to Odoo: ${authErr.message}`,
      });
    }

    if (!uid || typeof uid !== 'number') {
      return NextResponse.json({
        success: false,
        error: `Authentication failed on database "${cleanDb}". Please verify your Database name, Username (${cleanUser}), and API Key / Password in Settings.`,
      });
    }

    if (testOnly) {
      return NextResponse.json({
        success: true,
        authenticatedAs: cleanUser,
        uid,
        message: `Connection successful! Authenticated as ${cleanUser} (UID ${uid}).`,
      });
    }

    // Step 2: Query stock.location to map warehouse short codes
    let locations: any[] = [];
    try {
      locations = await callOdooRpc(cleanBaseUrl, 'object', 'execute_kw', [
        cleanDb,
        uid,
        cleanApiKey,
        'stock.location',
        'search_read',
        [[['usage', '=', 'internal']]],
        {
          fields: ['id', 'name', 'complete_name', 'barcode'],
          limit: 2000,
        },
      ]);
    } catch (locErr: any) {
      console.warn('Could not read stock.location:', locErr.message);
    }

    // Map location ID to clean short code and all possible alias codes (barcode, hierarchical, short code)
    const locationMap = new Map<
      number,
      {
        id: number;
        name: string;
        completeName: string;
        shortCode: string;
        barcode?: string;
        aliases: string[];
      }
    >();

    for (const loc of locations) {
      const cName: string = loc.complete_name || loc.name || '';
      const barcode: string = (loc.barcode || '').trim().toUpperCase();

      const aliases = new Set<string>();

      // 1. If barcode exists, add it directly and standard-formatted
      if (barcode) {
        aliases.add(barcode);
        const bMatch = barcode.match(/([A-Z])-?(\d{1,2})-?(\d{1,2})-?(\d{1,2})/);
        if (bMatch) {
          aliases.add(
            `${bMatch[1]}-${bMatch[2].padStart(2, '0')}-${bMatch[3].padStart(2, '0')}-${bMatch[4].padStart(2, '0')}`
          );
        }
      }

      // 2. Direct short code in complete_name (e.g. "WH/Stock/A-01-01-01" or "A-01-01-01")
      const directMatch = cName.match(/([A-Z])-(\d{1,2})-(\d{1,2})-(\d{1,2})/i);
      if (directMatch) {
        aliases.add(
          `${directMatch[1].toUpperCase()}-${directMatch[2].padStart(2, '0')}-${directMatch[3].padStart(2, '0')}-${directMatch[4].padStart(2, '0')}`
        );
      }

      // 3. Hierarchical path: "WH/Stock/Zone A/Row 01/Rack 01/Shelf 01"
      const zoneMatch = cName.match(/Zone\s*([A-Za-z])/i);
      const rowMatch = cName.match(/Row\s*(\d+)/i);
      const rackMatch =
        cName.match(/Rack\s*(\d+)/i) || cName.match(/Bay\s*(\d+)/i);
      const shelfMatch =
        cName.match(/Shelf\s*(\d+)/i) ||
        cName.match(/Tier\s*(\d+)/i) ||
        cName.match(/Level\s*(\d+)/i);

      if (zoneMatch && rowMatch && rackMatch && shelfMatch) {
        const z = zoneMatch[1].toUpperCase();
        const r = rowMatch[1].padStart(2, '0');
        const rk = rackMatch[1].padStart(2, '0');
        const sh = shelfMatch[1].padStart(2, '0');
        aliases.add(`${z}-${r}-${rk}-${sh}`);
      }

      if (cName) aliases.add(cName);
      if (loc.name) aliases.add(loc.name);

      // Best primary shortCode: formatted standard e.g. "A-01-01-01"
      let primaryCode = '';
      for (const a of aliases) {
        if (/^[A-Z]-\d{2}-\d{2}-\d{2}$/.test(a)) {
          primaryCode = a;
          break;
        }
      }
      if (!primaryCode) {
        primaryCode = barcode || cName.split('/').pop()?.trim() || cName;
      }

      locationMap.set(loc.id, {
        id: loc.id,
        name: loc.name,
        completeName: cName,
        shortCode: primaryCode,
        barcode: barcode || undefined,
        aliases: Array.from(aliases),
      });
    }

    // Step 3: Query stock.quant (real on-hand inventory per location)
    let quants: any[] = [];
    try {
      quants = await callOdooRpc(cleanBaseUrl, 'object', 'execute_kw', [
        cleanDb,
        uid,
        cleanApiKey,
        'stock.quant',
        'search_read',
        [[['location_id.usage', '=', 'internal'], ['quantity', '>', 0]]],
        {
          fields: ['id', 'product_id', 'location_id', 'quantity', 'reserved_quantity', 'lot_id', 'package_id'],
          limit: 2000,
        },
      ]);
    } catch (quantErr: any) {
      console.warn('Could not read stock.quant:', quantErr.message);
    }

    // Step 4: Collect Product Details for all products found in quants
    const productIds = Array.from(
      new Set(quants.map((q) => (Array.isArray(q.product_id) ? q.product_id[0] : q.product_id)).filter(Boolean))
    );

    const productDetailsMap = new Map<number, { sku: string; name: string; barcode?: string }>();
    if (productIds.length > 0) {
      try {
        const products = await callOdooRpc(cleanBaseUrl, 'object', 'execute_kw', [
          cleanDb,
          uid,
          cleanApiKey,
          'product.product',
          'search_read',
          [[['id', 'in', productIds]]],
          {
            fields: ['id', 'default_code', 'name', 'barcode'],
            limit: productIds.length + 50,
          },
        ]);

        for (const p of products) {
          productDetailsMap.set(p.id, {
            sku: p.default_code || p.barcode || `PROD-${p.id}`,
            name: p.name || 'Unnamed Product',
            barcode: p.barcode || undefined,
          });
        }
      } catch (pErr: any) {
        console.warn('Could not read product.product:', pErr.message);
      }
    }

    // Step 5: Assemble aggregated inventory records
    const inventory: Array<{
      id: number;
      productId: number;
      sku: string;
      name: string;
      quantity: number;
      reservedQuantity: number;
      lot?: string;
      locationId: number;
      locationName: string;
      shortCode: string;
      barcode?: string;
      aliases?: string[];
    }> = [];

    for (const q of quants) {
      const pId = Array.isArray(q.product_id) ? q.product_id[0] : q.product_id;
      const pDisplayName = Array.isArray(q.product_id) ? q.product_id[1] : '';
      const locId = Array.isArray(q.location_id) ? q.location_id[0] : q.location_id;
      const locDisplayName = Array.isArray(q.location_id) ? q.location_id[1] : '';

      const locInfo = locationMap.get(locId);
      const prodInfo = productDetailsMap.get(pId);

      // Extract SKU from default_code or display name e.g. "[SKU-100] Widget"
      let sku = prodInfo?.sku;
      if (!sku && pDisplayName) {
        const skuMatch = pDisplayName.match(/\[(.*?)\]/);
        sku = skuMatch ? skuMatch[1] : `PROD-${pId}`;
      }
      if (!sku) sku = `PROD-${pId}`;

      const name = prodInfo?.name || pDisplayName.replace(/\[.*?\]\s*/, '') || 'Odoo Product';

      let shortCode = locInfo?.shortCode;
      if (!shortCode && locDisplayName) {
        const match = locDisplayName.match(/([A-Z]-\d{2}-\d{2}-\d{2})/);
        shortCode = match ? match[1] : locDisplayName.split('/').pop()?.trim() || locDisplayName;
      }

      inventory.push({
        id: q.id,
        productId: pId,
        sku,
        name,
        quantity: q.quantity || 0,
        reservedQuantity: q.reserved_quantity || 0,
        lot: Array.isArray(q.lot_id) ? q.lot_id[1] : undefined,
        locationId: locId,
        locationName: locInfo?.completeName || locDisplayName,
        shortCode: locInfo?.shortCode || shortCode || '',
        barcode: locInfo?.barcode,
        aliases: locInfo?.aliases || (locDisplayName ? [locDisplayName] : []),
      });
    }

    return NextResponse.json({
      success: true,
      authenticatedAs: username,
      totalQuants: quants.length,
      totalLocations: locations.length,
      inventory,
    });
  } catch (err: any) {
    console.error('Odoo sync error:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'An unexpected error occurred during Odoo synchronization.',
      },
      { status: 500 }
    );
  }
}
