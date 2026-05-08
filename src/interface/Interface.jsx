import { useEffect, useState } from 'react';
import useGame from '../stores/useGame';
import useSound from '../stores/useSound';
import '../styles/interface.css';
import SoundOn from '../assets/icons/sound-on.svg';
import SoundOff from '../assets/icons/sound-off.svg';
import Dark from '../assets/icons/dark.svg';
import { UI_SOUND_VOLUME } from '../constants/constants';
import {
  preloadContinueRewardedAd,
  showContinueRewardedAd,
  subscribeContinueRewardedAdAvailability,
} from '../services/rewardedAd';

// Sound effects
const uiSound = new Audio('sounds/ui.mp3');
uiSound.volume = UI_SOUND_VOLUME;

export default function Interface() {
  const {
    score,
    bestScore,
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
  const [isLoadingContinue, setIsLoadingContinue] = useState(false);
  const [isContinueAdReady, setIsContinueAdReady] = useState(false);
  const [continueError, setContinueError] = useState('');

  useEffect(() => {
    if (score > bestScore && bestScore > 0 && !isNewBest) {
      setIsNewBest(true);
    }
  }, [score, bestScore]);

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
      setContinueError('');
    } else if (phase === 'playing') {
      setAnimateIntro(false);
      setContinueError('');
    } else if (phase === 'gameover' || phase === 'continue') {
      setAnimateGameOver(true);
    }
  }, [phase]);

  const playPromptText = isMobile ? 'TAP TO PLAY' : 'CLICK TO PLAY';

  const playUiClick = () => {
    if (!sound) return;
    uiSound.currentTime = 0;
    uiSound.play();
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
                uiSound.currentTime = 0;
                uiSound.play();
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
                uiSound.currentTime = 0;
                uiSound.play();
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
              <p className={`intro-data${dark ? ' dark' : ''}`}>GAMES PLAYED: {gamesPlayed}</p>
            {showCredits &&
            <div
              id="credits-panel"
              className={`slide-item-intro-bottom ${dark ? 'dark-container' : ''}`}
            >
              <p className={`credits-title`}>CREDITS</p>
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
            <button
              id="credits-toggle"
              type="button"
              className={`credits-button credits-docked slide-item-intro-bottom ${
                dark ? 'dark-gameover-button' : ''
              }`}
              onClick={() => {
                playUiClick();
                setShowCredits(true);
              }}
            >
              CREDITS
            </button>
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

            {phase === 'gameover' && continueError && (
              <p className={`slide-item-gameover ${dark ? ' dark' : ''}`}>
                {continueError}
              </p>
            )}

            <div
              className={`slide-item-gameover ${
                dark ? 'dark-gameover-button' : ' '
              } gameover-button`}
              onClick={() => {
                if (sound) {
                  uiSound.currentTime = 0;
                  uiSound.play();
                }
                setPhase('ready');
              }}
            >
              RETRY
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
