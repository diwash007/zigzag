import { Canvas } from '@react-three/fiber';
import { Capacitor } from '@capacitor/core';
import { StatusBar } from '@capacitor/status-bar';
import useGame from './stores/useGame';
import Interface from './interface/Interface';
import Game from './Game';
import { fancyLog } from './utils/fancyLog';
import { useEffect } from 'react';
import { initializeAds } from './services/adService';
import { preloadGameAudio, unlockGameAudio } from './services/audioContext';
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
    const configureFullscreenOverlay = async () => {
      if (Capacitor.getPlatform() !== 'android') return;

      try {
        await StatusBar.setOverlaysWebView({ overlay: true });
        const info = await StatusBar.getInfo();
        document.documentElement.style.setProperty('--safe-area-inset-top', `${info.height}px`);
      } catch (error) {
        console.error('Failed to enable status bar overlay:', error);
      }
    };

    configureFullscreenOverlay();

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
    initializeAds().catch((error) => {
      console.error('Failed to initialize ads:', error);
    });
    preloadGameAudio().catch((error) => {
      console.error('Failed to preload game audio:', error);
    });

    const unlockAudio = () => {
      unlockGameAudio().finally(() => {
        window.removeEventListener('pointerdown', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
      });
    };
    window.addEventListener('pointerdown', unlockAudio);
    window.addEventListener('keydown', unlockAudio);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      document.removeEventListener('contextmenu', preventContextMenu);
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  return (
  <>
  <Interface className="dark" />
  <Canvas
    shadows // Enable shadows for better tile depth!
    orthographic
    style={{
      position: 'fixed',
      inset: 0,
      width: '100vw',
      height: '100vh',
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
    {/* Fog makes tiles in the distance blend into the background color */}
    <fog 
      attach="fog" 
      args={[dark ? BACKGROUND_COLOR_DARK : BACKGROUND_COLOR, 20, 50]} 
    />
    <Game />
  </Canvas>
</> 
  );
}
