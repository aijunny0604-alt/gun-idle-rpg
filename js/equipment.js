// equipment.js - 장비 드롭 & 인벤토리 시스템

const EQUIP_SLOTS = ['weapon_mod', 'armor', 'ring', 'scope', 'boots'];

const EQUIP_GRADES = {
  common:    { name: '일반', color: '#999999', mult: 1.0, chance: 0.50 },
  uncommon:  { name: '고급', color: '#44cc44', mult: 1.5, chance: 0.25 },
  rare:      { name: '레어', color: '#4488ff', mult: 2.2, chance: 0.15 },
  legendary: { name: '전설', color: '#cc44ff', mult: 3.5, chance: 0.08 },
  mythic:    { name: '신화', color: '#ff8800', mult: 5.0, chance: 0.02 },
};

const EQUIP_TYPES = {
  armor: {
    slot: 'armor', name: '방탄 조끼', icon: '🛡️',
    statName: 'maxHp', statLabel: 'HP',
    baseMin: 10, baseMax: 30,
  },
  ring: {
    slot: 'ring', name: '전투 반지', icon: '💍',
    statName: 'critBonus', statLabel: '크리티컬',
    baseMin: 2, baseMax: 8,
  },
  scope: {
    slot: 'scope', name: '조준경', icon: '🔭',
    statName: 'damageBonus', statLabel: '데미지',
    baseMin: 5, baseMax: 20,
  },
  boots: {
    slot: 'boots', name: '전투화', icon: '👢',
    statName: 'speedBonus', statLabel: '속도',
    baseMin: 3, baseMax: 10,
  },
  weapon_mod: {
    slot: 'weapon_mod', name: '총기 개조', icon: '🔧',
    statName: 'fireRateBonus', statLabel: '연사',
    baseMin: 3, baseMax: 12,
  },
};

let _equipIdCounter = 0;

class EquipItem {
  constructor(typeId, grade, statValue) {
    this.id = ++_equipIdCounter;
    this.typeId = typeId;
    this.grade = grade;
    this.statValue = statValue;
    const def = EQUIP_TYPES[typeId];
    this.slot = def.slot;
    this.name = def.name;
    this.icon = def.icon;
    this.statName = def.statName;
    this.statLabel = def.statLabel;
  }

  get gradeInfo() { return EQUIP_GRADES[this.grade]; }
  get displayName() { return `${this.gradeInfo.name} ${this.name}`; }
  get displayStat() { return `${this.statLabel} +${this.statValue}`; }

  serialize() {
    return { id: this.id, typeId: this.typeId, grade: this.grade, statValue: this.statValue };
  }

  static deserialize(data) {
    const item = new EquipItem(data.typeId, data.grade, data.statValue);
    item.id = data.id;
    if (data.id >= _equipIdCounter) _equipIdCounter = data.id + 1;
    return item;
  }
}

class EquipmentManager {
  constructor() {
    this.inventory = [];      // EquipItem[]
    this.equipped = {};       // slot -> EquipItem
    this.maxInventory = 20;
    for (const slot of EQUIP_SLOTS) {
      this.equipped[slot] = null;
    }
  }

  // 장비 드롭 확률 (스테이지에 따라 증가)
  static dropChance(stage) {
    return Math.min(0.35, 0.08 + stage * 0.008);
  }

  // 등급 결정
  static rollGrade(stage) {
    // 높은 스테이지 = 높은 등급 확률
    const stageBonus = Math.min(stage * 0.005, 0.1);
    let roll = Math.random();

    if (roll < EQUIP_GRADES.mythic.chance + stageBonus * 0.2) return 'mythic';
    roll -= EQUIP_GRADES.mythic.chance + stageBonus * 0.2;
    if (roll < EQUIP_GRADES.legendary.chance + stageBonus * 0.5) return 'legendary';
    roll -= EQUIP_GRADES.legendary.chance + stageBonus * 0.5;
    if (roll < EQUIP_GRADES.rare.chance + stageBonus) return 'rare';
    roll -= EQUIP_GRADES.rare.chance + stageBonus;
    if (roll < EQUIP_GRADES.uncommon.chance) return 'uncommon';
    return 'common';
  }

  // 장비 생성
  static generateItem(stage) {
    const typeKeys = Object.keys(EQUIP_TYPES);
    const typeId = typeKeys[Math.floor(Math.random() * typeKeys.length)];
    const def = EQUIP_TYPES[typeId];
    const grade = EquipmentManager.rollGrade(stage);
    const gradeMult = EQUIP_GRADES[grade].mult;
    const baseVal = def.baseMin + Math.random() * (def.baseMax - def.baseMin);
    const statValue = Math.floor(baseVal * gradeMult * (1 + stage * 0.05));
    return new EquipItem(typeId, grade, statValue);
  }

  addItem(item) {
    if (this.inventory.length >= this.maxInventory) {
      // 자동으로 가장 약한 아이템 제거
      this._removeWeakest();
    }
    this.inventory.push(item);
  }

  _removeWeakest() {
    if (this.inventory.length === 0) return;
    let weakest = 0;
    for (let i = 1; i < this.inventory.length; i++) {
      if (this.inventory[i].statValue < this.inventory[weakest].statValue) {
        weakest = i;
      }
    }
    this.inventory.splice(weakest, 1);
  }

  equip(item) {
    const slot = item.slot;
    const current = this.equipped[slot];
    if (current) {
      // 기존 장비를 인벤토리로
      this.inventory.push(current);
    }
    // 인벤토리에서 제거 후 장착
    const idx = this.inventory.findIndex(i => i.id === item.id);
    if (idx >= 0) this.inventory.splice(idx, 1);
    this.equipped[slot] = item;
  }

  unequip(slot) {
    const item = this.equipped[slot];
    if (!item) return;
    this.equipped[slot] = null;
    this.inventory.push(item);
  }

  sellItem(itemId) {
    const idx = this.inventory.findIndex(i => i.id === itemId);
    if (idx < 0) return 0;
    const item = this.inventory[idx];
    const gradeMultipliers = { common: 10, uncommon: 30, rare: 80, legendary: 200, mythic: 500 };
    const gold = Math.floor((gradeMultipliers[item.grade] || 10) * (item.statValue / 10));
    this.inventory.splice(idx, 1);
    return gold;
  }

  // 장착 장비로부터 총 보너스 계산
  get totalBonuses() {
    const bonuses = { maxHp: 0, critBonus: 0, damageBonus: 0, speedBonus: 0, fireRateBonus: 0 };
    for (const slot of EQUIP_SLOTS) {
      const item = this.equipped[slot];
      if (item) {
        bonuses[item.statName] = (bonuses[item.statName] || 0) + item.statValue;
      }
    }
    return bonuses;
  }

  serialize() {
    return {
      inventory: this.inventory.map(i => i.serialize()),
      equipped: Object.fromEntries(
        Object.entries(this.equipped).map(([k, v]) => [k, v ? v.serialize() : null])
      ),
    };
  }

  static deserialize(data) {
    const em = new EquipmentManager();
    if (!data) return em;
    if (data.inventory) {
      em.inventory = data.inventory.map(d => EquipItem.deserialize(d));
    }
    if (data.equipped) {
      for (const [slot, d] of Object.entries(data.equipped)) {
        em.equipped[slot] = d ? EquipItem.deserialize(d) : null;
      }
    }
    return em;
  }
}
