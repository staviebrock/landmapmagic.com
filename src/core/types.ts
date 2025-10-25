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

// Click info configuration types
export interface ClickInfoField {
  key: string;
  label: string;
  format?: (value: any) => string;
}

export interface ClickInfoConfig {
  title?: (properties: Record<string, any>) => string;
  fields: ClickInfoField[];
  layerIds?: string[]; // Which layer IDs to listen for click events on
}

export interface VectorDataset {
  id: string;
  name: string;
  description?: string;
  sourceProps: DatasetSource;
  layers: Record<string, DatasetLayer>;
  attribution?: string;
  clickInfoConfig?: ClickInfoConfig;
}

// Land-specific dataset types
export interface SsurgoDataset extends VectorDataset {
  id: 'ssurgo';
}

export interface CdlDataset extends VectorDataset {
  id: 'cdl';
}

export interface PlssDataset extends VectorDataset {
  id: 'plss';
}

export interface CluDataset extends VectorDataset {
  id: 'clu';
}

export interface StatesDataset extends VectorDataset {
  id: 'states';
}

export interface LandDatasets {
  ssurgo: SsurgoDataset;
  cdl: CdlDataset;
  plss: PlssDataset;
  clu: CluDataset;
  states: StatesDataset;
}


// Component prop types
export interface LandMapProps {
  apiKey?: string; // API key for PMTiles and API calls - defaults to 'dev'
  baseApiUrl?: string; // Base API URL for all queries - defaults to staging endpoint
  initialCenter?: [number, number];
  initialZoom?: number;
  style?: string | object;
  availableLayers?: Array<keyof LandDatasets>; // Which layers are available to toggle - default: all (['ssurgo', 'cdl', 'plss', 'clu'])
  initialVisibleLayers?: Array<keyof LandDatasets>; // Which layers should be visible on load - default: []
  showLegend?: boolean; // Show/hide the legend - default true
  showClickInfo?: boolean; // Show/hide click info popup - default true
  className?: string;
  height?: string | number;
  width?: string | number;
}

// Hook return types
export interface UseLandMapsReturn {
  ssurgo: SsurgoDataset;
  cdl: CdlDataset;
  plss: PlssDataset;
  clu: CluDataset;
  states: StatesDataset | VectorDataset;
}


// Protocol types
export interface ProtocolHandler {
  install: (mapInstance?: any) => void;
  uninstall: () => void;
  isInstalled: () => boolean;
}
