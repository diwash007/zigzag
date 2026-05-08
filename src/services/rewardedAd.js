import { AdMob } from "@capacitor-community/admob";
import { Capacitor } from "@capacitor/core";

const TEST_ANDROID_REWARDED_AD_ID = "ca-app-pub-3940256099942544/5224354917";

let hasInitializedAdMob = false;
let rewardedAdReady = false;
let rewardedAdLoadPromise = null;
const availabilityListeners = new Set();

const isNativeAndroid = () =>
  Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";

const getRewardedAdId = () =>
  import.meta.env.VITE_ADMOB_REWARDED_AD_ID || TEST_ANDROID_REWARDED_AD_ID;

const isTestingAd = () => !import.meta.env.VITE_ADMOB_REWARDED_AD_ID;

const notifyAvailability = () => {
  availabilityListeners.forEach((listener) => listener(rewardedAdReady));
};

export async function initializeRewardedAds() {
  if (!isNativeAndroid() || hasInitializedAdMob) return;

  await AdMob.initialize();
  hasInitializedAdMob = true;
}

export function isContinueRewardedAdAvailable() {
  if (!isNativeAndroid()) return true;
  return rewardedAdReady;
}

export function subscribeContinueRewardedAdAvailability(listener) {
  availabilityListeners.add(listener);
  listener(isContinueRewardedAdAvailable());

  return () => {
    availabilityListeners.delete(listener);
  };
}

export async function preloadContinueRewardedAd() {
  if (!isNativeAndroid()) return true;
  if (rewardedAdReady) return true;
  if (rewardedAdLoadPromise) return rewardedAdLoadPromise;

  rewardedAdLoadPromise = (async () => {
    try {
      await initializeRewardedAds();
      await AdMob.prepareRewardVideoAd({
        adId: getRewardedAdId(),
        isTesting: isTestingAd(),
        immersiveMode: true,
      });
      rewardedAdReady = true;
      notifyAvailability();
      return true;
    } catch (error) {
      rewardedAdReady = false;
      notifyAvailability();
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
  notifyAvailability();

  try {
    const reward = await AdMob.showRewardVideoAd();
    return Boolean(reward && reward.amount > 0);
  } finally {
    preloadContinueRewardedAd().catch((error) => {
      console.error("Failed to preload next rewarded ad:", error);
    });
  }
}
