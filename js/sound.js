// sound.js - Web Audio API 사운드 시스템 (코드 생성 효과음)

class SoundManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.volume = 0.3;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio not supported');
      this.enabled = false;
    }
  }

  ensureContext() {
    if (!this.initialized) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // --- 총소리 (무기별 다른 소리) ---
  playGunshot(weaponId) {
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime;
    const g = this.ctx.createGain();
    g.connect(this.ctx.destination);

    switch (weaponId) {
      case 'pistol': {
        g.gain.setValueAtTime(this.volume * 0.4, t);
        g.gain.exponentialDecayToValueAtTime?.(0.01, t + 0.1) ||
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        const osc = this.ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(600, t);
        osc.frequency.exponentialRampToValueAtTime(80, t + 0.08);
        osc.connect(g);
        osc.start(t);
        osc.stop(t + 0.12);
        this._noise(t, 0.06, this.volume * 0.3);
        break;
      }
      case 'smg': {
        g.gain.setValueAtTime(this.volume * 0.25, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
        const osc = this.ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(900, t);
        osc.frequency.exponentialRampToValueAtTime(200, t + 0.04);
        osc.connect(g);
        osc.start(t);
        osc.stop(t + 0.06);
        this._noise(t, 0.03, this.volume * 0.2);
        break;
      }
      case 'assault_rifle':
      case 'hk416': {
        g.gain.setValueAtTime(this.volume * 0.35, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(500, t);
        osc.frequency.exponentialRampToValueAtTime(60, t + 0.08);
        osc.connect(g);
        osc.start(t);
        osc.stop(t + 0.1);
        this._noise(t, 0.05, this.volume * 0.35);
        break;
      }
      case 'shotgun': {
        g.gain.setValueAtTime(this.volume * 0.5, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.15);
        osc.connect(g);
        osc.start(t);
        osc.stop(t + 0.2);
        this._noise(t, 0.12, this.volume * 0.5);
        break;
      }
      case 'sniper': {
        g.gain.setValueAtTime(this.volume * 0.5, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.exponentialRampToValueAtTime(30, t + 0.25);
        osc.connect(g);
        osc.start(t);
        osc.stop(t + 0.3);
        this._noise(t, 0.15, this.volume * 0.45);
        // sniper crack
        const osc2 = this.ctx.createOscillator();
        const g2 = this.ctx.createGain();
        g2.gain.setValueAtTime(this.volume * 0.2, t + 0.02);
        g2.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        g2.connect(this.ctx.destination);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(2000, t + 0.02);
        osc2.frequency.exponentialRampToValueAtTime(400, t + 0.12);
        osc2.connect(g2);
        osc2.start(t + 0.02);
        osc2.stop(t + 0.15);
        break;
      }
      default: {
        g.gain.setValueAtTime(this.volume * 0.3, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        this._noise(t, 0.05, this.volume * 0.3);
      }
    }
  }

  // --- 피격 사운드 ---
  playHit() {
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime;
    this._noise(t, 0.04, this.volume * 0.15);
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(this.volume * 0.12, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    g.connect(this.ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(300, t + 0.04);
    osc.connect(g);
    osc.start(t);
    osc.stop(t + 0.05);
  }

  // --- 크리티컬 사운드 ---
  playCritical() {
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime;
    this._noise(t, 0.08, this.volume * 0.3);
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(this.volume * 0.3, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    g.connect(this.ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.12);
    osc.connect(g);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  // --- 킬 사운드 ---
  playKill() {
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime;
    // thump
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(this.volume * 0.25, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    g.connect(this.ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.12);
    osc.connect(g);
    osc.start(t);
    osc.stop(t + 0.15);
    this._noise(t, 0.06, this.volume * 0.2);
  }

  // --- 콤보 사운드 (콤보 수에 따라 피치 올라감) ---
  playCombo(comboCount) {
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime;
    const pitch = 400 + Math.min(comboCount, 20) * 60;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(this.volume * 0.2, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    g.connect(this.ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitch, t);
    osc.frequency.exponentialRampToValueAtTime(pitch * 1.5, t + 0.08);
    osc.connect(g);
    osc.start(t);
    osc.stop(t + 0.12);
  }

  // --- 레벨업 사운드 ---
  playLevelUp() {
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime;
    const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(this.volume * 0.2, t + i * 0.08);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.2);
      g.connect(this.ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.08);
      osc.connect(g);
      osc.start(t + i * 0.08);
      osc.stop(t + i * 0.08 + 0.2);
    });
  }

  // --- 강화 사운드 ---
  playUpgrade() {
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(this.volume * 0.2, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    g.connect(this.ctx.destination);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.linearRampToValueAtTime(1200, t + 0.15);
    osc.connect(g);
    osc.start(t);
    osc.stop(t + 0.2);
  }

  // --- 코인 획득 사운드 ---
  playCoin() {
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(this.volume * 0.1, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    g.connect(this.ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1800 + Math.random() * 400, t);
    osc.connect(g);
    osc.start(t);
    osc.stop(t + 0.08);
  }

  // --- 보스 등장 사운드 ---
  playBossAppear() {
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(this.volume * 0.3, t + i * 0.15);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.15 + 0.2);
      g.connect(this.ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150 - i * 30, t + i * 0.15);
      osc.connect(g);
      osc.start(t + i * 0.15);
      osc.stop(t + i * 0.15 + 0.2);
    }
    this._noise(t, 0.5, this.volume * 0.15);
  }

  // --- 노이즈 헬퍼 ---
  _noise(startTime, duration, volume) {
    if (!this.ctx) return;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(volume, startTime);
    g.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    g.connect(this.ctx.destination);
    source.connect(g);
    source.start(startTime);
  }
}

const soundManager = new SoundManager();
