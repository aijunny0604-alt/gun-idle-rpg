// ui.js - HUD, 탭 기반 업그레이드 UI

class UIManager {
  constructor() {
    this.evolutionTreeOpen = false;
    this.init();
  }

  init() {
    // Tab switching
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        const target = document.getElementById('tab-' + tab.dataset.tab);
        if (target) target.classList.add('active');
      });
    });

    // Weapon upgrade button
    document.getElementById('btn-upgrade').addEventListener('click', () => {
      if (typeof game === 'undefined') return;
      soundManager.ensureContext();
      const player = game.player;
      const cost = player.weapon.nextUpgradeCost;
      if (player.gold >= cost) {
        player.gold -= cost;
        player.weapon.upgrade();
        this.update(game);
        soundManager.playUpgrade();
        game.effects.push(new FloatingText(
          player.x, player.y - 80, '강화!', '#44ff44', 16, 40
        ));
      }
    });

    // Character levelup button
    document.getElementById('btn-levelup').addEventListener('click', () => {
      if (typeof game === 'undefined') return;
      soundManager.ensureContext();
      const player = game.player;
      const cost = Math.floor(50 * Math.pow(1.3, player.level - 1));
      if (player.gold >= cost) {
        player.gold -= cost;
        player.maxHp += 15;
        player.hp = Math.min(player.hp + 15, player.maxHp);
        player.maxShield += 5;
        this.update(game);
        soundManager.playUpgrade();
        game.effects.push(new FloatingText(
          player.x, player.y - 80, 'HP UP!', '#ff8888', 16, 40
        ));
      }
    });

    // Evolution tree toggle
    document.getElementById('btn-evolution').addEventListener('click', () => {
      this.toggleEvolutionTree();
    });

    // Pause button
    document.getElementById('btn-pause').addEventListener('click', () => {
      if (typeof game !== 'undefined') {
        game.togglePause();
      }
    });

    // Close evolution tree
    document.getElementById('btn-close-tree').addEventListener('click', () => {
      this.toggleEvolutionTree();
    });
  }

  toggleEvolutionTree() {
    this.evolutionTreeOpen = !this.evolutionTreeOpen;
    const tree = document.getElementById('evolution-tree');
    tree.style.display = this.evolutionTreeOpen ? 'flex' : 'none';
    if (this.evolutionTreeOpen && typeof game !== 'undefined') {
      this.renderEvolutionTree(game.player);
    }
  }

  renderEvolutionTree(player) {
    const container = document.getElementById('tree-nodes');
    container.innerHTML = '';

    const weapons = Object.keys(WEAPONS);
    weapons.forEach(wId => {
      const w = WEAPONS[wId];
      const pos = EVOLUTION_TREE[wId];
      const unlocked = player.unlockedWeapons[wId];
      const isEquipped = player.weapon.id === wId;

      const node = document.createElement('div');
      node.className = 'tree-node' +
        (unlocked ? ' unlocked' : '') +
        (isEquipped ? ' equipped' : '');
      node.style.gridColumn = (pos.x + 1);
      node.style.gridRow = (pos.y + 1);

      node.innerHTML = `
        <div class="node-name">${w.name}</div>
        <div class="node-tier">Tier ${w.tier}</div>
        <div class="node-stats">DMG: ${w.damage} | SPD: ${w.fireRate}ms</div>
      `;

      if (unlocked && !isEquipped) {
        node.addEventListener('click', () => {
          player.weapon = new WeaponInstance(wId);
          this.renderEvolutionTree(player);
          this.update(game);
        });
      }

      // Evolve button
      if (unlocked && w.evolvesTo.length > 0 && player.weapon.id === wId) {
        const canEvolve = player.weapon.level >= w.evolveLevel && player.gold >= w.evolveCost;
        w.evolvesTo.forEach(nextId => {
          if (!player.unlockedWeapons[nextId]) {
            const evoBtn = document.createElement('div');
            evoBtn.className = 'evolve-btn-tree' + (canEvolve ? ' can-evolve' : '');
            evoBtn.textContent = `→ ${WEAPONS[nextId].name} (Lv${w.evolveLevel}, ${w.evolveCost}G)`;
            if (canEvolve) {
              evoBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                player.gold -= w.evolveCost;
                player.unlockedWeapons[nextId] = true;
                player.weapon = new WeaponInstance(nextId);
                this.renderEvolutionTree(player);
                this.update(game);
              });
            }
            node.appendChild(evoBtn);
          }
        });
      }

      container.appendChild(node);
    });
  }

  update(gameRef) {
    const player = gameRef.player;
    const stage = gameRef.stageManager;
    const weapon = player.weapon;

    // Top HUD
    document.getElementById('level-text').textContent = `LEVEL ${player.level}`;
    document.getElementById('weapon-name').textContent = weapon.name;

    // EXP
    const expPercent = Math.floor((player.exp / player.expToNext) * 100);
    document.getElementById('exp-percent').textContent = expPercent + '%';
    document.getElementById('exp-fill').style.width = expPercent + '%';

    // Gold
    document.getElementById('gold-value').textContent = player.gold.toLocaleString();

    // Stage
    document.getElementById('stage-info').textContent = stage.displayText;

    // HP bar (with equipment bonus)
    const effMaxHp = player.effectiveMaxHp;
    const hpPercent = (player.hp / effMaxHp) * 100;
    document.getElementById('hp-fill').style.width = Math.min(100, hpPercent) + '%';
    document.getElementById('hp-text').textContent =
      `${Math.ceil(player.hp)}/${effMaxHp}`;

    // Shield bar
    const shieldPercent = (player.shield / player.maxShield) * 100;
    document.getElementById('shield-fill').style.width = shieldPercent + '%';
    document.getElementById('shield-text').textContent =
      `${Math.ceil(player.shield)}/${player.maxShield}`;

    // Upgrade tab - Weapon
    document.getElementById('weapon-label').textContent = weapon.name;
    document.getElementById('weapon-level').textContent = `Lv.${weapon.level}`;
    document.getElementById('damage-text').textContent =
      `DMG: ${player.attackDamage} | ${weapon.isReloading ? '재장전...' : weapon.currentAmmo + '/' + weapon.magSize}`;
    const weaponCost = weapon.nextUpgradeCost;
    document.getElementById('upgrade-cost').textContent = weaponCost + 'G';
    document.getElementById('btn-upgrade').disabled = player.gold < weaponCost;

    // Weapon progress bar (level progress toward next evolution)
    const wb = document.getElementById('weapon-bar');
    const wbp = document.getElementById('weapon-bar-pct');
    if (wb && wbp) {
      const wPct = Math.min(100, Math.floor((weapon.level / 10) * 100));
      wb.style.width = wPct + '%';
      wbp.textContent = wPct + '%';
    }

    // Upgrade tab - Character
    document.getElementById('char-level').textContent = `Lv.${player.level}`;
    const charCost = Math.floor(50 * Math.pow(1.3, player.level - 1));
    document.getElementById('levelup-cost').textContent = charCost + 'G';
    document.getElementById('btn-levelup').disabled = player.gold < charCost;

    // Character progress bar
    const cb = document.getElementById('char-bar');
    const cbp = document.getElementById('char-bar-pct');
    if (cb && cbp) {
      const cPct = expPercent;
      cb.style.width = cPct + '%';
      cbp.textContent = cPct + '%';
    }

    // Upgrade tab - Evolution
    document.getElementById('skill-level').textContent =
      `Lv.${Object.keys(player.unlockedWeapons).length}`;

    // Stats tab
    document.getElementById('kills-value').textContent = player.totalKills;
    document.getElementById('ammo-text').textContent =
      weapon.isReloading ? '재장전...' : `${weapon.currentAmmo}/${weapon.magSize}`;

    const statStage = document.getElementById('stat-stage');
    if (statStage) statStage.textContent = stage.stage;

    // DPS display
    const dpsEl = document.getElementById('dps-value');
    if (dpsEl) {
      const dps = Math.floor(player.attackDamage * (1000 / weapon.fireRate));
      dpsEl.textContent = dps.toLocaleString();
    }

    // Best combo
    const comboEl = document.getElementById('combo-value');
    if (comboEl) comboEl.textContent = player.combo.bestCombo;

    // Skills tab
    this.renderSkillsTab(player);

    // Equipment tab
    this.renderEquipTab(player);

    // Rebirth tab
    this.renderRebirthTab(gameRef);

    // Pause button
    document.getElementById('btn-pause').textContent = gameRef.paused ? '▶' : '❚❚';
  }

  renderSkillsTab(player) {
    const container = document.getElementById('tab-skills');
    if (!container) return;

    // Only rebuild if needed (check a flag)
    const skills = player.skills;
    let html = '';
    for (const [id, def] of Object.entries(PASSIVE_SKILLS)) {
      const lv = skills.getLevel(id);
      const cost = skills.getUpgradeCost(id);
      const maxed = lv >= def.maxLevel;
      const canBuy = player.gold >= cost && !maxed;
      const effectText = this._getSkillEffectText(id, lv);

      html += `
        <div class="upgrade-item">
          <div class="item-icon">${def.icon}</div>
          <div class="item-info">
            <div class="item-name">${def.name} <span style="color:#69f0ae">Lv.${lv}</span></div>
            <div class="item-stats">${def.desc}</div>
            <div class="item-stats" style="color:#ffd740">${effectText}</div>
          </div>
          <button class="item-btn ${maxed ? '' : 'green'} skill-btn" data-skill="${id}" ${!canBuy ? 'disabled' : ''}>
            <span class="btn-label">${maxed ? 'MAX' : '습득'}</span>
            <span class="btn-cost">${maxed ? '—' : cost + 'G'}</span>
          </button>
        </div>
      `;
    }
    container.innerHTML = html;

    // Bind skill buttons
    container.querySelectorAll('.skill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (typeof game === 'undefined') return;
        soundManager.ensureContext();
        const skillId = btn.dataset.skill;
        const cost = skills.getUpgradeCost(skillId);
        if (player.gold >= cost && skills.canUpgrade(skillId, player.gold)) {
          player.gold -= cost;
          skills.upgrade(skillId);
          soundManager.playUpgrade();
          game.effects.push(new FloatingText(
            player.x, player.y - 80, PASSIVE_SKILLS[skillId].name + ' UP!', '#aa44ff', 14, 40
          ));
          this.update(game);
        }
      });
    });
  }

  _getSkillEffectText(id, lv) {
    if (lv === 0) return '미습득';
    const skill = PASSIVE_SKILLS[id];
    const eff = skill.effect(lv);
    switch (id) {
      case 'pierce': return `관통 ${eff.pierceCount}회`;
      case 'vampire': return `킬당 HP +${eff.healOnKill}`;
      case 'explosive': return `범위 ${eff.explosionRadius}px, ${Math.floor(eff.explosionDmg*100)}% 데미지`;
      case 'speed': return `속도 x${eff.speedMult.toFixed(2)}, 발사 x${eff.fireRateMult.toFixed(2)}`;
      case 'critUp': return `크리 확률 ${Math.floor(eff.critChance*100)}%`;
      case 'goldBonus': return `골드 x${eff.goldMult.toFixed(2)}`;
      default: return '';
    }
  }

  renderEquipTab(player) {
    const container = document.getElementById('tab-equip');
    if (!container) return;

    const equip = player.equipment;
    let html = '';

    // Equipped slots
    html += '<div class="equip-section-title">장착 중</div>';
    for (const slot of EQUIP_SLOTS) {
      const item = equip.equipped[slot];
      const slotNames = { weapon_mod: '총기 개조', armor: '방탄 조끼', ring: '반지', scope: '조준경', boots: '전투화' };
      if (item) {
        const gi = item.gradeInfo;
        html += `
          <div class="upgrade-item" style="border-left:3px solid ${gi.color}">
            <div class="item-icon">${item.icon}</div>
            <div class="item-info">
              <div class="item-name" style="color:${gi.color}">${item.displayName}</div>
              <div class="item-stats" style="color:#ffd740">${item.displayStat}</div>
            </div>
            <button class="item-btn unequip-btn" data-slot="${slot}" style="background:#555;border-color:#777">
              <span class="btn-label">해제</span>
            </button>
          </div>`;
      } else {
        html += `
          <div class="upgrade-item" style="opacity:0.4">
            <div class="item-icon">⬜</div>
            <div class="item-info">
              <div class="item-name">${slotNames[slot] || slot}</div>
              <div class="item-stats">비어있음</div>
            </div>
          </div>`;
      }
    }

    // Inventory
    html += `<div class="equip-section-title">인벤토리 (${equip.inventory.length}/${equip.maxInventory})</div>`;
    if (equip.inventory.length === 0) {
      html += '<div class="empty-tab">장비가 없습니다. 적을 처치하면 드롭!</div>';
    } else {
      // Sort by grade quality desc
      const gradeOrder = { mythic: 5, legendary: 4, rare: 3, uncommon: 2, common: 1 };
      const sorted = [...equip.inventory].sort((a, b) => (gradeOrder[b.grade] || 0) - (gradeOrder[a.grade] || 0));
      for (const item of sorted) {
        const gi = item.gradeInfo;
        html += `
          <div class="upgrade-item" style="border-left:3px solid ${gi.color}">
            <div class="item-icon">${item.icon}</div>
            <div class="item-info">
              <div class="item-name" style="color:${gi.color}">${item.displayName}</div>
              <div class="item-stats" style="color:#ffd740">${item.displayStat}</div>
            </div>
            <div style="display:flex;flex-direction:column;gap:2px">
              <button class="item-btn green equip-inv-btn" data-item-id="${item.id}" style="height:22px;width:50px">
                <span class="btn-label" style="font-size:9px">장착</span>
              </button>
              <button class="item-btn sell-btn" data-item-id="${item.id}" style="height:22px;width:50px;background:#8b0000;border-color:#cc3333">
                <span class="btn-label" style="font-size:9px">판매</span>
              </button>
            </div>
          </div>`;
      }
    }

    container.innerHTML = html;

    // Bind equipment buttons
    container.querySelectorAll('.equip-inv-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        soundManager.ensureContext();
        const itemId = parseInt(btn.dataset.itemId);
        const item = equip.inventory.find(i => i.id === itemId);
        if (item) {
          equip.equip(item);
          soundManager.playUpgrade();
          this.update(game);
        }
      });
    });

    container.querySelectorAll('.unequip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        soundManager.ensureContext();
        equip.unequip(btn.dataset.slot);
        this.update(game);
      });
    });

    container.querySelectorAll('.sell-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        soundManager.ensureContext();
        const itemId = parseInt(btn.dataset.itemId);
        const gold = equip.sellItem(itemId);
        if (gold > 0) {
          player.gold += gold;
          soundManager.playCoin();
          game.screenEffects.push(new FloatingText(180, 300, `+${gold}G 판매!`, '#ffd740', 14, 40));
          this.update(game);
        }
      });
    });
  }

  renderRebirthTab(gameRef) {
    const container = document.getElementById('tab-rebirth');
    if (!container) return;

    const rm = gameRef.rebirthManager;
    const stage = gameRef.stageManager.stage;
    const canRebirth = rm.canRebirth(stage);
    const soulsWouldGet = rm.calculateSouls(stage, gameRef.player.totalKills);

    let html = `
      <div class="rebirth-header">
        <div class="rebirth-count">💀 환생 횟수: <span style="color:#ff88ff">${rm.rebirthCount}</span></div>
        <div class="rebirth-souls">👻 영혼석: <span style="color:#ddaaff">${rm.totalSouls}</span></div>
      </div>
      <div class="rebirth-info">
        <div class="stat-row"><span class="stat-label">데미지 배율</span><span class="stat-val" style="color:#ff8888">x${rm.permanentBonuses.damageMultiplier.toFixed(2)}</span></div>
        <div class="stat-row"><span class="stat-label">골드 배율</span><span class="stat-val" style="color:#ffd740">x${rm.permanentBonuses.goldMultiplier.toFixed(2)}</span></div>
        <div class="stat-row"><span class="stat-label">경험치 배율</span><span class="stat-val" style="color:#69f0ae">x${rm.permanentBonuses.expMultiplier.toFixed(2)}</span></div>
        <div class="stat-row"><span class="stat-label">시작 골드</span><span class="stat-val" style="color:#ffd740">${rm.permanentBonuses.startGold}G</span></div>
      </div>

      <div class="rebirth-action">
        <button class="item-btn purple rebirth-btn" id="btn-rebirth" ${!canRebirth ? 'disabled' : ''} style="width:100%;height:50px">
          <span class="btn-label" style="font-size:14px">💀 환생하기</span>
          <span class="btn-cost">${canRebirth ? `+${soulsWouldGet} 영혼석` : `스테이지 ${rm.minStageToRebirth} 필요 (현재 ${stage})`}</span>
        </button>
      </div>

      <div class="equip-section-title">👻 영혼석 상점</div>
    `;

    for (const upgrade of rm.soulUpgrades) {
      const canBuy = rm.totalSouls >= upgrade.cost;
      html += `
        <div class="upgrade-item">
          <div class="item-icon">👻</div>
          <div class="item-info">
            <div class="item-name">${upgrade.name}</div>
            <div class="item-stats">${upgrade.desc}</div>
          </div>
          <button class="item-btn soul-buy-btn" data-upgrade="${upgrade.id}" ${!canBuy ? 'disabled' : ''} style="background:linear-gradient(180deg,#6a1b9a,#4a148c);border-color:#ab47bc">
            <span class="btn-label">구매</span>
            <span class="btn-cost">${upgrade.cost}👻</span>
          </button>
        </div>
      `;
    }

    container.innerHTML = html;

    // Rebirth button
    const rebirthBtn = document.getElementById('btn-rebirth');
    if (rebirthBtn) {
      rebirthBtn.addEventListener('click', () => {
        if (!canRebirth) return;
        soundManager.ensureContext();
        rm.performRebirth(gameRef);
        this.update(gameRef);
      });
    }

    // Soul upgrade buttons
    container.querySelectorAll('.soul-buy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        soundManager.ensureContext();
        const upgradeId = btn.dataset.upgrade;
        if (rm.buySoulUpgrade(upgradeId)) {
          soundManager.playUpgrade();
          this.update(gameRef);
        }
      });
    });
  }
}
