// game.js - 게임 메인 루프, 초기화 (사이드스크롤 + 카메라)

class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');

    this.renderWidth = 360;
    this.renderHeight = 640;
    this.canvas.width = this.renderWidth;
    this.canvas.height = this.renderHeight;
    this.ctx.imageSmoothingEnabled = false;

    this.groundY = 520;
    this.cameraX = 0;

    this.player = new Player();
    this.player.y = this.groundY;

    this.enemies = [];
    this.bullets = [];
    this.effects = [];
    this.screenEffects = [];

    this.stageManager = new StageManager();
    this.stageManager.calculateWave();

    this.rebirthManager = new RebirthManager();

    this.ui = new UIManager();
    this.saveManager = new SaveManager();

    this.paused = false;
    this.lastTime = 0;
    this.running = true;

    // Screen shake
    this.shakeTimer = 0;
    this.shakeIntensity = 0;

    // Hitstop (freeze frame for impact feel)
    this.hitstopTimer = 0;

    // Background image
    this.bgImage = new Image();
    this.bgImage.src = 'assets/bg-stage1.png';
    this.bgReady = false;
    this.bgImage.onload = () => { this.bgReady = true; };

    // Initialize sound on first interaction
    this.soundInitialized = false;
    const initSound = () => {
      if (!this.soundInitialized) {
        soundManager.ensureContext();
        this.soundInitialized = true;
      }
    };
    document.addEventListener('click', initSound, { once: false });
    document.addEventListener('touchstart', initSound, { once: false });

    this.loadGame();
    this.checkOfflineReward();
    this.ui.update(this);
    requestAnimationFrame((t) => this.loop(t));
  }


  loadGame() {
    const data = this.saveManager.load();
    if (data) {
      this.player = Player.deserialize(data.player);
      this.player.y = this.groundY;
      this.stageManager = StageManager.deserialize(data.stage);
      if (data.rebirth) this.rebirthManager = RebirthManager.deserialize(data.rebirth);
      this.cameraX = Math.max(0, this.player.worldX - this.renderWidth * 0.25);
    }
  }

  checkOfflineReward() {
    const data = this.saveManager.load();
    if (!data || !data.timestamp) return;
    const elapsed = Date.now() - data.timestamp;
    const minMs = 60000; // minimum 1 minute
    if (elapsed < minMs) return;
    const minutes = Math.floor(elapsed / 60000);
    const hours = Math.floor(minutes / 60);
    const goldPerMin = 5 + this.player.level * 2;
    const reward = Math.floor(minutes * goldPerMin);
    if (reward > 0) {
      this.player.gold += reward;
      const timeText = hours > 0 ? `${hours}시간 ${minutes % 60}분` : `${minutes}분`;
      this.screenEffects.push(new FloatingText(
        180, 250, `오프라인 보상!`, '#ffd740', 20, 120
      ));
      this.screenEffects.push(new FloatingText(
        180, 280, `${timeText} 방치 → +${reward.toLocaleString()}G`, '#ffaa00', 14, 100
      ));
    }
  }

  togglePause() {
    this.paused = !this.paused;
    this.ui.update(this);
  }

  loop(timestamp) {
    if (!this.running) return;
    const dt = this.lastTime ? Math.min(timestamp - this.lastTime, 50) : 16;
    this.lastTime = timestamp;
    // Hitstop: skip update but still render (freeze frame effect)
    if (this.hitstopTimer > 0) {
      this.hitstopTimer--;
      this.render();
      this.saveManager.autoSave(this, Date.now());
      requestAnimationFrame((t) => this.loop(t));
      return;
    }
    if (!this.paused) this.update(dt);
    this.render();
    this.saveManager.autoSave(this, Date.now());
    if (Math.floor(timestamp / 100) !== Math.floor((timestamp - dt) / 100)) {
      this.ui.update(this);
    }
    requestAnimationFrame((t) => this.loop(t));
  }

  update(dt) {
    // Determine walking state: walk whenever no enemies on screen
    this.player.isWalking = this.enemies.length === 0;

    this.player.update(dt, this.enemies);

    // Update camera to follow player (player at 25% from left)
    this.cameraX = this.player.worldX - this.renderWidth * 0.25;
    if (this.cameraX < 0) this.cameraX = 0;

    // Stage/spawn system
    const action = this.stageManager.update(dt, this.enemies);
    if (action === 'spawn') {
      // Spawn enemies at right edge of camera view (world coordinates)
      const enemy = this.stageManager.spawnEnemy(
        this.cameraX + this.renderWidth, this.groundY
      );
      if (enemy) this.enemies.push(enemy);
    }

    for (const enemy of this.enemies) {
      enemy.update(dt, this.player);
      if (!enemy.alive) {
        // Apply rebirth exp multiplier
        const expMult = this.rebirthManager.permanentBonuses.expMultiplier;
        this.player.addExp(Math.floor(enemy.expReward * expMult));
        // Gold (rebirth multiplier already applied via combo system in bullet.js)
        const goldMult = this.rebirthManager.permanentBonuses.goldMultiplier;
        this.player.gold += Math.floor(enemy.goldReward * goldMult);
        this.player.totalKills++;
        this.stageManager.onEnemyKilled();

        // Equipment drop check
        const dropChance = EquipmentManager.dropChance(this.stageManager.stage);
        if (Math.random() < dropChance) {
          const item = EquipmentManager.generateItem(this.stageManager.stage);
          this.player.equipment.addItem(item);
          // Drop effect
          const gradeInfo = EQUIP_GRADES[item.grade];
          this.effects.push(new FloatingText(
            enemy.x, enemy.y - enemy.height - 45,
            `${item.icon} ${item.displayName}`,
            gradeInfo.color, 13, 60
          ));
          this.screenEffects.push(new ScreenFlash(gradeInfo.color, 0.15, 4));
        }
      }
    }
    this.enemies = this.enemies.filter(e => e.alive);

    for (const bullet of this.bullets) {
      bullet.update(dt, this.enemies, this.renderWidth, this.cameraX);
    }
    this.bullets = this.bullets.filter(b => b.alive);

    for (const effect of this.effects) {
      effect.update();
    }
    this.effects = this.effects.filter(e => e.alive);

    for (const effect of this.screenEffects) {
      effect.update();
    }
    this.screenEffects = this.screenEffects.filter(e => e.alive);

    // Screen shake decay
    if (this.shakeTimer > 0) {
      this.shakeTimer--;
    }

    if (this.player.hp <= 0) {
      this.player.hp = this.player.effectiveMaxHp;
      this.player.shield = this.player.maxShield;
      this.player.gold = Math.floor(this.player.gold * 0.8);
      this.enemies = [];
      this.bullets = [];
      this.stageManager.calculateWave();
      this.screenEffects.push(new FloatingText(180, 260, '부활! (골드 -20%)', '#ff8888', 16, 60));
    }
  }

  shake(intensity, duration) {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    this.shakeTimer = Math.max(this.shakeTimer, duration);
  }

  hitstop(frames) {
    this.hitstopTimer = Math.max(this.hitstopTimer, frames);
  }

  // Helper: compute tiled screen X for a background element
  tiledX(elementX, parallaxRate, tileWidth) {
    const offset = this.cameraX * parallaxRate;
    return ((elementX - offset) % tileWidth + tileWidth) % tileWidth;
  }

  render() {
    const ctx = this.ctx;
    const W = this.renderWidth;
    const H = this.renderHeight;
    const GY = this.groundY;
    const camX = this.cameraX;

    // === BACKGROUND IMAGE ===
    if (this.bgReady) {
      const imgW = this.bgImage.width;
      const imgH = this.bgImage.height;

      // The ground edge in the image is at ~60% of the image height.
      // Scale so that line aligns with groundY in the canvas.
      const bgGroundLine = 0.60;
      const scale = GY / (bgGroundLine * imgH);
      const drawW = imgW * scale;
      const drawH = imgH * scale;

      // Parallax scroll (slow for far background)
      const parallax = 0.15;
      const offset = ((camX * parallax) % drawW + drawW) % drawW;

      // Draw tiled copies to fill screen
      for (let x = -offset; x < W; x += drawW) {
        ctx.drawImage(this.bgImage, x, 0, drawW, drawH);
      }
    } else {
      // Fallback while image loads
      ctx.fillStyle = '#1a2030';
      ctx.fillRect(0, 0, W, H);
    }

    // === GAME OBJECTS (world coords → screen via translate) ===
    // Apply screen shake
    let shakeX = 0, shakeY = 0;
    if (this.shakeTimer > 0) {
      const t = this.shakeTimer / 6;
      const intensity = this.shakeIntensity * t;
      shakeX = (Math.random() - 0.5) * intensity * 2;
      shakeY = (Math.random() - 0.5) * intensity * 2;
      if (this.shakeTimer <= 0) this.shakeIntensity = 0;
    }

    ctx.save();
    ctx.translate(Math.round(-camX + shakeX), Math.round(shakeY));

    for (const enemy of this.enemies) {
      enemy.render(ctx);
    }
    this.player.render(ctx);
    for (const bullet of this.bullets) {
      bullet.render(ctx);
    }
    for (const effect of this.effects) {
      effect.render(ctx);
    }

    ctx.restore();

    // === SCREEN-SPACE EFFECTS (stage/wave text, revival text) ===
    for (const effect of this.screenEffects) {
      effect.render(ctx);
    }

    // Combo display
    this.player.combo.render(ctx, W);

    // Stage transition overlay
    if (this.stageManager.stageComplete) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(0, 0, W, H);
    }

    // Paused overlay
    if (this.paused) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px monospace';
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.strokeText('일시정지', W / 2, H / 2);
      ctx.fillText('일시정지', W / 2, H / 2);
    }
  }

}

let game;
window.addEventListener('DOMContentLoaded', () => {
  preloadImages();
  function waitAndStart() {
    if (allImagesReady) {
      game = new Game();
    } else {
      requestAnimationFrame(waitAndStart);
    }
  }
  setTimeout(waitAndStart, 100);
});
