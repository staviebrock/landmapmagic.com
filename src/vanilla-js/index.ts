/**
 * LandMapMagic Vanilla JS
 * 
 * For non-React applications (Flask, Django, PHP, plain HTML, etc.)
 * Provides a simple script tag integration for land mapping datasets
 * 
 * Usage:
 * <script src="https://static.landmapmagic.com/js/landmap-vanilla.js"></script>
 * <script>
 *   LandMapMagic.createMap('map-container', {
 *     apiKey: 'your-api-key',
 *     initialVisibleLayers: ['ssurgo']
 *   });
 * </script>
 */

import { installPmtilesProtocolMapLibre } from '../core/pmtilesProtocol.js';
import { makeSsurgoDataset, makeCdlDataset, makePlssDataset, makeCluDataset, makeStatesDataset } from '../core/makeVectorDataset.js';
import { getDefaultMapStyle, loadMapLibre } from '../react/utils.js';
import type { LandDatasets, VectorDataset } from '../core/types.js';
import type { Feature, Polygon } from 'geojson';

// Vanilla JS configuration interface
interface VanillaLandMapOptions {
  apiKey?: string;
  initialCenter?: [number, number];
  initialZoom?: number;
  style?: string | object;
  availableLayers?: Array<keyof LandDatasets>;
  initialVisibleLayers?: Array<keyof LandDatasets>;
  showLegend?: boolean;
  showClickInfo?: boolean;
  onMapLoad?: (map: VanillaLandMap) => void;
  onError?: (error: Error) => void;
}

// Main vanilla implementation class
class VanillaLandMap {
  private map: any;
  private datasets: LandDatasets;
  private options: Required<VanillaLandMapOptions>;
  private visibleLayers: Set<keyof LandDatasets>;
  private legendElement: HTMLElement | null = null;
  private clickInfoElement: HTMLElement | null = null;
  private container: HTMLElement;

  constructor(
    container: HTMLElement,
    map: any,
    datasets: LandDatasets,
    options: Required<VanillaLandMapOptions>
  ) {
    this.container = container;
    this.map = map;
    this.datasets = datasets;
    this.options = options;
    this.visibleLayers = new Set(options.initialVisibleLayers);
    
    this.initializeLayers();
    if (this.options.showLegend) {
      this.createLegend();
    }
    if (this.options.showClickInfo) {
      this.setupClickHandler();
    }
  }

  private initializeLayers() {
    console.log('🗺️ Initializing land datasets...');
    
    // Add sources and layers
    Object.entries(this.datasets).forEach(([datasetKey, dataset]: [string, VectorDataset]) => {
      const key = datasetKey as keyof LandDatasets;
      if (!this.options.availableLayers.includes(key)) return;
      
      console.log(`Adding dataset: ${dataset.id}`);
      
      // Add source
      if (!this.map.getSource(dataset.id)) {
        try {
          this.map.addSource(dataset.id, dataset.sourceProps);
          console.log(`✅ Source added: ${dataset.id}`);
        } catch (error) {
          console.error(`❌ Error adding source ${dataset.id}:`, error);
          return;
        }
      }
      
      // Add layers
      Object.entries(dataset.layers).forEach(([layerKey, layerConfig]) => {
        const layerId = `${dataset.id}-${layerKey}`;
        if (!this.map.getLayer(layerId)) {
          try {
            const isVisible = this.visibleLayers.has(key);
            this.map.addLayer({
              ...layerConfig,
              id: layerId,
              source: dataset.id,
              layout: {
                ...layerConfig.layout,
                visibility: isVisible ? 'visible' : 'none',
              },
            });
            console.log(`✅ Layer added: ${layerId} (${isVisible ? 'visible' : 'hidden'})`);
          } catch (error) {
            console.error(`❌ Error adding layer ${layerId}:`, error);
          }
        }
      });
    });
  }

  private createLegend() {
    const legendContainer = document.createElement('div');
    legendContainer.className = 'landmap-legend';
    legendContainer.style.cssText = `
      position: absolute;
      top: 10px;
      left: 10px;
      background: rgba(255, 255, 255, 0.95);
      padding: 12px;
      border-radius: 6px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      font-size: 13px;
      min-width: 180px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      z-index: 1000;
    `;
    
    // Make container relative if it isn't already
    if (getComputedStyle(this.container).position === 'static') {
      this.container.style.position = 'relative';
    }
    
    this.container.appendChild(legendContainer);
    this.legendElement = legendContainer;
    
    this.updateLegend();
  }

