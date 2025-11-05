/**
 * Cloudflare Worker - PMTiles Tile Server
 *
 * This worker serves PMTiles data in three formats:
 * 1. TileJSON metadata endpoint for deck.gl/Leaflet
 * 2. Individual MVT tile endpoints for standard HTTP tile requests
 * 3. Full PMTiles file for MapLibre's pmtiles:// protocol
 *
 * Deploy to Cloudflare Workers for edge-cached, global tile serving
 */

import { PMTiles, RangeResponse, Source } from 'pmtiles';

// Environment variables (set in wrangler.toml or Cloudflare dashboard)
interface Env {
  PMTILES_BUCKET_URL: string; // e.g., "https://your-r2-bucket.com"
  API_KEYS: string; // Comma-separated list of valid API keys
                    // For development: "dev"
                    // For production: "your-api-key-1,your-api-key-2"
                    // Note: 'dev' key should only be enabled in development environment
}

// Custom PMTiles source that works with Cloudflare Workers
class CloudflareSource implements Source {
  constructor(private url: string) {}

  getKey(): string {
    return this.url;
  }

  async getBytes(offset: number, length: number): Promise<RangeResponse> {
    const headers = new Headers();
    headers.set('Range', `bytes=${offset}-${offset + length - 1}`);

    const response = await fetch(this.url, { headers });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const data = await response.arrayBuffer();
    return {
      data: new Uint8Array(data),
      etag: response.headers.get('ETag') || undefined,
      expires: response.headers.get('Expires') || undefined,
      cacheControl: response.headers.get('Cache-Control') || undefined
    };
  }
}

/**
 * Validate API key
 */
function validateApiKey(apiKey: string | null, env: Env): boolean {
  if (!apiKey) return false;
  const validKeys = env.API_KEYS.split(',').map(k => k.trim());
  return validKeys.includes(apiKey);
}

/**
 * Get CORS headers
 */
function corsHeaders(): HeadersInit {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Range',
  };
}

/**
 * Main request handler
 */
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const apiKey = url.searchParams.get('key');

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    // Validate API key
    if (!validateApiKey(apiKey, env)) {
      return new Response(JSON.stringify({ error: 'Invalid or missing API key' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() }
      });
    }

    // Dataset configuration
    const datasets = ['clu', 'ssurgo', 'cdl', 'plss', 'states'];
    const dataset = url.pathname.split('/')[1]; // Extract dataset from path

    if (!datasets.includes(dataset)) {
      return new Response(JSON.stringify({ error: 'Unknown dataset' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() }
      });
    }

    // Route 1: TileJSON endpoint - /clu.json?key=dev
    if (url.pathname === `/${dataset}.json`) {
      const origin = url.origin;
      const tileJson = {
        tilejson: '3.0.0',
        name: dataset.toUpperCase(),
        description: `${dataset.toUpperCase()} vector tiles from PMTiles`,
        version: '1.0.0',
        attribution: 'LandMapMagic.com',
        scheme: 'xyz',
        tiles: [`${origin}/${dataset}/{z}/{x}/{y}.mvt?key=${apiKey}`],
        minzoom: getMinZoom(dataset),
        maxzoom: getMaxZoom(dataset),
        bounds: [-180, -90, 180, 90], // Global bounds, adjust per dataset
        center: [-98.5795, 39.8283, 4], // Center of US
        vector_layers: getVectorLayers(dataset)
      };

      return new Response(JSON.stringify(tileJson, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
          ...corsHeaders()
        }
      });
    }

    // Route 2: Individual tile endpoint - /clu/12/1024/1536.mvt?key=dev
    const tileMatch = url.pathname.match(/\/([^/]+)\/(\d+)\/(\d+)\/(\d+)\.mvt$/);
    if (tileMatch) {
      const [, tileDataset, z, x, y] = tileMatch;
      const zNum = parseInt(z);
      const xNum = parseInt(x);
      const yNum = parseInt(y);

      try {
        // Create PMTiles instance with Cloudflare-compatible source
        const pmtilesUrl = `${env.PMTILES_BUCKET_URL}/${tileDataset}.pmtiles`;
        const source = new CloudflareSource(pmtilesUrl);
        const pmtiles = new PMTiles(source);

        // Get the tile data
        const tileResult = await pmtiles.getZxy(zNum, xNum, yNum);

        if (!tileResult || !tileResult.data) {
          return new Response('Tile not found', {
            status: 404,
            headers: corsHeaders()
          });
        }

        // Determine content encoding based on PMTiles compression
        const headers: HeadersInit = {
          'Content-Type': 'application/vnd.mapbox-vector-tile',
          'Cache-Control': 'public, max-age=2592000', // Cache tiles for 30 days
          ...corsHeaders()
        };

        // PMTiles uses gzip compression (type 2)
        if (tileResult.header && tileResult.header.tileCompression === 2) {
          headers['Content-Encoding'] = 'gzip';
        }

        return new Response(tileResult.data, { status: 200, headers });

      } catch (error) {
        console.error('Error fetching tile:', error);
        return new Response(JSON.stringify({
          error: 'Failed to fetch tile',
          details: error instanceof Error ? error.message : 'Unknown error'
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders() }
        });
      }
    }

    // Route 3: Full PMTiles file download - /clu.pmtiles?key=dev
    // (Keep this for MapLibre's pmtiles:// protocol)
    if (url.pathname.endsWith('.pmtiles')) {
      const pmtilesDataset = url.pathname.replace('/', '').replace('.pmtiles', '');

      if (!datasets.includes(pmtilesDataset)) {
        return new Response('Dataset not found', { status: 404 });
      }

      const pmtilesUrl = `${env.PMTILES_BUCKET_URL}/${pmtilesDataset}.pmtiles`;

      // For full file, use range request support if client requests it
      const rangeHeader = request.headers.get('Range');
      const headers: HeadersInit = rangeHeader ? { Range: rangeHeader } : {};

      try {
        const response = await fetch(pmtilesUrl, { headers });

        // Forward the response with CORS headers
        const newHeaders = new Headers(response.headers);
        Object.entries(corsHeaders()).forEach(([key, value]) => {
          newHeaders.set(key, value);
        });

        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: newHeaders
        });
      } catch (error) {
        console.error('Error fetching PMTiles file:', error);
        return new Response('Failed to fetch PMTiles file', {
          status: 500,
          headers: corsHeaders()
        });
      }
    }

    // Unknown route
    return new Response(JSON.stringify({
      error: 'Not found',
      endpoints: [
        `/${dataset}.json?key=YOUR_KEY - TileJSON metadata`,
        `/${dataset}/{z}/{x}/{y}.mvt?key=YOUR_KEY - Individual tiles`,
        `/${dataset}.pmtiles?key=YOUR_KEY - Full PMTiles file`
      ]
    }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() }
    });
  }
};

