import { AdMob } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

// Standard Google AdMob test ad unit IDs for Android
const TEST_ANDROID_REWARDED_AD_ID = 'ca-app-pub-3940256099942544/5224354917';
const TEST_ANDROID_INTERSTITIAL_AD_ID = 'ca-app-pub-3940256099942544/1033173712';

// Interstitial pacing parameters
const MIN_INTERSTITIAL_INTERVAL_MS = 45 * 1000; // Minimum 45s between interstitials
const INTERSTITIAL_GAME_INTERVAL = 3; // Show every 3 games

let hasInitializedAdMob = false;

// Rewarded ad state
let rewardedAdReady = false;
let rewardedAdLoadPromise = null;
const rewardedListeners = new Set();

// Interstitial ad state
let interstitialAdReady = false;
let interstitialAdLoadPromise = null;
let lastInterstitialShowTime = 0;

const isNativeAndroid = () =>
  Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

const isDevMode = () => Boolean(import.meta.env.DEV);

const getRewardedAdId = () => {
  if (isDevMode()) return TEST_ANDROID_REWARDED_AD_ID;
  return import.meta.env.VITE_ADMOB_REWARDED_AD_ID || TEST_ANDROID_REWARDED_AD_ID;
};

const getInterstitialAdId = () => {
  if (isDevMode()) return TEST_ANDROID_INTERSTITIAL_AD_ID;
  return import.meta.env.VITE_ADMOB_INTERSTITIAL_AD_ID || TEST_ANDROID_INTERSTITIAL_AD_ID;
};

const isTestingAd = () =>
  isDevMode() || !import.meta.env.VITE_ADMOB_REWARDED_AD_ID;

const notifyRewardedAvailability = () => {
  rewardedListeners.forEach((listener) => {
    try {
      listener(rewardedAdReady);
    } catch (e) {
      console.error('Error in rewarded ad listener:', e);
    }
  });
};

/**
 * Initialize AdMob SDK and preload starting ads
 */
export async function initializeAds() {
  if (!isNativeAndroid() || hasInitializedAdMob) return;

  try {
    await AdMob.initialize({
      initializeForTesting: isDevMode(),
    });
    hasInitializedAdMob = true;

    // Start background preloading
    preloadContinueRewardedAd().catch((e) => {
      console.warn('Initial rewarded ad preload failed:', e);
    });
    preloadInterstitialAd().catch((e) => {
      console.warn('Initial interstitial ad preload failed:', e);
    });
  } catch (error) {
    console.error('AdMob initialization error:', error);
  }
}

/* ==========================================================================
   REWARDED AD (CONTINUE RUN)
   ========================================================================== */

export function isContinueRewardedAdAvailable() {
  if (!isNativeAndroid()) return true;
  return rewardedAdReady;
}

export function subscribeContinueRewardedAdAvailability(listener) {
  rewardedListeners.add(listener);
  listener(isContinueRewardedAdAvailable());

  return () => {
    rewardedListeners.delete(listener);
  };
}

export async function preloadContinueRewardedAd(retryCount = 0) {
  if (!isNativeAndroid()) return true;
  if (rewardedAdReady) return true;
  if (rewardedAdLoadPromise) return rewardedAdLoadPromise;

  rewardedAdLoadPromise = (async () => {
    try {
      if (!hasInitializedAdMob) {
        await initializeAds();
      }

      await AdMob.prepareRewardVideoAd({
        adId: getRewardedAdId(),
        isTesting: isTestingAd(),
        immersiveMode: true,
      });

      rewardedAdReady = true;
      notifyRewardedAvailability();
      return true;
    } catch (error) {
      rewardedAdReady = false;
      notifyRewardedAvailability();

      // Retry once after 3 seconds on failure
      if (retryCount < 1) {
        setTimeout(() => {
          preloadContinueRewardedAd(retryCount + 1).catch(() => {});
        }, 3000);
      }
      throw error;
    } finally {
      rewardedAdLoadPromise = null;
    }
  })();

  return rewardedAdLoadPromise;
}

export async function showContinueRewardedAd() {
  if (!isNativeAndroid()) return true;
  if (!rewardedAdReady) return false;

  rewardedAdReady = false;
  notifyRewardedAvailability();

  try {
    const reward = await AdMob.showRewardVideoAd();
    return Boolean(reward && reward.amount > 0);
  } catch (error) {
    console.error('Error showing rewarded ad:', error);
    return false;
  } finally {
    // Schedule preloading the next ad
    setTimeout(() => {
      preloadContinueRewardedAd().catch((err) => {
        console.warn('Failed to preload subsequent rewarded ad:', err);
      });
    }, 1000);
  }
}

/* ==========================================================================
   INTERSTITIAL AD (PACED GAME OVER)
   ========================================================================== */

export async function preloadInterstitialAd(retryCount = 0) {
  if (!isNativeAndroid()) return true;
  if (interstitialAdReady) return true;
  if (interstitialAdLoadPromise) return interstitialAdLoadPromise;

  interstitialAdLoadPromise = (async () => {
    try {
      if (!hasInitializedAdMob) {
        await initializeAds();
      }

      await AdMob.prepareInterstitial({
        adId: getInterstitialAdId(),
        isTesting: isTestingAd(),
      });

      interstitialAdReady = true;
      return true;
    } catch (error) {
      interstitialAdReady = false;

      // Retry once after 3 seconds on failure
      if (retryCount < 1) {
        setTimeout(() => {
          preloadInterstitialAd(retryCount + 1).catch(() => {});
        }, 3000);
      }
      throw error;
    } finally {
      interstitialAdLoadPromise = null;
    }
  })();

  return interstitialAdLoadPromise;
}

/**
 * Checks pacing rules and displays an interstitial ad on game over if eligible.
 * Pacing Rules:
 * 1. Must be native Android.
 * 2. If player used rewarded ad to continue this run, skip interstitial (no double-ad penalty).
 * 3. Shows every INTERSTITIAL_GAME_INTERVAL games (e.g. game 3, 6, 9...).
 * 4. Must satisfy minimum interval cooldown (e.g. 45s) since last interstitial.
 */
export async function checkAndShowGameOverInterstitial({
  gamesPlayed,
  wasContinued = false,
}) {
  if (!isNativeAndroid()) return false;

  // Rule 2: Skip if user already watched a rewarded ad during this run
  if (wasContinued) {
    return false;
  }

  // Rule 3: Frequency check (e.g., every 3 games)
  if (gamesPlayed <= 0 || gamesPlayed % INTERSTITIAL_GAME_INTERVAL !== 0) {
    return false;
  }

  // Rule 4: Cooldown check
  const now = Date.now();
  if (now - lastInterstitialShowTime < MIN_INTERSTITIAL_INTERVAL_MS) {
    return false;
  }

  // Check readiness
  if (!interstitialAdReady) {
    preloadInterstitialAd().catch(() => {});
    return false;
  }

  try {
    interstitialAdReady = false;
    await AdMob.showInterstitial();
    lastInterstitialShowTime = Date.now();
    return true;
  } catch (error) {
    console.error('Failed to show interstitial ad:', error);
    return false;
  } finally {
    // Schedule preloading the next interstitial
    setTimeout(() => {
      preloadInterstitialAd().catch((e) => {
        console.warn('Failed to preload next interstitial ad:', e);
      });
    }, 1500);
  }
}
