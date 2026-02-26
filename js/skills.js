// skills.js - 패시브 스킬 시스템

const PASSIVE_SKILLS = {
  pierce: {
    id: 'pierce',
    name: '관통탄',
    icon: '🔥',
    desc: '총알이 적을 관통',
    maxLevel: 5,
    baseCost: 200,
    effect: (lv) => ({ pierceCount: lv }), // 관통 횟수
  },
  vampire: {
    id: 'vampire',
    name: '흡혈',
    icon: '🩸',
    desc: '적 처치 시 HP 회복',
    maxLevel: 5,
    baseCost: 300,
    effect: (lv) => ({ healOnKill: 2 + lv * 2 }),
  },
  explosive: {
    id: 'explosive',
    name: '폭발탄',
    icon: '💥',
    desc: '피격 시 범위 데미지',
    maxLevel: 5,
    baseCost: 500,
    effect: (lv) => ({ explosionRadius: 30 + lv * 10, explosionDmg: 0.2 + lv * 0.1 }),
  },
  speed: {
    id: 'speed',
    name: '가속',
    icon: '⚡',
    desc: '이동 및 발사 속도 증가',
    maxLevel: 5,
    baseCost: 150,
    effect: (lv) => ({ speedMult: 1 + lv * 0.08, fireRateMult: 1 - lv * 0.05 }),
  },
  critUp: {
    id: 'critUp',
    name: '급소 사격',
    icon: '🎯',
    desc: '크리티컬 확률 증가',
    maxLevel: 5,
    baseCost: 250,
    effect: (lv) => ({ critChance: 0.12 + lv * 0.06 }),
  },
  goldBonus: {
    id: 'goldBonus',
    name: '골드 러시',
    icon: '💰',
    desc: '골드 획득량 증가',
    maxLevel: 5,
    baseCost: 180,
    effect: (lv) => ({ goldMult: 1 + lv * 0.15 }),
  },
};

class SkillManager {
  constructor() {
    this.levels = {};
    for (const id of Object.keys(PASSIVE_SKILLS)) {
      this.levels[id] = 0;
    }
  }

  getLevel(id) {
    return this.levels[id] || 0;
  }

  getEffect(id) {
    const skill = PASSIVE_SKILLS[id];
    const lv = this.getLevel(id);
    if (lv === 0) return skill.effect(0);
    return skill.effect(lv);
  }

  getUpgradeCost(id) {
    const skill = PASSIVE_SKILLS[id];
    const lv = this.getLevel(id);
    return Math.floor(skill.baseCost * Math.pow(1.8, lv));
  }

  canUpgrade(id, gold) {
    const skill = PASSIVE_SKILLS[id];
    const lv = this.getLevel(id);
    return lv < skill.maxLevel && gold >= this.getUpgradeCost(id);
  }

  upgrade(id) {
    const skill = PASSIVE_SKILLS[id];
    if (this.levels[id] < skill.maxLevel) {
      this.levels[id]++;
      return true;
    }
    return false;
  }

  // Aggregated effects
  get pierceCount() { return this.getLevel('pierce'); }
  get healOnKill() { return this.getLevel('vampire') > 0 ? this.getEffect('vampire').healOnKill : 0; }
  get explosionData() {
    if (this.getLevel('explosive') === 0) return null;
    return this.getEffect('explosive');
  }
  get speedMult() { return this.getLevel('speed') > 0 ? this.getEffect('speed').speedMult : 1; }
  get fireRateMult() { return this.getLevel('speed') > 0 ? this.getEffect('speed').fireRateMult : 1; }
  get critChance() { return this.getLevel('critUp') > 0 ? this.getEffect('critUp').critChance : 0.12; }
  get goldMult() { return this.getLevel('goldBonus') > 0 ? this.getEffect('goldBonus').goldMult : 1; }

  serialize() {
    return { levels: { ...this.levels } };
  }

  static deserialize(data) {
    const sm = new SkillManager();
    if (data && data.levels) {
      for (const [k, v] of Object.entries(data.levels)) {
        if (sm.levels.hasOwnProperty(k)) sm.levels[k] = v;
      }
    }
    return sm;
  }
}
