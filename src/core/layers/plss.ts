import type { PlssDataset } from '../types.js';
import { makeVectorDataset } from '../makeVectorDataset.js';

// Default worker endpoint from environment or fallback
const getDefaultWorkerEndpoint = (): string => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env.REACT_APP_WORKER_ENDPOINT || 'http://localhost:8787';
  }
  return 'http://localhost:8787';
};

const DEFAULT_WORKER_ENDPOINT = getDefaultWorkerEndpoint();

/**
 * Create PLSS (Public Land Survey System) dataset
 * Matches the hierarchical structure from the working frontend prototype
 */
export function makePlssDataset(): PlssDataset {
  return makeVectorDataset({
    id: 'plss',
    name: 'Public Land Survey System',
    description: 'Hierarchical PLSS data with states, counties, townships, and sections',
    url: `pmtiles://${DEFAULT_WORKER_ENDPOINT}/plss.pmtiles?key=dev`,
    sourceLayer: 'plss',
    attribution: '© Bureau of Land Management',
    minzoom: 0,
    maxzoom: 16,
    layers: {
      // Hierarchical fill layer with different colors for each admin level
      fill: {
        type: 'fill',
        paint: {
          'fill-color': [
            'case',
            ['==', ['get', 'admin_level'], 'state'], '#4A90E2',      // Blue for states
            ['==', ['get', 'admin_level'], 'county'], '#FFA500',     // Orange for counties
            ['==', ['get', 'admin_level'], 'township'], '#228B22',   // Green for townships
            ['==', ['get', 'admin_level'], 'section'], '#DC143C',    // Red for sections
            '#808080' // Gray for unknown
          ],
          'fill-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 0.1,   // Very transparent at world scale
            4, 0.2,   // Light at country scale
            8, 0.4,   // Medium at state scale
            12, 0.6   // More visible at detailed scale
          ]
        },
        layout: {}
      },
      // Hierarchical outline layer with different colors and widths
      outline: {
        type: 'line',
        paint: {
          'line-color': [
            'case',
            ['==', ['get', 'admin_level'], 'state'], '#2E5BBA',      // Dark blue for states
            ['==', ['get', 'admin_level'], 'county'], '#CC7A00',     // Dark orange for counties
            ['==', ['get', 'admin_level'], 'township'], '#1A5F1A',   // Dark green for townships
            ['==', ['get', 'admin_level'], 'section'], '#A01030',    // Dark red for sections
            '#404040' // Dark gray for unknown
          ],
          'line-width': [
            'case',
            ['==', ['get', 'admin_level'], 'state'], 3,      // Thick for states
            ['==', ['get', 'admin_level'], 'county'], 2,     // Medium for counties
            ['==', ['get', 'admin_level'], 'township'], 1.5, // Thin for townships
            ['==', ['get', 'admin_level'], 'section'], 1,    // Very thin for sections
            1 // Default
          ],
          'line-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 0.3,   // Faint at world scale
            4, 0.5,   // Medium at country scale
            8, 0.7,   // Good at state scale
            12, 0.9   // Full at detailed scale
          ]
        },
        layout: {}
      },
      // State Labels
      stateLabels: {
        type: 'symbol',
        paint: {
          'text-color': '#2E5BBA',
          'text-halo-color': '#FFFFFF',
          'text-halo-width': 2
        },
        layout: {
          'text-field': ['get', 'state_name'],
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 3, 12, 6, 18],
          'text-anchor': 'center',
          'text-transform': 'uppercase'
        },
        filter: ['==', ['get', 'admin_level'], 'state_label'],
        maxzoom: 8
      },
      // County Labels
      countyLabels: {
        type: 'symbol',
        paint: {
          'text-color': '#CC7A00',
          'text-halo-color': '#FFFFFF',
          'text-halo-width': 1
        },
        layout: {
          'text-field': ['get', 'county_name'],
          'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
          'text-size': 14,
          'text-anchor': 'center'
        },
        filter: ['==', ['get', 'admin_level'], 'county_label'],
        minzoom: 6,
        maxzoom: 8
      },
      // Township Labels
      townshipLabels: {
        type: 'symbol',
        paint: {
          'text-color': '#1A5F1A',
          'text-halo-color': '#FFFFFF',
          'text-halo-width': 1
        },
        layout: {
          'text-field': [
            'format',
            ['get', 'township_name'], {},
            '\n', {},
            ['get', 'TWNSHPLAB'], { 'font-scale': 0.8 }
          ],
          'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
          'text-size': 12,
          'text-anchor': 'center'
        },
        filter: ['==', ['get', 'admin_level'], 'township_label'],
        minzoom: 8,
        maxzoom: 12
      },
      // Section Labels
      sectionLabels: {
        type: 'symbol',
        paint: {
          'text-color': '#A01030',
          'text-halo-color': '#FFFFFF',
          'text-halo-width': 1
        },
        layout: {
          'text-field': ['get', 'section_label'],
          'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
          'text-size': 12,
          'text-anchor': 'center'
        },
        filter: ['==', ['get', 'admin_level'], 'section_label'],
        minzoom: 12
      }
    }
  }) as PlssDataset;
}
