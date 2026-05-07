import { AdMob } from "@capacitor-community/admob";
import { Capacitor } from "@capacitor/core";

const TEST_ANDROID_REWARDED_AD_ID = "ca-app-pub-3940256099942544/5224354917";

let hasInitializedAdMob = false;

const isNativeAndroid = () =>
  Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";

const getRewardedAdId = () =>
  import.meta.env.VITE_ADMOB_REWARDED_AD_ID || TEST_ANDROID_REWARDED_AD_ID;

const isTestingAd = () => !import.meta.env.VITE_ADMOB_REWARDED_AD_ID;

export async function initializeRewardedAds() {
  if (!isNativeAndroid() || hasInitializedAdMob) return;

  await AdMob.initialize();
  hasInitializedAdMob = true;
}

export async function showContinueRewardedAd() {
  if (!isNativeAndroid()) return true;

  await initializeRewardedAds();

  await AdMob.prepareRewardVideoAd({
    adId: getRewardedAdId(),
    isTesting: isTestingAd(),
    immersiveMode: true,
  });

  const reward = await AdMob.showRewardVideoAd();
  return Boolean(reward && reward.amount > 0);
}
