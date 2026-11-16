// Haptic feedback service for mobile devices and WebViews
// Uses navigator.vibrate when available with safe fallbacks

const isVibrateSupported = () => {
  return typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'vibrate' in navigator;
};

export const vibrate = (pattern) => {
  try {
    if (isVibrateSupported()) {
      navigator.vibrate(pattern);
    }
  } catch {
    // Graceful no-op on unsupported platforms or when permission restricted
  }
};

// Crisp micro-tap on directional turn
export const hapticTap = () => {
  vibrate(12);
};

// Double pulse on gem collection
export const hapticGem = () => {
  vibrate([18, 30, 24]);
};

// Impact thud on falling
export const hapticFall = () => {
  vibrate([35, 40, 50]);
};

// Celebratory burst on hitting a new high score
export const hapticNewBest = () => {
  vibrate([20, 40, 30, 40, 40]);
};