  private updateLegend() {
    if (!this.legendElement) return;
    
    let html = '<h4 style="margin: 0 0 12px 0; font-size: 14px; font-weight: bold; color: #333;">Map Layers</h4>';
    
    this.options.availableLayers.forEach((datasetKey) => {
      const dataset = this.datasets[datasetKey];
      if (!dataset) return;
      
      const isVisible = this.visibleLayers.has(datasetKey);
      const color = this.getDatasetColor(dataset.id);
      
      html += `
        <div class="layer-toggle" data-layer="${datasetKey}" style="
          display: flex;
          align-items: center;
          margin-bottom: 8px;
          cursor: pointer;
          padding: 6px 8px;
          border-radius: 4px;
          border: 1px solid transparent;
          transition: background-color 0.2s;
        ">
          <input type="checkbox" ${isVisible ? 'checked' : ''} style="margin-right: 10px; cursor: pointer;">
          <div style="
            width: 14px;
            height: 14px;
            margin-right: 8px;
            border-radius: 2px;
            background-color: ${color};
            opacity: ${isVisible ? 1 : 0.3};
            border: 1px solid rgba(0,0,0,0.2);
          "></div>
          <span style="color: ${isVisible ? '#333' : '#999'}; font-size: 13px; font-weight: 500; user-select: none;">
            ${dataset.name}
          </span>
        </div>
      `;
    });
    
    this.legendElement.innerHTML = html;
    
    // Add event listeners
    this.legendElement.querySelectorAll('.layer-toggle').forEach(element => {
      const layerKey = (element as HTMLElement).dataset.layer as keyof LandDatasets;
      
      element.addEventListener('click', (e) => {
        e.preventDefault();
        this.toggleLayer(layerKey);
      });
      
      element.addEventListener('mouseenter', (e) => {
        (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(0,0,0,0.05)';
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,0,0,0.1)';
      });
      
      element.addEventListener('mouseleave', (e) => {
        (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
        (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
      });
    });
  }

  private toggleLayer(datasetKey: keyof LandDatasets) {
    const dataset = this.datasets[datasetKey];
    if (!dataset) return;
    
    const isCurrentlyVisible = this.visibleLayers.has(datasetKey);
    
    // Toggle visibility for all layers in this dataset
    Object.keys(dataset.layers).forEach(layerKey => {
      const layerId = `${dataset.id}-${layerKey}`;
      if (this.map.getLayer(layerId)) {
        const newVisibility = !isCurrentlyVisible ? 'visible' : 'none';
        this.map.setLayoutProperty(layerId, 'visibility', newVisibility);
      }
    });
    
    // Update state
    if (isCurrentlyVisible) {
      this.visibleLayers.delete(datasetKey);
    } else {
      this.visibleLayers.add(datasetKey);
    }
    
    // Update legend
    this.updateLegend();
    
    console.log(`${dataset.name} ${!isCurrentlyVisible ? 'shown' : 'hidden'}`);
  }

  private getDatasetColor(id: string): string {
    switch (id) {
      case 'ssurgo': return '#2E8B57'; // SeaGreen for soil data
      case 'cdl': return '#FFD700'; // Gold for crop data
      case 'plss': return '#4A90E2'; // Blue for survey data
      case 'clu': return '#FF6B35'; // Orange for field boundaries
      default: return '#95A5A6'; // Gray fallback
    }
  }

  private setupClickHandler() {
    this.map.on('click', (e: any) => {
      // Query all visible layers for features at the click point
      const features = this.map.queryRenderedFeatures(e.point);
      
      if (features.length > 0) {
        // Find the first feature that has a corresponding click info config
        for (const feature of features) {
          const layerId = feature.layer.id;
          
          // Find which dataset this layer belongs to
          for (const [datasetKey, dataset] of Object.entries(this.datasets)) {
            const key = datasetKey as keyof LandDatasets;
            
            // Skip if not in available layers
            if (!this.options.availableLayers.includes(key)) continue;
            
            if (dataset.clickInfoConfig && 
                dataset.clickInfoConfig.layerIds && 
                dataset.clickInfoConfig.layerIds.includes(layerId)) {
              
              // Check if this layer is currently visible
              if (this.visibleLayers.has(key)) {
                this.showClickInfo(e.point.x, e.point.y, feature.properties, dataset.clickInfoConfig);
                return; // Stop at first match
              }
            }
          }
        }
      }
      
      // If no features found or clicked outside, close any open popup
      this.hideClickInfo();
    });
  }

  private showClickInfo(x: number, y: number, properties: Record<string, any>, config: any) {
    this.hideClickInfo(); // Close any existing popup
    
    const popup = document.createElement('div');
    popup.className = 'landmap-click-info';
    popup.setAttribute('data-click-info-popup', 'true');
    popup.style.cssText = `
      position: absolute;
      left: ${x}px;
      top: ${y}px;
      background: white;
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      font-size: 12px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 300px;
      z-index: 1001;
      transform: translate(-50%, -100%);
      margin-top: -10px;
    `;
    
    // Build content
    let html = '';
    if (config.title) {
      html += `<h4 style="margin: 0 0 8px 0; font-size: 13px; font-weight: bold;">${config.title(properties)}</h4>`;
    }
    
    config.fields.forEach((field: any) => {
      const value = properties[field.key];
      const displayValue = field.format ? field.format(value) : value;
      if (displayValue !== undefined && displayValue !== null) {
        html += `<div style="margin-bottom: 4px;"><strong>${field.label}:</strong> ${displayValue}</div>`;
      }
    });
    
    // Close button
    html += `<button onclick="this.parentElement.remove()" style="
      position: absolute;
      top: 4px;
      right: 4px;
      background: none;
      border: none;
      font-size: 16px;
      cursor: pointer;
      color: #999;
    ">×</button>`;
    
    popup.innerHTML = html;
    this.container.appendChild(popup);
    this.clickInfoElement = popup;
    
    // Auto-close after 10 seconds
    setTimeout(() => {
      if (popup.parentElement) {
        popup.remove();
      }
    }, 10000);
  }

  private hideClickInfo() {
    if (this.clickInfoElement && this.clickInfoElement.parentElement) {
      this.clickInfoElement.remove();
      this.clickInfoElement = null;
    }
  }

  // Public API methods
  public showLayer(datasetKey: keyof LandDatasets) {
    if (!this.visibleLayers.has(datasetKey)) {
      this.toggleLayer(datasetKey);
    }
  }

  public hideLayer(datasetKey: keyof LandDatasets) {
    if (this.visibleLayers.has(datasetKey)) {
      this.toggleLayer(datasetKey);
    }
  }

  public getVisibleLayers(): Array<keyof LandDatasets> {
    return Array.from(this.visibleLayers);
  }

  public getMap() {
    return this.map;
  }

  public destroy() {
    if (this.legendElement && this.legendElement.parentElement) {
      this.legendElement.remove();
    }
    if (this.clickInfoElement && this.clickInfoElement.parentElement) {
      this.clickInfoElement.remove();
    }
    if (this.map) {
      this.map.remove();
    }
  }
}

// Helper function to create land datasets (extracted from React hook)
function createLandDatasets(apiKey: string): LandDatasets {
  return {
    ssurgo: makeSsurgoDataset(apiKey),
    cdl: makeCdlDataset(apiKey),
    plss: makePlssDataset(apiKey),
    clu: makeCluDataset(apiKey),
    states: makeStatesDataset(apiKey),
  };
}

// Global namespace for vanilla JS usage
interface LandMapMagicGlobal {
  config: {
    defaultApiKey: string | null;
    defaultEndpoint: string;
  };
  configure: (options: Partial<LandMapMagicGlobal['config']>) => void;
  createMap: (containerId: string, options?: VanillaLandMapOptions) => Promise<VanillaLandMap>;
  autoInit: () => Promise<VanillaLandMap[]>;
}

// Create the global object
const LandMapMagic: LandMapMagicGlobal = {
  // Global configuration
  config: {
    defaultApiKey: null,
    defaultEndpoint: process.env.REACT_APP_LANDMAP_API_ENDPOINT || '/api/aoi/summary'
  },
  
  // Set global defaults
  configure(options: Partial<LandMapMagicGlobal['config']>) {
    Object.assign(this.config, options);
  },
  
  // Main map creation function
  async createMap(containerId: string, options: VanillaLandMapOptions = {}): Promise<VanillaLandMap> {
    console.log('🚀 Initializing LandMapMagic...');
    
    // Merge options with defaults
    const finalOptions: Required<VanillaLandMapOptions> = {
      apiKey: options.apiKey || this.config.defaultApiKey || 'dev',
      initialCenter: options.initialCenter || [-98.5795, 39.8283],
      initialZoom: options.initialZoom || 4,
      style: options.style || getDefaultMapStyle(),
      availableLayers: options.availableLayers || ['ssurgo', 'cdl', 'plss', 'clu'],
      initialVisibleLayers: options.initialVisibleLayers || [],
      showLegend: options.showLegend !== undefined ? options.showLegend : true,
      showClickInfo: options.showClickInfo !== undefined ? options.showClickInfo : true,
      onMapLoad: options.onMapLoad || (() => {}),
      onError: options.onError || ((error) => console.error('LandMapMagic Error:', error))
    };
    
    // Validate API key
    if (!finalOptions.apiKey) {
      const error = new Error('API key is required. Set it via options.apiKey or LandMapMagic.configure({ defaultApiKey: "your-key" })');
      finalOptions.onError(error);
      throw error;
    }
    
    // Get container element
    const container = document.getElementById(containerId);
    if (!container) {
      const error = new Error(`Container element with id "${containerId}" not found`);
      finalOptions.onError(error);
      throw error;
    }
    
    try {
      // Load MapLibre and initialize
      console.log('📦 Loading MapLibre GL JS...');
      const maplibregl = await loadMapLibre();
      installPmtilesProtocolMapLibre(maplibregl);
      
      // Create map
      console.log('🗺️ Creating map instance...');
      const map = new maplibregl.Map({
        container: containerId,
        style: finalOptions.style as any,
        center: finalOptions.initialCenter,
        zoom: finalOptions.initialZoom,
      });
      
      // Get land datasets
      console.log('🌾 Loading land datasets...');
      const datasets = createLandDatasets(finalOptions.apiKey);
      
      // Wait for map to load
      await new Promise<void>((resolve, reject) => {
        map.on('load', () => resolve());
        map.on('error', (e: any) => reject(new Error(`Map load error: ${e.error?.message || 'Unknown error'}`)));
        
        // Timeout after 30 seconds
        setTimeout(() => reject(new Error('Map load timeout')), 30000);
      });
      
      // Initialize the land map
      console.log('✅ Map loaded, initializing land datasets...');
      const landMap = new VanillaLandMap(container, map, datasets, finalOptions);
      
      // Call onMapLoad callback
      finalOptions.onMapLoad(landMap);
      
      console.log('🎉 LandMapMagic initialized successfully!');
      return landMap;
      
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      finalOptions.onError(err);
      throw err;
    }
  },
  
  // Auto-initialize maps from data attributes
  async autoInit(): Promise<VanillaLandMap[]> {
    const elements = document.querySelectorAll('[data-landmap-api-key]');
    const maps: VanillaLandMap[] = [];
    
    for (const element of elements) {
      const htmlElement = element as HTMLElement;
      
      if (!htmlElement.id) {
        console.warn('LandMapMagic: Element with data-landmap-api-key must have an id attribute', element);
        continue;
      }
      
      const options: VanillaLandMapOptions = {
        apiKey: htmlElement.dataset.landmapApiKey,
        initialCenter: htmlElement.dataset.landmapCenter?.split(',').map(Number) as [number, number],
        initialZoom: htmlElement.dataset.landmapZoom ? Number(htmlElement.dataset.landmapZoom) : undefined,
        availableLayers: htmlElement.dataset.landmapLayers?.split(',') as any,
        initialVisibleLayers: htmlElement.dataset.landmapVisible?.split(',') as any,
        showLegend: htmlElement.dataset.landmapLegend !== 'false',
        showClickInfo: htmlElement.dataset.landmapClickInfo !== 'false'
      };
      
      try {
        const map = await this.createMap(htmlElement.id, options);
        maps.push(map);
      } catch (error) {
        console.error(`Failed to initialize map for element ${htmlElement.id}:`, error);
      }
    }
    
    return maps;
  }
};

// Expose to global scope
declare global {
  interface Window {
    LandMapMagic: typeof LandMapMagic;
  }
}

if (typeof window !== 'undefined') {
  window.LandMapMagic = LandMapMagic;
}

// Export for module usage
export default LandMapMagic;
export { VanillaLandMap, type VanillaLandMapOptions };
