import React from 'react';
import { Map, Source, Layer as MapLayer } from 'react-map-gl';
import { useLandMaps, useAoiDraw, useAoiQuery, InstallPmtilesProtocol } from '@landmap/mapbox';

// Advanced usage with Mapbox and hooks
export default function AdvancedMapboxExample() {
  const { ssurgo, cdl, plss } = useLandMaps();
  const aoi = useAoiDraw();
  const { data, loading, error } = useAoiQuery(aoi.aoi.polygon, { 
    endpoint: '/api/aoi/summary' 
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
        onClick={(e) => aoi.handleMapClick({ 
          lngLat: [e.lngLat.lng, e.lngLat.lat] 
        })}
      >
        {/* SSURGO Soil Data */}
        <Source {...ssurgo.sourceProps}>
          <MapLayer {...ssurgo.layers.fill} />
          <MapLayer {...ssurgo.layers.outline} />
        </Source>

        {/* CDL Cropland Data */}
        <Source {...cdl.sourceProps}>
          <MapLayer {...cdl.layers.fill} />
        </Source>

        {/* PLSS Survey Data */}
        <Source {...plss.sourceProps}>
          <MapLayer {...plss.layers.township} />
          <MapLayer {...plss.layers.section} />
          <MapLayer {...plss.layers.labels} />
        </Source>

        {/* AOI Drawing */}
        <Source {...aoi.sourceProps}>
          <MapLayer {...aoi.layers.polygon} />
          <MapLayer {...aoi.layers.line} />
          <MapLayer {...aoi.layers.points} />
        </Source>
      </Map>

      {/* Controls */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        background: 'white',
        padding: '10px',
        borderRadius: '5px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <button onClick={() => aoi.setMode('draw')}>Draw AOI</button>
        <button onClick={() => aoi.setMode('view')}>View Mode</button>
        <button onClick={aoi.clearAoi}>Clear AOI</button>
      </div>

      {/* Status */}
      {loading && (
        <div style={{
          position: 'absolute',
          bottom: '10px',
          left: '10px',
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '10px',
          borderRadius: '5px'
        }}>
          Loading AOI data...
        </div>
      )}

      {data && (
        <div style={{
          position: 'absolute',
          bottom: '10px',
          left: '10px',
          background: 'rgba(0,128,0,0.8)',
          color: 'white',
          padding: '10px',
          borderRadius: '5px'
        }}>
          AOI Analysis Complete!
        </div>
      )}

      {error && (
        <div style={{
          position: 'absolute',
          bottom: '10px',
          left: '10px',
          background: 'rgba(255,0,0,0.8)',
          color: 'white',
          padding: '10px',
          borderRadius: '5px'
        }}>
          Error: {error}
        </div>
      )}
    </div>
  );
}
