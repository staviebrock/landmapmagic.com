import { useState } from 'react';
import type { AOIQueryResult } from './AOIQuery';

export interface AOIResultsProps {
  results: AOIQueryResult[];
  aoi: any;
  onClose?: () => void;
}

export function AOIResults({ results, aoi, onClose }: AOIResultsProps) {
  const [expandedLayers, setExpandedLayers] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'summary' | 'details'>('summary');

  if (!results.length && !aoi) return null;

  const toggleLayerExpansion = (layerId: string) => {
    const newExpanded = new Set(expandedLayers);
    if (newExpanded.has(layerId)) {
      newExpanded.delete(layerId);
    } else {
      newExpanded.add(layerId);
    }
    setExpandedLayers(newExpanded);
  };

  const formatArea = (area: number) => {
    const acres = area * 0.000247105; // Convert m² to acres
    const hectares = area / 10000; // Convert m² to hectares
    
    if (acres < 1) {
      return `${area.toFixed(0)} m²`;
    } else if (acres < 100) {
      return `${acres.toFixed(2)} acres (${hectares.toFixed(2)} ha)`;
    } else {
      return `${acres.toFixed(0)} acres (${hectares.toFixed(0)} ha)`;
    }
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '10px',
        left: '10px',
        background: 'rgba(255, 255, 255, 0.98)',
        padding: '16px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        fontSize: '13px',
        maxWidth: '400px',
        maxHeight: '60vh',
        overflow: 'auto',
        zIndex: 1000,
      }}
    >
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '12px',
        borderBottom: '1px solid #eee',
        paddingBottom: '8px'
      }}>
        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#333' }}>
          AOI Query Results
        </h4>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '18px',
              cursor: 'pointer',
              color: '#666',
              padding: '0 4px'
            }}
          >
            ×
          </button>
        )}
      </div>

      {/* AOI Info */}
      {aoi && (
        <div style={{ 
          marginBottom: '16px',
          padding: '8px',
          backgroundColor: '#f8f9fa',
          borderRadius: '4px',
          border: '1px solid #e9ecef'
        }}>
          <strong>AOI Area:</strong> {formatArea(aoi.properties?.area || 0)}
        </div>
      )}

      {/* Tabs */}
      <div style={{ marginBottom: '12px' }}>
        <button
          onClick={() => setActiveTab('summary')}
          style={{
            padding: '6px 12px',
            backgroundColor: activeTab === 'summary' ? '#007bff' : '#f8f9fa',
            color: activeTab === 'summary' ? 'white' : '#333',
            border: '1px solid #dee2e6',
            borderRadius: '4px 0 0 4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Summary
        </button>
        <button
          onClick={() => setActiveTab('details')}
          style={{
            padding: '6px 12px',
            backgroundColor: activeTab === 'details' ? '#007bff' : '#f8f9fa',
            color: activeTab === 'details' ? 'white' : '#333',
            border: '1px solid #dee2e6',
            borderLeft: 'none',
            borderRadius: '0 4px 4px 0',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Details
        </button>
      </div>

      {results.length === 0 ? (
        <div style={{ 
          padding: '16px',
          textAlign: 'center',
          color: '#666',
          fontStyle: 'italic'
        }}>
          No features found in the selected area
        </div>
      ) : (
        <>
          {activeTab === 'summary' && (
            <div>
              <div style={{ marginBottom: '12px' }}>
                <strong>Total Layers:</strong> {results.length}<br/>
                <strong>Total Features:</strong> {formatNumber(results.reduce((sum, r) => sum + r.featureCount, 0))}
              </div>

              {results.map((result, index) => (
                <div key={`${result.layerId}-${index}`} style={{ 
                  marginBottom: '12px',
                  padding: '8px',
                  border: '1px solid #e9ecef',
                  borderRadius: '4px'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '4px'
                  }}>
                    <strong style={{ color: '#007bff' }}>{result.layerName}</strong>
                    <span style={{ 
                      backgroundColor: '#28a745',
                      color: 'white',
                      padding: '2px 6px',
                      borderRadius: '12px',
                      fontSize: '11px'
                    }}>
                      {formatNumber(result.featureCount)}
                    </span>
                  </div>
                  
                  {/* Layer-specific summary */}
                  {result.summary && (
                    <div style={{ fontSize: '11px', color: '#666' }}>
                      {renderLayerSummary(result)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'details' && (
            <div>
              {results.map((result, index) => (
                <div key={`${result.layerId}-${index}`} style={{ marginBottom: '16px' }}>
                  <div
                    onClick={() => toggleLayerExpansion(result.layerId)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px',
                      backgroundColor: '#f8f9fa',
                      border: '1px solid #dee2e6',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      marginBottom: '4px'
                    }}
                  >
                    <strong>{result.layerName}</strong>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11px', color: '#666' }}>
                        {formatNumber(result.featureCount)} features
                      </span>
                      <span>{expandedLayers.has(result.layerId) ? '−' : '+'}</span>
                    </div>
                  </div>

                  {expandedLayers.has(result.layerId) && (
                    <div style={{ 
                      maxHeight: '200px',
                      overflow: 'auto',
                      border: '1px solid #e9ecef',
                      borderRadius: '4px',
                      padding: '8px'
                    }}>
                      {result.features.slice(0, 10).map((feature, featureIndex) => (
                        <div key={featureIndex} style={{ 
                          marginBottom: '8px',
                          paddingBottom: '8px',
                          borderBottom: featureIndex < Math.min(result.features.length, 10) - 1 ? '1px solid #f0f0f0' : 'none'
                        }}>
                          {renderFeatureDetails(feature, result.layerName)}
                        </div>
                      ))}
                      {result.features.length > 10 && (
                        <div style={{ 
                          textAlign: 'center',
                          color: '#666',
                          fontStyle: 'italic',
                          fontSize: '11px',
                          marginTop: '8px'
                        }}>
                          ... and {result.features.length - 10} more features
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function renderLayerSummary(result: AOIQueryResult) {
  const { summary, layerName } = result;
  
  if (layerName.includes('SSURGO') || layerName.includes('Soil')) {
    return (
      <div>
        {summary.uniqueSoilTypes && <div>Unique soil types: {summary.uniqueSoilTypes}</div>}
        {summary.totalAcres && <div>Total acres: {summary.totalAcres.toLocaleString()}</div>}
      </div>
    );
  }
  
  if (layerName.includes('PLSS') || layerName.includes('Survey')) {
    return (
      <div>
        {summary.uniqueStates && <div>States: {summary.uniqueStates}</div>}
        {summary.uniqueCounties && <div>Counties: {summary.uniqueCounties}</div>}
        {summary.uniqueTownships && <div>Townships: {summary.uniqueTownships}</div>}
        {summary.uniqueSections && <div>Sections: {summary.uniqueSections}</div>}
      </div>
    );
  }
  
  if (layerName.includes('CDL') || layerName.includes('Crop')) {
    return (
      <div>
        <div>{summary.note || 'Raster crop data'}</div>
      </div>
    );
  }
  
  return <div>Features: {result.featureCount}</div>;
}

function renderFeatureDetails(feature: any, layerName: string) {
  const props = feature.properties || {};
  
  if (layerName.includes('SSURGO') || layerName.includes('Soil')) {
    return (
      <div style={{ fontSize: '11px' }}>
        <div><strong>Map Unit:</strong> {props.musym || 'N/A'}</div>
        <div><strong>Name:</strong> {props.muname || 'N/A'}</div>
        {props.muacres && <div><strong>Acres:</strong> {parseFloat(props.muacres).toLocaleString()}</div>}
      </div>
    );
  }
  
  if (layerName.includes('PLSS') || layerName.includes('Survey')) {
    return (
      <div style={{ fontSize: '11px' }}>
        <div><strong>Level:</strong> {props.admin_level || 'N/A'}</div>
        {props.state_name && <div><strong>State:</strong> {props.state_name}</div>}
        {props.county_name && <div><strong>County:</strong> {props.county_name}</div>}
        {props.township_name && <div><strong>Township:</strong> {props.township_name}</div>}
        {props.section_label && <div><strong>Section:</strong> {props.section_label}</div>}
      </div>
    );
  }
  
  // Generic feature display
  const importantProps = Object.entries(props)
    .filter(([key, value]) => 
      value !== null && 
      value !== undefined && 
      value !== '' &&
      !key.startsWith('_') &&
      typeof value !== 'object'
    )
    .slice(0, 3);
    
  return (
    <div style={{ fontSize: '11px' }}>
      {importantProps.map(([key, value]) => (
        <div key={key}>
          <strong>{key}:</strong> {String(value)}
        </div>
      ))}
    </div>
  );
}
