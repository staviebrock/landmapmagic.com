# LandMapMagic Integration Guide

LandMapMagic provides **four levels of integration**, from "give me everything" to "just give me the tile URLs." Pick the level that matches how much control you need.

---

## Level 1: Full Component

**`import { LandMap } from 'landmapmagic'`**

Drop-in map component. You don't have a map yet — LandMapMagic gives you the whole thing: map, layers, legend, search, click info, query tools.

```tsx
import { LandMap } from 'landmapmagic';

function App() {
  return (
    <LandMap
      apiKey="your-api-key"
      availableLayers={['clu', 'cdl', 'parcels', 'states', 'counties']}
      initialVisibleLayers={['clu']}
      showSearch
      showLegend
      height="100vh"
    />
  );
}
```

**When to use:** You're starting from scratch, building a land/ag app, and want the fastest path to a working map.

**What you get:** MapLibre GL JS map with all 9 data layers, zoom-based layer hierarchy, hover states, click popups, search, AOI queries, point lookups, CDL year switching, and a layer legend. Zero config required.

---

## Level 2: React Hooks

**`import { useLandMapLayers, useLandMapClick } from 'landmapmagic/hooks'`**

You already have a MapLibre map in React. These hooks add LandMapMagic layers to your existing map instance and manage the full lifecycle: sources, layers, visibility, zoom hierarchy, hover states, cleanup.

```tsx
import { useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { useLandMapLayers, useLandMapClick } from 'landmapmagic/hooks';
import type { ClickInfoEvent } from 'landmapmagic/hooks';

function MyExistingMapApp() {
  const mapRef = useRef<maplibregl.Map>(null);
  const [clickInfo, setClickInfo] = useState<ClickInfoEvent | null>(null);

  // This hook adds all LandMapMagic sources + layers to your map
  const land = useLandMapLayers(mapRef, {
    apiKey: 'your-api-key',
    layers: ['clu', 'cdl', 'parcels', 'counties'],
    initialVisible: ['clu'],
    cdlYear: '2024',
  });

  // Optional: click-to-inspect on LandMapMagic layers
  useLandMapClick(mapRef, {
    datasets: land.datasets,
    visibleLayers: land.visibleLayers,
    onClickInfo: setClickInfo,
  });

  return (
    <div>
      {/* Your existing map — LandMapMagic hooks attach to it */}
      <div ref={/* your map container */} />

      {/* Build your own layer toggle UI */}
      <div>
        {(['clu', 'cdl', 'parcels', 'counties'] as const).map(id => (
          <button key={id} onClick={() => land.toggleLayer(id)}>
            {land.visibleLayers.includes(id) ? '✓' : '○'} {id}
          </button>
        ))}
      </div>

      {/* Use click info however you want */}
      {clickInfo && (
        <div>
          <h3>{clickInfo.config.title?.(clickInfo.properties)}</h3>
          {clickInfo.config.fields.map(f => (
            <p key={f.key}>{f.label}: {clickInfo.properties[f.key]}</p>
          ))}
        </div>
      )}
    </div>
  );
}
```

**When to use:** You have an existing React + MapLibre app. You want LandMapMagic data layers without replacing your map component.

**What you get:** Automatic source/layer lifecycle management, zoom-based layer hierarchy, hover states, visibility toggling, CDL year switching, and click-to-inspect — all as composable React hooks.

### API

**`useLandMapLayers(mapRef, options)`** returns:

| Property | Type | Description |
|----------|------|-------------|
| `visibleLayers` | `LayerId[]` | Currently visible layers |
| `toggleLayer(id)` | `function` | Toggle a layer on/off |
| `setVisibleLayers(ids)` | `function` | Set visible layers explicitly |
| `datasets` | `Record<string, VectorDataset>` | All dataset objects |
| `mainLayer` | `string \| null` | Current zoom-based main layer |
| `parentLayer` | `string \| null` | Current zoom-based parent layer |
| `ready` | `boolean` | Whether sources/layers have been added |
| `cdlYear` | `string` | Current CDL year |
| `setCdlYear(year)` | `function` | Change CDL year |

---

## Level 3: Style Spec JSON

**`import { getLandMapStyle, mergeLandMapStyle } from 'landmapmagic/style'`**

No React needed. Returns standard MapLibre/Mapbox Style Spec `sources` and `layers` objects that you merge into any existing style.

