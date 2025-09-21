import React from 'react';
import { LandMap } from '@landmapmagic';

// Basic usage - drop-in component
export default function BasicExample() {
  return (
    <div style={{ height: '100vh', width: '100vw' }}>
      <LandMap 
        showDatasets={['plss', 'ssurgo']}
        showLegend={true}
      />
    </div>
  );
}
