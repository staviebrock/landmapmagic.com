import { useState, useCallback, useRef, useEffect } from 'react';
// @ts-ignore
import * as turf from '@turf/turf';
import type { Feature, Polygon, Position } from 'geojson';
import { DEFAULT_WORKER_ENDPOINT } from '../core/utils.js';

// CDL Crop lookup — USDA NASS official colormap (RGB from source COG palette)
const CDL_CROPS: Record<number, { name: string; color: string }> = {
  1: { name: 'Corn', color: '#FFD400' },
  2: { name: 'Cotton', color: '#FF2626' },
  3: { name: 'Rice', color: '#00A9E6' },
  4: { name: 'Sorghum', color: '#FF9E0F' },
  5: { name: 'Soybeans', color: '#267300' },
  6: { name: 'Sunflower', color: '#FFFF00' },
  10: { name: 'Peanuts', color: '#70A800' },
  11: { name: 'Tobacco', color: '#00AF4D' },
  12: { name: 'Sweet Corn', color: '#E0A60F' },
  13: { name: 'Pop or Orn Corn', color: '#E0A60F' },
  14: { name: 'Mint', color: '#80D4FF' },
  21: { name: 'Barley', color: '#E2007F' },
  22: { name: 'Durum Wheat', color: '#8A6453' },
  23: { name: 'Spring Wheat', color: '#D9B56C' },
  24: { name: 'Winter Wheat', color: '#A87000' },
  25: { name: 'Other Small Grains', color: '#D69DBC' },
  26: { name: 'Dbl Crop WinWht/Soybeans', color: '#737300' },
  27: { name: 'Rye', color: '#AE017E' },
  28: { name: 'Oats', color: '#A15889' },
  29: { name: 'Millet', color: '#73004C' },
  30: { name: 'Speltz', color: '#D69DBC' },
  31: { name: 'Canola', color: '#D1FF00' },
  32: { name: 'Flaxseed', color: '#8099FF' },
  33: { name: 'Safflower', color: '#D6D600' },
  34: { name: 'Rape Seed', color: '#D1FF00' },
  35: { name: 'Mustard', color: '#00AF4D' },
  36: { name: 'Alfalfa', color: '#FFA8E3' },
  37: { name: 'Other Hay/Non Alfalfa', color: '#A5F58D' },
  38: { name: 'Camelina', color: '#00AF4D' },
  39: { name: 'Buckwheat', color: '#D69DBC' },
  41: { name: 'Sugarbeets', color: '#A900E6' },
  42: { name: 'Dry Beans', color: '#A80000' },
  43: { name: 'Potatoes', color: '#732600' },
  44: { name: 'Other Crops', color: '#00AF4D' },
  45: { name: 'Sugarcane', color: '#B380FF' },
  46: { name: 'Sweet Potatoes', color: '#732600' },
  47: { name: 'Misc Vegs & Fruits', color: '#FF6666' },
  48: { name: 'Watermelons', color: '#FF6666' },
  49: { name: 'Onions', color: '#FFCC66' },
  50: { name: 'Cucumbers', color: '#FF6666' },
  51: { name: 'Chick Peas', color: '#00AF4D' },
  52: { name: 'Lentils', color: '#00DEB0' },
  53: { name: 'Peas', color: '#55FF00' },
  54: { name: 'Tomatoes', color: '#F5A27A' },
  55: { name: 'Caneberries', color: '#FF6666' },
  56: { name: 'Hops', color: '#00AF4D' },
  57: { name: 'Herbs', color: '#80D4FF' },
  58: { name: 'Clover/Wildflowers', color: '#E8BEFF' },
  59: { name: 'Sod/Grass Seed', color: '#B2FFDE' },
  60: { name: 'Switchgrass', color: '#00AF4D' },
  61: { name: 'Fallow/Idle Cropland', color: '#BFBF7A' },
  63: { name: 'Forest', color: '#95CE93' },
  64: { name: 'Shrubland', color: '#C7D79E' },
  65: { name: 'Barren', color: '#CCBFA3' },
  66: { name: 'Cherries', color: '#FF00FF' },
  67: { name: 'Peaches', color: '#FF91AB' },
  68: { name: 'Apples', color: '#B90050' },
  69: { name: 'Grapes', color: '#704489' },
  70: { name: 'Christmas Trees', color: '#007878' },
  71: { name: 'Other Tree Crops', color: '#B39C70' },
  72: { name: 'Citrus', color: '#FFFF80' },
  74: { name: 'Pecans', color: '#B6705C' },
  75: { name: 'Almonds', color: '#00A884' },
  76: { name: 'Walnuts', color: '#EBD6B0' },
  77: { name: 'Pears', color: '#B39C70' },
  81: { name: 'Clouds/No Data', color: '#F7F7F7' },
  82: { name: 'Developed', color: '#9C9C9C' },
  83: { name: 'Water', color: '#4D70A3' },
  87: { name: 'Wetlands', color: '#80B3B3' },
  88: { name: 'Nonag/Undefined', color: '#E9FFBE' },
  92: { name: 'Aquaculture', color: '#00FFFF' },
  111: { name: 'Open Water', color: '#4D70A3' },
  112: { name: 'Perennial Ice/Snow', color: '#D4E3FC' },
  121: { name: 'Developed/Open Space', color: '#9C9C9C' },
  122: { name: 'Developed/Low Intensity', color: '#9C9C9C' },
  123: { name: 'Developed/Med Intensity', color: '#9C9C9C' },
  124: { name: 'Developed/High Intensity', color: '#9C9C9C' },
  131: { name: 'Barren', color: '#CCBFA3' },
  141: { name: 'Deciduous Forest', color: '#95CE93' },
  142: { name: 'Evergreen Forest', color: '#95CE93' },
  143: { name: 'Mixed Forest', color: '#95CE93' },
  152: { name: 'Shrubland', color: '#C7D79E' },
  176: { name: 'Grass/Pasture', color: '#E9FFBE' },
  190: { name: 'Woody Wetlands', color: '#80B3B3' },
  195: { name: 'Herbaceous Wetlands', color: '#80B3B3' },
  204: { name: 'Pistachios', color: '#00FF8C' },
  205: { name: 'Triticale', color: '#D69DBC' },
  206: { name: 'Carrots', color: '#FF6666' },
  207: { name: 'Asparagus', color: '#FF6666' },
  208: { name: 'Garlic', color: '#FF6666' },
  209: { name: 'Cantaloupes', color: '#FF6666' },
  210: { name: 'Prunes', color: '#FF91AB' },
  211: { name: 'Olives', color: '#344A34' },
  212: { name: 'Oranges', color: '#E67525' },
  213: { name: 'Honeydew Melons', color: '#FF6666' },
  214: { name: 'Broccoli', color: '#FF6666' },
  215: { name: 'Avocados', color: '#66994D' },
  216: { name: 'Peppers', color: '#FF6666' },
  217: { name: 'Pomegranates', color: '#B39C70' },
  218: { name: 'Nectarines', color: '#FF91AB' },
  219: { name: 'Greens', color: '#FF6666' },
  220: { name: 'Plums', color: '#FF91AB' },
  221: { name: 'Strawberries', color: '#FF6666' },
  222: { name: 'Squash', color: '#FF6666' },
  223: { name: 'Apricots', color: '#FF91AB' },
  224: { name: 'Vetch', color: '#00AF4D' },
  225: { name: 'Dbl Crop WinWht/Corn', color: '#FFD400' },
  226: { name: 'Dbl Crop Oats/Corn', color: '#FFD400' },
  227: { name: 'Lettuce', color: '#FF6666' },
  228: { name: 'Dbl Crop Triticale/Corn', color: '#FFD400' },
  229: { name: 'Pumpkins', color: '#FF6666' },
  230: { name: 'Dbl Crop Lettuce/Durum Wht', color: '#8A6453' },
  231: { name: 'Dbl Crop Lettuce/Cantaloupe', color: '#FF6666' },
  232: { name: 'Dbl Crop Lettuce/Cotton', color: '#FF2626' },
  233: { name: 'Dbl Crop Lettuce/Barley', color: '#E2007F' },
  234: { name: 'Dbl Crop Durum Wht/Sorghum', color: '#FF9E0F' },
  235: { name: 'Dbl Crop Barley/Sorghum', color: '#FF9E0F' },
  236: { name: 'Dbl Crop WinWht/Sorghum', color: '#A87000' },
  237: { name: 'Dbl Crop Barley/Corn', color: '#FFD400' },
  238: { name: 'Dbl Crop WinWht/Cotton', color: '#A87000' },
  239: { name: 'Dbl Crop Soybeans/Cotton', color: '#267300' },
  240: { name: 'Dbl Crop Soybeans/Oats', color: '#267300' },
  241: { name: 'Dbl Crop Corn/Soybeans', color: '#FFD400' },
  242: { name: 'Blueberries', color: '#000099' },
  243: { name: 'Cabbage', color: '#FF6666' },
  244: { name: 'Cauliflower', color: '#FF6666' },
  245: { name: 'Celery', color: '#FF6666' },
  246: { name: 'Radishes', color: '#FF6666' },
  247: { name: 'Turnips', color: '#FF6666' },
  248: { name: 'Eggplants', color: '#FF6666' },
  249: { name: 'Gourds', color: '#FF6666' },
  250: { name: 'Cranberries', color: '#FF6666' },
  254: { name: 'Dbl Crop Barley/Soybeans', color: '#267300' },
};

