import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  // Load env file from root directory
  const env = loadEnv(mode, path.resolve(__dirname, '..'), '');
  
  return {
    plugins: [
      react(),
      {
        name: 'html-transform',
        transformIndexHtml(html) {
          return html
            .replace(/%VITE_GOOGLE_MAPS_API_KEY%/g, env.VITE_GOOGLE_MAPS_API_KEY || '')
            .replace(/%VITE_ARCGIS_API_KEY%/g, env.VITE_ARCGIS_API_KEY || '')
            .replace(/%VITE_LAND_MAP_MAGIC_API_KEY%/g, env.VITE_LAND_MAP_MAGIC_API_KEY || 'dev')
            .replace(/%VITE_LAND_MAP_MAGIC_API_URL%/g, env.VITE_LAND_MAP_MAGIC_API_URL || 'https://api.landmapmagic.com');
        }
      }
    ],
    resolve: {
      alias: {
        'landmapmagic/maplibre': path.resolve(__dirname, '../dist/maplibre.js'),
        'landmapmagic/mapbox': path.resolve(__dirname, '../dist/mapbox.js'),
        'landmapmagic': path.resolve(__dirname, '../dist/root.js'),
      }
    },
    server: {
      port: 3000,
      open: true
    },
    // Load .env files from the root directory (parent of examples/)
    envDir: path.resolve(__dirname, '..')
  };
});
