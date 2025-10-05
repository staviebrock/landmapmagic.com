# @landmapmagic

The easiest way to build maps about land in your apps.

A single npm package that makes it **extremely easy** for developers to display geospatial datasets (SSURGO, CDL, PLSS, etc.) in interactive maps.

## Features

- 🗺️ **Drop-in map component** - Get started in minutes with `<LandMap />`
- 🌾 **Built-in land datasets** - SSURGO soils, CDL crops, PLSS boundaries
- 🎛️ **Interactive legend** - Toggle layer visibility with built-in controls
- 📐 **AOI Query Tool** - Draw areas of interest and query features within them
- 📊 **Smart Results** - Get detailed summaries and statistics for queried areas
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
- Map Style: **No default - must be explicitly set**

### Basic Usage

```tsx
import { LandMap } from "@landmapmagic";

export default function App() {
  return (
    <LandMap 
      apiKey="your-api-key-here"
      initialVisibleLayers={['plss', 'ssurgo']}
      showLegend={true}
    />
  );
}
```

That's it! You now have a fully functional map with:
- Specified land datasets available (example shows PLSS and SSURGO)
- Interactive legend for toggling layer visibility
- Layers specified in `initialVisibleLayers` shown on load
- Built-in AOI query tool for spatial analysis
- Click-to-query feature information

> **Note:** By default, no layers are visible when the map loads (`initialVisibleLayers` defaults to `[]`). All 4 datasets are available to toggle by default (`availableLayers` defaults to all). This gives users full control over what they want to see.

#### More Examples

```tsx
// Only make SSURGO and PLSS available, with SSURGO visible on load
<LandMap 
  availableLayers={['ssurgo', 'plss']}
  initialVisibleLayers={['ssurgo']}
/>

// All layers available, none visible on load (default)
<LandMap />

// Only CLU available and visible
<LandMap 
  availableLayers={['clu']}
  initialVisibleLayers={['clu']}
/>
```

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

## AOI Query Tool

The built-in Area of Interest (AOI) Query Tool allows users to draw polygons on the map and get detailed information about features within those areas.

### How to Use

1. **Enable the tool**: Click the "📐 AOI Query Tool" button in the map legend
2. **Start drawing**: Click "Start Drawing" in the AOI tool panel
3. **Draw your area**: Click on the map to add points for your polygon
4. **Complete the area**: Double-click or click "Complete" when you have at least 3 points
5. **View results**: Results appear automatically in the bottom-left panel

### Features

- **Interactive drawing**: Click to add points, double-click to complete
- **Real-time feedback**: See your polygon as you draw
- **Smart queries**: Automatically queries all visible layers
- **Detailed results**: Get feature counts, areas, and layer-specific summaries
- **Expandable details**: Click layers in results to see individual feature properties

### Query Results

The AOI tool provides different types of analysis based on the layer:

#### SSURGO Soil Data
- Unique soil types count
- Map unit information
- Total acres by soil type
- Detailed soil properties

#### PLSS Survey Data  
- Administrative levels (states, counties, townships, sections)
- Unique boundary counts
- Geographic coverage summary

#### CDL Cropland Data
- Raster data coverage information
- Pixel-level analysis notes

### Programmatic Usage

You can also use the AOI components programmatically:

```tsx
import { AOIDrawer, AOIQuery, AOIResults } from "@landmapmagic";

function CustomMap() {
  const [aoi, setAOI] = useState(null);
  const [results, setResults] = useState([]);

  return (
    <div>
      <LandMap />
      
      <AOIDrawer
        map={mapRef.current}
        onAOIComplete={setAOI}
        isActive={true}
        onToggle={() => {}}
      />
      
      <AOIQuery
        map={mapRef.current}
        aoi={aoi}
        visibleLayers={['ssurgo', 'plss']}
        datasets={{ ssurgo, plss }}
        onResults={setResults}
      />
      
      <AOIResults
        results={results}
        aoi={aoi}
        onClose={() => setResults([])}
      />
    </div>
  );
}
```

## Advanced Usage

### With MapLibre GL JS

```tsx
import { Map, Source, Layer as MapLayer } from "react-map-gl/maplibre";
import { useLandMaps } from "@landmapmagic/maplibre";

function MyCustomMap() {
  const { ssurgo, cdl, plss } = useLandMaps();

  return (
    <Map>
      {/* SSURGO Soil Data */}
      <Source {...ssurgo.sourceProps}>
        <MapLayer {...ssurgo.layers.fill} />
        <MapLayer {...ssurgo.layers.outline} />
      </Source>
      
      {/* CDL Cropland Data */}
      <Source {...cdl.sourceProps}>
        <MapLayer {...cdl.layers.fill} />
      </Source>
      
      {/* PLSS Survey Data */}
      <Source {...plss.sourceProps}>
        <MapLayer {...plss.layers.township} />
        <MapLayer {...plss.layers.section} />
        <MapLayer {...plss.layers.labels} />
      </Source>
    </Map>
  );
}
```

