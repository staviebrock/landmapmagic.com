# Implementation Guide: Adding Tile Server Endpoints to Your Worker

## Quick Summary

**You need to add 2 endpoints to your existing Cloudflare Worker:**

1. **TileJSON endpoint**: `/clu.json?key=dev`
2. **Individual tiles**: `/clu/{z}/{x}/{y}.mvt?key=dev`

This will make deck.gl + Google Maps work while keeping MapLibre working.

---

## Step-by-Step Implementation

### Step 1: Install PMTiles in Your Worker

```bash
cd your-worker-project
npm install pmtiles
```

### Step 2: Add the Cloudflare-Compatible PMTiles Source

PMTiles needs a custom `Source` implementation for Cloudflare Workers:

```typescript
import { PMTiles, RangeResponse, Source } from 'pmtiles';

class CloudflareSource implements Source {
  constructor(private url: string) {}

  getKey(): string {
    return this.url;
  }

  async getBytes(offset: number, length: number): Promise<RangeResponse> {
    const headers = new Headers();
    headers.set('Range', `bytes=${offset}-${offset + length - 1}`);

    const response = await fetch(this.url, { headers });
    const data = await response.arrayBuffer();

    return {
      data: new Uint8Array(data),
      etag: response.headers.get('ETag') || undefined,
      expires: response.headers.get('Expires') || undefined,
      cacheControl: response.headers.get('Cache-Control') || undefined
    };
  }
}
```

### Step 3: Add TileJSON Endpoint

```typescript
// Route: GET /clu.json?key=dev
if (url.pathname === '/clu.json') {
  const apiKey = url.searchParams.get('key');

  // Validate API key (implement your own validation)
  if (!validateApiKey(apiKey)) {
    return new Response('Invalid API key', { status: 401 });
  }

  const tileJson = {
    tilejson: '3.0.0',
    name: 'CLU',
    description: 'Common Land Unit field boundaries',
    tiles: [`${url.origin}/clu/{z}/{x}/{y}.mvt?key=${apiKey}`],
    minzoom: 11,
    maxzoom: 15,
    bounds: [-180, -90, 180, 90],
    vector_layers: [
      {
        id: 'clu',
        description: 'CLU field polygons',
        fields: {
          id: 'String',
          calcacres: 'Number'
        }
      },
      {
        id: 'clu_labels',
        description: 'CLU centroid labels',
        fields: {
          id: 'String',
          calcacres: 'Number'
        }
      }
    ]
  };

  return new Response(JSON.stringify(tileJson), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=86400',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
```

### Step 4: Add Individual Tile Endpoint

```typescript
// Route: GET /clu/{z}/{x}/{y}.mvt?key=dev
const tileMatch = url.pathname.match(/\/clu\/(\d+)\/(\d+)\/(\d+)\.mvt$/);
if (tileMatch) {
  const [, z, x, y] = tileMatch.map(Number);
  const apiKey = url.searchParams.get('key');

  // Validate API key
  if (!validateApiKey(apiKey)) {
    return new Response('Invalid API key', { status: 401 });
  }

  // Get PMTiles URL (from R2, CDN, or wherever you store it)
  const pmtilesUrl = `${env.PMTILES_BUCKET_URL}/clu.pmtiles`;

  // Create PMTiles instance
  const source = new CloudflareSource(pmtilesUrl);
  const pmtiles = new PMTiles(source);

  // Extract the specific tile
  const tile = await pmtiles.getZxy(z, x, y);

  if (!tile || !tile.data) {
    return new Response('Tile not found', { status: 404 });
  }

  // Return the MVT tile data
  return new Response(tile.data, {
    headers: {
      'Content-Type': 'application/vnd.mapbox-vector-tile',
      'Content-Encoding': 'gzip',  // PMTiles uses gzip compression
      'Cache-Control': 'public, max-age=2592000',  // Cache for 30 days
      'Access-Control-Allow-Origin': '*'
    }
  });
}
```

