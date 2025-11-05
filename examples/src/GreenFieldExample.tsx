import { LandMap } from 'landmapmagic';
import { useState, useEffect } from 'react';

// Vite environment variables are automatically typed by Vite
// We can access them via import.meta.env

interface Environment {
  name: string;
  apiUrl: string;
  apiKey: string;
}

export default function BasicExample() {

  // Get API key from environment variable
  // For development, 'dev' key is still allowed
  // For staging/production, you must set VITE_LANDMAP_API_KEY in .env.local
  const landmapApiKey = import.meta.env.VITE_LANDMAP_API_KEY || 'dev';

  // Define environments based on STAGE_ prefixed environment variables
  const environments: Environment[] = [
    {
      name: 'Development',
      apiUrl: import.meta.env.VITE_STAGE_DEV_API_URL || 'http://localhost:8787',
      apiKey: 'dev' // Dev environment still allows 'dev' key
    },
    {
      name: 'Staging',
      apiUrl: import.meta.env.VITE_STAGE_STAGING_API_URL || 'https://staging-api.landmapmagic.com',
      apiKey: landmapApiKey // Use env var for staging
    },
    {
      name: 'Production',
      apiUrl: import.meta.env.VITE_STAGE_PROD_API_URL || 'https://api.landmapmagic.com',
      apiKey: landmapApiKey // Use env var for production
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
    
    // Debug logging
    console.log('🔧 GreenField Example Debug Info:');
    console.log('  Environment:', selectedEnvironment.name);
    console.log('  API URL:', selectedEnvironment.apiUrl);
    console.log('  API Key:', selectedEnvironment.apiKey);
    console.log('  API Key (first 10 chars):', selectedEnvironment.apiKey.substring(0, 10) + '...');
    console.log('  VITE_LANDMAP_API_KEY from env:', import.meta.env.VITE_LANDMAP_API_KEY || '(not set - using default)');
    console.log('  Full tile URL would be:', `${selectedEnvironment.apiUrl}/clu/{z}/{x}/{y}?key=${selectedEnvironment.apiKey}`);
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
          baseApiUrl={selectedEnvironment.apiUrl}
          apiKey={selectedEnvironment.apiKey}
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

