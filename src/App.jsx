import { Canvas } from '@react-three/fiber';
import useGame from './stores/useGame';
import Interface from './interface/Interface';
import Game from './Game';
import { fancyLog } from './utils/fancyLog';
import { useEffect } from 'react';
import { initializeRewardedAds } from './services/rewardedAd';
import {
  ZOOM_LEVEL_DESKTOP,
  ZOOM_LEVEL_MOBILE,
  CAMERA_FAR,
  BACKGROUND_COLOR,
  BACKGROUND_COLOR_DARK,
} from './constants/constants';

export default function App() {
  const { isMobile, dark } = useGame((state) => state);

  useEffect(() => {
    console.log(
      `%cVersion: ${__APP_VERSION__}`,
      'font-family: Arial, sans-serif; font-size: 16px; background-color: #000; color: #fff; font-weight: 600; padding: 2px 6px;',
    );

    // Handle debug mode
    const handleHashChange = () => {
      const isDebug = window.location.hash === '#debug';
      useGame.setState({
        debug: isDebug,
        performance: isDebug,
      });
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // initial check

    // Prevent right click
    const preventContextMenu = (e) => e.preventDefault();
    document.addEventListener('contextmenu', preventContextMenu);

    // Fancy log message
    fancyLog();
    initializeRewardedAds().catch((error) => {
      console.error('Failed to initialize rewarded ads:', error);
    });

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      document.removeEventListener('contextmenu', preventContextMenu);
    };
  }, []);

  return (
  <>
  <Interface className="dark" />
  <Canvas
    shadows // Enable shadows for better tile depth!
    orthographic
    style={{ 
      // This creates the gradient behind the transparent canvas
      background: dark 
        ? 'radial-gradient(circle, #353535 0%, #050505 100%)' 
        : 'radial-gradient(circle, #ffffff 0%, #cfd9df 100%)' 
    }}
    camera={{
      zoom: isMobile ? ZOOM_LEVEL_MOBILE : ZOOM_LEVEL_DESKTOP,
      far: CAMERA_FAR,
    }}
  >
    <color attach="background" args={[dark ? BACKGROUND_COLOR_DARK : BACKGROUND_COLOR]} />
  
  {/* Fog makes tiles in the distance blend into the background color */}
  <fog 
    attach="fog" 
    args={[dark ? BACKGROUND_COLOR_DARK : BACKGROUND_COLOR, 20, 50]} 
  />
    {/* Remove the <color attach="background" /> line entirely */}
    <Game />
  </Canvas>
</> 
  );
}