### With Mapbox GL JS

```tsx
import { Map, Source, Layer as MapLayer } from "react-map-gl";
import { useLandMaps, InstallPmtilesProtocol } from "@landmapmagic/mapbox";

function MyMapboxMap() {
  const { ssurgo, cdl, plss } = useLandMaps();

  React.useEffect(() => {
    InstallPmtilesProtocol.install();
    return () => InstallPmtilesProtocol.uninstall();
  }, []);

  return (
    <Map 
      mapboxAccessToken={process.env.REACT_APP_MAPBOX_TOKEN}
    >
      {/* SSURGO Soil Data */}
      <Source {...ssurgo.sourceProps}>
        <MapLayer {...ssurgo.layers.fill} />
        <MapLayer {...ssurgo.layers.outline} />
      </Source>
      
      {/* CDL Cropland Data */}
      <Source {...cdl.sourceProps}>
        <MapLayer {...cdl.layers.fill} />
      </Source>
      
      {/* PLSS Survey Data */}
      <Source {...plss.sourceProps}>
        <MapLayer {...plss.layers.township} />
        <MapLayer {...plss.layers.section} />
        <MapLayer {...plss.layers.labels} />
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
- `apiKey?: string` - API key for accessing PMTiles and tile endpoints (default: `'dev'`)
- `initialCenter?: [number, number]` - Map center coordinates (default: `[-98.5795, 39.8283]`)
- `initialZoom?: number` - Initial zoom level (default: `4`)
- `style?: string | object` - Map style URL or style object (optional - uses environment variable or default)
- `availableLayers?: Array<'ssurgo' | 'cdl' | 'plss' | 'clu'>` - Which datasets are available to toggle in the legend (default: `['ssurgo', 'cdl', 'plss', 'clu']` - all layers)
- `initialVisibleLayers?: Array<'ssurgo' | 'cdl' | 'plss' | 'clu'>` - Which layers should be visible on load (default: `[]` - none visible)
- `showLegend?: boolean` - Show/hide the interactive legend (default: `true`)
- `showClickInfo?: boolean` - Show/hide click info popup (default: `true`)
- `className?: string` - CSS class name
- `height?: string | number` - Map height (default: `'500px'`)
- `width?: string | number` - Map width (default: `'100%'`)

### Hooks

#### `useLandMaps(apiKey?: string)`

Returns pre-configured land datasets with the specified API key.

```tsx
const { ssurgo, cdl, plss, clu } = useLandMaps('your-api-key');
// Or use default 'dev' key
const { ssurgo, cdl, plss, clu } = useLandMaps();
```

**Parameters:**
- `apiKey?: string` - API key for accessing PMTiles and tile endpoints (default: `'dev'`)

**Returns:**
- `ssurgo` - SSURGO soil data with fill and outline layers
- `cdl` - Cropland Data Layer with crop type styling  
- `plss` - Public Land Survey System with township/section boundaries
- `clu` - Common Land Units field boundaries

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

## Vanilla JS Version (Non-React)

For **Flask, Django, PHP, Rails, and plain HTML** applications, use the vanilla JavaScript version:

```html
<!-- Include MapLibre CSS -->
<link href='https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css' rel='stylesheet' />

<!-- Your map container -->
<div id="farm-map" style="width: 100%; height: 500px;"></div>

<!-- LandMapMagic Vanilla JS -->
<script src="https://static.landmapmagic.com/js/landmap-vanilla-latest.min.js"></script>
<script>
    LandMapMagic.createMap('farm-map', {
        apiKey: 'your-api-key',
        initialCenter: [-93.5, 42.0],
        initialVisibleLayers: ['ssurgo']
    });
</script>
```

### Framework Integration Examples

**Flask:**
```python
@app.route('/farm/<farm_id>')
def farm_view(farm_id):
    return render_template('farm.html', 
                         api_key=os.environ['LANDMAP_API_KEY'])
```

**Django:**
```python
def farm_view(request, farm_id):
    return render(request, 'farm.html', {
        'api_key': settings.LANDMAP_API_KEY
    })
```

**PHP:**
```php
<script>
    LandMapMagic.createMap('map', {
        apiKey: '<?php echo $apiKey; ?>',
        initialVisibleLayers: ['ssurgo']
    });
</script>
```

See `src/vanilla-js/README.md` for complete documentation and examples.

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

## Development

```bash
# Install dependencies
npm install

# Copy environment template (required for build)
cp .env.template .env
# Edit .env with your map style URL

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