const SOUND_ASSET_MAP = {
  tap: 'sounds/tap.mp3',
  fall: 'sounds/fall.mp3',
  gem: 'sounds/gem.mp3',
  ui: 'sounds/ui.mp3',
};

let audioContext = null;
const audioBufferCache = new Map();

const getAudioContext = () => {
  if (audioContext) return audioContext;

  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) return null;

  try {
    audioContext = new AudioContextCtor();
  } catch (error) {
    console.error('Failed to create AudioContext:', error);
    return null;
  }

  return audioContext;
};

const loadAudioBuffer = async (soundName) => {
  const existing = audioBufferCache.get(soundName);
  if (existing) {
    return existing instanceof Promise ? existing : Promise.resolve(existing);
  }

  const context = getAudioContext();
  const soundPath = SOUND_ASSET_MAP[soundName];

  if (!context || !soundPath) {
    throw new Error(`Unknown sound or unavailable AudioContext: ${soundName}`);
  }

  const loadPromise = (async () => {
    const response = await fetch(soundPath);
    if (!response.ok) {
      throw new Error(`Failed to load sound "${soundName}" from ${soundPath}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = await context.decodeAudioData(arrayBuffer.slice(0));
    audioBufferCache.set(soundName, buffer);
    return buffer;
  })().catch((error) => {
    audioBufferCache.delete(soundName);
    throw error;
  });

  audioBufferCache.set(soundName, loadPromise);
  return loadPromise;
};

export async function preloadGameAudio() {
  await Promise.all(Object.keys(SOUND_ASSET_MAP).map(loadAudioBuffer));
}

export async function unlockGameAudio() {
  const context = getAudioContext();
  if (!context) return false;

  if (context.state === 'suspended') {
    try {
      await context.resume();
    } catch (error) {
      console.error('Failed to resume AudioContext:', error);
      return false;
    }
  }

  return context.state === 'running';
}

export function playGameSound(soundName, { volume = 1 } = {}) {
  void (async () => {
    const context = getAudioContext();
    if (!context) return;

    if (context.state !== 'running') {
      const unlocked = await unlockGameAudio();
      if (!unlocked) return;
    }

    const buffer = await loadAudioBuffer(soundName);

    const source = context.createBufferSource();
    source.buffer = buffer;

    const gainNode = context.createGain();
    gainNode.gain.value = volume;

    source.connect(gainNode);
    gainNode.connect(context.destination);
    source.start(0);
  })().catch((error) => {
    console.error(`Failed to play "${soundName}" sound:`, error);
  });
}
