// effects.js - 이펙트 시스템 (박진감 강화)

class FloatingText {
  constructor(x, y, text, color, size, duration) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.size = size || 14;
    this.duration = duration || 30;
    this.timer = this.duration;
    this.alive = true;
    this.vy = -2.0;
    this.vx = (Math.random() - 0.5) * 1.2;
    this.scale = 1.4; // start big, shrink down
  }

  update() {
    this.y += this.vy;
    this.x += this.vx;
    this.vy *= 0.94;
    this.scale = Math.max(1, this.scale - 0.03);
    this.timer--;
    if (this.timer <= 0) this.alive = false;
  }

  render(ctx) {
    const alpha = Math.min(1, this.timer / (this.duration * 0.3));
    ctx.save();
    ctx.globalAlpha = alpha;
    const s = Math.round(this.size * this.scale);
    ctx.font = `bold ${s}px monospace`;
    ctx.textAlign = 'center';

    // Black outline
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.strokeText(this.text, Math.round(this.x), Math.round(this.y));
    // Color fill
    ctx.fillStyle = this.color;
    ctx.fillText(this.text, Math.round(this.x), Math.round(this.y));
    ctx.restore();
  }
}

class Particle {
  constructor(x, y, vx, vy, color, size, duration) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.size = size || 3;
    this.duration = duration || 20;
    this.timer = this.duration;
    this.alive = true;
    this.gravity = 0.15;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity;
    this.vx *= 0.98;
    this.timer--;
    if (this.timer <= 0) this.alive = false;
  }

  render(ctx) {
    const alpha = this.timer / this.duration;
    const s = this.size * (0.5 + alpha * 0.5);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.fillRect(
      Math.round(this.x) - s / 2,
      Math.round(this.y) - s / 2,
      s, s
    );
    ctx.restore();
  }
}

class ShellCasing {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = -2 - Math.random() * 3;
    this.vy = -4 - Math.random() * 4;
    this.gravity = 0.2;
    this.rotation = 0;
    this.rotSpeed = (Math.random() - 0.5) * 0.5;
    this.timer = 35;
    this.alive = true;
    this.grounded = false;
  }

  update() {
    if (!this.grounded) {
      this.x += this.vx;
      this.y += this.vy;
      this.vy += this.gravity;
      this.rotation += this.rotSpeed;
      if (this.y > 515) {
        this.y = 515;
        this.grounded = true;
      }
    }
    this.timer--;
    if (this.timer <= 0) this.alive = false;
  }

  render(ctx) {
    const alpha = Math.min(1, this.timer / 12);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#d4a830';
    ctx.fillRect(Math.round(this.x), Math.round(this.y), 3, 5);
    ctx.fillStyle = '#e8c040';
    ctx.fillRect(Math.round(this.x), Math.round(this.y), 2, 2);
    ctx.fillStyle = '#c09020';
    ctx.fillRect(Math.round(this.x) - 1, Math.round(this.y) + 4, 4, 1);
    ctx.restore();
  }
}

// Impact ring - expanding circle at hit point
class ImpactRing {
  constructor(x, y, maxRadius, color, duration) {
    this.x = x;
    this.y = y;
    this.maxRadius = maxRadius || 20;
    this.color = color || '#ffdd44';
    this.duration = duration || 12;
    this.timer = this.duration;
    this.alive = true;
  }

  update() {
    this.timer--;
    if (this.timer <= 0) this.alive = false;
  }

