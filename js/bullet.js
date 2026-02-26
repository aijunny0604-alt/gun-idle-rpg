// bullet.js - 총알 시스템 (박진감 강화)

class Bullet {
  constructor(x, y, angle, speed, damage, size, color, pierceCount) {
    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.damage = damage;
    this.size = size;
    this.color = color || '#ffcc00';
    this.alive = true;
    this.trail = [];
    this.pierceLeft = pierceCount || 0;
    this.hitEnemies = new Set();
  }

  update(dt, enemies, canvasWidth, cameraX) {
    const step = dt / 16;
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 6) this.trail.shift();

    this.x += this.vx * step;
    this.y += this.vy * step;

    const camLeft = (cameraX || 0);
    if (this.x > camLeft + canvasWidth + 10 || this.x < camLeft - 10 || this.y < -10 || this.y > 700) {
      this.alive = false;
      return;
    }

    for (const enemy of enemies) {
      if (!enemy.alive || enemy.dying) continue;
      if (this.hitEnemies.has(enemy)) continue;
      const dx = this.x - enemy.x;
      const dy = this.y - (enemy.y - enemy.height / 2);
      if (Math.abs(dx) < enemy.width / 2 + this.size &&
          Math.abs(dy) < enemy.height / 2 + this.size) {

        if (typeof game !== 'undefined') {
          const player = game.player;
          const skills = player.skills;
          const critChance = player.effectiveCritChance;
          const isCrit = Math.random() < critChance;
          const finalDmg = isCrit ? this.damage * 2 : this.damage;

          const killed = enemy.takeDamage(finalDmg);

          // Pierce logic
          this.hitEnemies.add(enemy);
          if (this.pierceLeft > 0) {
            this.pierceLeft--;
          } else {
            this.alive = false;
          }

          const hitX = this.x;
          const hitY = this.y;

          // Explosion skill
          const explData = skills.explosionData;
          if (explData) {
            game.effects.push(new Explosion(hitX, hitY, explData.explosionRadius));
            for (const other of enemies) {
              if (other === enemy || !other.alive || other.dying) continue;
              const edx = hitX - other.x;
              const edy = hitY - (other.y - other.height / 2);
              if (Math.sqrt(edx*edx + edy*edy) < explData.explosionRadius) {
                other.takeDamage(Math.floor(finalDmg * explData.explosionDmg));
              }
            }
          }

          if (isCrit) {
            soundManager.playCritical();

            game.effects.push(new FloatingText(
              enemy.x + (Math.random() - 0.5) * 10,
              enemy.y - enemy.height - 15,
              finalDmg + '!',
              '#ff2222', 26, 50
            ));
            game.effects.push(new FloatingText(
              enemy.x, enemy.y - enemy.height - 35,
              'CRITICAL!',
              '#ffaa00', 16, 40
            ));
            game.shake(7, 10);
            game.hitstop(4);
            game.screenEffects.push(new ScreenFlash('#ffffff', 0.35, 5));
            game.effects.push(new CritSlash(hitX, hitY));
            game.effects.push(new ImpactRing(hitX, hitY, 50, '#ff4400', 16));
            game.effects.push(new ImpactRing(hitX, hitY, 30, '#ffcc00', 12));
            game.effects.push(new ImpactRing(hitX, hitY, 20, '#ffffff', 8));

            const critColors = ['#ffffff', '#ffee44', '#ff8800', '#ff4400', '#ffcc00', '#ff2200'];
            for (let i = 0; i < 25; i++) {
              const angle = Math.random() * Math.PI * 2;
              const speed = 3 + Math.random() * 8;
              game.effects.push(new Particle(
                hitX + (Math.random() - 0.5) * 10,
                hitY + (Math.random() - 0.5) * 10,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed - 2,
                critColors[Math.floor(Math.random() * critColors.length)],
                2 + Math.random() * 5,
                18 + Math.random() * 12
              ));
            }
            game.effects.push(new DirectionalSparks(hitX, hitY, 0));

          } else {
            soundManager.playHit();

            game.effects.push(new FloatingText(
              enemy.x + (Math.random() - 0.5) * 18,
              enemy.y - enemy.height - 8,
              '+' + this.damage,
              '#44ff44', 13, 30
            ));
            game.shake(1.5, 3);
            game.effects.push(new ImpactRing(hitX, hitY, 18, '#ffdd44', 8));
            game.effects.push(new DirectionalSparks(hitX, hitY, 0));

            for (let i = 0; i < 10; i++) {
              const angle = Math.random() * Math.PI * 2;
              const speed = 2 + Math.random() * 4;
              game.effects.push(new Particle(
                hitX, hitY,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed - 1,
                i < 3 ? '#ffffff' : (i < 6 ? '#ffdd00' : '#ff8800'),
                2 + Math.random() * 3,
                10 + Math.random() * 8
              ));
            }
          }

          if (killed) {
            soundManager.playKill();

            // Combo
            player.combo.onKill();
            const comboMult = player.combo.multiplier;
            const goldMult = skills.goldMult;
            const finalGold = Math.floor(enemy.goldReward * comboMult * goldMult);
            const finalExp = Math.floor(enemy.expReward * comboMult);

            // Vampire heal
            const heal = skills.healOnKill;
            if (heal > 0) {
              player.hp = Math.min(player.maxHp, player.hp + heal);
              game.effects.push(new FloatingText(
                player.worldX, player.y - 90, '+' + heal + 'HP', '#44ff88', 11, 30
              ));
            }

            // Gold coins fly to player
            const coinCount = Math.min(8, Math.max(2, Math.floor(finalGold / 10)));
            for (let i = 0; i < coinCount; i++) {
              game.effects.push(new GoldCoin(
                enemy.x + (Math.random() - 0.5) * 20,
                enemy.y - 30 + (Math.random() - 0.5) * 20,
                player,
                Math.floor(finalGold / coinCount)
              ));
            }

            // Override default rewards with multiplied ones
            enemy.goldReward = finalGold;
            enemy.expReward = finalExp;

            // EXP popup
            game.effects.push(new FloatingText(
              enemy.x + 14, enemy.y - enemy.height - 16,
              '+' + finalExp + 'EXP',
              '#88ff88', 12, 45
            ));

            // Combo text
            if (player.combo.count >= 3) {
              game.effects.push(new FloatingText(
                enemy.x, enemy.y - enemy.height - 38,
                player.combo.count + ' COMBO x' + comboMult.toFixed(1),
                player.combo.comboColor, 13, 40
              ));
            }

            game.shake(5, 7);
            game.hitstop(3);
            game.screenEffects.push(new ScreenFlash('#ff4400', 0.2, 4));
            game.effects.push(new ImpactRing(enemy.x, enemy.y - 30, 60, '#ff6600', 20));
            game.effects.push(new ImpactRing(enemy.x, enemy.y - 30, 35, '#ffaa00', 14));

            for (let i = 0; i < 22; i++) {
              const angle = Math.random() * Math.PI * 2;
              const speed = 1.5 + Math.random() * 6;
              game.effects.push(new Particle(
                enemy.x + (Math.random() - 0.5) * 16,
                enemy.y - 20 + (Math.random() - 0.5) * 24,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed - 2.5,
                i < 6 ? enemy.bodyColor : (i < 12 ? '#ffaa00' : (i < 18 ? '#ff4400' : '#ffffff')),
                2 + Math.random() * 5,
                22 + Math.random() * 18
              ));
            }
          }
        }
        if (!this.alive) break;
      }
    }
  }

  render(ctx) {
    // Bullet trail (brighter, longer)
    for (let i = 0; i < this.trail.length; i++) {
      const alpha = (i + 1) / this.trail.length * 0.6;
      ctx.fillStyle = `rgba(255, 220, 50, ${alpha})`;
      const s = 1 + i * 0.4;
      ctx.fillRect(
        Math.round(this.trail[i].x) - s / 2,
        Math.round(this.trail[i].y) - s / 2,
        s, s
      );
    }

    // Bullet body (wider, brighter)
    ctx.fillStyle = '#ffdd44';
    ctx.fillRect(
      Math.round(this.x) - this.size - 1,
      Math.round(this.y) - 1,
      this.size * 2 + 3, 3
    );
    // Bright tip
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(
      Math.round(this.x) + this.size,
      Math.round(this.y),
      3, 1
    );
    // Glow
    ctx.fillStyle = 'rgba(255, 220, 68, 0.3)';
    ctx.fillRect(
      Math.round(this.x) - this.size - 2,
      Math.round(this.y) - 2,
      this.size * 2 + 6, 5
    );
  }
}
