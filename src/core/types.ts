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


// Component prop types
export interface LandMapProps {
  initialCenter?: [number, number];
  initialZoom?: number;
  style?: string | object;
  layers?: Array<keyof LandDatasets>;
  showDatasets?: Array<keyof LandDatasets>; // Deprecated: use layers instead
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
}


// Protocol types
export interface ProtocolHandler {
  install: (mapInstance?: any) => void;
  uninstall: () => void;
  isInstalled: () => boolean;
}
