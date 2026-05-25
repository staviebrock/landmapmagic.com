import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: { root: "src/root.ts" },
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    external: ["react", "react-dom", "maplibre-gl", "mapbox-gl", "@turf/turf"],
    // Note: pmtiles is NOT external - it must be bundled to avoid __publicField errors in web workers
    clean: true,
  },
  {
    entry: { maplibre: "src/maplibre.tsx" },
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    external: ["react", "react-dom", "maplibre-gl", "@turf/turf"],
    // Note: pmtiles is NOT external - it must be bundled to avoid __publicField errors in web workers
    clean: false,
  },
  {
    entry: { mapbox: "src/mapbox.tsx" },
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    external: ["react", "react-dom", "mapbox-gl", "@turf/turf"],
    // Note: pmtiles is NOT external - it must be bundled to avoid __publicField errors in web workers
    clean: false,
  },
  // Layers - pure data configs, no React dependency
  {
    entry: { layers: "src/layers.ts" },
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    external: ["@turf/turf"],
    clean: false,
  },
  // Style - MapLibre/Mapbox style spec JSON helpers, no React dependency
  {
    entry: { style: "src/style.ts" },
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    external: ["@turf/turf"],
    clean: false,
  },
  // Hooks - React hooks for existing MapLibre maps
  {
    entry: { hooks: "src/hooks.ts" },
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    external: ["react", "react-dom", "maplibre-gl", "mapbox-gl", "@turf/turf"],
    clean: false,
  },
  // Leaflet adapter - one-liner mount helper for Leaflet maps. Peer-deps
  // (`leaflet`, `leaflet.vectorgrid`) are supplied by the consumer.
  {
    entry: { leaflet: "src/leaflet/index.ts" },
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    external: ["@turf/turf", "leaflet"],
    clean: false,
  },
  // Google / deck.gl adapter - one-liner mount helper for Google Maps via
  // GoogleMapsOverlay. deck.gl deps are supplied by the consumer.
  {
    entry: { google: "src/google/index.ts" },
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    external: [
      "@turf/turf",
      "@deck.gl/core",
      "@deck.gl/layers",
      "@deck.gl/geo-layers",
      "@deck.gl/google-maps",
    ],
    clean: false,
  },
  // Vanilla JS build for non-React applications (Flask, Django, PHP, plain HTML, etc.)
  {
    entry: { 'landmap-vanilla': "src/vanilla-js/index.ts" },
    format: ["iife"], // Immediately Invoked Function Expression for browser
    globalName: 'LandMapMagic',
    dts: false, // No TypeScript definitions needed for vanilla JS
    sourcemap: true,
    minify: true,
    clean: false,
    // Bundle everything - no externals for vanilla version
    noExternal: ['maplibre-gl', 'pmtiles', '@turf/turf'],
    // Add banner for version info
    banner: {
      js: `/* LandMapMagic Vanilla JS v${JSON.stringify(process.env.npm_package_version || '0.1.0').slice(1, -1)} - For non-React apps */`
    },
    // Optimize for browser
    platform: 'browser',
    target: 'es2018',
    // Custom output naming
    outExtension({ format }) {
      return {
        js: '.js'
      }
    }
  }
]);
