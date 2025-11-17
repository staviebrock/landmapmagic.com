import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import GreenFieldExample from './GreenFieldExample';
import MapboxSelectableExample from './MapboxSelectableExample';
import MapLibreStatesExample from './MapLibreStatesExample';

interface Example {
  id: string;
  title: string;
  description: string;
  category: 'react' | 'html';
  path?: string;
  icon: string;
  tags: {
    framework: 'react' | 'html';
    sdk: 'maplibre' | 'mapbox' | 'google-maps' | 'arcgis' | 'deck.gl';
    data: ('clu' | 'states' | 'parcels')[];
    features: ('selection' | 'hover' | 'labels' | 'aoi-query' | 'click-to-zoom')[];
  };
}

const EXAMPLES: Example[] = [
  {
    id: 'greenfield',
    title: 'LandMap Component',
    description: 'Basic React component with MapLibre - perfect starting point',
    category: 'react',
    icon: '🗺️',
    tags: {
      framework: 'react',
      sdk: 'maplibre',
      data: ['clu'],
      features: []
    }
  },
  {
    id: 'mapbox-selectable',
    title: 'MapBox Selectable',
    description: 'MapBox with clickable CLU polygons - select and track fields',
    category: 'react',
    icon: '✅',
    tags: {
      framework: 'react',
      sdk: 'mapbox',
      data: ['clu'],
      features: ['selection', 'hover']
    }
  },
  {
    id: 'maplibre-states',
    title: 'MapLibre States',
    description: 'Simple MapLibre example using our /states/style.json endpoint',
    category: 'react',
    icon: '🇺🇸',
    tags: {
      framework: 'react',
      sdk: 'maplibre',
      data: ['states'],
      features: ['labels']
    }
  },
  {
    id: 'google-maps',
    title: 'Google Maps Basic',
    description: 'Google Maps with CLU field boundaries overlay',
    category: 'html',
    path: '/google-maps-example.html',
    icon: '🌍',
    tags: {
      framework: 'html',
      sdk: 'google-maps',
      data: ['clu'],
      features: ['labels']
    }
  },
  {
    id: 'google-maps-states',
    title: 'Google Maps States',
    description: 'Google Maps with US state boundaries - hover and click to zoom',
    category: 'html',
    path: '/google-maps-states-example.html',
    icon: '🗺️',
    tags: {
      framework: 'html',
      sdk: 'google-maps',
      data: ['states'],
      features: ['hover', 'click-to-zoom']
    }
  },
  {
    id: 'google-maps-parcels',
    title: 'Google Maps Parcels',
    description: 'Property parcels with ownership data using ReportAll MVT tiles',
    category: 'html',
    path: '/google-maps-parcels-example.html',
    icon: '🏘️',
    tags: {
      framework: 'html',
      sdk: 'google-maps',
      data: ['parcels'],
      features: ['labels']
    }
  },
  {
    id: 'google-maps-selectable',
    title: 'Google Maps Selectable',
    description: 'Click to select and track multiple CLU polygons',
    category: 'html',
    path: '/google-maps-selectable.html',
    icon: '✅',
    tags: {
      framework: 'html',
      sdk: 'google-maps',
      data: ['clu'],
      features: ['selection', 'hover']
    }
  },
  {
    id: 'google-maps-aoi',
    title: 'Google Maps AOI Query',
    description: 'Draw custom polygons and query intersecting CLU fields',
    category: 'html',
    path: '/google-maps-aoi-example.html',
    icon: '🎯',
    tags: {
      framework: 'html',
      sdk: 'google-maps',
      data: ['clu'],
      features: ['aoi-query', 'selection']
    }
  },
  {
    id: 'arcgis',
    title: 'ArcGIS Maps SDK',
    description: 'ArcGIS Maps SDK with CLU field boundaries and acreage labels',
    category: 'html',
    path: '/arcgis-example.html',
    icon: '🌐',
    tags: {
      framework: 'html',
      sdk: 'arcgis',
      data: ['clu'],
      features: ['labels']
    }
  }
];

