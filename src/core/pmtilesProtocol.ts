import { PMTiles, Protocol } from 'pmtiles';
import type { ProtocolHandler } from './types.js';

// Global protocol state
let protocolInstalled = false;
let pmtilesInstances = new Map<string, PMTiles>();

/**
 * Install PMTiles protocol for MapLibre GL JS
 */
export function installPmtilesProtocolMapLibre(maplibregl?: any): void {
  if (protocolInstalled) {
    console.log('PMTiles protocol already installed');
    return;
  }

  const protocol = new Protocol();
  
  // Add debugging to the protocol handler
  const debugProtocol = {
    tile: (params: any, callback: any) => {
      console.log('PMTiles protocol called with params:', params);
      return protocol.tile(params, callback);
    }
  };
  
  if (maplibregl?.addProtocol) {
    maplibregl.addProtocol('pmtiles', debugProtocol.tile);
    protocolInstalled = true;
    console.log('PMTiles protocol installed successfully with MapLibre GL JS');
  } else if (typeof window !== 'undefined' && (window as any).maplibregl?.addProtocol) {
    (window as any).maplibregl.addProtocol('pmtiles', protocol.tile);
    protocolInstalled = true;
    console.log('PMTiles protocol installed successfully with global MapLibre GL JS');
  } else {
    console.warn('MapLibre GL JS not found. PMTiles protocol not installed.');
  }
}

/**
 * Install PMTiles protocol for Mapbox GL JS
 */
export function installPmtilesProtocolMapbox(mapboxgl?: any): void {
  if (protocolInstalled) return;

  const protocol = new Protocol();
  
  if (mapboxgl?.addProtocol) {
    mapboxgl.addProtocol('pmtiles', protocol.tile);
    protocolInstalled = true;
  } else if (typeof window !== 'undefined' && (window as any).mapboxgl?.addProtocol) {
    (window as any).mapboxgl.addProtocol('pmtiles', protocol.tile);
    protocolInstalled = true;
  } else {
    console.warn('Mapbox GL JS not found. PMTiles protocol not installed.');
  }
}

/**
 * Uninstall PMTiles protocol
 */
export function uninstallPmtilesProtocol(mapgl?: any): void {
  if (!protocolInstalled) return;

  if (mapgl?.removeProtocol) {
    mapgl.removeProtocol('pmtiles');
  } else if (typeof window !== 'undefined') {
    const globalMapLibre = (window as any).maplibregl;
    const globalMapbox = (window as any).mapboxgl;
    
    if (globalMapLibre?.removeProtocol) {
      globalMapLibre.removeProtocol('pmtiles');
    }
    if (globalMapbox?.removeProtocol) {
      globalMapbox.removeProtocol('pmtiles');
    }
  }

  // Clean up PMTiles instances
  pmtilesInstances.clear();
  protocolInstalled = false;
}

/**
 * Check if PMTiles protocol is installed
 */
export function isPmtilesProtocolInstalled(): boolean {
  return protocolInstalled;
}

/**
 * Create a PMTiles instance for a given URL
 */
export function createPmtilesInstance(url: string): PMTiles {
  if (pmtilesInstances.has(url)) {
    return pmtilesInstances.get(url)!;
  }

  const pmtiles = new PMTiles(url);
  pmtilesInstances.set(url, pmtiles);
  return pmtiles;
}

/**
 * MapLibre PMTiles protocol handler
 */
export const MapLibrePmtilesProtocol: ProtocolHandler = {
  install: (maplibregl?: any) => installPmtilesProtocolMapLibre(maplibregl),
  uninstall: () => uninstallPmtilesProtocol(),
  isInstalled: () => isPmtilesProtocolInstalled(),
};

/**
 * Mapbox PMTiles protocol handler
 */
export const MapboxPmtilesProtocol: ProtocolHandler = {
  install: (mapboxgl?: any) => installPmtilesProtocolMapbox(mapboxgl),
  uninstall: () => uninstallPmtilesProtocol(),
  isInstalled: () => isPmtilesProtocolInstalled(),
};

/**
 * Auto-install PMTiles protocol based on available map library
 */
export function autoInstallPmtilesProtocol(): void {
  if (protocolInstalled) return;

  if (typeof window !== 'undefined') {
    const globalMapLibre = (window as any).maplibregl;
    const globalMapbox = (window as any).mapboxgl;

    if (globalMapLibre) {
      installPmtilesProtocolMapLibre(globalMapLibre);
    } else if (globalMapbox) {
      installPmtilesProtocolMapbox(globalMapbox);
    }
  }
}
