import * as THREE from 'three';
import { useMemo } from 'react';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry';
import { TILE_SIZE, TILE_DEPTH, TILE_COLOR } from '../../constants/constants';

const boxGeometry = new RoundedBoxGeometry(TILE_SIZE, TILE_DEPTH, TILE_SIZE, 4, 0.05);
const standardMaterial = new THREE.MeshStandardMaterial({ 
  color: TILE_COLOR,
  roughness: 1 // Higher roughness = less "confusing" reflections
});

export default function Tile({ tileData, tileRef }) {
  return (
    <mesh
      ref={tileRef}
      geometry={boxGeometry}
      material={standardMaterial}
      position={tileData.position}
    />
  );
}