// combo.js - 연속 킬 콤보 시스템

class ComboManager {
  constructor() {
    this.count = 0;
    this.timer = 0;
    this.maxTimer = 3000; // 3초 내에 다음 킬
    this.bestCombo = 0;
    this.displayTimer = 0;
    this.displayCount = 0;
    this.shakeScale = 0;
  }

  onKill() {
    this.count++;
    this.timer = this.maxTimer;
    this.displayTimer = 80;
    this.displayCount = this.count;
    this.shakeScale = Math.min(1, this.count / 10);

    if (this.count > this.bestCombo) {
      this.bestCombo = this.count;
    }

    if (this.count >= 3) {
      soundManager.playCombo(this.count);
    }
  }

  get multiplier() {
    if (this.count < 3) return 1;
    if (this.count < 5) return 1.2;
    if (this.count < 10) return 1.5;
    if (this.count < 20) return 2.0;
    if (this.count < 50) return 3.0;
    return 5.0;
  }

  get comboName() {
    if (this.count < 3) return '';
    if (this.count < 5) return 'NICE!';
    if (this.count < 10) return 'GREAT!';
    if (this.count < 20) return 'AWESOME!';
    if (this.count < 50) return 'UNSTOPPABLE!';
    return 'GODLIKE!';
  }

  get comboColor() {
    if (this.count < 5) return '#44ff44';
    if (this.count < 10) return '#44ddff';
    if (this.count < 20) return '#ffaa00';
    if (this.count < 50) return '#ff44ff';
    return '#ff2222';
  }

  update(dt) {
    if (this.timer > 0) {
      this.timer -= dt;
      if (this.timer <= 0) {
        this.count = 0;
        this.timer = 0;
      }
    }
    if (this.displayTimer > 0) {
      this.displayTimer--;
    }
  }

  render(ctx, canvasWidth) {
    if (this.displayTimer <= 0 || this.displayCount < 3) return;

    const alpha = Math.min(1, this.displayTimer / 20);
    const bounce = this.displayTimer > 65 ? 1 + (this.displayTimer - 65) * 0.03 : 1;

    ctx.save();
    ctx.globalAlpha = alpha;

    // Combo count
    const x = canvasWidth / 2;
    const y = 180;

    ctx.textAlign = 'center';

    // Glow
    ctx.shadowColor = this.comboColor;
    ctx.shadowBlur = 15;

    // Combo number
    const numSize = Math.round(32 * bounce);
    ctx.font = `900 ${numSize}px monospace`;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 5;
    ctx.strokeText(`${this.displayCount} COMBO`, x, y);
    ctx.fillStyle = this.comboColor;
    ctx.fillText(`${this.displayCount} COMBO`, x, y);

    // Combo name
    if (this.comboName) {
      const nameSize = Math.round(16 * bounce);
      ctx.font = `900 ${nameSize}px monospace`;
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.strokeText(this.comboName, x, y + 24);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(this.comboName, x, y + 24);
    }

    // Multiplier
    if (this.multiplier > 1) {
      ctx.font = '700 12px monospace';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.strokeText(`x${this.multiplier.toFixed(1)} BONUS`, x, y + 42);
      ctx.fillStyle = '#ffd740';
      ctx.fillText(`x${this.multiplier.toFixed(1)} BONUS`, x, y + 42);
    }

    ctx.shadowBlur = 0;
    ctx.restore();

    // Combo timer bar
    if (this.count >= 3 && this.timer > 0) {
      const barW = 120;
      const barH = 4;
      const barX = x - barW / 2;
      const barY = y + 52;
      const pct = this.timer / this.maxTimer;

      ctx.save();
      ctx.globalAlpha = alpha * 0.8;
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = this.comboColor;
      ctx.fillRect(barX, barY, barW * pct, barH);
      ctx.restore();
    }
  }
}
