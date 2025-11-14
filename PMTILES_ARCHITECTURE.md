# PMTiles Architecture for Google Maps Integration

## Current Situation

Your data is in **PMTiles format** (excellent choice!), and you want to serve it to:
- ✅ **MapLibre GL JS** - Currently works via `pmtiles://` protocol
- ❌ **Google Maps with deck.gl** - Currently broken

## The Problem

**PMTiles is a file format, not a tile server protocol.**

- MapLibre works because you register a custom protocol handler (`pmtiles://`) that:
  1. Opens the PMTiles archive
  2. Extracts individual tiles on-demand
  3. Returns them to MapLibre

- deck.gl/Google Maps **don't support custom protocols** - they only fetch tiles via HTTP URLs

## Solution Options (Keep PMTiles as Base)

### ✅ **Option 1: Cloudflare Worker as PMTiles Tile Server (RECOMMENDED)**

**What you have now:**
```
GET https://api.landmapmagic.com/clu.pmtiles?key=dev
→ Returns entire PMTiles file (not useful for deck.gl)
```

**What you need to add:**

```typescript
// 1. TileJSON endpoint (metadata)
GET /clu.json?key=dev
→ Returns: {
  "tilejson": "3.0.0",
  "tiles": ["https://api.landmapmagic.com/clu/{z}/{x}/{y}.mvt?key=dev"],
  "minzoom": 11,
  "maxzoom": 15,
  "bounds": [-180, -90, 180, 90],
  "vector_layers": [{
    "id": "clu",
    "fields": { "id": "String", "calcacres": "Number" }
  }]
}

// 2. Individual tile endpoint
GET /clu/{z}/{x}/{y}.mvt?key=dev
→ Opens clu.pmtiles, extracts tile at z/x/y, returns MVT data
```

**Cloudflare Worker Example:**

```typescript
import { PMTiles } from 'pmtiles';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const apiKey = url.searchParams.get('key');

    // Validate API key
    if (!validateApiKey(apiKey)) {
      return new Response('Invalid API key', { status: 401 });
    }

    // TileJSON endpoint
    if (url.pathname === '/clu.json') {
      return new Response(JSON.stringify({
        tilejson: '3.0.0',
        tiles: [`${url.origin}/clu/{z}/{x}/{y}.mvt?key=${apiKey}`],
        minzoom: 11,
        maxzoom: 15,
        bounds: [-180, -90, 180, 90],
        vector_layers: [{
          id: 'clu',
          fields: { id: 'String', calcacres: 'Number' }
        }]
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Individual tile endpoint
    const tileMatch = url.pathname.match(/\/clu\/(\d+)\/(\d+)\/(\d+)\.mvt$/);
    if (tileMatch) {
      const [, z, x, y] = tileMatch.map(Number);

      // Open PMTiles from R2/CloudFlare CDN
      const pmtilesUrl = `${env.PMTILES_BUCKET_URL}/clu.pmtiles`;
      const pmtiles = new PMTiles(pmtilesUrl);

      // Extract the specific tile
      const tile = await pmtiles.getZxy(z, x, y);

      if (!tile) {
        return new Response('Tile not found', { status: 404 });
      }

      return new Response(tile.data, {
        headers: {
          'Content-Type': 'application/vnd.mapbox-vector-tile',
          'Content-Encoding': tile.header.compression === 2 ? 'gzip' : 'none',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=86400'
        }
      });
    }

    // Legacy: Full PMTiles download (keep for MapLibre)
    if (url.pathname === '/clu.pmtiles') {
      const pmtilesUrl = `${env.PMTILES_BUCKET_URL}/clu.pmtiles`;
      return fetch(pmtilesUrl);
    }

    return new Response('Not found', { status: 404 });
  }
};
```

**Benefits:**
- ✅ Keep PMTiles as storage format
- ✅ Works with ALL mapping libraries (deck.gl, MapLibre, Mapbox, Leaflet)
- ✅ Cloudflare edge caching = fast global delivery
- ✅ No additional infrastructure
- ✅ TileJSON is the industry standard
- ✅ Efficient: Only requested tiles are extracted

**Costs:**
- Cloudflare Workers: ~$5/month (10M requests included)
- R2 Storage: ~$0.015/GB/month
- Data transfer: Free on R2

---

### 🔧 **Option 2: Client-Side Service Worker**

Intercept tile requests in the browser and serve from PMTiles:

```javascript
// Install service worker
navigator.serviceWorker.register('/pmtiles-sw.js');

// pmtiles-sw.js
import { PMTiles } from 'pmtiles';

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Intercept tile requests
  if (url.pathname.match(/\/clu\/(\d+)\/(\d+)\/(\d+)\.mvt$/)) {
    event.respondWith(handleTileRequest(url));
  }
});

async function handleTileRequest(url) {
  const [, z, x, y] = url.pathname.match(/\/clu\/(\d+)\/(\d+)\/(\d+)\.mvt$/);

  // Load PMTiles archive (cached)
  const pmtilesUrl = 'https://api.landmapmagic.com/clu.pmtiles?key=dev';
  const pmtiles = new PMTiles(pmtilesUrl);

  const tile = await pmtiles.getZxy(z, x, y);
  return new Response(tile.data, {
    headers: { 'Content-Type': 'application/vnd.mapbox-vector-tile' }
  });
}
```

