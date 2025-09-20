import React from 'react';
import { LandMap } from '@landmap';

// Basic usage - drop-in component
export default function BasicExample() {
  return (
    <div style={{ height: '100vh', width: '100vw' }}>
      <LandMap 
        apiEndpoint="/api/aoi/summary"
        onAoiResult={(result) => {
          console.log('AOI Result:', result);
        }}
      />
    </div>
  );
}
