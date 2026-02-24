// player.js - 플레이어 캐릭터 (스프라이트시트 이미지 사용)

class Player {
  constructor() {
    this.x = 140;
    this.y = 0;
    this.worldX = 140;    // world position (advances over time)
    this.walkSpeed = 1.5; // forward movement speed
    this.isWalking = false; // controlled by game.js
    this.width = 92;   // approximate rendered width
    this.height = 120;
    this.level = 1;
    this.exp = 0;
    this.expToNext = 100;
    this.maxHp = 100;
    this.hp = 100;
    this.maxShield = 30;
    this.shield = 30;
    this.gold = 0;
    this.totalKills = 0;

    this.weapon = new WeaponInstance('pistol');
    this.unlockedWeapons = { pistol: true };
    this.fireTimer = 0;

    this.recoilOffset = 0;
    this.muzzleFlash = 0;
    this.isHurt = false;
    this.hurtTimer = 0;
    this.breathOffset = 0;
    this.breathTimer = 0;

    // Animation
    this.animState = 'idle'; // 'idle', 'walk', 'shoot'
    this.animFrame = 0;
    this.animTimer = 0;
    this.isShooting = false;
  }

  get attackDamage() {
    return this.weapon.damage + Math.floor(this.level * 2);
  }

  addExp(amount) {
    this.exp += amount;
    while (this.exp >= this.expToNext) {
      this.exp -= this.expToNext;
      this.levelUp();
    }
  }

  levelUp() {
    this.level++;
    this.expToNext = Math.floor(100 * Math.pow(1.2, this.level - 1));
    this.maxHp += 10;
    this.hp = this.maxHp;
    this.maxShield += 5;
    this.shield = this.maxShield;
    if (typeof game !== 'undefined') {
      game.effects.push(new FloatingText(this.x, this.y - 65, 'LEVEL UP!', '#ffff00', 18, 60));
    }
  }

  takeDamage(amount) {
    if (this.shield > 0) {
      const absorbed = Math.min(this.shield, amount);
      this.shield -= absorbed;
      amount -= absorbed;
    }
    this.hp -= amount;
    this.isHurt = true;
    this.hurtTimer = 10;
    if (this.hp <= 0) this.hp = 0;
  }

  update(dt, enemies) {
    // Walking (controlled by game.js)
    if (this.isWalking) {
      this.worldX += this.walkSpeed * (dt / 16);
    }
    this.x = this.worldX;

    this.breathTimer += dt * 0.003;
    this.breathOffset = Math.sin(this.breathTimer) * 1;

    if (this.isHurt) {
      this.hurtTimer -= 1;
      if (this.hurtTimer <= 0) this.isHurt = false;
    }

    if (this.recoilOffset > 0) {
      this.recoilOffset -= 0.8;
      if (this.recoilOffset < 0) this.recoilOffset = 0;
    }

    if (this.muzzleFlash > 0) this.muzzleFlash -= 1;

    this.weapon.updateReload(dt);

    // Animation frame cycling (faster when walking)
    this.animTimer += dt;
    if (this.animTimer > (this.isWalking ? 150 : 300)) {
      this.animFrame++;
      this.animTimer = 0;
    }

    // Determine animation state
    if (enemies.length > 0) {
      this.isShooting = true;
      this.animState = 'shoot';
    } else if (this.isWalking) {
      this.isShooting = false;
      this.animState = 'walk';
    } else {
      this.isShooting = false;
      this.animState = 'idle';
    }

    // Auto fire
    this.fireTimer -= dt;
    if (this.fireTimer <= 0 && enemies.length > 0) {
      this.fire(enemies);
      this.fireTimer = this.weapon.fireRate;
    }

    if (this.shield < this.maxShield) {
      this.shield = Math.min(this.maxShield, this.shield + 0.01 * dt);
    }
  }

  fire(enemies) {
    if (!this.weapon.shoot()) return;

    this.recoilOffset = 6;
    this.muzzleFlash = 6;

    // Gun tip position (right side of rendered sprite)
    const gunTipX = this.x + this.width * 0.55 - this.recoilOffset;
    const gunTipY = this.y - this.height * 0.52 + this.breathOffset;

    for (let i = 0; i < this.weapon.bulletCount; i++) {
      const spreadAngle = (Math.random() - 0.5) * this.weapon.spread * (Math.PI / 180);

      if (typeof game !== 'undefined') {
        game.bullets.push(new Bullet(
          gunTipX, gunTipY,
          spreadAngle,
          this.weapon.bulletSpeed,
          this.attackDamage,
          this.weapon.bulletSize,
          this.weapon.color
        ));

        game.effects.push(new ShellCasing(gunTipX - 12, gunTipY - 4));

        // Muzzle flash effect
        game.effects.push(new MuzzleFlash(gunTipX + 4, gunTipY - 3));
      }
    }
  }

  render(ctx) {
    ctx.save();
    drawPlayerSprite(
      ctx, this.x, this.y,
      this.animState, this.animFrame,
      this.recoilOffset, this.muzzleFlash,
      this.breathOffset, this.isHurt, this.hurtTimer
    );
    ctx.restore();
  }

  serialize() {
    return {
      level: this.level, exp: this.exp,
      maxHp: this.maxHp, hp: this.hp,
      maxShield: this.maxShield, shield: this.shield,
      gold: this.gold, totalKills: this.totalKills,
      weapon: this.weapon.serialize(),
      unlockedWeapons: this.unlockedWeapons,
      worldX: this.worldX,
    };
  }

  static deserialize(data) {
    const p = new Player();
    p.level = data.level;
    p.exp = data.exp;
    p.expToNext = Math.floor(100 * Math.pow(1.2, p.level - 1));
    p.maxHp = data.maxHp;
    p.hp = data.hp;
    p.maxShield = data.maxShield;
    p.shield = data.shield;
    p.gold = data.gold;
    p.totalKills = data.totalKills || 0;
    p.weapon = WeaponInstance.deserialize(data.weapon);
    p.unlockedWeapons = data.unlockedWeapons;
    p.worldX = data.worldX || 140;
    p.x = p.worldX;
    return p;
  }
}
