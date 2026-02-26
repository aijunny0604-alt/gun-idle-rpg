// save.js - localStorage 저장/로드

const SAVE_KEY = 'gun_idle_rpg_save';
const SAVE_INTERVAL = 30000; // 30초

class SaveManager {
  constructor() {
    this.lastSave = 0;
  }

  save(gameRef) {
    const data = {
      version: 2,
      timestamp: Date.now(),
      player: gameRef.player.serialize(),
      stage: gameRef.stageManager.serialize(),
      rebirth: gameRef.rebirthManager.serialize(),
    };
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      this.lastSave = Date.now();
      return true;
    } catch (e) {
      console.warn('Save failed:', e);
      return false;
    }
  }

  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (data.version !== 1 && data.version !== 2) return null;
      return data;
    } catch (e) {
      console.warn('Load failed:', e);
      return null;
    }
  }

  deleteSave() {
    localStorage.removeItem(SAVE_KEY);
  }

  autoSave(gameRef, now) {
    if (now - this.lastSave >= SAVE_INTERVAL) {
      this.save(gameRef);
    }
  }
}
