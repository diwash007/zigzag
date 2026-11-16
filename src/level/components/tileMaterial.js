import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry';
import { TILE_SIZE, TILE_DEPTH, TILE_COLOR } from '../../constants/constants';

export const boxGeometry = new RoundedBoxGeometry(TILE_SIZE, TILE_DEPTH, TILE_SIZE, 4, 0.05);

export const tileStandardMaterial = new THREE.MeshStandardMaterial({
  color: TILE_COLOR,
  roughness: 1, // Higher roughness = less confusing reflections
});
