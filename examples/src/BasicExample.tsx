import { LandMap } from 'landmapmagic';
import { useState, useEffect } from 'react';

// Extend ImportMeta interface for Vite environment variables
declare global {
  interface ImportMeta {
    env: {
      VITE_STAGE_DEV_API_URL?: string;
      VITE_STAGE_STAGING_API_URL?: string;
      VITE_STAGE_PROD_API_URL?: string;
    };
  }
}

interface Environment {
  name: string;
  apiUrl: string;
  apiKey: string;
}

export default function BasicExample() {

  // Define environments based on STAGE_ prefixed environment variables
  const environments: Environment[] = [
    {
      name: 'Development',
      apiUrl: import.meta.env.VITE_STAGE_DEV_API_URL || 'http://localhost:8787',
      apiKey: 'dev'
    },
    {
      name: 'Staging',
      apiUrl: import.meta.env.VITE_STAGE_STAGING_API_URL || 'https://staging-api.landmapmagic.com',
      apiKey: 'staging-test-token-12345'
    },
    {
      name: 'Production',
      apiUrl: import.meta.env.VITE_STAGE_PROD_API_URL || 'https://api.landmapmagic.com',
      apiKey: 'prod-test-token-12345'
    }
  ];

  // Load saved environment from localStorage or default to staging
  const [selectedEnvironment, setSelectedEnvironment] = useState<Environment>(() => {
    const savedEnvName = localStorage.getItem('landmap-selected-environment');
    const savedEnv = environments.find(env => env.name === savedEnvName);
    return savedEnv || environments[1]; // Default to staging if not found
  });

  // Save to localStorage whenever environment changes
  useEffect(() => {
    localStorage.setItem('landmap-selected-environment', selectedEnvironment.name);
  }, [selectedEnvironment]);

  const handleEnvironmentChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedEnv = environments.find(env => env.name === event.target.value);
    if (selectedEnv) {
      setSelectedEnvironment(selectedEnv);
    }
  };

  return (
    <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column' }}>
      {/* Controls */}
      <div style={{
        padding: '10px',
        backgroundColor: '#f5f5f5',
        borderBottom: '1px solid #ddd',
        display: 'flex',
        alignItems: 'center',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label htmlFor="environment-select" style={{ fontWeight: 'bold' }}>
            Environment:
          </label>
          <select
            id="environment-select"
            value={selectedEnvironment.name}
            onChange={handleEnvironmentChange}
            style={{
              padding: '5px 10px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              backgroundColor: 'white',
              minWidth: '200px'
            }}
          >
            {environments.map((env) => (
              <option key={env.name} value={env.name}>
                {env.name} - {env.apiUrl}
              </option>
            ))}
          </select>
        </div>

        <div style={{ fontSize: '12px', color: '#6c757d' }}>
          Current: {selectedEnvironment.name}
        </div>
      </div>

      {/* Map Component */}
      <div style={{ flex: 1 }}>
        <LandMap
          // baseApiUrl={selectedEnvironment.apiUrl}
          baseApiUrl="https://staging-api.landmapmagic.com"
          apiKey="dev"
          showLegend={false}
          initialVisibleLayers={['clu']}
          availableLayers={['clu']}
          height="100%"
          width="100%"
        />
      </div>
    </div>
  );
}