// Filter Section Component
function FilterSection({ title, options, selected, onToggle }: {
  title: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div style={{ marginBottom: '28px' }}>
      <div style={{
        fontSize: '12px',
        fontWeight: 600,
        color: '#71717a',
        marginBottom: '12px',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}>
        {title}
      </div>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
      }}>
        {options.map(option => {
          const isSelected = selected.includes(option);
          return (
            <button
              key={option}
              onClick={() => onToggle(option)}
              style={{
                background: isSelected ? '#facc15' : 'transparent',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 14px',
                color: isSelected ? '#0a0a0b' : '#a1a1aa',
                fontSize: '14px',
                fontWeight: isSelected ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = '#27272a';
                  e.currentTarget.style.color = '#e4e4e7';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#a1a1aa';
                }
              }}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function App() {
  const getInitialView = (): string => {
    const hash = window.location.hash.slice(1);
    return hash || 'home';
  };

  const [currentView, setCurrentView] = useState<string>(getInitialView());
  const [selectedFilters, setSelectedFilters] = useState<{
    framework: string[];
    sdk: string[];
    data: string[];
    features: string[];
  }>({
    framework: [],
    sdk: [],
    data: [],
    features: []
  });

  // Listen for browser back/forward button
  useEffect(() => {
    const handlePopState = () => {
      const hash = window.location.hash.slice(1);
      setCurrentView(hash || 'home');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleExampleClick = (example: Example) => {
    if (example.category === 'html' && example.path) {
      window.location.href = example.path;
    } else {
      // Use pushState to create a proper history entry
      window.history.pushState({}, '', `#${example.id}`);
      setCurrentView(example.id);
    }
  };

  const toggleFilter = (category: keyof typeof selectedFilters, value: string) => {
    setSelectedFilters(prev => {
      const current = prev[category];
      // If clicking the same value, deselect it. Otherwise, select only this value
      const newValues = current.includes(value) && current.length === 1
        ? []
        : [value];
      return { ...prev, [category]: newValues };
    });
  };

  const clearFilters = () => {
    setSelectedFilters({ framework: [], sdk: [], data: [], features: [] });
  };

  const filteredExamples = EXAMPLES.filter(example => {
    if (selectedFilters.framework.length > 0 && !selectedFilters.framework.includes(example.tags.framework)) {
      return false;
    }
    if (selectedFilters.sdk.length > 0 && !selectedFilters.sdk.includes(example.tags.sdk)) {
      return false;
    }
    if (selectedFilters.data.length > 0 && !example.tags.data.some(d => selectedFilters.data.includes(d))) {
      return false;
    }
    if (selectedFilters.features.length > 0 && !example.tags.features.some(f => selectedFilters.features.includes(f))) {
      return false;
    }
    return true;
  });

  const hasActiveFilters = Object.values(selectedFilters).some(arr => arr.length > 0);

  // Show example selector
  if (currentView === 'home') {
    return (
      <div style={{
        height: '100vh',
        overflow: 'hidden',
        background: '#0a0a0b',
        fontFamily: 'Space Grotesk, -apple-system, BlinkMacSystemFont, sans-serif',
        display: 'flex'
      }}>
        {/* Left Sidebar - Filters */}
        <div style={{
          width: '280px',
          height: '100vh',
          background: '#18181b',
          borderRight: '1px solid #27272a',
          padding: '32px 24px',
          overflowY: 'auto',
          flexShrink: 0
        }}>
          <div style={{
            marginBottom: '32px'
          }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: 600,
              color: 'white',
              margin: '0 0 8px 0'
            }}>
              Filters
            </h2>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  color: '#facc15',
                  fontSize: '13px',
                  cursor: 'pointer',
                  fontWeight: 500,
                  textDecoration: 'underline'
                }}
              >
                Clear all
              </button>
            )}
          </div>

          {/* Framework Filter */}
          <FilterSection
            title="Framework"
            options={['react', 'html']}
            selected={selectedFilters.framework}
            onToggle={(val) => toggleFilter('framework', val)}
          />

          {/* SDK Filter */}
          <FilterSection
            title="Map SDK"
            options={['maplibre', 'mapbox', 'google-maps', 'arcgis']}
            selected={selectedFilters.sdk}
            onToggle={(val) => toggleFilter('sdk', val)}
          />

          {/* Data Filter */}
          <FilterSection
            title="Data Layer"
            options={['clu', 'states', 'parcels']}
            selected={selectedFilters.data}
            onToggle={(val) => toggleFilter('data', val)}
          />

          {/* Features Filter */}
          <FilterSection
            title="Features"
            options={['selection', 'hover', 'labels', 'aoi-query', 'click-to-zoom']}
            selected={selectedFilters.features}
            onToggle={(val) => toggleFilter('features', val)}
          />
        </div>

        {/* Main Content */}
        <div style={{
          flex: 1,
          height: '100vh',
          overflowY: 'auto',
          padding: '48px 60px'
        }}>
          {/* Header */}
          <div style={{
            marginBottom: '48px'
          }}>
            <h1 style={{
              fontSize: '48px',
              margin: '0 0 12px 0',
              fontWeight: 700,
              color: 'white',
              letterSpacing: '-0.02em'
            }}>
              LandMapMagic Examples
            </h1>
            <p style={{
              fontSize: '18px',
              margin: '0 0 16px 0',
              color: '#71717a',
              lineHeight: 1.6
            }}>
              Explore interactive examples and integration patterns
            </p>
            <div style={{
              fontSize: '14px',
              color: '#52525b',
              fontWeight: 500
            }}>
              {filteredExamples.length} {filteredExamples.length === 1 ? 'example' : 'examples'}
            </div>
          </div>

          {/* Examples Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '16px',
            paddingBottom: '60px'
          }}>
            {filteredExamples.map(example => (
              <div
                key={example.id}
                onClick={() => handleExampleClick(example)}
                style={{
                  background: '#18181b',
                  borderRadius: '12px',
                  padding: '18px',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  border: '1px solid #27272a',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.borderColor = '#facc15';
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.3)';
                  e.currentTarget.style.background = '#1f1f23';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = '#27272a';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.background = '#18181b';
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div style={{
                    fontSize: '24px',
                    lineHeight: 1,
                    flexShrink: 0
                  }}>
                    {example.icon}
                  </div>
                  <h3 style={{
                    margin: 0,
                    fontSize: '16px',
                    fontWeight: 600,
                    color: 'white',
                    letterSpacing: '-0.01em'
                  }}>
                    {example.title}
                  </h3>
                </div>
                <p style={{
                  margin: 0,
                  fontSize: '13px',
                  color: '#71717a',
                  lineHeight: 1.5
                }}>
                  {example.description}
                </p>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '4px',
                  marginTop: 'auto'
                }}>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    color: '#52525b',
                    background: '#27272a',
                    padding: '3px 6px',
                    borderRadius: '4px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    {example.tags.sdk}
                  </span>
                  {example.tags.data.map(d => (
                    <span key={d} style={{
                      fontSize: '10px',
                      fontWeight: 600,
                      color: '#52525b',
                      background: '#27272a',
                      padding: '3px 6px',
                      borderRadius: '4px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{
            textAlign: 'center',
            paddingTop: '40px',
            borderTop: '1px solid #3f3f46'
          }}>
            <p style={{
              color: '#71717a',
              fontSize: '14px',
              margin: '0 0 16px 0'
            }}>
              Need help getting started?
            </p>
            <a
              href="https://landmapmagic.com/docs?utm_source=examples&utm_medium=website&utm_campaign=examples"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#facc15',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 500,
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#fbbf24';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#facc15';
              }}
            >
              View Documentation →
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Show React example with back button
  const renderExample = () => {
    switch (currentView) {
      case 'greenfield':
        return <GreenFieldExample />;
      case 'mapbox-selectable':
        return <MapboxSelectableExample />;
      case 'maplibre-states':
        return <MapLibreStatesExample />;
      default:
        return <GreenFieldExample />;
    }
  };

  return (
    <div style={{ height: '100vh', width: '100vw', overflow: 'hidden' }}>
      {renderExample()}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
