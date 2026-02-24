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
      const player = game.player;
      const cost = player.weapon.nextUpgradeCost;
      if (player.gold >= cost) {
        player.gold -= cost;
        player.weapon.upgrade();
        this.update(game);
        game.effects.push(new FloatingText(
          player.x, player.y - 80, '강화!', '#44ff44', 16, 40
        ));
      }
    });

    // Character levelup button
    document.getElementById('btn-levelup').addEventListener('click', () => {
      if (typeof game === 'undefined') return;
      const player = game.player;
      const cost = Math.floor(50 * Math.pow(1.3, player.level - 1));
      if (player.gold >= cost) {
        player.gold -= cost;
        player.maxHp += 15;
        player.hp = Math.min(player.hp + 15, player.maxHp);
        player.maxShield += 5;
        this.update(game);
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

    // HP bar
    const hpPercent = (player.hp / player.maxHp) * 100;
    document.getElementById('hp-fill').style.width = hpPercent + '%';
    document.getElementById('hp-text').textContent =
      `${Math.ceil(player.hp)}/${player.maxHp}`;

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

    // Pause button
    document.getElementById('btn-pause').textContent = gameRef.paused ? '▶' : '❚❚';
  }
}