// Available layers for AOI query (matching the real API)
const AVAILABLE_LAYERS = ['states', 'counties', 'townships', 'sections', 'clu', 'cdl'] as const;
type LayerType = typeof AVAILABLE_LAYERS[number];

// Simple styles
const styles = {
  container: {
    position: 'absolute' as const,
    top: '60px',
    right: '10px',
    background: 'rgba(255, 255, 255, 0.98)',
    backdropFilter: 'blur(8px)',
    borderRadius: '6px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
    fontSize: '13px',
    width: '320px',
    maxHeight: '75vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column' as const,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    zIndex: 1000,
  },
  header: {
    padding: '12px 14px',
    borderBottom: '1px solid #e4e4e7',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    margin: 0,
    fontSize: '14px',
    fontWeight: 600,
    color: '#18181b',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: '#71717a',
    cursor: 'pointer',
    fontSize: '18px',
    padding: '0 4px',
    lineHeight: 1,
  },
  section: {
    padding: '12px 14px',
    borderBottom: '1px solid #e4e4e7',
  },
  sectionLabel: {
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    color: '#71717a',
    marginBottom: '8px',
  },
  layerButton: (isSelected: boolean) => ({
    padding: '5px 10px',
    background: isSelected ? '#18181b' : 'white',
    border: `1px solid ${isSelected ? '#18181b' : '#d4d4d8'}`,
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: 500,
    color: isSelected ? 'white' : '#52525b',
  }),
  primaryButton: {
    flex: 1,
    padding: '8px 14px',
    background: '#18181b',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 600,
    color: 'white',
  },
  secondaryButton: {
    padding: '8px 14px',
    background: 'white',
    border: '1px solid #d4d4d8',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 500,
    color: '#52525b',
  },
  infoBox: {
    padding: '10px',
    background: '#f4f4f5',
    borderRadius: '4px',
    fontSize: '11px',
    color: '#52525b',
  },
  scrollArea: {
    flex: 1,
    overflow: 'auto',
    padding: '12px 14px',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '24px 10px',
    color: '#71717a',
  },
  resultCard: {
    padding: '10px 12px',
    background: '#fafafa',
    border: '1px solid #e4e4e7',
    borderRadius: '6px',
    marginBottom: '8px',
  },
  spinner: {
    width: '20px',
    height: '20px',
    border: '2px solid #e4e4e7',
    borderTop: '2px solid #18181b',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 8px',
  },
  errorBox: {
    padding: '10px',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '4px',
    color: '#dc2626',
    fontSize: '12px',
  },
};

