// sprites.js - 스프라이트시트 로딩 & 렌더링

// === Image Loader ===
const IMAGES = {};
let imagesLoaded = 0;
let imagesToLoad = 0;
let allImagesReady = false;

function loadImage(key, src) {
  imagesToLoad++;
  const img = new Image();
  img.onload = () => {
    IMAGES[key] = img;
    imagesLoaded++;
    if (imagesLoaded >= imagesToLoad) allImagesReady = true;
  };
  img.onerror = () => {
    console.warn('Failed to load:', src);
    imagesLoaded++;
    if (imagesLoaded >= imagesToLoad) allImagesReady = true;
  };
  img.src = src;
}

// Preload all images
function preloadImages() {
  loadImage('player', 'assets/player.png');
  // 좀비 이미지가 생기면 여기에 추가
  // loadImage('zombie_red', 'assets/zombie_red.png');
}

// === Player Sprite Frame Data ===
// Source: 2752x1536 RGBA sprite sheet
const PLAYER_FRAMES = {
  idle: [
    { x: 80, y: 66, w: 191, h: 249 },
    { x: 319, y: 66, w: 190, h: 249 },
  ],
  walk: [
    { x: 1238, y: 66, w: 197, h: 249 },
    { x: 1466, y: 66, w: 202, h: 249 },
    { x: 1688, y: 66, w: 196, h: 249 },
    { x: 1918, y: 66, w: 220, h: 249 },
  ],
  shoot: [
    { x: 93, y: 963, w: 227, h: 212 },
    { x: 364, y: 963, w: 220, h: 212 },
    { x: 641, y: 963, w: 225, h: 212 },
  ],
};

// Target render height on 720x640 canvas
const PLAYER_RENDER_H = 120;

function drawPlayerSprite(ctx, x, y, state, frameIndex, recoilOffset, muzzleFlash, breathOffset, isHurt, hurtTimer) {
  const img = IMAGES['player'];
  if (!img) {
    // Fallback: simple rect if image not loaded
    ctx.fillStyle = '#4a6741';
    ctx.fillRect(x - 10, y - 50, 20, 50);
    return;
  }

  const frames = PLAYER_FRAMES[state] || PLAYER_FRAMES.idle;
  const fi = frameIndex % frames.length;
  const frame = frames[fi];

  // Scale to target height
  const scale = PLAYER_RENDER_H / frame.h;
  const rw = frame.w * scale;
  const rh = frame.h * scale;

  ctx.save();

  // Hurt flash
  if (isHurt && hurtTimer % 2 === 0) {
    ctx.globalAlpha = 0.5;
  }

  // Enable smoothing for high-res sprite image
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Recoil offset (push back slightly when shooting)
  const ro = recoilOffset || 0;

  // Draw character
  ctx.drawImage(
    img,
    frame.x, frame.y, frame.w, frame.h,   // source rect
    x - rw * 0.3 - ro, y - rh + breathOffset, rw, rh  // dest rect (anchor at feet-center)
  );

  // Restore pixel art mode for other rendering
  ctx.imageSmoothingEnabled = false;

  // Muzzle flash (drawn at gun tip, right side of sprite)
  if (muzzleFlash > 0) {
    const alpha = muzzleFlash / 5;
    const fx = x + rw * 0.55 - ro;
    const fy = y - rh * 0.52 + breathOffset;
    const sz = 14 + (5 - muzzleFlash) * 4;

    ctx.globalAlpha = alpha;

    // Outer orange glow
    ctx.fillStyle = '#ff8800';
    ctx.fillRect(fx - sz * 0.3, fy - sz * 0.7, sz * 1.8, sz * 1.5);

    // Middle yellow
    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(fx + sz * 0.1, fy - sz * 0.4, sz * 1.1, sz * 0.9);

    // Inner white
    ctx.fillStyle = '#ffffee';
    ctx.fillRect(fx + sz * 0.3, fy - sz * 0.1, sz * 0.5, sz * 0.4);

    // Radiating sparks
    ctx.fillStyle = '#ffaa22';
    ctx.fillRect(fx + sz * 1.3, fy - sz * 0.5, 5, 3);
    ctx.fillRect(fx + sz * 1.1, fy + sz * 0.5, 5, 3);
    ctx.fillRect(fx - sz * 0.1, fy - sz * 0.9, 3, 5);
    ctx.fillRect(fx + sz * 1.5, fy, 4, 3);
  }

  ctx.restore();
}

// === Zombie Pixel Art (until zombie sprite images are provided) ===
const SP = 4;

function drawSprite(ctx, data, pal, x, y, flipH) {
  for (let r = 0; r < data.length; r++) {
    const row = data[r];
    for (let c = 0; c < row.length; c++) {
      const ch = row[c];
      if (ch === '.' || !pal[ch]) continue;
      const px = flipH ? x - (c + 1) * SP : x + c * SP;
      ctx.fillStyle = pal[ch];
      ctx.fillRect(px, y + r * SP, SP, SP);
    }
  }
}

