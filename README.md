# @landmapmagic

The easiest way to build maps about land in your apps.

A single npm package that makes it **extremely easy** for developers to display geospatial datasets (SSURGO, CDL, PLSS, etc.), draw Areas of Interest (AOIs), and query a backend.

## Features

- 🗺️ **Drop-in map component** - Get started in minutes with `<LandMap />`
- 🌾 **Built-in land datasets** - SSURGO soils, CDL crops, PLSS boundaries
- ✏️ **AOI drawing** - Interactive polygon drawing with real-time feedback
- 🔌 **Backend integration** - Automatic API queries with debouncing and progress
- 📦 **Multiple adapters** - Works with both MapLibre GL JS and Mapbox GL JS
- 🎯 **TypeScript support** - Full type safety and IntelliSense
- 🚀 **Bundle efficient** - Peer dependencies externalized, tree-shakeable

## Quick Start

### Installation

```bash
npm install @landmapmagic maplibre-gl react react-dom
```

### Build-Time Configuration (Required)

**IMPORTANT:** You must configure the map style URL before building this package. The `REACT_APP_MAP_STYLE_URL` environment variable is **mandatory** and gets baked into the bundle at build time.

```bash
# REQUIRED: Map Style Configuration  
REACT_APP_MAP_STYLE_URL=https://api.maptiler.com/maps/basic-v2/style.json?key=YOUR_KEY

# OPTIONAL: API Configuration
REACT_APP_LANDMAP_API_ENDPOINT=https://your-api.com/aoi/summary
```

**Setup Steps:**

1. **For local development:** Copy `.env.template` to `.env` and set your map style URL
2. **For CI/CD:** Set `REACT_APP_MAP_STYLE_URL` in your build environment (GitHub Actions, Vercel, Netlify, etc.)
3. **Build the package:** The build will fail if `REACT_APP_MAP_STYLE_URL` is not set

**Example Map Style URLs:**
- MapTiler: `https://api.maptiler.com/maps/basic-v2/style.json?key=YOUR_KEY`
- Mapbox: `mapbox://styles/mapbox/streets-v11` 
- OpenStreetMap: `https://demotiles.maplibre.org/style.json`

**Defaults:**
- API Endpoint: `/api/aoi/summary` (if not specified) - **Returns fake data for development**
- Map Style: **No default - must be explicitly set**

**Development Mode:**
When using the default API endpoint (`/api/aoi/summary`), the component automatically returns realistic fake data instead of making HTTP requests. This allows you to develop and test AOI drawing functionality before implementing your backend API.

### Basic Usage

```tsx
import { LandMap } from "@landmapmagic";

export default function App() {
  return (
    <LandMap 
      onAoiResult={(result) => console.log('AOI data:', result)}
    />
  );
}
```

That's it! You now have a fully functional map with:
- SSURGO soil data
- CDL cropland data  
- PLSS survey boundaries

## Building and Publishing

When building this package for distribution, ensure the environment variable is set:

```bash
# Set the required environment variable
export REACT_APP_MAP_STYLE_URL=https://demotiles.maplibre.org/style.json

# Build the package
npm run build

# Publish (if you're a maintainer)
npm publish
```

The build process will fail with a clear error message if `REACT_APP_MAP_STYLE_URL` is not set, ensuring that published packages always have a valid map style configured.
- Interactive AOI drawing
- Automatic backend queries

## Advanced Usage

### With MapLibre GL JS

```tsx
import { Map, Source, Layer as MapLayer } from "react-map-gl/maplibre";
import { useLandMaps, useAoiDraw, useAoiQuery } from "@landmapmagic/maplibre";

function MyCustomMap() {
  const { ssurgo, cdl, plss } = useLandMaps();
  const aoi = useAoiDraw();
  const { data, loading } = useAoiQuery(aoi.aoi.polygon, { 
    endpoint: "/api/aoi/summary" 
  });

  return (
    <Map onClick={(e) => aoi.handleMapClick({ lngLat: [e.lngLat.lng, e.lngLat.lat] })}>
      {/* Land datasets */}
      <Source {...ssurgo.sourceProps}>
        <MapLayer {...ssurgo.layers.fill} />
      </Source>
      
      {/* AOI drawing */}
      <Source {...aoi.sourceProps}>
        <MapLayer {...aoi.layers.polygon} />
        <MapLayer {...aoi.layers.points} />
      </Source>
    </Map>
  );
}
```

