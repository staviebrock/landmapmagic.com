# MapLibre Integration

Add CLU field boundaries to your existing MapLibre map in under 5 minutes using the LandMapMagic API.

---

## Quick Start (Fastest Path)

If you already have a MapLibre map instance, just install the PMTiles protocol and fetch the style:

### 1. Install PMTiles Protocol

```bash
npm install pmtiles
```

### 2. Register the Protocol

```ts
import maplibregl from 'maplibre-gl';
import { Protocol } from 'pmtiles';

// Register PMTiles protocol once at app startup
const protocol = new Protocol();
maplibregl.addProtocol('pmtiles', protocol.tile);
```

### 3. Add CLU Layers to Your Map

**Option A: Fetch and merge the style (Recommended)**

```ts
// Fetch the CLU style from the API
const response = await fetch('https://api.landmapmagic.com/clu/style.json?key=YOUR_API_KEY');
const cluStyle = await response.json();

// Add the source
map.addSource('clu', cluStyle.sources.clu);

// Add all layers
cluStyle.layers.forEach(layer => {
  map.addLayer(layer);
});
```

**Option B: Manual source and layer definition**

```ts
// Add the PMTiles source
map.addSource('clu', {
  type: 'vector',
  url: 'pmtiles://https://api.landmapmagic.com/clu.pmtiles?key=YOUR_API_KEY',
  attribution: 'USDA FSA CLU / LandMapMagic'
});

// Add the outline layer
map.addLayer({
  id: 'clu-outline',
  type: 'line',
  source: 'clu',
  'source-layer': 'clu',
  paint: {
    'line-color': '#fde047',
    'line-width': 2,
    'line-opacity': 0.9
  },
  layout: {
    'line-cap': 'round',
    'line-join': 'round'
  },
  minzoom: 11
});

// Add the labels layer (optional)
map.addLayer({
  id: 'clu-labels',
  type: 'symbol',
  source: 'clu',
  'source-layer': 'clu_labels',
  layout: {
    'text-field': ['concat', ['get', 'calcacres'], ' ac'],
    'text-size': 14,
    'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
    'text-anchor': 'center'
  },
  paint: {
    'text-color': '#000000',
    'text-halo-color': '#ffffff',
    'text-halo-width': 3
  },
  minzoom: 13
});
```

---

## Complete Example

```ts
import maplibregl from 'maplibre-gl';
import { Protocol } from 'pmtiles';
import 'maplibre-gl/dist/maplibre-gl.css';

// Register PMTiles protocol
const protocol = new Protocol();
maplibregl.addProtocol('pmtiles', protocol.tile);

// Create your map
const map = new maplibregl.Map({
  container: 'map',
  style: 'https://demotiles.maplibre.org/style.json', // Your existing style
  center: [-93.5, 42.0],
  zoom: 12
});

map.on('load', async () => {
  // Fetch CLU style
  const response = await fetch('https://api.landmapmagic.com/clu/style.json?key=YOUR_API_KEY');
  const cluStyle = await response.json();

  // Add source and layers
  map.addSource('clu', cluStyle.sources.clu);
  cluStyle.layers.forEach(layer => map.addLayer(layer));
});
```

---

## Customizing Colors

Pass query parameters to the style endpoint:

```ts
const response = await fetch(
  'https://api.landmapmagic.com/clu/style.json?key=YOUR_API_KEY&borderColor=ff6b35&hoverColor=ffd700&labels=false'
);
```

Available parameters:
- `borderColor` - Hex color for field boundaries (default: `fde047`)
- `hoverColor` - Hex color for hover state (default: `ffd700`)
- `labelColor` - Hex color for acreage labels (default: `000000`)
- `labels` - Show/hide labels (`true` or `false`, default: `true`)

---

## Adding Hover Effects

The style includes hover state support. Enable it with feature state:

```ts
let hoveredFeatureId = null;

map.on('mousemove', 'clu-outline', (e) => {
  if (e.features.length > 0) {
    // Clear previous hover
    if (hoveredFeatureId !== null) {
      map.setFeatureState(
        { source: 'clu', sourceLayer: 'clu', id: hoveredFeatureId },
        { hover: false }
      );
    }

    // Set new hover
    hoveredFeatureId = e.features[0].id;
    map.setFeatureState(
      { source: 'clu', sourceLayer: 'clu', id: hoveredFeatureId },
      { hover: true }
    );
  }
});

map.on('mouseleave', 'clu-outline', () => {
  if (hoveredFeatureId !== null) {
    map.setFeatureState(
      { source: 'clu', sourceLayer: 'clu', id: hoveredFeatureId },
      { hover: false }
    );
  }
  hoveredFeatureId = null;
});
```

---

## Click Events for Feature Info

```ts
map.on('click', 'clu-outline', (e) => {
  if (e.features.length > 0) {
    const feature = e.features[0];
    const acres = feature.properties.calcacres;
    const id = feature.properties.id;

    new maplibregl.Popup()
      .setLngLat(e.lngLat)
      .setHTML(`
        <h3>CLU Field</h3>
        <p><strong>Field ID:</strong> ${id}</p>
        <p><strong>Acres:</strong> ${acres?.toFixed(2)}</p>
      `)
      .addTo(map);
  }
});

// Change cursor on hover
map.on('mouseenter', 'clu-outline', () => {
  map.getCanvas().style.cursor = 'pointer';
});

map.on('mouseleave', 'clu-outline', () => {
  map.getCanvas().style.cursor = '';
});
```

---

## Layer Visibility Toggle

```ts
// Hide CLU layers
map.setLayoutProperty('clu-outline', 'visibility', 'none');
map.setLayoutProperty('clu-labels', 'visibility', 'none');

// Show CLU layers
map.setLayoutProperty('clu-outline', 'visibility', 'visible');
map.setLayoutProperty('clu-labels', 'visibility', 'visible');
```

---

## Performance Tips

1. **Cache the style response** - Fetch `/clu/style.json` once and reuse it across map instances
2. **Use minzoom** - CLU tiles start at zoom 11; don't render at lower zooms
3. **Debounce interactions** - Throttle hover/click handlers if you have many features
4. **Layer ordering** - Add CLU layers after your base layers but before labels for best visual hierarchy

---

## Troubleshooting

**PMTiles not loading:**
- Verify the protocol is registered before creating the map
- Check that your API key is valid and has CLU dataset access
- Ensure the URL includes `pmtiles://` prefix

**401/403 errors:**
- Confirm your domain is whitelisted in the LandMap admin console
- Check that the `key` parameter is present in the URL

**No features visible:**
- Zoom to level 11+ (CLU tiles start at Z11)
- Verify the source-layer name is `'clu'` for outlines and `'clu_labels'` for labels
- Check browser console for tile loading errors

**Style conflicts:**
- If layer IDs conflict with your existing style, rename them when adding:
  ```ts
  map.addLayer({ ...layer, id: `my-prefix-${layer.id}` });
  ```

---

## Next Steps

- Add multiple datasets (SSURGO, PLSS) by fetching their respective style endpoints
- Build a layer switcher UI to toggle visibility
- Combine with your own vector/raster data sources
- Check out the [Google Maps integration guide](../google-maps/README.md) if you need to support both platforms

---

## Need Help?

Open an issue on GitHub or reach out to support@landmapmagic.com