### Step 5: Keep Existing PMTiles Endpoint for MapLibre

```typescript
// Route: GET /clu.pmtiles?key=dev
// Keep this working for MapLibre's pmtiles:// protocol
if (url.pathname === '/clu.pmtiles') {
  const apiKey = url.searchParams.get('key');

  if (!validateApiKey(apiKey)) {
    return new Response('Invalid API key', { status: 401 });
  }

  const pmtilesUrl = `${env.PMTILES_BUCKET_URL}/clu.pmtiles`;

  // Support HTTP range requests for efficient partial downloads
  const rangeHeader = request.headers.get('Range');
  const headers = rangeHeader ? { Range: rangeHeader } : {};

  const response = await fetch(pmtilesUrl, { headers });

  // Add CORS headers
  const newHeaders = new Headers(response.headers);
  newHeaders.set('Access-Control-Allow-Origin', '*');

  return new Response(response.body, {
    status: response.status,
    headers: newHeaders
  });
}
```

---

## Complete Minimal Example

Here's a minimal, complete worker:

```typescript
import { PMTiles, RangeResponse, Source } from 'pmtiles';

interface Env {
  PMTILES_BUCKET_URL: string;  // e.g., "https://your-r2-bucket.com"
}

class CloudflareSource implements Source {
  constructor(private url: string) {}
  getKey() { return this.url; }

  async getBytes(offset: number, length: number): Promise<RangeResponse> {
    const response = await fetch(this.url, {
      headers: { Range: `bytes=${offset}-${offset + length - 1}` }
    });
    return {
      data: new Uint8Array(await response.arrayBuffer()),
      etag: response.headers.get('ETag') || undefined
    };
  }
}

function validateApiKey(key: string | null): boolean {
  // TODO: Implement your API key validation
  return key === 'dev' || key === 'staging-test-token-12345';
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const apiKey = url.searchParams.get('key');

    if (!validateApiKey(apiKey)) {
      return new Response('Invalid API key', { status: 401 });
    }

    const cors = { 'Access-Control-Allow-Origin': '*' };

    // TileJSON endpoint
    if (url.pathname === '/clu.json') {
      return new Response(JSON.stringify({
        tilejson: '3.0.0',
        tiles: [`${url.origin}/clu/{z}/{x}/{y}.mvt?key=${apiKey}`],
        minzoom: 11,
        maxzoom: 15,
        vector_layers: [{ id: 'clu', fields: { id: 'String', calcacres: 'Number' } }]
      }), {
        headers: { 'Content-Type': 'application/json', ...cors }
      });
    }

    // Individual tile endpoint
    const match = url.pathname.match(/\/clu\/(\d+)\/(\d+)\/(\d+)\.mvt$/);
    if (match) {
      const [, z, x, y] = match.map(Number);
      const pmtiles = new PMTiles(new CloudflareSource(
        `${env.PMTILES_BUCKET_URL}/clu.pmtiles`
      ));
      const tile = await pmtiles.getZxy(z, x, y);

      if (!tile?.data) {
        return new Response('Not found', { status: 404 });
      }

      return new Response(tile.data, {
        headers: {
          'Content-Type': 'application/vnd.mapbox-vector-tile',
          'Content-Encoding': 'gzip',
          'Cache-Control': 'public, max-age=2592000',
          ...cors
        }
      });
    }

    // Full PMTiles file (for MapLibre)
    if (url.pathname === '/clu.pmtiles') {
      const response = await fetch(`${env.PMTILES_BUCKET_URL}/clu.pmtiles`, {
        headers: request.headers.get('Range') ? { Range: request.headers.get('Range')! } : {}
      });
      const headers = new Headers(response.headers);
      Object.entries(cors).forEach(([k, v]) => headers.set(k, v));
      return new Response(response.body, { status: response.status, headers });
    }

    return new Response('Not found', { status: 404 });
  }
};
```

