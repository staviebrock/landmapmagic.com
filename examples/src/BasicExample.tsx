import { LandMap } from 'landmapmagic';

export default function BasicExample() {
  return (
      <LandMap 
        height="100vh"
        width="100vw"
        onAoiResult={(result) => {
          console.log('AOI Result:', result);
        }}
      />
  );
}

