import { forwardRef } from 'react';
import { SPHERE_RADIUS, SPHERE_SEGMENTS } from './constants/constants.js';
import { SKINS_MAP } from './constants/skins.js';
import useGame from './stores/useGame.js';

const Sphere = forwardRef((props, ref) => {
  const dark = useGame((state) => state.dark);
  const selectedSkin = useGame((state) => state.selectedSkin);

  const skin = SKINS_MAP[selectedSkin] || SKINS_MAP.classic;
  const skinColor = dark ? skin.darkColor : skin.color;

  return (
    <mesh ref={ref} position={[0, SPHERE_RADIUS, 0]}>
      <sphereGeometry
        args={[SPHERE_RADIUS, SPHERE_SEGMENTS, SPHERE_SEGMENTS]}
      />
      <meshStandardMaterial
        color={skinColor}
        metalness={skin.metalness}
        roughness={skin.roughness}
      />
    </mesh>
  );
});

export default Sphere;
