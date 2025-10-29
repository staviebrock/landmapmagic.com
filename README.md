# landmapmagic

The easiest way to build maps about land in your apps.

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

#### More Examples

```tsx
// Only make SSURGO and PLSS available, with SSURGO visible on load
// Dont show legend
<LandMap 
  availableLayers={['ssurgo', 'plss']}
  initialVisibleLayers={['ssurgo']}
  showLegend={false}
/>
```

Built with ❤️ for the agricultural and geospatial communities.