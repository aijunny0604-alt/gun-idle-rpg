// enemy.js - 적(좀비) 시스템 (스크린샷 스타일)

class Enemy {
  constructor(x, y, type, stageMultiplier) {
    this.x = x;
    this.y = y;
    this.type = type; // 'normal', 'fast', 'tank', 'boss'
    this.width = type === 'boss' ? 80 : 48;
    this.height = type === 'boss' ? 112 : 88;

    const mult = stageMultiplier || 1;

    switch (type) {
      case 'fast':
        this.maxHp = Math.floor(20 * mult);
        this.speed = 0.6;
        this.damage = Math.floor(5 * mult);
        this.expReward = Math.floor(15 * mult);
        this.goldReward = Math.floor(8 * mult);
        this.skinColor = '#5aaa5a';    // green zombie
        this.skinDark = '#3a8a3a';
        this.clothColor = '#4a3a2a';
        this.variant = 'green';
        break;
      case 'tank':
        this.maxHp = Math.floor(80 * mult);
        this.speed = 0.2;
        this.damage = Math.floor(15 * mult);
        this.expReward = Math.floor(30 * mult);
        this.goldReward = Math.floor(20 * mult);
        this.skinColor = '#8b3a3a';    // dark red tank
        this.skinDark = '#6a2020';
        this.clothColor = '#2a2a3a';
        this.variant = 'red';
        break;
      case 'boss':
        this.maxHp = Math.floor(300 * mult);
        this.speed = 0.15;
        this.damage = Math.floor(25 * mult);
        this.expReward = Math.floor(100 * mult);
        this.goldReward = Math.floor(80 * mult);
        this.skinColor = '#cc4444';    // bright red boss
        this.skinDark = '#992222';
        this.clothColor = '#1a1a2a';
        this.variant = 'boss';
        break;
      default: // normal - red muscular zombie like screenshot
        this.maxHp = Math.floor(40 * mult);
        this.speed = 0.35;
        this.damage = Math.floor(8 * mult);
        this.expReward = Math.floor(12 * mult);
        this.goldReward = Math.floor(10 * mult);
        this.skinColor = '#c05040';    // red zombie
        this.skinDark = '#903830';
        this.clothColor = '#4a4a3a';
        this.variant = 'red';
    }

    this.hp = this.maxHp;
    this.alive = true;
    this.attackTimer = 0;
    this.attackCooldown = 1500;
    this.hitFlash = 0;
    this.walkFrame = 0;
    this.walkTimer = 0;
    this.deathTimer = 0;
    this.dying = false;
    this.bodyColor = this.skinColor; // for death particles
  }

  takeDamage(amount) {
    this.hp -= amount;
    this.hitFlash = 6;
    if (this.hp <= 0) {
      this.hp = 0;
      this.dying = true;
      this.deathTimer = 15;
    }
    return this.hp <= 0;
  }

  update(dt, player) {
    if (this.dying) {
      this.deathTimer -= 1;
      if (this.deathTimer <= 0) this.alive = false;
      return;
    }

    this.walkTimer += dt;
    if (this.walkTimer > 200) {
      this.walkFrame = (this.walkFrame + 1) % 2;
      this.walkTimer = 0;
    }

    if (this.hitFlash > 0) this.hitFlash--;

    const dx = player.x - this.x;
    if (Math.abs(dx) > this.width) {
      this.x += Math.sign(dx) * this.speed * (dt / 16);
    } else {
      this.attackTimer -= dt;
      if (this.attackTimer <= 0) {
        player.takeDamage(this.damage);
        this.attackTimer = this.attackCooldown;
        if (typeof game !== 'undefined') {
          game.effects.push(new FloatingText(
            player.x, player.y - 50, '-' + this.damage, '#ff4444', 14, 30
          ));
        }
      }
    }
  }

  render(ctx) {
    ctx.save();
    renderZombie(
      ctx, Math.round(this.x), Math.round(this.y),
      this.type, this.walkFrame,
      this.hitFlash, this.dying, this.deathTimer,
      this.hp, this.maxHp
    );
    ctx.restore();
  }
}
