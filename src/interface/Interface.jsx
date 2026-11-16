import { useEffect, useState } from 'react';
import pkg from "../../package.json";
import useGame from '../stores/useGame';
import useSound from '../stores/useSound';
import '../styles/interface.css';
import SoundOn from '../assets/icons/sound-on.svg';
import SoundOff from '../assets/icons/sound-off.svg';
import Dark from '../assets/icons/dark.svg';
import { UI_SOUND_VOLUME } from '../constants/constants';
import { playGameSound } from '../services/audioContext';
import { hapticGem } from '../services/haptics';
import ShopModal from './ShopModal';
import {
  preloadContinueRewardedAd,
  showContinueRewardedAd,
  subscribeContinueRewardedAdAvailability,
  checkAndShowGameOverInterstitial,
} from '../services/adService';

export default function Interface() {
  const {
    score,
    bestScore,
    totalGems,
    runGems,
    hasDoubledGems,
    doubleRunGems,
    gamesPlayed,
    phase,
    setPhase,
    canContinueRun,
    setCanContinueRun,
    setContinueRequested,
    isMobile,
    dark,
    toggleDark,
  } = useGame((state) => state);
  const { sound, toggleSound } = useSound((state) => state);

  const [isNewBest, setIsNewBest] = useState(false);
  const [animateIntro, setAnimateIntro] = useState(false);
  const [animateGameOver, setAnimateGameOver] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [isLoadingContinue, setIsLoadingContinue] = useState(false);
  const [isLoadingDoubleGems, setIsLoadingDoubleGems] = useState(false);
  const [isContinueAdReady, setIsContinueAdReady] = useState(false);
  const [continueError, setContinueError] = useState('');
  const [doubleGemsError, setDoubleGemsError] = useState('');

  useEffect(() => {
    if (score > bestScore && bestScore > 0 && !isNewBest) {
      setIsNewBest(true);
    }
  }, [score, bestScore, isNewBest]);

  useEffect(() => {
    const unsubscribe = subscribeContinueRewardedAdAvailability((available) => {
      setIsContinueAdReady(available);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (phase !== 'playing') return;

    preloadContinueRewardedAd().catch((error) => {
      console.error('Failed to preload rewarded ad:', error);
    });
  }, [phase]);

  useEffect(() => {
    if (phase === 'ready') {
      setIsNewBest(false);
      setAnimateIntro(true);
      setAnimateGameOver(false);
      setShowCredits(false);
      setIsLoadingContinue(false);
      setIsLoadingDoubleGems(false);
      setContinueError('');
      setDoubleGemsError('');
    } else if (phase === 'playing') {
      setAnimateIntro(false);
      setContinueError('');
      setDoubleGemsError('');
    } else if (phase === 'gameover' || phase === 'continue') {
      setAnimateGameOver(true);
    }
  }, [phase]);

  const playPromptText = isMobile ? 'TAP TO PLAY' : 'CLICK TO PLAY';

  const playUiClick = () => {
    if (!sound) return;
    playGameSound('ui', { volume: UI_SOUND_VOLUME });
  };

  const handleRetry = async () => {
    if (sound) {
      playGameSound('ui', { volume: UI_SOUND_VOLUME });
    }
    const wasContinued = !canContinueRun;
    await checkAndShowGameOverInterstitial({ gamesPlayed, wasContinued }).catch((err) => {
      console.warn('Interstitial ad check failed:', err);
    });
    setPhase('ready');
  };

  const handleDoubleGems = async () => {
    if (
      phase !== 'gameover' ||
      runGems <= 0 ||
      hasDoubledGems ||
      isLoadingDoubleGems ||
      !isContinueAdReady
    ) {
      return;
    }

    setIsLoadingDoubleGems(true);
    setDoubleGemsError('');

    try {
      const rewarded = await showContinueRewardedAd();
      if (!rewarded) {
        setDoubleGemsError('Watch full ad to claim 2x gems.');
        return;
      }

      doubleRunGems();
      hapticGem();
      if (sound) {
        playGameSound('gem');
      }
    } catch (error) {
      console.error('Failed to show rewarded ad for gems:', error);
      setDoubleGemsError('Rewarded ad unavailable. Please retry.');
    } finally {
      setIsLoadingDoubleGems(false);
    }
  };

  const handleContinueRun = async () => {
    if (
      phase !== 'gameover' ||
      !canContinueRun ||
      !isContinueAdReady ||
      isLoadingContinue
    ) {
      return;
    }

    setIsLoadingContinue(true);
    setContinueError('');

    try {
      const rewarded = await showContinueRewardedAd();

      if (!rewarded) {
        setContinueError('Watch the full ad to continue.');
        return;
      }

      setCanContinueRun(false);
      setContinueRequested(true);
      setAnimateGameOver(false);
      setPhase('continue');
    } catch (error) {
      console.error('Failed to show rewarded ad:', error);
      setContinueError('Rewarded ad unavailable. Please retry.');
    } finally {
      setIsLoadingContinue(false);
    }
  };

  return (
    <div id="interface">
      {/* Intro Screen */}
      {phase === 'ready' && (
        <div id="intro-screen" className={`${animateIntro ? 'animate' : ''}`}>
          <img
            id="sound-toggle"
            className={dark ? 'dark-button' : ''}
            src={sound ? SoundOn : SoundOff}
            alt="Sound toggle"
            onClick={() => {
              toggleSound();
              if (!sound) {
                playGameSound('ui', { volume: UI_SOUND_VOLUME });
              }
            }}
          />
          <img
            id="dark-toggle"
            className={dark ? 'dark-button' : ''}
            src={Dark}
            alt="Dark toggle"
            onClick={() => {
              toggleDark();
              if (sound) {
                playGameSound('ui', { volume: UI_SOUND_VOLUME });
              }
            }}
          />
          {/* <h1
            id="title"
            className={`slide-item-intro-top${dark ? ' dark' : ''}`}
          >
            TAP & REGRET
          </h1> */}
          <p
            id="play-prompt"
            className={`slide-item-intro-bottom${dark ? ' dark' : ''}`}
          >
            {playPromptText}
          </p>
              <p className={`intro-data${dark ? ' dark' : ''}`}>BEST SCORE: {bestScore}</p>
              <p
                id="gems-data"
                className={`intro-data${dark ? ' dark' : ''}`}
                style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                onClick={() => {
                  playUiClick();
                  setShowShop(true);
                }}
              >
                GEMS: {totalGems} 💎
              </p>
              <p className={`intro-data${dark ? ' dark' : ''}`}>GAMES PLAYED: {gamesPlayed}</p>
            {showCredits &&
            <div
              id="credits-panel"
              className={`slide-item-intro-bottom ${dark ? 'dark-container' : ''}`}
            >
              <p className={`credits-title`}>CREDITS</p>
              <p className={`credits-line`}>
                v{pkg.version}
              </p>
              <p className={`credits-line`}>
                Licensed under AGPLv3
              </p>
              <p className={`credits-line`}>
                Original game by{' '}
                <a
                  className={dark ? 'dark' : ''}
                  href="https://michaelkolesidis.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Michael Kolesidis
                </a>
              </p>
              {/* <p className={`credits-line ${dark ? 'dark' : ''}`}>
                This fork extends and improves gameplay and UI.
              </p> */}
              <p className={`credits-line `}>
                Current source:{' '}
                <a
                  href="https://github.com/diwash007/zigzag"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  diwash007/zigzag
                </a>
                <br />
                Original source:{' '}
                <a
                  href="https://github.com/michaelkolesidis/zigzag"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  michaelkolesidis/zigzag
                </a>
              </p>
              <button
                id="credits-back"
                type="button"
                className={`credits-button credits-back ${
                  dark ? 'dark-gameover-button' : ''
                }`}
                onClick={() => {
                  playUiClick();
                  setShowCredits(false);
                }}
              >
                BACK
              </button>
            </div>
          }
          {!showCredits && (
            <div className="intro-actions slide-item-intro-bottom">
              <button
                id="shop-toggle"
                type="button"
                className={`credits-button ${
                  dark ? 'dark-gameover-button' : ''
                }`}
                onClick={() => {
                  playUiClick();
                  setShowShop(true);
                }}
              >
                SKINS 💎
              </button>
              <button
                id="credits-toggle"
                type="button"
                className={`credits-button ${
                  dark ? 'dark-gameover-button' : ''
                }`}
                onClick={() => {
                  playUiClick();
                  setShowCredits(true);
                }}
              >
                CREDITS
              </button>
            </div>
          )}
        </div>
      )}

      {/* Score */}
      {phase === 'playing' && (
        <div id="score" className={dark ? 'dark' : ''}>
          {score}
        </div>
      )}

      {/* Game Over Screen */}
      {(phase === 'ready' || phase === 'gameover') && (
        <div id="gameover-screen">
          <div
            className={`gameover-content ${animateGameOver ? 'animate' : ''}`}
          >
            <h1
              id="gameover-title"
              className={`slide-item-gameover${dark ? ' dark' : ''}`}
            >
              GAME OVER
            </h1>

            {isNewBest && (
              <p
                id="new-high-score"
                className={`slide-item-gameover${dark ? ' dark' : ''}`}
              >
                NEW HIGH SCORE!
              </p>
            )}

            <div
              id="gameover-score-container"
              className={`slide-item-gameover ${dark ? ' dark-container' : ''}`}
              style={
                isNewBest ? { background: dark ? '#c435b6' : '#fd44e9' } : {}
              }
            >
              <p
                className={`gameover-score-title ${dark ? ' dark' : ''}`}
                style={isNewBest ? { color: '#ffffff' } : {}}
              >
                SCORE
              </p>
              <p
                className={`gameover-score ${dark ? ' dark' : ''}`}
                style={isNewBest ? { color: '#ffffff' } : {}}
              >
                {score}
              </p>
              <p
                className={`gameover-score-title ${dark ? ' dark' : ''}`}
                style={isNewBest ? { color: '#ffffff' } : {}}
              >
                BEST SCORE
              </p>
              <p
                className={`gameover-score ${dark ? ' dark' : ''}`}
                style={isNewBest ? { color: '#ffffff' } : {}}
              >
                {bestScore}
              </p>
              <p
                className={`gameover-score-title ${dark ? ' dark' : ''}`}
                style={isNewBest ? { color: '#ffffff' } : {}}
              >
                GEMS COLLECTED
              </p>
              <p
                className={`gameover-score ${dark ? ' dark' : ''}`}
                style={isNewBest ? { color: '#ffffff' } : {}}
              >
                +{runGems} 💎 ({totalGems})
              </p>
            </div>

            {phase === 'gameover' && canContinueRun && (
              <button
                type="button"
                className={`slide-item-gameover ${
                  dark ? 'dark-gameover-button' : ' '
                } gameover-button`}
                style={isLoadingContinue || !isContinueAdReady ? { opacity: 0.6 } : undefined}
                onClick={handleContinueRun}
                disabled={!isContinueAdReady || isLoadingContinue}
              >
                {isLoadingContinue
                  ? 'OPENING AD...'
                  : isContinueAdReady
                    ? 'CONTINUE (AD)'
                    : 'PREPARING AD...'}
              </button>
            )}

            {phase === 'gameover' && runGems > 0 && (
              <button
                type="button"
                className={`slide-item-gameover ${
                  dark ? 'dark-gameover-button' : ' '
                } gameover-button gameover-double-gems`}
                style={
                  isLoadingDoubleGems || !isContinueAdReady || hasDoubledGems
                    ? { opacity: hasDoubledGems ? 0.8 : 0.6 }
                    : undefined
                }
                onClick={handleDoubleGems}
                disabled={!isContinueAdReady || isLoadingDoubleGems || hasDoubledGems}
              >
                {hasDoubledGems
                  ? '✓ 2X GEMS CLAIMED!'
                  : isLoadingDoubleGems
                    ? 'OPENING AD...'
                    : `💎 2X GEMS (+${runGems})`}
              </button>
            )}

            {phase === 'gameover' && doubleGemsError && (
              <p className={`slide-item-gameover ${dark ? ' dark' : ''}`}>
                {doubleGemsError}
              </p>
            )}

            {phase === 'gameover' && continueError && (
              <p className={`slide-item-gameover ${dark ? ' dark' : ''}`}>
                {continueError}
              </p>
            )}

            <button
              type="button"
              className={`slide-item-gameover ${
                dark ? 'dark-gameover-button' : ' '
              } gameover-button`}
              onClick={handleRetry}
            >
              RETRY
            </button>
          </div>
        </div>
      )}

      {showShop && <ShopModal onClose={() => setShowShop(false)} />}
    </div>
  );
}