### With Mapbox GL JS

```tsx
import { Map, Source, Layer as MapLayer } from "react-map-gl";
import { useLandMaps, useAoiDraw, InstallPmtilesProtocol } from "@landmapmagic/mapbox";

function MyMapboxMap() {
  const { ssurgo } = useLandMaps();
  const aoi = useAoiDraw();

  React.useEffect(() => {
    InstallPmtilesProtocol.install();
    return () => InstallPmtilesProtocol.uninstall();
  }, []);

  return (
    <Map 
      mapboxAccessToken={process.env.REACT_APP_MAPBOX_TOKEN}
      onClick={(e) => aoi.handleMapClick({ lngLat: [e.lngLat.lng, e.lngLat.lat] })}
    >
      <Source {...ssurgo.sourceProps}>
        <MapLayer {...ssurgo.layers.fill} />
      </Source>
      <Source {...aoi.sourceProps}>
        <MapLayer {...aoi.layers.polygon} />
      </Source>
    </Map>
  );
}
```

## API Reference

### Components

#### `<LandMap />`

Drop-in map component with all features enabled.

**Props:**
- `apiEndpoint?: string` - Backend API endpoint for AOI queries (optional - uses environment variable or default)
- `initialCenter?: [number, number]` - Map center coordinates (default: `[-98.5795, 39.8283]`)
- `initialZoom?: number` - Initial zoom level (default: `4`)
- `style?: string | object` - Map style URL or style object (optional - uses environment variable or default)
- `onAoiResult?: (result: any) => void` - Callback when AOI query completes
- `onAoiChange?: (aoi: AoiState) => void` - Callback when AOI changes
- `aoiMode?: 'draw' | 'edit' | 'view'` - AOI interaction mode (default: `'draw'`)
- `showDatasets?: Array<'ssurgo' | 'cdl' | 'plss'>` - Which datasets to show (default: all)
- `className?: string` - CSS class name
- `height?: string | number` - Map height (default: `'500px'`)
- `width?: string | number` - Map width (default: `'100%'`)

### Hooks

#### `useLandMaps()`

Returns pre-configured land datasets.

```tsx
const { ssurgo, cdl, plss } = useLandMaps();
```

**Returns:**
- `ssurgo` - SSURGO soil data with fill and outline layers
- `cdl` - Cropland Data Layer with crop type styling  
- `plss` - Public Land Survey System with township/section boundaries

#### `useAoiDraw(mode?)`

Manages AOI drawing state and interactions.

```tsx
const aoi = useAoiDraw('draw');
```

**Parameters:**
- `mode?: 'draw' | 'edit' | 'view'` - Initial interaction mode

**Returns:**
- `aoi: AoiState` - Current AOI state (points, polygon, etc.)
- `sourceProps: DatasetSource` - GeoJSON source for map rendering
- `layers: { points, polygon, line }` - Layer configurations
- `handleMapClick: (event) => void` - Handle map click events
- `clearAoi: () => void` - Clear current AOI
- `completeAoi: () => void` - Complete current AOI
- `setMode: (mode) => void` - Change interaction mode
- `mode: AoiMode` - Current mode

#### `useAoiQuery(polygon, options, debounceMs?)`

Handles backend API queries for AOI data.

```tsx
const { data, loading, error } = useAoiQuery(
  aoi.polygon,
  { endpoint: '/api/aoi/summary' },
  1000
);
```

**Parameters:**
- `polygon: AoiPolygon | null` - AOI polygon to query
- `options: AoiQueryOptions` - Query configuration
- `debounceMs?: number` - Debounce delay in milliseconds (default: `500`)

**Options:**
- `endpoint: string` - API endpoint URL
- `method?: 'GET' | 'POST'` - HTTP method (default: `'POST'`)
- `headers?: Record<string, string>` - Additional headers
- `timeout?: number` - Request timeout (default: `30000`)
- `enableSSE?: boolean` - Enable Server-Sent Events for progress
- `onProgress?: (progress, message?) => void` - Progress callback