  render(ctx) {
    const progress = 1 - this.timer / this.duration;
    const radius = this.maxRadius * progress;
    const alpha = 1 - progress;
    const lineWidth = Math.max(1, 4 * (1 - progress));
    ctx.save();
    ctx.globalAlpha = alpha * 0.9;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.arc(Math.round(this.x), Math.round(this.y), radius, 0, Math.PI * 2);
    ctx.stroke();
    // Inner glow
    ctx.globalAlpha = alpha * 0.35;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(Math.round(this.x), Math.round(this.y), radius * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// Hit flash - brief white outline/glow on enemy (not a big rectangle)
class HitFlash {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = Math.min(w || 30, 50);  // cap size
    this.h = Math.min(h || 40, 60);
    this.timer = 3;
    this.alive = true;
  }

  update() {
    this.timer--;
    if (this.timer <= 0) this.alive = false;
  }

  render(ctx) {
    const alpha = this.timer / 3 * 0.4;
    const cx = Math.round(this.x);
    const cy = Math.round(this.y) - this.h * 0.5;
    ctx.save();
    ctx.globalAlpha = alpha;
    // Small bright flash at hit point (not full body rectangle)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy, this.w * 0.35, 0, Math.PI * 2);
    ctx.fill();
    // Outer glow ring
    ctx.globalAlpha = alpha * 0.5;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, this.w * 0.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

// Crit slash lines radiating from impact point
class CritSlash {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.timer = 12;
    this.duration = 12;
    this.alive = true;
    this.lines = [];
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 / 8) * i + (Math.random() - 0.5) * 0.4;
      this.lines.push({
        angle,
        len: 20 + Math.random() * 35,
        width: 2 + Math.random() * 3,
      });
    }
  }

  update() {
    this.timer--;
    if (this.timer <= 0) this.alive = false;
  }

  render(ctx) {
    const progress = 1 - this.timer / this.duration;
    const alpha = 1 - progress;
    ctx.save();
    ctx.globalAlpha = alpha;
    for (const l of this.lines) {
      const extend = l.len * Math.min(1, progress * 3);
      const startDist = extend * 0.2;
      const x1 = this.x + Math.cos(l.angle) * startDist;
      const y1 = this.y + Math.sin(l.angle) * startDist;
      const x2 = this.x + Math.cos(l.angle) * extend;
      const y2 = this.y + Math.sin(l.angle) * extend;
      // White core
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = l.width * (1 - progress);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      // Orange/red glow
      ctx.strokeStyle = '#ff4400';
      ctx.lineWidth = l.width * (1 - progress) * 2.5;
      ctx.globalAlpha = alpha * 0.35;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.globalAlpha = alpha;
    }
    ctx.restore();
  }
}

// Big muzzle flash explosion effect
class MuzzleFlash {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.timer = 5;
    this.alive = true;
    this.size = 14 + Math.random() * 10;
  }

  update() {
    this.timer--;
    if (this.timer <= 0) this.alive = false;
  }

  render(ctx) {
    const alpha = this.timer / 5;
    const s = this.size * (1 + (1 - alpha) * 0.6);
    ctx.save();
    ctx.globalAlpha = alpha;

    // Outer orange glow
    ctx.fillStyle = '#ff6600';
    ctx.fillRect(this.x - s * 0.7, this.y - s * 0.9, s * 2, s * 1.8);

    // Middle yellow
    ctx.fillStyle = '#ffdd00';
    ctx.fillRect(this.x - s * 0.3, this.y - s * 0.5, s * 1.4, s * 1.0);

    // Core white
    ctx.globalAlpha = alpha * 1.2;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(this.x, this.y - s * 0.25, s * 0.7, s * 0.5);

    // Radiating sparks
    ctx.globalAlpha = alpha * 0.8;
    ctx.fillStyle = '#ffaa00';
    ctx.fillRect(this.x + s * 1.1, this.y - s * 0.5, s * 0.5, 3);
    ctx.fillRect(this.x + s * 0.9, this.y + s * 0.5, s * 0.6, 3);
    ctx.fillRect(this.x - s * 0.3, this.y - s, 3, s * 0.4);
    ctx.fillRect(this.x + s * 1.4, this.y - 2, s * 0.4, 2);

    ctx.restore();
  }
}

// Screen flash - brief full-screen color overlay (rendered in screen space)
class ScreenFlash {
  constructor(color, intensity, duration) {
    this.color = color || '#ffffff';
    this.intensity = intensity || 0.3;
    this.duration = duration || 6;
    this.timer = this.duration;
    this.alive = true;
  }

  update() {
    this.timer--;
    if (this.timer <= 0) this.alive = false;
  }

  render(ctx) {
    const alpha = (this.timer / this.duration) * this.intensity;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.fillRect(0, 0, 360, 640);
    ctx.restore();
  }
}

// Directional hit sparks - spray in the bullet's travel direction
class DirectionalSparks {
  constructor(x, y, direction) {
    this.sparks = [];
    const baseAngle = direction || 0; // angle bullets travel (0 = right)
    for (let i = 0; i < 6; i++) {
      const spread = (Math.random() - 0.5) * 1.2;
      const angle = baseAngle + Math.PI + spread; // sparks fly backwards from bullet
      const speed = 3 + Math.random() * 5;
      this.sparks.push({
        x, y: y + (Math.random() - 0.5) * 6,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        size: 1 + Math.random() * 3,
      });
    }
    this.timer = 12;
    this.duration = 12;
    this.alive = true;
  }

