/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_MAPS_API_KEY?: string
  readonly VITE_LANDMAP_API_KEY?: string
  readonly VITE_MAPBOX_TOKEN?: string
  readonly VITE_STAGE_DEV_API_URL?: string
  readonly VITE_STAGE_STAGING_API_URL?: string
  readonly VITE_STAGE_PROD_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

