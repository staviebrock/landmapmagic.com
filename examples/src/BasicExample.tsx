import React from 'react';
import { LandMap } from 'landmapmagic';

// Basic usage - drop-in component
export default function BasicExample() {
  return (
    <div style={{ 
      height: '100vh', 
      width: '100vw',
      margin: 0,
      padding: 0,
      overflow: 'hidden'
    }}>
      <LandMap 
        height="100vh"
        width="100vw"
        onAoiResult={(result) => {
          console.log('AOI Result:', result);
        }}
      />
    </div>
  );
}
