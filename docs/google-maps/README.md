# Google Maps Integration

Bring Common Land Unit (CLU) boundaries into Google Maps without rebuilding your map stack. This guide covers the supported approaches using the LandMapMagic API Endpoits (`/clu.pmtiles` and `/clu/style.json`).

---

## 1. Prerequisites

- LandMap API key with access to the `clu` dataset.
- Google Maps JavaScript API key and an initialized map.
- Dependencies for vector tile decoding when using dynamic overlays: `pmtiles`, `@mapbox/vector-tile`, and `pbf`.
- Optional higher-level tooling such as `deck.gl` for quicker iteration.

```bash
npm install pmtiles @mapbox/vector-tile pbf
# Optional helpers
npm install deck.gl @deck.gl/google-maps
```

---

## 2. Fetch the CLU Style Metadata (Optional but Recommended)

The worker exposes a MapLibre style document that centralizes colors, labels, and layer IDs. Even though Google Maps cannot ingest the style directly, reusing its values keeps your presentation consistent across platforms.

```
GET https://api.landmapmagic.com/clu/style.json?key=YOUR_API_KEY
```

Runtime overrides:

- `borderColor=#fde047`
- `hoverColor=#ffd700`
- `labelColor=#000000`
- `labels=false`

---

## 3. Option A — WebGLOverlayView + PMTiles (Full Control)

Render CLU geometries directly inside Google Maps using `WebGLOverlayView` and a PMTiles reader. This approach keeps everything client-side and allows custom styling/interaction.

```ts
import { Loader } from '@googlemaps/js-api-loader';
import { PMTiles } from 'pmtiles';
import { VectorTile } from '@mapbox/vector-tile';
import Pbf from 'pbf';

const pmtiles = new PMTiles('https://api.landmapmagic.com/clu.pmtiles?key=YOUR_API_KEY');

const loader = new Loader({ apiKey: process.env.GMAPS_KEY!, version: 'weekly' });

loader.load().then(() => {
  const map = new google.maps.Map(document.getElementById('map')!, {
    center: { lat: 41.878, lng: -93.097 },
    zoom: 12,
    mapId: 'YOUR_VECTOR_MAP_ID'
  });

  const overlay = new google.maps.WebGLOverlayView();

  overlay.onAdd = () => {
    overlay.requestRedraw();
  };

  overlay.onContextRestored = () => {
    // Initialize shaders/buffers here.
    overlay.requestRedraw();
  };

  overlay.onDraw = async ({ gl, transformer }) => {
    const { zoom } = transformer;
    const visibleTiles = transformer.getVisibleRegion().tiles();

    for (const { z, x, y } of visibleTiles) {
      const tile = await pmtiles.getZxy(z, x, y);
      if (!tile) continue;

      const vt = new VectorTile(new Pbf(tile.data));
      const layer = vt.layers['clu'];
      if (!layer) continue;

      for (let i = 0; i < layer.length; i++) {
        const feature = layer.feature(i);
        const geom = feature.loadGeometry();
        // Convert to Web Mercator, populate buffers, draw lines using style colors.
      }
    }

    gl.drawArrays(gl.LINES, 0, vertexCount);
  };

  overlay.setMap(map);
});
```

### Tips

- Cache decoded tiles by `z/x/y` so panning does not refetch data.
- Pull `borderColor`/`hoverColor` from `/clu/style.json` for visual parity with MapLibre.
- Implement hover/click hit testing by checking whether pointer coordinates fall inside a decoded polygon.

---

## 4. Option B — deck.gl MVTLayer (Faster Iteration)

Deck.gl’s `MVTLayer` understands PMTiles when the loader is enabled and integrates cleanly with Google Maps via `@deck.gl/google-maps`.

```ts
import { Loader } from '@googlemaps/js-api-loader';
import { GoogleMapsOverlay } from '@deck.gl/google-maps';
import { MVTLayer } from '@deck.gl/geo-layers';

const loader = new Loader({ apiKey: process.env.GMAPS_KEY!, version: 'weekly' });

loader.load().then(() => {
  const map = new google.maps.Map(document.getElementById('map')!, {
    center: { lat: 41.878, lng: -93.097 },
    zoom: 12,
    mapId: 'YOUR_VECTOR_MAP_ID'
  });

  const overlay = new GoogleMapsOverlay({
    layers: [
      new MVTLayer({
        id: 'clu-outline',
        data: 'https://api.landmapmagic.com/clu.pmtiles?key=YOUR_API_KEY',
        minZoom: 6,
        maxZoom: 14,
        lineWidthMinPixels: 1,
        getLineColor: [253, 224, 71, 255], // #fde047
        loadOptions: {
          pmtiles: { metadata: true }
        }
      })
    ]
  });

  overlay.setMap(map);
});
```

### Notes

- Add a second `MVTLayer` targeting the `clu_labels` source layer to render acreage labels (`getText: (f) => `${f.properties.calcacres} ac``).
- Fetch `/clu/style.json` once on init to keep colors and label formatting in sync.
- deck.gl ≥ 8.9 bundles the PMTiles loader; earlier versions require manual registration via `@loaders.gl/pmtiles`.

---

## 5. Option C — Pre-rendered Raster Tiles (Fallback)

If WebGL overlays are not an option, prerender CLU data to raster PNGs (for example with `pmtiles serve` or TileServer GL) and register them with `google.maps.ImageMapType`. This removes interactivity but works with older Google Maps map IDs.

---

## 6. Performance & Quotas

- Cloudflare caches byte-range PMTiles requests—reuse URLs to maximize cache hits.
- Throttle redraws to `idle`/`tilesloaded` events to avoid starving the main thread.
- Rotate client-side API keys regularly and restrict allowed origins in the LandMap admin console.

---

## 7. Troubleshooting

- `401`/`403` responses → verify the `key` parameter and allowed origin configuration.
- Empty overlays → ensure zoom level ≥ 11 (CLU tiles start at Z11) and that you request the `clu` source layer.
- deck.gl loader errors → confirm the PMTiles loader is active via `loadOptions`.
- Visual artifacts → double-check coordinate conversions to Web Mercator before submitting vertices to WebGL.

---

## 8. Next Steps

- Layer additional datasets such as SSURGO or PLSS by adding more PMTiles sources.
- Ship hover/click interactions by reusing decoded vector geometries.
- Open a GitHub issue if you would like a starter sandbox or have integration questions.


