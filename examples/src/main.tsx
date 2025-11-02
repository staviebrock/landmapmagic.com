import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import GreenFieldExample from './GreenFieldExample';
import ExistingMapboxExample from './ExistingMapboxExample';

type ExampleType = 'greenfield' | 'existing-mapbox';

function App() {
  // Check URL hash for initial example
  const getInitialExample = (): ExampleType => {
    const hash = window.location.hash.slice(1);
    if (hash === 'existing-mapbox') return 'existing-mapbox';
    return 'greenfield';
  };

  const [currentExample, setCurrentExample] = useState<ExampleType>(getInitialExample());

  const handleExampleChange = (example: ExampleType) => {
    setCurrentExample(example);
    window.location.hash = example;
  };

  const renderExample = () => {
    switch (currentExample) {
      case 'existing-mapbox':
        return <ExistingMapboxExample />;
      case 'greenfield':
      default:
        return <GreenFieldExample />;
    }
  };

  return (
    <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column' }}>
      {/* Example Selector */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 1000,
          backgroundColor: 'white',
          padding: '10px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        }}
      >
        <select
          value={currentExample}
          onChange={(e) => handleExampleChange(e.target.value as ExampleType)}
          style={{
            padding: '8px 12px',
            fontSize: '14px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            cursor: 'pointer',
            minWidth: '250px'
          }}
        >
          <option value="greenfield">LandMap Component</option>
          <option value="existing-mapbox">Existing Mapbox Integration</option>
        </select>
      </div>

      {renderExample()}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