**Returns:**
- `data: any` - Query result data
- `loading: boolean` - Loading state
- `error?: string` - Error message if query failed
- `progress?: number` - Progress percentage (0-100) if SSE enabled
- `refetch: () => void` - Manually refetch data
- `cancel: () => void` - Cancel current request

### Utilities

#### `InstallPmtilesProtocol`

Protocol handler for PMTiles support.

```tsx
// MapLibre
import { InstallPmtilesProtocol } from "@landmap/maplibre";
InstallPmtilesProtocol.install();

// Mapbox  
import { InstallPmtilesProtocol } from "@landmap/mapbox";
InstallPmtilesProtocol.install();
```

## Package Exports

The package provides multiple entry points for different use cases:

- `@landmapmagic` - Root export with drop-in `<LandMap />` component (MapLibre-based)
- `@landmapmagic/maplibre` - Full MapLibre adapter with hooks and utilities
- `@landmapmagic/mapbox` - Full Mapbox adapter with hooks and utilities

## Peer Dependencies

The package requires these peer dependencies:

```json
{
  "maplibre-gl": "^3",      // For MapLibre support
  "mapbox-gl": "^2",        // For Mapbox support (optional)
  "react": "^18 || ^19",
  "react-dom": "^18 || ^19"
}
```

Install only what you need:

```bash
# For MapLibre (recommended)
npm install @landmapmagic maplibre-gl react react-dom

# For Mapbox
npm install @landmapmagic mapbox-gl react react-dom

# For both
npm install @landmapmagic maplibre-gl mapbox-gl react react-dom
```

## Dataset Information

### SSURGO (Soil Survey Geographic Database)
- **Source:** USDA Natural Resources Conservation Service
- **Content:** Detailed soil information including soil types, properties, and hydric soil classification
- **Zoom levels:** 10-16 (high detail)
- **Styling:** Color-coded by soil properties with hydric soil highlighting

### CDL (Cropland Data Layer)  
- **Source:** USDA National Agricultural Statistics Service
- **Content:** Annual crop type classification
- **Zoom levels:** 8-14 (field level)
- **Styling:** Color-coded by crop type (corn, soybeans, wheat, etc.)

### PLSS (Public Land Survey System)
- **Source:** Bureau of Land Management
- **Content:** Township, range, and section boundaries
- **Zoom levels:** 6-16 (multiple scales)
- **Styling:** Township lines (red), section lines (teal), with labels at high zoom

## Backend Integration

The package expects your backend API to accept AOI polygons and return analysis results:

### Request Format (POST)
```json
{
  "aoi": {
    "type": "Polygon",
    "coordinates": [[[lng, lat], [lng, lat], ...]]
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Response Format
```json
{
  "area": 1234.5,
  "soilTypes": ["Mollisols", "Alfisols"],
  "cropTypes": ["corn", "soybeans"],
  "analysis": { ... }
}
```

### Server-Sent Events (Optional)
For long-running analysis, enable SSE for progress updates:

```tsx
const { data, progress } = useAoiQuery(polygon, {
  endpoint: '/api/aoi/analyze',
  enableSSE: true,
  onProgress: (progress, message) => {
    console.log(`${progress}%: ${message}`);
  }
});
```

Your backend should send progress events:
```
data: {"progress": 25, "message": "Analyzing soil data..."}

data: {"progress": 50, "message": "Processing crop data..."}

data: {"progress": 100, "complete": true, "data": {...}}
```

## Development

```bash
# Install dependencies
npm install

# Copy environment template (optional)
cp .env.template .env
# Edit .env with your local API endpoint

# Build the package
npm run build

# Run type checking
npm run typecheck

# Watch mode for development
npm run dev
```

### Environment Variables

The package includes a `.env.template` file showing all available build-time configuration options. These variables are processed during the build and compiled into the bundle - they're not read at runtime.

**Key points:**
- Variables are for **build-time configuration only**
- Perfect for CI/CD pipelines with different environments
- End users don't need to configure anything
- All variables are optional with sensible defaults

## License

MIT

## Contributing

Contributions welcome! Please read our contributing guidelines and submit pull requests to our GitHub repository.

---

Built with ❤️ for the agricultural and geospatial communities.