import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: { root: "src/root.ts" },
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    external: ["react", "react-dom", "maplibre-gl", "mapbox-gl", "pmtiles", "@turf/turf"],
    clean: true,
  },
  {
    entry: { maplibre: "src/maplibre.tsx" },
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    external: ["react", "react-dom", "maplibre-gl", "pmtiles", "@turf/turf"],
    clean: false,
  },
  {
    entry: { mapbox: "src/mapbox.tsx" },
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    external: ["react", "react-dom", "mapbox-gl", "pmtiles", "@turf/turf"],
    clean: false,
  },
]);
