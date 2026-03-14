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
  'source-layer'?: string;  // For vector tile sources
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
  promoteId?: string | Record<string, string>;
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

export interface CountiesDataset extends VectorDataset {
  id: 'counties';
}

export interface TownshipsDataset extends VectorDataset {
  id: 'townships';
}

export interface SectionsDataset extends VectorDataset {
  id: 'sections';
}

export interface ParcelsDataset extends VectorDataset {
  id: 'parcels';
}

export interface LandDatasets {
  ssurgo: SsurgoDataset;
  cdl: CdlDataset;
  plss: PlssDataset;
  clu: CluDataset;
  states: StatesDataset;
  counties: CountiesDataset;
  townships: TownshipsDataset;
  sections: SectionsDataset;
  parcels: ParcelsDataset;
}


// Query tool types
export type QueryToolType = 'point' | 'aoi';

// Component prop types
export interface LandMapProps {
  apiKey?: string; // API key for tile endpoints and API calls - defaults to 'dev'
  baseApiUrl?: string; // Base API URL for all queries - defaults to staging endpoint
  initialCenter?: [number, number];
  initialZoom?: number;
  style?: string | object;
  availableLayers?: Array<keyof LandDatasets>; // Which layers are available to toggle - default: all (['ssurgo', 'cdl', 'plss', 'clu'])
  initialVisibleLayers?: Array<keyof LandDatasets>; // Which layers should be visible on load - default: []
  showLegend?: boolean; // Show/hide the legend - default true
  showClickInfo?: boolean; // Show/hide click info popup - default true
  showSearch?: boolean; // Show/hide the search box - default true
  showQueryTools?: boolean; // Show/hide query tools panel - default false
  availableQueryTools?: QueryToolType[]; // Which query tools to show - default: ['point', 'aoi']
  className?: string;
  height?: string | number;
  width?: string | number;
  borderColor?: string; // Border/outline color for layers - defaults vary by layer
  cdlYears?: string[]; // Available CDL years to choose from - default: ['2025', '2024', '2023', '2022', '2021', '2020']
  initialCdlYear?: string; // Initial CDL year to display - default: '2025'
  searchLimit?: number; // Maximum number of search results to show - default: 15
  persistSettings?: boolean; // Persist layer selection and CDL year to localStorage - default: false
  persistenceKey?: string; // Key prefix for localStorage - default: 'landmap'
  /** Called when the user selects a search result. Receives the full result object. */
  onSearchResultSelect?: (result: SearchResult) => void;
}

// Parcel details returned for 'parcel' type results
export interface SearchResultParcel {
  parcelId?: string;
  robustId?: string;
  owner?: string;
  address?: string;
  acreage?: number;
  acreageDeeded?: string;
  marketValue?: string;
  landUseClass?: string;
  legalDescription?: string;
  countyId?: number;
}

// Search result type from API
export interface SearchResult {
  id: string;
  name: string;
  simpleName: string;
  /** Result type: 'state' | 'county' | 'plss_township' | 'plss_section' | 'address' | 'parcel' */
  type: string;
  bbox?: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  centroid?: [number, number]; // [lng, lat]
  suggestedZoom?: number;
  score?: number;
  /** State abbreviation (e.g. 'IA') */
  state?: string | null;
  /** Full state name (e.g. 'Iowa') */
  stateName?: string | null;
  // County context (present on plss_township and plss_section results)
  countyFips?: string;
  countyName?: string;
  // PLSS context (present on plss_township results)
  townshipId?: string;
  townshipLabel?: string;
  plssMeridian?: string;
  plssTownNum?: number;
  plssTownDir?: string;
  plssRangeNum?: number;
  plssRangeDir?: string;
  // PLSS section context (present on plss_section results)
  plssSection?: number;
  // Parcel-specific fields (present on 'parcel' type results)
  parcel?: SearchResultParcel;
  county?: { fips: number; name: string };
  /** State name used for parcel lookup (e.g. 'Iowa') */
  region?: string;
}

// Hook return types
export interface UseLandMapsReturn {
  ssurgo: SsurgoDataset;
  cdl: CdlDataset;
  plss: PlssDataset;
  clu: CluDataset;
  states: StatesDataset | VectorDataset;
  counties: CountiesDataset;
  townships: TownshipsDataset;
  sections: SectionsDataset;
  parcels: ParcelsDataset;
}