  update() {
    for (const s of this.sparks) {
      s.x += s.vx;
      s.y += s.vy;
      s.vy += 0.15;
      s.vx *= 0.96;
    }
    this.timer--;
    if (this.timer <= 0) this.alive = false;
  }

  render(ctx) {
    const alpha = this.timer / this.duration;
    ctx.save();
    ctx.globalAlpha = alpha;
    for (const s of this.sparks) {
      ctx.fillStyle = '#ffdd44';
      ctx.fillRect(Math.round(s.x), Math.round(s.y), s.size, s.size);
      // Bright core
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(Math.round(s.x), Math.round(s.y), Math.max(1, s.size - 1), 1);
    }
    ctx.restore();
  }
}

// Gold coin that flies toward the player
class GoldCoin {
  constructor(x, y, targetPlayer, amount) {
    this.x = x;
    this.y = y;
    this.targetPlayer = targetPlayer;
    this.amount = amount;
    this.alive = true;
    this.timer = 0;
    this.phase = 'scatter'; // 'scatter' -> 'attract'
    this.scatterTime = 15 + Math.random() * 10;
    this.vx = (Math.random() - 0.5) * 6;
    this.vy = -3 - Math.random() * 5;
    this.gravity = 0.15;
    this.size = 6;
    this.sparkle = 0;
    this.collected = false;
  }

  update() {
    this.timer++;
    this.sparkle += 0.3;

    if (this.phase === 'scatter') {
      this.x += this.vx;
      this.y += this.vy;
      this.vy += this.gravity;
      this.vx *= 0.96;
      if (this.timer > this.scatterTime) {
        this.phase = 'attract';
      }
    } else {
      // Attract to player
      const tx = this.targetPlayer.worldX;
      const ty = this.targetPlayer.y - 40;
      const dx = tx - this.x;
      const dy = ty - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const speed = 6 + (this.timer - this.scatterTime) * 0.5;
      if (dist < 15) {
        this.alive = false;
        this.collected = true;
        if (typeof soundManager !== 'undefined') soundManager.playCoin();
      } else {
        this.x += (dx / dist) * speed;
        this.y += (dy / dist) * speed;
      }
    }

    if (this.timer > 120) this.alive = false;
  }

  render(ctx) {
    const alpha = this.timer > 100 ? (120 - this.timer) / 20 : 1;
    ctx.save();
    ctx.globalAlpha = alpha;

    // Coin shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(this.x, this.y + this.size + 2, this.size * 0.6, 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Coin body
    const shimmer = Math.sin(this.sparkle) * 0.2 + 0.8;
    ctx.fillStyle = `rgb(${Math.floor(255 * shimmer)}, ${Math.floor(215 * shimmer)}, 0)`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();

    // Coin highlight
    ctx.fillStyle = '#fff8';
    ctx.beginPath();
    ctx.arc(this.x - 2, this.y - 2, this.size * 0.4, 0, Math.PI * 2);
    ctx.fill();

    // G text
    ctx.fillStyle = '#8B6914';
    ctx.font = `bold ${this.size + 2}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('G', this.x, this.y + 1);

    ctx.restore();
  }
}

// Explosion effect for explosive skill
class Explosion {
  constructor(x, y, radius) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.maxRadius = radius;
    this.timer = 16;
    this.duration = 16;
    this.alive = true;
  }

  update() {
    this.timer--;
    if (this.timer <= 0) this.alive = false;
  }

  render(ctx) {
    const progress = 1 - this.timer / this.duration;
    const r = this.maxRadius * (0.3 + progress * 0.7);
    const alpha = 1 - progress;

    ctx.save();
    ctx.globalAlpha = alpha * 0.6;

    // Outer ring
    ctx.strokeStyle = '#ff6600';
    ctx.lineWidth = 3 * (1 - progress);
    ctx.beginPath();
    ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
    ctx.stroke();

    // Inner glow
    ctx.globalAlpha = alpha * 0.3;
    const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, r);
    grad.addColorStop(0, '#ffaa00');
    grad.addColorStop(0.5, '#ff440088');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