```ts
import { getLandMapStyle, mergeLandMapStyle } from 'landmapmagic/style';

// Get style spec objects for the layers you want
const landStyle = getLandMapStyle({
  apiKey: 'your-api-key',
  layers: ['clu', 'parcels', 'counties'],
  visibleLayers: ['clu'],
  cdlYear: '2024',
});

// Option A: Merge into an existing style object
const myStyle = mergeLandMapStyle(existingStyle, landStyle);
const map = new maplibregl.Map({ container: 'map', style: myStyle });

// Option B: Add to a map that's already loaded
const map = new maplibregl.Map({ container: 'map', style: existingStyle });
map.on('load', () => {
  // Add sources
  for (const [id, source] of Object.entries(landStyle.sources)) {
    map.addSource(id, source);
  }
  // Add layers
  for (const layer of landStyle.layers) {
    map.addLayer(layer);
  }
});
```

**When to use:** You have a non-React MapLibre app, or you want maximum control over how layers are added. Works with any MapLibre or Mapbox GL JS setup — vanilla JS, Vue, Svelte, Angular, whatever.

**What you get:** Pure JSON objects that conform to the Mapbox Style Spec. You handle visibility, interactivity, and lifecycle yourself.

---

## Level 4: Layer Configs

**`import { makeCluDataset, ZOOM_THRESHOLDS } from 'landmapmagic/layers'`**

The lowest level. Individual factory functions that return `VectorDataset` objects — tile source configs, layer paint/layout properties, click info configs. You wire everything yourself.

```ts
import {
  makeCluDataset,
  makeCdlDataset,
  makeParcelsDataset,
  createAllDatasets,
  ZOOM_THRESHOLDS,
  LAYER_HIERARCHY,
} from 'landmapmagic/layers';

// Create individual datasets
const clu = makeCluDataset('your-api-key');
const cdl = makeCdlDataset('your-api-key', undefined, '2024');

// Or create all at once
const all = createAllDatasets({ apiKey: 'your-api-key', cdlYear: '2024' });

// Each dataset gives you everything you need:
console.log(clu.id);          // 'clu'
console.log(clu.name);        // 'Common Land Units'
console.log(clu.sourceProps);  // { type: 'vector', tiles: ['https://...'], ... }
console.log(clu.layers);      // { fill: { type: 'fill', paint: {...} }, outline: { ... } }

// Add to your map manually
map.addSource(clu.id, clu.sourceProps);
for (const [key, layer] of Object.entries(clu.layers)) {
  map.addLayer({ ...layer, source: clu.id });
}

// Use the constants to build your own zoom-based visibility logic
// ZOOM_THRESHOLDS = { states: 0, counties: 6, townships: 10, sections: 12, clu: 14, parcels: 14 }
// LAYER_HIERARCHY = ['states', 'counties', 'townships', 'sections', 'clu']
```

**When to use:** You want just the tile URLs and style definitions. You're integrating into a highly custom mapping setup, or you're building your own abstraction on top.

**What you get:** Pure data objects with zero side effects. No DOM, no React, no map instance needed. Just configs.

---

## Available Layers

All four integration levels provide access to these 9 data layers:

| Layer | ID | Type | Description |
|-------|-----|------|-------------|
| US States | `states` | Vector MVT | State boundaries with labels |
| Counties | `counties` | Vector MVT | County boundaries with labels |
| Townships | `townships` | Vector MVT | PLSS township boundaries |
| Sections | `sections` | Vector MVT | PLSS section boundaries |
| CLU | `clu` | Vector MVT | USDA FSA Common Land Unit field boundaries |
| Parcels | `parcels` | Vector MVT | Land parcels with ownership data |
| SSURGO | `ssurgo` | Vector MVT | USDA NRCS soil survey data |
| CDL | `cdl` | Raster PNG | USDA NASS Cropland Data Layer |
| PLSS | `plss` | Vector MVT | Public Land Survey System (combined townships/sections with labels) |

### Zoom-Based Layer Hierarchy

The administrative layers follow a zoom-based hierarchy. At each zoom level, one layer is the "main" layer and its predecessor becomes the "parent" outline:

```
Zoom 0-5:    States (main)
Zoom 6-9:    Counties (main), States (parent outline)
Zoom 10-11:  Townships (main), Counties (parent outline)
Zoom 12-13:  Sections (main), Townships (parent outline)
Zoom 14+:    CLU (main), Sections (parent outline)
```

CDL, SSURGO, and Parcels are **independent overlays** — they can be toggled on/off regardless of zoom level (though Parcels only renders at zoom 14+).

---

## Quick Reference: Which Level Do I Need?

| I want to... | Use |
|---|---|
| Show a map with zero setup | Level 1: `LandMap` component |
| Add layers to my React + MapLibre app | Level 2: `useLandMapLayers` hook |
| Get style JSON for any JS framework | Level 3: `getLandMapStyle` |
| Just get tile URLs and layer configs | Level 4: `makeCluDataset` etc. |