---

## Testing Your Implementation

### Test 1: TileJSON Endpoint

```bash
curl https://staging-api.landmapmagic.com/clu.json?key=dev
```

**Expected output:**
```json
{
  "tilejson": "3.0.0",
  "tiles": ["https://staging-api.landmapmagic.com/clu/{z}/{x}/{y}.mvt?key=dev"],
  "minzoom": 11,
  "maxzoom": 15,
  ...
}
```

### Test 2: Individual Tile

```bash
# Get a tile for Des Moines, Iowa area (z=12, x=1024, y=1536)
curl https://staging-api.landmapmagic.com/clu/12/1024/1536.mvt?key=dev \
  --output tile.mvt
```

**Expected:** Binary MVT file downloaded.

**Verify with:**
```bash
file tile.mvt
# Should output: tile.mvt: gzip compressed data
```

### Test 3: MapLibre Still Works

```bash
curl -H "Range: bytes=0-511" \
  https://staging-api.landmapmagic.com/clu.pmtiles?key=dev
```

**Expected:** Partial content response (206 status).

---

## Deployment

### Deploy to Cloudflare Workers

```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy
wrangler deploy
```

### Set Environment Variables

```bash
# Set in Cloudflare dashboard or via CLI
wrangler secret put PMTILES_BUCKET_URL
# Enter: https://your-r2-bucket.com
```

---

## Performance Optimization Tips

### 1. Enable Cloudflare Cache API

```typescript
const cache = caches.default;
const cacheKey = new Request(url.toString(), request);
let response = await cache.match(cacheKey);

if (!response) {
  // Fetch tile from PMTiles
  response = await getTile(z, x, y);
  // Cache it
  ctx.waitUntil(cache.put(cacheKey, response.clone()));
}

return response;
```

### 2. Add Tile Metadata Caching

Cache the PMTiles metadata separately to avoid repeated header reads:

```typescript
// Cache metadata in KV or in-memory
const metadata = await pmtiles.getMetadata();
// Store metadata for reuse
```

### 3. Use R2 for PMTiles Storage

R2 has no egress fees and works perfectly with range requests:

```toml
# wrangler.toml
[[r2_buckets]]
binding = "PMTILES_BUCKET"
bucket_name = "landmap-pmtiles"
```

```typescript
// Access via R2 binding
const pmtilesFile = await env.PMTILES_BUCKET.get('clu.pmtiles');
```

---

## Cost Estimate

Based on 1 million map views/month:

| Item | Cost |
|------|------|
| Cloudflare Workers (10M requests) | $5/month |
| R2 Storage (50GB) | $0.75/month |
| R2 Operations (Class A) | ~$0.50/month |
| **Total** | **~$6.25/month** |

Compare to:
- AWS Lambda + S3: ~$15-30/month
- Dedicated tile server (DigitalOcean): ~$20/month
- Maptiler Cloud: ~$50-200/month

---

## Troubleshooting

### "Tile not found" errors
- Check PMTiles file has tiles at that zoom level
- Verify z/x/y coordinates are valid
- Check PMTiles file is accessible from worker

### CORS errors in browser
- Ensure `Access-Control-Allow-Origin: *` header is set
- Add CORS preflight handling for OPTIONS requests

### Slow tile loading
- Enable Cloudflare Cache API
- Increase cache TTL for tiles
- Use R2 instead of external storage

### Worker CPU time exceeded
- Cache PMTiles metadata
- Reduce tile extraction work
- Consider using Durable Objects for connection pooling

---

## Next Steps

1. **Implement the minimal example** in your worker
2. **Test with curl** to verify endpoints work
3. **Test with deck.gl** using the Google Maps example
4. **Add caching** for production performance
5. **Monitor usage** in Cloudflare dashboard

The Google Maps example ([google-maps-example.html](examples/google-maps-example.html)) is already updated and will work as soon as you deploy these endpoints!
