import type { FeatureCollection } from 'geojson';

// Map library types
export type MapLibrary = 'maplibre' | 'mapbox';

// Geospatial data types
export interface LngLat {
  lng: number;
  lat: number;
}

export interface Bounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

// AOI (Area of Interest) types
export interface AoiPoint {
  id: string;
  coordinates: [number, number]; // [lng, lat]
}

export interface AoiPolygon {
  type: 'Polygon';
  coordinates: number[][][]; // GeoJSON Polygon coordinates
}

export interface AoiState {
  points: AoiPoint[];
  polygon: AoiPolygon | null;
  isDrawing: boolean;
  isComplete: boolean;
}

export type AoiMode = 'draw' | 'edit' | 'view';

// Dataset types
export interface DatasetLayer {
  id: string;
  type: 'fill' | 'line' | 'circle' | 'symbol' | 'raster' | 'fill-extrusion' | 'heatmap' | 'hillshade';
  paint?: Record<string, any>;
  layout?: Record<string, any>;
  filter?: any[];
  minzoom?: number;
  maxzoom?: number;
}

export interface DatasetSource {
  type: 'vector' | 'raster' | 'geojson' | 'image' | 'video' | 'canvas';
  url?: string;
  tiles?: string[];
  data?: FeatureCollection | string;
  scheme?: 'xyz' | 'tms';
  tileSize?: number;
  attribution?: string;
  bounds?: [number, number, number, number];
  minzoom?: number;
  maxzoom?: number;
  [key: string]: any;
}

export interface VectorDataset {
  id: string;
  name: string;
  description?: string;
  sourceProps: DatasetSource;
  layers: Record<string, DatasetLayer>;
  attribution?: string;
}

// Land-specific dataset types
export interface SsurgoDataset extends VectorDataset {
  id: 'ssurgo';
  name: 'SSURGO Soil Data';
}

export interface CdlDataset extends VectorDataset {
  id: 'cdl';
  name: 'Cropland Data Layer';
}

export interface PlssDataset extends VectorDataset {
  id: 'plss';
  name: 'Public Land Survey System';
}

export interface LandDatasets {
  ssurgo: SsurgoDataset;
  cdl: CdlDataset;
  plss: PlssDataset;
}

// API types
export interface AoiQueryOptions {
  endpoint: string;
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  timeout?: number;
  enableSSE?: boolean;
  onProgress?: (progress: number, message?: string) => void;
}

export interface AoiQueryResult {
  data: any;
  error?: string;
  loading: boolean;
  progress?: number;
}

// Component prop types
export interface LandMapProps {
  apiEndpoint?: string;
  initialCenter?: [number, number];
  initialZoom?: number;
  style?: string | object;
  onAoiResult?: (result: any) => void;
  onAoiChange?: (aoi: AoiState) => void;
  aoiMode?: AoiMode;
  showDatasets?: Array<keyof LandDatasets>;
  className?: string;
  height?: string | number;
  width?: string | number;
}

// Hook return types
export interface UseLandMapsReturn {
  ssurgo: SsurgoDataset;
  cdl: CdlDataset;
  plss: PlssDataset;
}

export interface UseAoiDrawReturn {
  aoi: AoiState;
  sourceProps: DatasetSource;
  layers: {
    points: DatasetLayer;
    polygon: DatasetLayer;
    line: DatasetLayer;
  };
  handleMapClick: (event: { lngLat: [number, number] }) => void;
  clearAoi: () => void;
  completeAoi: () => void;
  setMode: (mode: AoiMode) => void;
  mode: AoiMode;
}

export interface UseAoiQueryReturn extends AoiQueryResult {
  refetch: () => void;
  cancel: () => void;
}

// Protocol types
export interface ProtocolHandler {
  install: (mapInstance?: any) => void;
  uninstall: () => void;
  isInstalled: () => boolean;
}