/**
 * Get min zoom for dataset
 */
function getMinZoom(dataset: string): number {
  const minZooms: Record<string, number> = {
    clu: 11,
    ssurgo: 10,
    cdl: 8,
    plss: 6,
    states: 0
  };
  return minZooms[dataset] || 0;
}

/**
 * Get max zoom for dataset
 */
function getMaxZoom(dataset: string): number {
  const maxZooms: Record<string, number> = {
    clu: 15,
    ssurgo: 14,
    cdl: 12,
    plss: 12,
    states: 8
  };
  return maxZooms[dataset] || 14;
}

/**
 * Get vector layer definitions for TileJSON
 */
function getVectorLayers(dataset: string): any[] {
  const layerDefs: Record<string, any[]> = {
    clu: [
      {
        id: 'clu',
        description: 'Common Land Unit field boundaries',
        minzoom: 11,
        maxzoom: 15,
        fields: {
          id: 'String',
          calcacres: 'Number',
          state_fips: 'String',
          county_fips: 'String'
        }
      },
      {
        id: 'clu_labels',
        description: 'CLU centroid labels with acreage',
        minzoom: 13,
        maxzoom: 15,
        fields: {
          id: 'String',
          calcacres: 'Number'
        }
      }
    ],
    ssurgo: [
      {
        id: 'ssurgo',
        description: 'SSURGO soil survey polygons',
        fields: {
          mukey: 'String',
          musym: 'String',
          muname: 'String'
        }
      }
    ],
    cdl: [
      {
        id: 'cdl',
        description: 'Cropland Data Layer',
        fields: {
          class: 'Number',
          class_name: 'String'
        }
      }
    ],
    plss: [
      {
        id: 'plss',
        description: 'Public Land Survey System',
        fields: {
          township: 'String',
          range: 'String',
          section: 'Number'
        }
      }
    ],
    states: [
      {
        id: 'states',
        description: 'US State boundaries',
        fields: {
          name: 'String',
          abbr: 'String',
          fips: 'String'
        }
      }
    ]
  };

  return layerDefs[dataset] || [];
}
