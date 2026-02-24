// weapon.js - 무기 & 진화 트리 시스템

const WEAPONS = {
  pistol: {
    id: 'pistol',
    name: '권총',
    damage: 10,
    fireRate: 350,    // ms between shots (fast!)
    magSize: 12,
    reloadTime: 1200,
    bulletSpeed: 10,
    bulletSize: 3,
    spread: 0,
    bulletCount: 1,
    color: '#c0c0c0',
    upgradeCost: 50,
    evolvesTo: ['smg'],
    evolveLevel: 5,
    evolveCost: 500,
    tier: 1,
  },
  smg: {
    id: 'smg',
    name: '기관단총',
    damage: 8,
    fireRate: 90,
    magSize: 30,
    reloadTime: 1500,
    bulletSpeed: 12,
    bulletSize: 2,
    spread: 4,
    bulletCount: 1,
    color: '#a0a0a0',
    upgradeCost: 120,
    evolvesTo: ['assault_rifle', 'shotgun'],
    evolveLevel: 5,
    evolveCost: 2000,
    tier: 2,
  },
  assault_rifle: {
    id: 'assault_rifle',
    name: '돌격소총',
    damage: 18,
    fireRate: 75,
    magSize: 30,
    reloadTime: 1800,
    bulletSpeed: 14,
    bulletSize: 3,
    spread: 2,
    bulletCount: 1,
    color: '#808080',
    upgradeCost: 300,
    evolvesTo: ['hk416'],
    evolveLevel: 5,
    evolveCost: 8000,
    tier: 3,
  },
  shotgun: {
    id: 'shotgun',
    name: '산탄총',
    damage: 12,
    fireRate: 450,
    magSize: 8,
    reloadTime: 2000,
    bulletSpeed: 9,
    bulletSize: 3,
    spread: 18,
    bulletCount: 6,
    color: '#8b6914',
    upgradeCost: 350,
    evolvesTo: ['sniper'],
    evolveLevel: 5,
    evolveCost: 10000,
    tier: 3,
  },
  hk416: {
    id: 'hk416',
    name: 'HK416',
    damage: 30,
    fireRate: 60,
    magSize: 30,
    reloadTime: 1600,
    bulletSpeed: 16,
    bulletSize: 3,
    spread: 1,
    bulletCount: 1,
    color: '#505050',
    upgradeCost: 800,
    evolvesTo: [],
    evolveLevel: 99,
    evolveCost: 0,
    tier: 4,
  },
  sniper: {
    id: 'sniper',
    name: '저격소총',
    damage: 120,
    fireRate: 900,
    magSize: 5,
    reloadTime: 2200,
    bulletSpeed: 22,
    bulletSize: 4,
    spread: 0,
    bulletCount: 1,
    color: '#2f4f2f',
    upgradeCost: 900,
    evolvesTo: [],
    evolveLevel: 99,
    evolveCost: 0,
    tier: 4,
  },
};

// 진화 트리 위치 (UI용)
const EVOLUTION_TREE = {
  pistol:        { x: 0, y: 1, row: 0 },
  smg:           { x: 1, y: 1, row: 0 },
  assault_rifle: { x: 2, y: 0, row: 0 },
  shotgun:       { x: 2, y: 2, row: 1 },
  hk416:         { x: 3, y: 0, row: 0 },
  sniper:        { x: 3, y: 2, row: 1 },
};

class WeaponInstance {
  constructor(weaponId) {
    const base = WEAPONS[weaponId];
    this.id = base.id;
    this.name = base.name;
    this.level = 1;
    this.baseDamage = base.damage;
    this.baseFireRate = base.fireRate;
    this.magSize = base.magSize;
    this.currentAmmo = base.magSize;
    this.reloadTime = base.reloadTime;
    this.bulletSpeed = base.bulletSpeed;
    this.bulletSize = base.bulletSize;
    this.spread = base.spread;
    this.bulletCount = base.bulletCount;
    this.color = base.color;
    this.upgradeCost = base.upgradeCost;
    this.isReloading = false;
    this.reloadTimer = 0;
  }

  get damage() {
    return Math.floor(this.baseDamage * (1 + (this.level - 1) * 0.15));
  }

  get fireRate() {
    return Math.max(50, this.baseFireRate * Math.pow(0.97, this.level - 1));
  }

  get nextUpgradeCost() {
    return Math.floor(this.upgradeCost * Math.pow(1.4, this.level - 1));
  }

  upgrade() {
    this.level++;
  }

  startReload() {
    if (this.isReloading) return;
    this.isReloading = true;
    this.reloadTimer = this.reloadTime;
  }

  updateReload(dt) {
    if (!this.isReloading) return;
    this.reloadTimer -= dt;
    if (this.reloadTimer <= 0) {
      this.currentAmmo = this.magSize;
      this.isReloading = false;
      this.reloadTimer = 0;
    }
  }

  shoot() {
    if (this.isReloading || this.currentAmmo <= 0) return false;
    this.currentAmmo--;
    if (this.currentAmmo <= 0) {
      this.startReload();
    }
    return true;
  }

  serialize() {
    return { id: this.id, level: this.level };
  }

  static deserialize(data) {
    const w = new WeaponInstance(data.id);
    w.level = data.level;
    return w;
  }
}
