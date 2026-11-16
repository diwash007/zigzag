import { memo } from 'react';
import { boxGeometry, tileStandardMaterial } from './tileMaterial';

function Tile({ tileData, tileRef }) {
  return (
    <mesh
      ref={tileRef}
      geometry={boxGeometry}
      material={tileStandardMaterial}
      position={tileData.position}
    />
  );
}

export default memo(Tile);
