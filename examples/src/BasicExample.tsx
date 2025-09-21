import { LandMap } from 'landmapmagic';

export default function BasicExample() {
  return (
      <LandMap 
        height="100vh"
        width="100vw"
        showDatasets={['plss', 'ssurgo']}
        showLegend={true}
      />
  );
}

