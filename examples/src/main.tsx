import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import GreenFieldExample from './GreenFieldExample';

interface Example {
  id: string;
  title: string;
  description: string;
  category: 'react' | 'html';
  path?: string;
  icon: string;
}

const EXAMPLES: Example[] = [
  {
    id: 'greenfield',
    title: 'LandMap Component',
    description: 'Basic React component with MapLibre - perfect starting point',
    category: 'react',
    icon: '🗺️'
  },
  {
    id: 'google-maps',
    title: 'Google Maps Basic',
    description: 'Google Maps with CLU field boundaries overlay',
    category: 'html',
    path: '/google-maps-example.html',
    icon: '🌍'
  },
  {
    id: 'google-maps-selectable',
    title: 'Google Maps Selectable',
    description: 'Click to select and track multiple CLU polygons',
    category: 'html',
    path: '/google-maps-selectable.html',
    icon: '✅'
  },
  {
    id: 'google-maps-aoi',
    title: 'Google Maps AOI Query',
    description: 'Draw custom polygons and query intersecting CLU fields',
    category: 'html',
    path: '/google-maps-aoi-example.html',
    icon: '🎯'
  }
];

function App() {
  const getInitialView = (): string => {
    const hash = window.location.hash.slice(1);
    return hash || 'home';
  };

  const [currentView, setCurrentView] = useState<string>(getInitialView());

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

  // Show example selector
  if (currentView === 'home') {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#18181b',
        padding: '60px 20px',
        fontFamily: 'Space Grotesk, -apple-system, BlinkMacSystemFont, sans-serif'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {/* Header */}
          <div style={{
            textAlign: 'center',
            marginBottom: '60px'
          }}>
            <h1 style={{
              fontSize: '42px',
              margin: '0 0 12px 0',
              fontWeight: 600,
              color: 'white'
            }}>
              LandMapMagic Examples
            </h1>
            <p style={{
              fontSize: '18px',
              margin: 0,
              color: '#a1a1aa'
            }}>
              Explore interactive examples and integration patterns
            </p>
          </div>

          {/* Examples Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '20px',
            marginBottom: '60px'
          }}>
            {EXAMPLES.map(example => (
              <div
                key={example.id}
                onClick={() => handleExampleClick(example)}
                style={{
                  background: '#27272a',
                  borderRadius: '8px',
                  padding: '24px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  border: '1px solid #3f3f46',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.borderColor = '#facc15';
                  e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = '#3f3f46';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{
                  fontSize: '42px',
                  lineHeight: 1,
                  marginBottom: '4px'
                }}>
                  {example.icon}
                </div>
                <h3 style={{
                  margin: 0,
                  fontSize: '18px',
                  fontWeight: 600,
                  color: 'white'
                }}>
                  {example.title}
                </h3>
                <p style={{
                  margin: 0,
                  fontSize: '14px',
                  color: '#a1a1aa',
                  lineHeight: 1.5,
                  flex: 1
                }}>
                  {example.description}
                </p>
                <div style={{
                  marginTop: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#facc15'
                }}>
                  View Example →
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
              href="https://github.com/yourusername/landmapmagic"
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