export interface CropStats {
  code: number;
  name: string;
  pixel_count: number;
  acres: number;
  percent: number;
}

export interface CDLResult {
  aoi_area: { acres: number; hectares: number; square_meters: number };
  year: string;
  crop_summary: { total_pixels: number; total_acres: number; crops: CropStats[] };
  query_info: { processing_time_ms: number; tiles_queried: number; zoom_level: number };
}

export interface VectorLayerResult {
  layer: string;
  feature_count: number;
  features: Array<{
    id: string | number;
    name: string;
    properties: Record<string, any>;
  }>;
}

export interface AOIQueryResponse {
  aoi_area: { acres: number; hectares: number; square_meters: number; square_kilometers: number; square_miles: number };
  results_by_layer: Record<string, VectorLayerResult>;
  cdl_results: Record<string, CDLResult>;
  layers_queried: string[];
  total_features_found: number;
  query_info: {
    timestamp: string;
    account_id: string;
    processing_time_ms: number;
    layers_queried: { vector: string[]; cdl_years: string[] };
  };
}

export interface AOIQueryWidgetProps {
  map: any;
  apiKey: string;
  baseApiUrl?: string;
  isActive: boolean;
  onToggle: () => void;
  availableLayers?: LayerType[];
  cdlYears?: string[];
  maxAcres?: number;
  onResults?: (results: AOIQueryResponse | null) => void;
}

