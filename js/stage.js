// stage.js - 스테이지/웨이브 관리

class StageManager {
  constructor() {
    this.stage = 1;
    this.wave = 1;
    this.wavesPerStage = 5;
    this.enemiesPerWave = 5;
    this.enemiesSpawned = 0;
    this.enemiesKilled = 0;
    this.totalEnemiesInWave = 5;
    this.spawnTimer = 0;
    this.spawnInterval = 2000;
    this.waveComplete = false;
    this.waveTransition = false;
    this.transitionTimer = 0;
    this.bossWave = false;
    this.stageComplete = false;
    this.stageTransitionTimer = 0;
  }

  get stageMultiplier() {
    return 1 + (this.stage - 1) * 0.3 + (this.wave - 1) * 0.05;
  }

  get displayText() {
    if (this.bossWave) return `STAGE ${this.stage} — BOSS`;
    return `STAGE ${this.stage} — ${this.wave}/${this.wavesPerStage}`;
  }

  calculateWave() {
    this.bossWave = (this.wave === this.wavesPerStage);
    if (this.bossWave) {
      this.totalEnemiesInWave = 1;
      this.spawnInterval = 1000;
    } else {
      this.totalEnemiesInWave = this.enemiesPerWave + Math.floor(this.stage * 1.5);
      this.spawnInterval = Math.max(600, 2000 - this.stage * 50);
    }
    this.enemiesSpawned = 0;
    this.enemiesKilled = 0;
    this.waveComplete = false;
  }

  spawnEnemy(canvasWidth, groundY) {
    if (this.enemiesSpawned >= this.totalEnemiesInWave) return null;
    if (this.waveTransition || this.stageComplete) return null;

    const x = canvasWidth + 10 + Math.random() * 30;
    const y = groundY;

    let type = 'normal';
    if (this.bossWave) {
      type = 'boss';
      if (this.enemiesSpawned === 0) soundManager.playBossAppear();
    } else {
      const roll = Math.random();
      if (roll < 0.15 && this.stage >= 2) type = 'fast';
      else if (roll < 0.25 && this.stage >= 3) type = 'tank';
    }

    this.enemiesSpawned++;
    return new Enemy(x, y, type, this.stageMultiplier);
  }

  onEnemyKilled() {
    this.enemiesKilled++;
    if (this.enemiesKilled >= this.totalEnemiesInWave) {
      this.waveComplete = true;
    }
  }

  update(dt, enemies) {
    // Stage complete transition
    if (this.stageComplete) {
      this.stageTransitionTimer -= dt;
      if (this.stageTransitionTimer <= 0) {
        this.stage++;
        this.wave = 1;
        this.stageComplete = false;
        this.enemiesPerWave = 5 + Math.floor(this.stage * 0.5);
        this.calculateWave();
      }
      return;
    }

    // Wave transition
    if (this.waveTransition) {
      this.transitionTimer -= dt;
      if (this.transitionTimer <= 0) {
        this.waveTransition = false;
        this.calculateWave();
      }
      return;
    }

    // Check wave complete
    if (this.waveComplete && enemies.length === 0) {
      if (this.wave >= this.wavesPerStage) {
        // Stage complete
        this.stageComplete = true;
        this.stageTransitionTimer = 2000;
        if (typeof game !== 'undefined') {
          game.screenEffects.push(new FloatingText(
            180, 280, `스테이지 ${this.stage} 클리어!`,
            '#ffd700', 20, 90
          ));
        }
      } else {
        this.wave++;
        this.waveTransition = true;
        this.transitionTimer = 1500;
        if (typeof game !== 'undefined') {
          game.screenEffects.push(new FloatingText(
            180, 300, `웨이브 ${this.wave}`,
            '#ffffff', 16, 60
          ));
        }
      }
      return;
    }

    // Spawn timer
    if (!this.waveComplete) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0 && this.enemiesSpawned < this.totalEnemiesInWave) {
        this.spawnTimer = this.spawnInterval;
        return 'spawn';
      }
    }

    return null;
  }

  serialize() {
    return {
      stage: this.stage,
      wave: this.wave,
    };
  }

  static deserialize(data) {
    const sm = new StageManager();
    sm.stage = data.stage;
    sm.wave = data.wave;
    sm.enemiesPerWave = 5 + Math.floor(sm.stage * 0.5);
    sm.calculateWave();
    return sm;
  }
}