const PAL_ZOMBIE_RED = {
  '1': '#12100a', 'R': '#c05040', 'r': '#903830', 'S': '#dd6050',
  'w': '#8a2020', 'Y': '#ff3300', 'T': '#ddddaa', 't': '#3a1a1a',
  'H': '#2a1a1a', 'V': '#4a4230', 'v': '#3a3220', 'B': '#881818',
};

const PAL_ZOMBIE_GREEN = {
  '1': '#12100a', 'R': '#5aaa5a', 'r': '#3a8a3a', 'S': '#70cc70',
  'w': '#2a6a2a', 'Y': '#ffff00', 'T': '#ccccaa', 't': '#2a2a1a',
  'H': '#2a3a1a', 'V': '#3a3a2a', 'v': '#2a2a1a', 'B': '#40aa40',
};

const PAL_ZOMBIE_BOSS = {
  '1': '#12100a', 'R': '#cc3333', 'r': '#992222', 'S': '#ee5555',
  'w': '#770000', 'Y': '#ff0000', 'T': '#eeeecc', 't': '#2a0a0a',
  'H': '#1a0a0a', 'V': '#2a2a30', 'v': '#1a1a20', 'B': '#aa0000',
  'G': '#ffd700', 'g': '#ccaa00', 'J': '#ff2222',
};

const ZOMBIE_BODY = [
  '..1HHHHHH1....',
  '.1HHHH1HHH1...',
  '.1HHHHHHHH1...',
  '.1RRRrRRRR1...',
  '.1RYR1RYRR1...',
  '.1RRRrRRRR1...',
  '.1RtTtTtRR1...',
  '..1RBrRRR1....',
  '...1RRSRR1....',
  '..1RRrRRR1....',
  '.1RSRrRSRR1...',
  '.1RRrRRRRR1...',
  '.1RwR1RRwR1...',
  '..1RRRRRR1....',
  '..1VVVVVV1....',
  '..1VV1.VV1....',
  '..1VR1.RV1....',
  '..1Vr1.rV1....',
  '..1rr1.rr1....',
  '.1rrr1.rrr1...',
  '.11111.11111..',
  '..............',
];

const ZOMBIE_ARMS = [
  '1RRR1RRRR.',
  '.1RR1rRRR.',
  '1rr11RR...',
  '111.......',
];

const BOSS_CROWN = [
  '1G1G1G1.',
  '1JGJGJG1',
  '1GGGGGG1',
  '11111111',
];

function renderZombie(ctx, x, y, type, walkFrame, hitFlash, dying, deathTimer, hp, maxHp) {
  const isBoss = type === 'boss';
  const scale = isBoss ? 1.4 : 1;
  const pal = type === 'fast' ? PAL_ZOMBIE_GREEN :
              type === 'boss' ? PAL_ZOMBIE_BOSS : PAL_ZOMBIE_RED;

  if (dying) ctx.globalAlpha = deathTimer / 15;

  // Build white palette (same keys, all white)
  const whitePal = {};
  if (hitFlash > 0) {
    for (const k of Object.keys(pal)) whitePal[k] = '#ffffff';
  }

  // Choose palette: alternate white/normal for flash effect
  const usePal = (hitFlash > 0 && hitFlash % 2 === 0) ? whitePal : pal;

  ctx.save();
  if (isBoss) {
    ctx.translate(x, y); ctx.scale(scale, scale); ctx.translate(-x, -y);
  }

  const bx = x - 28, by = y - 88;
  drawSprite(ctx, ZOMBIE_BODY, usePal, bx, by, true);

  const armOff = walkFrame === 0 ? 0 : 5;
  drawSprite(ctx, ZOMBIE_ARMS, usePal, bx - 10 * SP + armOff, by + 9 * SP, true);
  drawSprite(ctx, ZOMBIE_ARMS, usePal, bx - 8 * SP - armOff, by + 11 * SP, true);

  if (isBoss) drawSprite(ctx, BOSS_CROWN, usePal, bx + 6, by - 16, false);
  ctx.restore();

  // HP bar (always normal colors)
  const barW = isBoss ? 80 : 50, barH = 6;
  const barY = y - (isBoss ? 120 : 95);
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(x - barW / 2 - 1, barY - 1, barW + 2, barH + 2);
  ctx.fillStyle = '#2a2a2a';
  ctx.fillRect(x - barW / 2, barY, barW, barH);
  const pct = hp / maxHp;
  ctx.fillStyle = isBoss ? '#ff2200' : (pct > 0.5 ? '#44dd44' : (pct > 0.25 ? '#ddaa00' : '#dd2222'));
  ctx.fillRect(x - barW / 2, barY, barW * pct, barH);
  ctx.strokeStyle = '#444'; ctx.lineWidth = 1;
  ctx.strokeRect(x - barW / 2, barY, barW, barH);

  if (dying) ctx.globalAlpha = 1;
}
