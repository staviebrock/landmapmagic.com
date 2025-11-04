# Google Maps + LandMapMagic CLU Integration

## Quick Start (3 steps)

Add USDA CLU field boundaries to your Google Maps application in minutes.

### Step 1: Include deck.gl in your HTML

```html
<script src="https://unpkg.com/deck.gl@^9.0.0/dist.min.js"></script>
<script src="https://unpkg.com/@deck.gl/google-maps@^9.0.0/dist.min.js"></script>
```

### Step 2: Create your Google Map

```javascript
const map = new google.maps.Map(document.getElementById('map'), {
  center: { lat: 41.878, lng: -93.097 },
  zoom: 12,
  mapId: 'YOUR_MAP_ID' // Optional: for vector maps
});
```

### Step 3: Add CLU Layer with deck.gl

```javascript
// Your LandMapMagic API key (get free at landmapmagic.com)
const landmapApiKey = 'YOUR_API_KEY';

// Create CLU layer using TileJSON endpoint
const cluLayer = new deck.MVTLayer({
  id: 'clu-fields',
  data: `https://api.landmapmagic.com/clu.json?key=${landmapApiKey}`,
  minZoom: 11,
  maxZoom: 15,
  stroked: true,
  filled: false,
  lineWidthMinPixels: 2,
  getLineColor: [253, 224, 71, 230], // Yellow
  getLineWidth: 2,
  pickable: true,
  onClick: (info) => {
    if (info.object && info.object.properties) {
      const acres = info.object.properties.calcacres || 'Unknown';
      alert(`Field Size: ${acres} acres`);
    }
  }
});

// Add to Google Maps
const overlay = new deck.GoogleMapsOverlay({
  layers: [cluLayer]
});
overlay.setMap(map);
```

## That's it!

Your map now shows CLU field boundaries. Click on any field to see its acreage.

---

## Complete Minimal Example

```html
<!DOCTYPE html>
<html>
<head>
  <title>CLU Fields on Google Maps</title>
  <style>
    #map { height: 100vh; width: 100vw; }
  </style>
</head>
<body>
  <div id="map"></div>

  <!-- deck.gl -->
  <script src="https://unpkg.com/deck.gl@^9.0.0/dist.min.js"></script>
  <script src="https://unpkg.com/@deck.gl/google-maps@^9.0.0/dist.min.js"></script>

  <script>
    function initMap() {
      // Create Google Map
      const map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 41.878, lng: -93.097 }, // Iowa
        zoom: 12
      });

      // Add CLU layer
      const overlay = new deck.GoogleMapsOverlay({
        layers: [
          new deck.MVTLayer({
            id: 'clu',
            data: 'https://api.landmapmagic.com/clu.json?key=YOUR_API_KEY',
            stroked: true,
            filled: false,
            getLineColor: [253, 224, 71, 230],
            lineWidthMinPixels: 2,
            pickable: true,
            onClick: (info) => {
              if (info.object) {
                alert(`Acres: ${info.object.properties.calcacres}`);
              }
            }
          })
        ]
      });
      overlay.setMap(map);
    }
  </script>

  <!-- Google Maps -->
  <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_KEY&callback=initMap" async defer></script>
</body>
</html>
```

---

## Customization

### Change Border Color

```javascript
getLineColor: [255, 0, 0, 230]  // Red
getLineColor: [0, 255, 0, 230]  // Green
getLineColor: [0, 0, 255, 230]  // Blue
```

### Add Fill Color

```javascript
new deck.MVTLayer({
  // ... other props
  filled: true,
  getFillColor: [253, 224, 71, 50],  // Yellow with 50 opacity
  stroked: true,
  getLineColor: [253, 224, 71, 230]
})
```

### Thicker Lines

```javascript
lineWidthMinPixels: 4,  // Thicker borders
```

### Show Tooltips on Hover

```javascript
new deck.MVTLayer({
  // ... other props
  pickable: true,
  onHover: (info) => {
    if (info.object) {
      const acres = info.object.properties.calcacres;
      // Update a tooltip element or use Google Maps InfoWindow
      console.log(`Hovering over ${acres} acre field`);
    }
  }
})
```

---

## What Data is Available?

Each CLU field has these properties:

```javascript
{
  id: "unique-field-id",
  calcacres: 42.5,        // Calculated acreage
  state_fips: "19",       // State FIPS code
  county_fips: "153"      // County FIPS code
}
```

---

## API Endpoints

LandMapMagic provides standard MVT (Mapbox Vector Tile) endpoints:

### TileJSON Metadata
```
GET https://api.landmapmagic.com/clu.json?key=YOUR_KEY
```
Returns tile URL template and metadata.

### Individual Tiles
```
GET https://api.landmapmagic.com/clu/{z}/{x}/{y}.mvt?key=YOUR_KEY
```
Returns vector tile data for the specified tile coordinates.

---

## Performance

- **Tile Caching**: Tiles are cached for 30 days
- **Global CDN**: Served from Cloudflare edge network
- **Efficient**: Only loads tiles for visible area
- **Zoom Levels**: CLU data available at zoom 11-15

---

## React Example

```jsx
import { GoogleMapsOverlay } from '@deck.gl/google-maps';
import { MVTLayer } from '@deck.gl/geo-layers';
import { useEffect, useRef } from 'react';

function MapWithCLU() {
  const mapRef = useRef(null);
  const overlayRef = useRef(null);

  useEffect(() => {
    // Create Google Map
    const map = new google.maps.Map(mapRef.current, {
      center: { lat: 41.878, lng: -93.097 },
      zoom: 12
    });

    // Create CLU layer
    const cluLayer = new MVTLayer({
      id: 'clu',
      data: 'https://api.landmapmagic.com/clu.json?key=YOUR_KEY',
      stroked: true,
      filled: false,
      getLineColor: [253, 224, 71, 230],
      lineWidthMinPixels: 2
    });

    // Add overlay
    const overlay = new GoogleMapsOverlay({ layers: [cluLayer] });
    overlay.setMap(map);
    overlayRef.current = overlay;

    return () => overlay.setMap(null);
  }, []);

  return <div ref={mapRef} style={{ height: '100vh', width: '100%' }} />;
}
```

---

## Interactive Examples

### 1. Basic CLU Display
**File**: `google-maps-example.html`

Shows CLU field boundaries with acreage labels. Click fields to see details.

### 2. CLU AOI Query Demo
**File**: `google-maps-aoi-example.html`

Interactive example showing:
- Draw custom AOI (Area of Interest) polygons on the map
- Query CLU fields within the AOI using the `/aoi/query` API
- Display results with highlighting and statistics
- Calculate coverage percentages and total acreage

Perfect for:
- Farm/property boundary analysis
- Regional agricultural surveys
- Field-level data extraction

### 3. Selectable Fields
**File**: `google-maps-selectable.html`

Click-to-select multiple CLU fields with visual feedback.

## Getting Help

- **Documentation**: [landmapmagic.com/docs](https://landmapmagic.com/docs)
- **API Keys**: [landmapmagic.com/signup](https://landmapmagic.com/signup)
- **Support**: support@landmapmagic.com
- **Examples**: See `google-maps-example.html` and `google-maps-aoi-example.html`

---

## Other Datasets

LandMapMagic also provides:
- **SSURGO**: Soil survey data
- **CDL**: Cropland Data Layer
- **PLSS**: Public Land Survey System
- **States**: State boundaries

Use the same pattern - just change `clu` to the dataset name:
```javascript
data: 'https://api.landmapmagic.com/ssurgo.json?key=YOUR_KEY'
```
