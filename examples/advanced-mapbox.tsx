import React, { useState } from 'react';
import { Map, Source, Layer as MapLayer } from 'react-map-gl';
import { useLandMaps, InstallPmtilesProtocol } from '@landmapmagic/mapbox';

// Advanced usage with Mapbox and hooks
export default function AdvancedMapboxExample() {
  const { ssurgo, cdl, plss } = useLandMaps();
  const [visibleLayers, setVisibleLayers] = useState({
    ssurgo: true,
    cdl: true,
    plss: true,
  });

  // Install PMTiles protocol on component mount
  React.useEffect(() => {
    InstallPmtilesProtocol.install();
    return () => InstallPmtilesProtocol.uninstall();
  }, []);

  return (
    <div style={{ height: '100vh', width: '100vw' }}>
      <Map
        initialViewState={{
          longitude: -98.5795,
          latitude: 39.8283,
          zoom: 4
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/streets-v11"
        mapboxAccessToken={process.env.REACT_APP_MAPBOX_TOKEN}
      >
        {/* SSURGO Soil Data */}
        {visibleLayers.ssurgo && (
          <Source {...ssurgo.sourceProps}>
            <MapLayer {...ssurgo.layers.fill} />
            <MapLayer {...ssurgo.layers.outline} />
          </Source>
        )}

        {/* CDL Cropland Data */}
        {visibleLayers.cdl && (
          <Source {...cdl.sourceProps}>
            <MapLayer {...cdl.layers.fill} />
          </Source>
        )}

        {/* PLSS Survey Data */}
        {visibleLayers.plss && (
          <Source {...plss.sourceProps}>
            <MapLayer {...plss.layers.township} />
            <MapLayer {...plss.layers.section} />
            <MapLayer {...plss.layers.labels} />
          </Source>
        )}
      </Map>

      {/* Layer Controls */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        background: 'white',
        padding: '10px',
        borderRadius: '5px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h4 style={{ margin: '0 0 10px 0' }}>Map Layers</h4>
        <div>
          <label>
            <input
              type="checkbox"
              checked={visibleLayers.ssurgo}
              onChange={(e) => setVisibleLayers(prev => ({ ...prev, ssurgo: e.target.checked }))}
            />
            SSURGO Soil Data
          </label>
        </div>
        <div>
          <label>
            <input
              type="checkbox"
              checked={visibleLayers.cdl}
              onChange={(e) => setVisibleLayers(prev => ({ ...prev, cdl: e.target.checked }))}
            />
            Cropland Data Layer
          </label>
        </div>
        <div>
          <label>
            <input
              type="checkbox"
              checked={visibleLayers.plss}
              onChange={(e) => setVisibleLayers(prev => ({ ...prev, plss: e.target.checked }))}
            />
            PLSS Survey Data
          </label>
        </div>
      </div>
    </div>
  );
}
