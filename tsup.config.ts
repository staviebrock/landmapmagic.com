import { defineConfig } from "tsup";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Validate required environment variables
if (!process.env.REACT_APP_MAP_STYLE_URL) {
  console.error('❌ REACT_APP_MAP_STYLE_URL is required but not set!');
  console.error('Please set this environment variable in your .env file or environment.');
  console.error('Example: REACT_APP_MAP_STYLE_URL=https://demotiles.maplibre.org/style.json');
  process.exit(1);
}

console.log('✅ Building with map style:', process.env.REACT_APP_MAP_STYLE_URL);
if (process.env.REACT_APP_LANDMAP_API_ENDPOINT) {
  console.log('✅ Building with API endpoint:', process.env.REACT_APP_LANDMAP_API_ENDPOINT);
}

// Shared environment variables for all builds - using define to replace at build time
const sharedDefines = {
  'process.env.REACT_APP_MAP_STYLE_URL': JSON.stringify(process.env.REACT_APP_MAP_STYLE_URL),
  'process.env.REACT_APP_LANDMAP_API_ENDPOINT': JSON.stringify(process.env.REACT_APP_LANDMAP_API_ENDPOINT || '/api/aoi/summary'),
};

export default defineConfig([
  {
    entry: { root: "src/root.ts" },
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    external: ["react", "react-dom", "maplibre-gl", "mapbox-gl", "pmtiles", "@turf/turf"],
    clean: true,
    define: sharedDefines,
  },
  {
    entry: { maplibre: "src/maplibre.tsx" },
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    external: ["react", "react-dom", "maplibre-gl", "pmtiles", "@turf/turf"],
    clean: false,
    define: sharedDefines,
  },
  {
    entry: { mapbox: "src/mapbox.tsx" },
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    external: ["react", "react-dom", "mapbox-gl", "pmtiles", "@turf/turf"],
    clean: false,
    define: sharedDefines,
  },
]);