export function AOIQueryWidget({
  map,
  apiKey,
  baseApiUrl,
  isActive,
  onToggle,
  availableLayers = ['states', 'counties', 'townships', 'sections', 'clu', 'cdl'],
  cdlYears = ['2025', '2024', '2023', '2022', '2021', '2020'],
  maxAcres = 1000,
  onResults
}: AOIQueryWidgetProps) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<Position[]>([]);
  const [selectedLayers, setSelectedLayers] = useState<Set<LayerType>>(new Set(['clu', 'cdl']));
  const [selectedCdlYears, setSelectedCdlYears] = useState<Set<string>>(new Set(['2024']));
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<AOIQueryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentAOI, setCurrentAOI] = useState<Feature<Polygon> | null>(null);

  const baseUrl = baseApiUrl || DEFAULT_WORKER_ENDPOINT;
  
  const drawingRef = useRef<{
    points: Position[];
    markers: string[];
    tempLine: string | null;
  }>({
    points: [],
    markers: [],
    tempLine: null
  });

  const toggleLayer = (layer: LayerType) => {
    setSelectedLayers(prev => {
      const next = new Set(prev);
      if (next.has(layer)) {
        next.delete(layer);
      } else {
        next.add(layer);
      }
      return next;
    });
  };

  const toggleCdlYear = (year: string) => {
    setSelectedCdlYears(prev => {
      const next = new Set(prev);
      if (next.has(year)) {
        next.delete(year);
      } else {
        next.add(year);
      }
      return next;
    });
  };

  const cleanupDrawing = useCallback(() => {
    if (!map) return;
    drawingRef.current.markers.forEach(pointId => {
      if (map.getLayer(pointId)) map.removeLayer(pointId);
      if (map.getSource(pointId)) map.removeSource(pointId);
    });
    drawingRef.current.markers = [];
    if (drawingRef.current.tempLine && map.getLayer(drawingRef.current.tempLine)) {
      map.removeLayer(drawingRef.current.tempLine);
      map.removeSource(drawingRef.current.tempLine);
    }
    drawingRef.current.tempLine = null;
    if (map.getLayer('aoi-fill')) map.removeLayer('aoi-fill');
    if (map.getLayer('aoi-outline')) map.removeLayer('aoi-outline');
    if (map.getSource('aoi')) map.removeSource('aoi');
    drawingRef.current.points = [];
    setCurrentPoints([]);
    setIsDrawing(false);
  }, [map]);

  const startDrawing = useCallback(() => {
    if (!map || isDrawing) return;
    cleanupDrawing();
    setIsDrawing(true);
    setResults(null);
    setError(null);
    setCurrentAOI(null);
    map.getCanvas().style.cursor = 'crosshair';
  }, [map, isDrawing, cleanupDrawing]);

  const addPoint = useCallback((lngLat: [number, number]) => {
    if (!map) return;
    const newPoints = [...drawingRef.current.points, lngLat];
    drawingRef.current.points = newPoints;
    setCurrentPoints(newPoints);

    try {
      const pointId = `aoi-drawing-point-${newPoints.length}`;
      if (map.getLayer(pointId)) map.removeLayer(pointId);
      if (map.getSource(pointId)) map.removeSource(pointId);

      map.addSource(pointId, {
        type: 'geojson',
        data: { type: 'Feature', geometry: { type: 'Point', coordinates: lngLat }, properties: {} }
      });
      map.addLayer({
        id: pointId,
        type: 'circle',
        source: pointId,
        paint: { 'circle-radius': 5, 'circle-color': '#18181b', 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 2 }
      });
      drawingRef.current.markers.push(pointId);
    } catch (err) {
      console.error('Error adding point marker:', err);
    }

    if (newPoints.length > 1) {
      const lineId = 'aoi-temp-line';
      const lineData = { type: 'Feature' as const, geometry: { type: 'LineString' as const, coordinates: newPoints }, properties: {} };
      if (drawingRef.current.tempLine && map.getLayer(drawingRef.current.tempLine)) {
        map.removeLayer(drawingRef.current.tempLine);
        map.removeSource(drawingRef.current.tempLine);
      }
      map.addSource(lineId, { type: 'geojson', data: lineData });
      map.addLayer({
        id: lineId,
        type: 'line',
        source: lineId,
        paint: { 'line-color': '#18181b', 'line-width': 2, 'line-dasharray': [2, 2] }
      });
      drawingRef.current.tempLine = lineId;
    }
  }, [map]);

  const completeDrawing = useCallback(() => {
    if (!map || drawingRef.current.points.length < 3) {
      setError('Please draw at least 3 points');
      return;
    }
    const closedPoints = [...drawingRef.current.points, drawingRef.current.points[0]];
    const aoiFeature: Feature<Polygon> = {
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [closedPoints] },
      properties: { area: turf.area({ type: 'Feature', geometry: { type: 'Polygon', coordinates: [closedPoints] }, properties: {} }) }
    };

    const areaAcres = (aoiFeature.properties?.area || 0) / 4047;
    if (areaAcres > maxAcres) {
      setError(`Area too large (${areaAcres.toFixed(1)} acres). Max: ${maxAcres} acres`);
      cleanupDrawing();
      return;
    }

    displayAOI(aoiFeature);
    setCurrentAOI(aoiFeature);

    drawingRef.current.markers.forEach(pointId => {
      if (map.getLayer(pointId)) map.removeLayer(pointId);
      if (map.getSource(pointId)) map.removeSource(pointId);
    });
    drawingRef.current.markers = [];
    if (drawingRef.current.tempLine && map.getLayer(drawingRef.current.tempLine)) {
      map.removeLayer(drawingRef.current.tempLine);
      map.removeSource(drawingRef.current.tempLine);
    }
    drawingRef.current.tempLine = null;
    drawingRef.current.points = [];
    setCurrentPoints([]);
    setIsDrawing(false);
    map.getCanvas().style.cursor = '';
  }, [map, maxAcres, cleanupDrawing]);

  const displayAOI = useCallback((aoi: Feature<Polygon>) => {
    if (!map) return;
    if (map.getLayer('aoi-fill')) map.removeLayer('aoi-fill');
    if (map.getLayer('aoi-outline')) map.removeLayer('aoi-outline');
    if (map.getSource('aoi')) map.removeSource('aoi');
    map.addSource('aoi', { type: 'geojson', data: aoi });
    map.addLayer({ id: 'aoi-fill', type: 'fill', source: 'aoi', paint: { 'fill-color': '#18181b', 'fill-opacity': 0.15 } });
    map.addLayer({ id: 'aoi-outline', type: 'line', source: 'aoi', paint: { 'line-color': '#18181b', 'line-width': 2 } });
  }, [map]);

  // Build layers array for API request
  const buildLayersArray = useCallback(() => {
    const layers: string[] = [];
    selectedLayers.forEach(layer => {
      if (layer === 'cdl') {
        // CDL with year support: "cdl:2024,2023,2022"
        const years = Array.from(selectedCdlYears);
        if (years.length > 0) {
          layers.push(`cdl:${years.join(',')}`);
        }
      } else {
        layers.push(layer);
      }
    });
    return layers;
  }, [selectedLayers, selectedCdlYears]);

  // Query AOI with all selected layers
  const queryAOI = useCallback(async () => {
    if (!currentAOI) {
      setError('Please draw an area first');
      return;
    }

    const layers = buildLayersArray();
    if (layers.length === 0) {
      setError('Please select at least one layer');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${baseUrl}/v1/data/aoi?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aoi: currentAOI,
          layers,
          options: { includeGeometry: false, includeMetadata: true }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      const data: AOIQueryResponse = await response.json();
      setResults(data);
      onResults?.(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Query failed';
      setError(message);
      setResults(null);
      onResults?.(null);
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, baseUrl, currentAOI, buildLayersArray, onResults]);

  const clearAOI = useCallback(() => {
    cleanupDrawing();
    setCurrentAOI(null);
    setResults(null);
    setError(null);
    if (map) map.getCanvas().style.cursor = '';
  }, [cleanupDrawing, map]);

  useEffect(() => {
    if (!map || !isActive) return;
    const handleClick = (e: any) => {
      if (isDrawing) addPoint([e.lngLat.lng, e.lngLat.lat]);
    };
    const handleDoubleClick = (e: any) => {
      if (isDrawing) {
        e.preventDefault();
        completeDrawing();
      }
    };
    map.on('click', handleClick);
    map.on('dblclick', handleDoubleClick);
    return () => {
      map.off('click', handleClick);
      map.off('dblclick', handleDoubleClick);
    };
  }, [map, isActive, isDrawing, addPoint, completeDrawing]);

  useEffect(() => {
    if (!isActive) clearAOI();
  }, [isActive, clearAOI]);

  if (!isActive) return null;

  const aoiAcres = currentAOI ? (currentAOI.properties?.area || 0) / 4047 : 0;
  const showCdlYears = selectedLayers.has('cdl');

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h4 style={styles.title}>Area Query</h4>
        <button onClick={onToggle} style={styles.closeButton}>×</button>
      </div>

      {/* Layer Selection */}
      <div style={styles.section}>
        <div style={styles.sectionLabel}>Layers to Query</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {availableLayers.map(layer => (
            <button
              key={layer}
              onClick={() => toggleLayer(layer)}
              style={styles.layerButton(selectedLayers.has(layer))}
            >
              {layer}
            </button>
          ))}
        </div>

        {/* CDL Year Selection */}
        {showCdlYears && (
          <div style={{ marginTop: '10px' }}>
            <div style={{ ...styles.sectionLabel, marginBottom: '6px' }}>CDL Years</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {cdlYears.map(year => (
                <button
                  key={year}
                  onClick={() => toggleCdlYear(year)}
                  style={{
                    ...styles.layerButton(selectedCdlYears.has(year)),
                    padding: '3px 8px',
                    fontSize: '10px',
                  }}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Drawing Controls */}
      <div style={styles.section}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {!isDrawing && !currentAOI && (
            <button onClick={startDrawing} style={styles.primaryButton}>
              Start Drawing
            </button>
          )}
          {isDrawing && (
            <button
              onClick={completeDrawing}
              disabled={currentPoints.length < 3}
              style={{
                ...styles.primaryButton,
                opacity: currentPoints.length >= 3 ? 1 : 0.5,
                cursor: currentPoints.length >= 3 ? 'pointer' : 'not-allowed',
              }}
            >
              Complete ({currentPoints.length} pts)
            </button>
          )}
          {currentAOI && !isLoading && (
            <button onClick={queryAOI} style={styles.primaryButton}>
              Query Layers
            </button>
          )}
          {(isDrawing || currentAOI) && (
            <button onClick={clearAOI} style={styles.secondaryButton}>
              Clear
            </button>
          )}
        </div>

        {isDrawing && (
          <div style={{ ...styles.infoBox, marginTop: '10px' }}>
            <div style={{ fontWeight: 600, marginBottom: '2px' }}>Drawing...</div>
            <div>Click to add points • Double-click to finish</div>
          </div>
        )}

        {currentAOI && (
          <div style={{ ...styles.infoBox, marginTop: '10px' }}>
            <strong>Area:</strong> {aoiAcres.toFixed(2)} acres
          </div>
        )}
      </div>

      {/* Results Area */}
      <div style={styles.scrollArea}>
        {isLoading && (
          <div style={{ textAlign: 'center', padding: '20px', color: '#71717a' }}>
            <div style={styles.spinner} />
            Querying...
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {error && <div style={styles.errorBox}>{error}</div>}

        {!isLoading && !error && !results && !currentAOI && (
          <div style={styles.emptyState}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>📐</div>
            <div>Draw an area to query</div>
          </div>
        )}

        {results && (
          <>
            {/* Summary */}
            <div style={{ ...styles.resultCard, background: '#f4f4f5' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '12px' }}>
                <span style={{ color: '#71717a' }}>Total Area</span>
                <span style={{ fontWeight: 600, color: '#18181b' }}>{results.aoi_area?.acres?.toFixed(1) || aoiAcres.toFixed(1)} ac</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '12px' }}>
                <span style={{ color: '#71717a' }}>Layers Queried</span>
                <span style={{ fontWeight: 600, color: '#18181b' }}>{results.layers_queried?.length || 0}</span>
              </div>
              <div style={{ fontSize: '10px', color: '#a1a1aa', textAlign: 'right' }}>
                {results.query_info?.processing_time_ms}ms
              </div>
            </div>

            {/* Vector Layer Results */}
            {results.results_by_layer && Object.keys(results.results_by_layer).length > 0 && (
              <>
                <div style={styles.sectionLabel}>Vector Layers</div>
                {Object.entries(results.results_by_layer).map(([layerName, layerData]) => (
                  <div key={layerName} style={styles.resultCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', color: '#18181b' }}>{layerName}</span>
                      <span style={{ fontSize: '11px', color: '#71717a' }}>{layerData.feature_count} features</span>
                    </div>
                    {layerData.features && layerData.features.slice(0, 5).map((feature, idx) => (
                      <div key={idx} style={{ fontSize: '11px', color: '#52525b', padding: '4px 0', borderTop: idx > 0 ? '1px solid #e4e4e7' : 'none' }}>
                        {feature.name || `Feature ${feature.id}`}
                      </div>
                    ))}
                    {layerData.features && layerData.features.length > 5 && (
                      <div style={{ fontSize: '10px', color: '#a1a1aa', marginTop: '4px' }}>
                        + {layerData.features.length - 5} more
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}

            {/* CDL Results */}
            {results.cdl_results && Object.keys(results.cdl_results).length > 0 && (
              <>
                <div style={{ ...styles.sectionLabel, marginTop: '12px' }}>CDL Crop Data</div>
                {Object.entries(results.cdl_results).map(([yearKey, cdlData]) => {
                  if ('error' in cdlData) {
                    return (
                      <div key={yearKey} style={{ ...styles.resultCard, borderColor: '#fecaca' }}>
                        <div style={{ fontWeight: 600, fontSize: '12px', color: '#dc2626' }}>{yearKey}</div>
                        <div style={{ fontSize: '11px', color: '#dc2626' }}>{(cdlData as any).error}</div>
                      </div>
                    );
                  }
                  const data = cdlData as CDLResult;
                  return (
                    <div key={yearKey} style={styles.resultCard}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 600, fontSize: '12px', color: '#18181b' }}>{data.year}</span>
                        <span style={{ fontSize: '10px', color: '#a1a1aa' }}>{data.query_info?.processing_time_ms}ms</span>
                      </div>
                      
                      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {data.crop_summary?.crops?.map((crop) => {
                          const cropInfo = CDL_CROPS[crop.code];
                          const barColor = cropInfo?.color || '#71717a';
                          return (
                            <div key={crop.code} style={{ marginBottom: '6px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: barColor, display: 'inline-block' }} />
                                  <span style={{ fontWeight: 500, color: '#18181b', fontSize: '11px' }}>{crop.name}</span>
                                </div>
                                <span style={{ fontSize: '10px', color: '#71717a' }}>{crop.percent?.toFixed(1)}%</span>
                              </div>
                              <div style={{ height: '3px', background: '#e4e4e7', borderRadius: '2px', overflow: 'hidden' }}>
                                <div style={{ width: `${Math.min(crop.percent || 0, 100)}%`, height: '100%', background: barColor }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