**Benefits:**
- ✅ No server changes needed
- ✅ Works offline once cached

**Drawbacks:**
- ❌ Service Workers have browser compatibility issues
- ❌ Requires user to accept service worker installation
- ❌ Downloads entire PMTiles file to browser (large!)
- ❌ Complex debugging
- ❌ Not great for mobile/bandwidth-constrained users

---

### 🔧 **Option 3: Use protomaps/PMTiles Tile Server**

Run a dedicated tile server (not serverless):

```bash
# Using protomaps tile server
docker run -p 8080:8080 \
  -v /data:/data \
  protomaps/go-pmtiles serve /data/clu.pmtiles
```

**Benefits:**
- ✅ Battle-tested open source
- ✅ Built specifically for PMTiles

**Drawbacks:**
- ❌ Requires running a server (EC2, DigitalOcean, etc.)
- ❌ Need to manage uptime, scaling, caching
- ❌ Additional monthly costs (~$5-20/month minimum)
- ❌ Not edge-cached like Cloudflare

---

### ❌ **Option 4: Convert to MBTiles or GeoJSON**

**Don't do this.** PMTiles is superior:
- Smaller file sizes
- HTTP range request support (efficient)
- No database overhead
- Cloud-native (works great with R2/S3)

---

## Recommendation

**Use Option 1: Cloudflare Worker as PMTiles Tile Server**

### Why?

1. **You're already using Cloudflare Workers** (`api.landmapmagic.com`)
2. **Minimal code change** - just add 2 endpoints
3. **Works everywhere** - MapLibre, deck.gl, Google Maps, Leaflet
4. **Industry standard** - TileJSON is what all map libraries expect
5. **Scales automatically** - Cloudflare edge network
6. **Cost-effective** - $5/month for 10M requests
7. **Keep PMTiles** - No data conversion needed

### Architecture Diagram

```
┌─────────────────┐
│  clu.pmtiles    │  ← Your source data (R2/CloudFlare CDN)
│  (MVT tiles)    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  Cloudflare Worker                  │
│  (api.landmapmagic.com)    │
│                                     │
│  Routes:                            │
│  • /clu.pmtiles?key=X               │  ← MapLibre (existing)
│  • /clu.json?key=X                  │  ← TileJSON (NEW)
│  • /clu/{z}/{x}/{y}.mvt?key=X      │  ← Individual tiles (NEW)
└─────────┬───────────────────────────┘
          │
    ┌─────┴─────┐
    ▼           ▼
┌─────────┐  ┌────────────────┐
│ MapLibre│  │ deck.gl        │
│         │  │ Google Maps    │
└─────────┘  └────────────────┘
```

---

## Implementation Steps

### Step 1: Update Cloudflare Worker

Add the two new endpoints (see code example above).

### Step 2: Test TileJSON

```bash
curl https://api.landmapmagic.com/clu.json?key=dev
```

Should return TileJSON metadata.

### Step 3: Test Individual Tile

```bash
curl https://api.landmapmagic.com/clu/12/1000/1500.mvt?key=dev
```

Should return MVT binary data.

### Step 4: Update Google Maps Example

Already done! [google-maps-example.html](examples/google-maps-example.html) now expects `/clu.json`.

### Step 5: Keep MapLibre Working

The existing `/clu.pmtiles` endpoint continues to work for MapLibre.

---

## Cost Comparison

| Option | Setup Cost | Monthly Cost | Maintenance |
|--------|------------|--------------|-------------|
| Cloudflare Worker | 1 hour | $5 | Low |
| Service Worker | 4 hours | $0 | High |
| Dedicated Server | 2 hours | $20+ | Medium |
| PMTiles.cloud* | 0 hours | $10+ | None |

*PMTiles.cloud is a hosted service but doesn't support custom domains/API keys

---

## Performance Characteristics

### Current (MapLibre only)
- ✅ Fast initial load (HTTP range requests)
- ✅ Only fetches needed tile index
- ✅ Edge cached

### After Adding Tile Endpoints
- ✅ All the above
- ✅ Works with deck.gl/Google Maps
- ✅ Standard HTTP caching (even better!)
- ✅ CDN-friendly
- ⚠️ Slightly more worker invocations (but still very cheap)

---

## Summary

**Keep PMTiles as your storage format.** It's excellent.

**Add 2 HTTP endpoints to your Cloudflare Worker:**
1. `/clu.json` - TileJSON metadata
2. `/clu/{z}/{x}/{y}.mvt` - Individual tiles

This gives you:
- ✅ Universal compatibility (all mapping libraries)
- ✅ Industry-standard API
- ✅ Great performance
- ✅ Low cost
- ✅ Minimal code changes

The Google Maps example will work immediately once these endpoints are added!
