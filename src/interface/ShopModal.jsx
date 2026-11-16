import { SKINS, SKINS_MAP } from '../constants/skins';
import useGame from '../stores/useGame';
import useSound from '../stores/useSound';
import { playGameSound } from '../services/audioContext';
import { UI_SOUND_VOLUME } from '../constants/constants';

export default function ShopModal({ onClose }) {
  const {
    totalGems,
    unlockedSkins,
    selectedSkin,
    unlockSkin,
    selectSkin,
    dark,
  } = useGame((state) => state);
  const sound = useSound((state) => state.sound);

  const playClick = () => {
    if (sound) playGameSound('ui', { volume: UI_SOUND_VOLUME });
  };

  const playBuy = () => {
    if (sound) playGameSound('gem');
  };

  const handleSelect = (skinId) => {
    playClick();
    selectSkin(skinId);
  };

  const handleUnlock = (skinId) => {
    const success = unlockSkin(skinId);
    if (success) {
      playBuy();
    } else {
      playClick();
    }
  };

  return (
    <div id="shop-overlay" onClick={onClose}>
      <div
        id="shop-modal"
        className={dark ? 'dark-container' : ''}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shop-header">
          <h2 className="shop-title">BALL SKINS</h2>
          <div className="shop-wallet">
            <span className="shop-gem-icon">💎</span>
            <span className="shop-gem-count">{totalGems}</span>
          </div>
        </div>

        <div className="shop-grid">
          {SKINS.map((skin) => {
            const isUnlocked = unlockedSkins.includes(skin.id);
            const isEquipped = selectedSkin === skin.id;
            const canAfford = totalGems >= skin.price;

            const ballColor = dark ? skin.darkColor : skin.color;
            const ballStyle = {
              background: `radial-gradient(circle at 35% 35%, #ffffff 0%, ${ballColor} 50%, #151515 100%)`,
            };

            return (
              <div
                key={skin.id}
                className={`shop-item ${isEquipped ? 'item-equipped' : ''} ${
                  dark ? 'dark-shop-item' : ''
                }`}
              >
                <div className="shop-ball-preview" style={ballStyle} />
                <span className="shop-item-name">{skin.name}</span>

                {isEquipped ? (
                  <button type="button" className="shop-btn btn-equipped" disabled>
                    EQUIPPED
                  </button>
                ) : isUnlocked ? (
                  <button
                    type="button"
                    className="shop-btn btn-equip"
                    onClick={() => handleSelect(skin.id)}
                  >
                    EQUIP
                  </button>
                ) : (
                  <button
                    type="button"
                    className={`shop-btn ${canAfford ? 'btn-unlock' : 'btn-locked'}`}
                    disabled={!canAfford}
                    onClick={() => handleUnlock(skin.id)}
                  >
                    💎 {skin.price}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <button
          type="button"
          className={`credits-button shop-close-btn ${dark ? 'dark-gameover-button' : ''}`}
          onClick={() => {
            playClick();
            onClose();
          }}
        >
          CLOSE
        </button>
      </div>
    </div>
  );
}
