<div align="center">
  <img src="https://landmapmagic.com/static/LandMapMagic_logo.png" alt="LandMapMagic Logo" width="400">

<br>

  The easiest way to build land maps in your apps
</div>

A single npm package that makes it **extremely easy** for developers to display geospatial datasets (CLU, SSURGO, CDL, PLSS, etc.) in interactive maps.

## Features

- 🗺️ **Drop-in map component** - Get started in minutes with `<LandMap />`
- 🌾 **Built-in land datasets** - CLU, SSURGO soils, CDL crops, PLSS boundaries
- 🎛️ **Interactive legend** - Toggle layer visibility with built-in controls
- 📐 **AOI Query Tool** - Draw areas of interest and query features within them
- 📊 **Smart Results** - Get detailed summaries and statistics for queried areas
- 📦 **Multiple adapters** - Works with both MapLibre GL JS and Mapbox GL JS
- 🎯 **TypeScript support** - Full type safety and IntelliSense
- 🚀 **Bundle efficient** - Peer dependencies externalized, tree-shakeable

## Quick Start

```bash
npm install landmapmagic maplibre-gl react react-dom
```

### Basic Usage

```tsx
import { LandMap } from "landmapmagic";

export default function App() {
  return (
    <LandMap 
      apiKey="your-api-key-here"
    />
  );
}
```

### All Available Props

Here's a comprehensive example showing all available props and how to use them:

```tsx
import { LandMap } from "landmapmagic";

export default function App() {
  return (
    <LandMap 
      // API Configuration
      apiKey="your-api-key-here"              // Your API key
      
      // Map Configuration
      initialCenter={[-93.5, 42.0]}           // [longitude, latitude] - defaults to US center
      initialZoom={12}                        // Zoom level (0-22) - defaults to 4
      style="mapbox://styles/mapbox/satellite-v9"  // Map style URL or object
      
      // Layer Configuration
      availableLayers={['clu', 'ssurgo', 'cdl', 'plss']}  // Which layers users can toggle
      initialVisibleLayers={['clu', 'ssurgo']}            // Layers visible on load
      
      // UI Configuration
      showLegend={true}                       // Show layer toggle legend - defaults to true
      showClickInfo={true}                    // Show feature info on click - defaults to true
      
      // Styling
      className="my-custom-map"               // CSS class name
      height="600px"                          // Map height - defaults to '500px'
      width="100%"                            // Map width - defaults to '100%'
    />
  );
}
```

#### Available Layers

- `'clu'` - Common Land Units (field boundaries)
- `'ssurgo'` - SSURGO soil data
- `'cdl'` - Cropland Data Layer
- `'plss'` - Public Land Survey System
- `'states'` - US state boundaries

#### Simple Examples

```tsx
// Minimal setup - just CLU layer
<LandMap apiKey="your-key" />

// Multiple layers visible on load
<LandMap 
  apiKey="your-key"
  availableLayers={['clu', 'ssurgo', 'plss']}
  initialVisibleLayers={['clu', 'ssurgo']}
/>

// Custom size and no legend
<LandMap 
  apiKey="your-key"
  height="800px"
  width="100%"
  showLegend={false}
/>

// Focused on specific area
<LandMap 
  apiKey="your-key"
  initialCenter={[-93.5, 42.0]}  // Iowa
  initialZoom={14}
  availableLayers={['clu', 'ssurgo']}
  initialVisibleLayers={['clu']}
/>
```

## Using Without React

For Flask, Django, PHP, or plain HTML apps, use the CDN version:

```html
<!-- Add the script -->
<script src="https://landmapmagic.com/js/landmap-latest.min.js"></script>

<!-- Create a map container -->
<div id="map" style="width: 100%; height: 500px;"></div>

<!-- Initialize the map -->
<script>
  LandMapMagic.createMap('map', {
    apiKey: 'your-api-key',
    initialVisibleLayers: ['clu']
  });
</script>
```

### Pinned Version (Recommended for Production)

```html
<!-- Use a specific version that won't auto-update -->
<script src="https://landmapmagic.com/js/landmap-1.2.3.min.js"></script>
```

Check [Releases](https://github.com/staviebrock/landmapmagic.com/releases) for the latest version number.

Built with ❤️ for the agricultural and geospatial communities.

## Environment Variables

For local development and examples, create a `.env.local` file in the `examples/` directory:

```bash
# Copy env.example to .env.local in the examples/ directory
cd examples
cp env.example .env.local
```

Then edit `.env.local` and add your API keys:

```bash
# Google Maps API Key (required for Google Maps examples)
# Get your key at: https://console.cloud.google.com/google/maps-apis
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# LandMapMagic API Key
# Get your key at: https://staging-api.landmapmagic.com/admin
VITE_LAND_MAP_MAGIC_API_KEY=your_landmap_api_key_here

# Mapbox Access Token (required for Mapbox examples)
VITE_MAPBOX_TOKEN=your_mapbox_token_here
```

### Development vs Production API Keys

**Development Environment:**
- For local testing with a development API instance, you can use `VITE_LAND_MAP_MAGIC_API_KEY=dev`
- This **only works** with API instances that have `ENVIRONMENT=development` set
- Typically used with `http://localhost:8787` or local development servers

**Staging/Production Environments:**
- You **must** use a real API key obtained from the admin portal
- The `dev` key will **not work** with staging or production APIs
- Register at your API URL's `/admin` endpoint to get an API key

When you run `npm run dev` in the `examples/` directory, Vite will:
1. Load these environment variables from `.env.local`
2. Inject them into the HTML examples at build time
3. Replace placeholders like `%VITE_LAND_MAP_MAGIC_API_KEY%` with actual values

**Note:** After creating or modifying `.env.local`, restart the Vite dev server.

See [`examples/SETUP.md`](./examples/SETUP.md) for detailed setup instructions.

## Integration Guides

### Existing MapLibre Map
Already have a MapLibre map? Add CLU boundaries in 3 lines of code: [`docs/maplibre/README.md`](./docs/maplibre/README.md)

### Google Maps
Need to overlay CLU boundaries on an existing Google Maps implementation? Follow the step-by-step guide in [`docs/google-maps/README.md`](./docs/google-maps/README.md).