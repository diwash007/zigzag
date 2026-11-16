import { useRef, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Billboard } from '@react-three/drei';
import useGame from '../../stores/useGame';
import {
  FLOATING_TEXT_FONT_SIZE,
  FLOATING_TEXT_FONT_WEIGHT,
  FLOATING_TEXT_COLOR,
  FLOATING_TEXT_COLOR_DARK,
  FLOATING_TEXT_OPACITY,
} from '../../constants/constants';

function FloatingText({ position, content, color, fontSize, onComplete }) {
  const text = useRef();
  const lifetime = useRef(0);
  const { dark } = useGame((state) => state);

  useFrame((_, delta) => {
    lifetime.current += delta;

    if (text.current) {
      text.current.position.y += delta * 4;
      const material = text.current.material;
      if (material) {
        material.opacity = material.opacity - delta * 3;
      }
    }

    if (lifetime.current > 0.75 && typeof onComplete === 'function') {
      onComplete();
    }
  });

  const resolvedColor = color || (dark ? FLOATING_TEXT_COLOR_DARK : FLOATING_TEXT_COLOR);
  const resolvedSize = fontSize || FLOATING_TEXT_FONT_SIZE;

  return (
    <Billboard position={position}>
      <Text
        ref={text}
        fontSize={resolvedSize}
        fontWeight={FLOATING_TEXT_FONT_WEIGHT}
        color={resolvedColor}
        anchorX="center"
        anchorY="middle"
        material-toneMapped={false}
        material-transparent
        material-opacity={FLOATING_TEXT_OPACITY}
      >
        {content}
      </Text>
    </Billboard>
  );
}

export default memo(FloatingText);
