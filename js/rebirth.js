// rebirth.js - 환생(리버스) 시스템

class RebirthManager {
  constructor() {
    this.rebirthCount = 0;
    this.totalSouls = 0;      // 환생 재화 (영혼석)
    this.permanentBonuses = {
      damageMultiplier: 1,
      goldMultiplier: 1,
      expMultiplier: 1,
      startGold: 0,
    };
  }

  get minStageToRebirth() { return 10; }

  canRebirth(currentStage) {
    return currentStage >= this.minStageToRebirth;
  }

  // 환생 시 얻는 영혼석 계산
  calculateSouls(stage, totalKills) {
    const baseSouls = Math.floor(stage * 2 + totalKills * 0.01);
    return Math.max(1, baseSouls);
  }

  // 환생 실행
  performRebirth(gameRef) {
    const stage = gameRef.stageManager.stage;
    const kills = gameRef.player.totalKills;
    const souls = this.calculateSouls(stage, kills);

    this.rebirthCount++;
    this.totalSouls += souls;

    // 영구 보너스 재계산
    this._recalcBonuses();

    // 플레이어 리셋 (스킬은 유지)
    const oldSkills = gameRef.player.skills.serialize();
    const oldBestCombo = gameRef.player.combo.bestCombo;
    const oldEquipment = gameRef.player.equipment ? gameRef.player.equipment.serialize() : null;

    gameRef.player = new Player();
    gameRef.player.y = gameRef.groundY;
    gameRef.player.skills = SkillManager.deserialize(oldSkills);
    gameRef.player.combo.bestCombo = oldBestCombo;
    if (oldEquipment) {
      gameRef.player.equipment = EquipmentManager.deserialize(oldEquipment);
    }

    // 시작 골드 보너스
    gameRef.player.gold = this.permanentBonuses.startGold;

    // 스테이지 리셋
    gameRef.stageManager = new StageManager();
    gameRef.stageManager.calculateWave();

    // 게임 상태 리셋
    gameRef.enemies = [];
    gameRef.bullets = [];
    gameRef.effects = [];
    gameRef.cameraX = 0;

    // 연출
    gameRef.screenEffects.push(new ScreenFlash('#aa44ff', 0.5, 20));
    gameRef.screenEffects.push(new FloatingText(
      180, 220, `환생 #${this.rebirthCount}`, '#ff88ff', 24, 120
    ));
    gameRef.screenEffects.push(new FloatingText(
      180, 255, `+${souls} 영혼석 획득!`, '#ddaaff', 16, 100
    ));
    gameRef.screenEffects.push(new FloatingText(
      180, 285, `영구 배율 적용!`, '#ffd740', 14, 90
    ));

    soundManager.playLevelUp();

    return souls;
  }

  _recalcBonuses() {
    const rc = this.rebirthCount;
    this.permanentBonuses.damageMultiplier = 1 + rc * 0.15;
    this.permanentBonuses.goldMultiplier = 1 + rc * 0.2;
    this.permanentBonuses.expMultiplier = 1 + rc * 0.1;
    this.permanentBonuses.startGold = rc * 100;
  }

  // 영혼석으로 추가 보너스 구매
  get soulUpgrades() {
    return [
      {
        id: 'soulDmg',
        name: '영혼 강타',
        desc: '영구 데미지 +10%',
        cost: 10 + this.rebirthCount * 5,
        apply: () => { this.permanentBonuses.damageMultiplier += 0.1; },
      },
      {
        id: 'soulGold',
        name: '영혼 축복',
        desc: '영구 골드 +15%',
        cost: 8 + this.rebirthCount * 4,
        apply: () => { this.permanentBonuses.goldMultiplier += 0.15; },
      },
      {
        id: 'soulExp',
        name: '영혼 깨달음',
        desc: '영구 경험치 +10%',
        cost: 8 + this.rebirthCount * 4,
        apply: () => { this.permanentBonuses.expMultiplier += 0.1; },
      },
      {
        id: 'soulStartGold',
        name: '영혼 부',
        desc: '시작 골드 +500',
        cost: 15 + this.rebirthCount * 5,
        apply: () => { this.permanentBonuses.startGold += 500; },
      },
    ];
  }

  buySoulUpgrade(upgradeId) {
    const upgrade = this.soulUpgrades.find(u => u.id === upgradeId);
    if (!upgrade) return false;
    if (this.totalSouls < upgrade.cost) return false;
    this.totalSouls -= upgrade.cost;
    upgrade.apply();
    return true;
  }

  serialize() {
    return {
      rebirthCount: this.rebirthCount,
      totalSouls: this.totalSouls,
      permanentBonuses: { ...this.permanentBonuses },
    };
  }

  static deserialize(data) {
    const rm = new RebirthManager();
    if (!data) return rm;
    rm.rebirthCount = data.rebirthCount || 0;
    rm.totalSouls = data.totalSouls || 0;
    if (data.permanentBonuses) {
      rm.permanentBonuses = { ...rm.permanentBonuses, ...data.permanentBonuses };
    }
    return rm;
  }
}
