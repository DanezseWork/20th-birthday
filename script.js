import * as THREE from "three";

const CARD_W = 2.5;
const CARD_H = 3.4;
const THICK = 0.014;
const PAPER_EDGE_COLOR = 0x6b5c64;
const PAPER_EDGE_OPACITY = 0.95;
const FULL_OPEN = Math.PI * 0.92;
const SLIGHT_OPEN = 0.03;
const FRONT_TEXT_W = CARD_W * 0.94;
const FRONT_TEXT_H = CARD_H * 0.48;
const PAGE_W = CARD_W;
const PAGE_H = CARD_H;
const PAGE_FLIP_ANGLE = FULL_OPEN;
const PAGE_BASE_Z = THICK / 2 + 0.002;
const PAGE_STACK_STEP = 0.016;
const PAGE_TEX_W = 512;
const PAGE_PAD_X = 72;

// Edit page content here — each page is an array of text lines.
const PAGES = [
  [
    { text: "Hi Trixie,", color: "#c882a0", font: "italic 42px Georgia, serif", y: 185, leading: 50 },
    {
      text:
        "Happy happy birthday! I want to start this off by appreciating you as a person, a friend, a churchmate, a daughter, and a sister. Truly, you have been such an amazing person not just to me, but to everyone around you.",
      color: "#8c7882",
      font: "400 21px Georgia, serif",
      y: 248,
      leading: 34,
    },
    {
      text: 'I think the name "Joy" truly fits you as a person.',
      color: "#a08f99",
      font: "italic 22px Georgia, serif",
      leading: 36,
    },
  ],
  [
    {
      text:
        'So with that, I would also like to pray for your joy on your very special day. May it be a day of joy and happy moments for you and your family. For this occasion, I do have something to give to you, a "present," so to speak. This is actually something that you have made me realize as well. And that is the value of the present moment. To quote one of my childhood movies:',
      color: "#8c7882",
      font: "400 18px Georgia, serif",
      y: 158,
      leading: 27,
    },
    {
      text:
        '"Yesterday is history, tomorrow is a mystery, but today is a gift. That is why it is called the present."',
      color: "#a08f99",
      font: "italic 18px Georgia, serif",
      leading: 27,
    },
    {
      text: "— some turtle",
      color: "#c882a0",
      font: "italic 17px Georgia, serif",
      leading: 32,
    },
  ],
  [
    {
      text:
        "As someone who lacked placing value in special occasions in my life, I think this is a great reminder of how precious our lives really are. Which is why I give you this reminder to cherish where you are right now and what you've been through in life, good or bad.",
      color: "#8c7882",
      font: "400 18px Georgia, serif",
      y: 158,
      leading: 27,
    },
    {
      text:
        'As your friend and someone who considers you a best friend, this "present" isn\'t just a reminder of this current moment, but it is also my way of saying thank you, thank you for spending and sharing all those past present moments with me, and prayerfully for more present moments to come.',
      color: "#8c7882",
      font: "400 18px Georgia, serif",
      leading: 27,
    },
  ],
  [
    {
      text:
        "I want to end this letter by thanking you for being you! Someone very thoughtful, funny, honest, and always ready to be there in times of need, yung tipong usapan bibili lang ng bulaklak haha.",
      color: "#8c7882",
      font: "400 18px Georgia, serif",
      y: 158,
      leading: 27,
    },
    {
      text:
        "With that, I leave you this verse that has helped an overthinker like me remain in the present moment.",
      color: "#8c7882",
      font: "400 18px Georgia, serif",
      leading: 27,
    },
    {
      text:
        "'Therefore do not worry about tomorrow, for tomorrow will worry about itself. Each day has enough trouble of its own.'",
      color: "#a08f99",
      font: "italic 18px Georgia, serif",
      leading: 27,
    },
    {
      text: "Matthew 6:34 NIV",
      color: "#c882a0",
      font: "italic 17px Georgia, serif",
      leading: 32,
    },
  ],
  [
    {
      text: "I pray that all your goals may be fulfilled.",
      color: "#8c7882",
      font: "400 20px Georgia, serif",
      y: 220,
      leading: 34,
    },
    {
      text: "Happy Birthday Trixie,",
      color: "#c882a0",
      font: "italic 28px Georgia, serif",
      y: 320,
      leading: 40,
    },
    {
      text: "Daniel",
      color: "#8c7882",
      font: "400 26px Georgia, serif",
      leading: 36,
    },
  ],
];

/** Hinged right sheets: PAGES[0], PAGES[2], PAGES[4]. Left cover spread uses PAGES[1] or PAGES[3]. */
const FLIP_PAGE_COUNT = 3;
const FLIP_PAGE_TEXTURE_INDEX = [0, 2, 4];
const LEFT_SPREAD_TEXTURE_BY_VIEW = { 1: 1, 2: 3 };

const PASTEL_PINKS = [
  0xffb7c5, 0xffc8dd, 0xffafcc, 0xf8bbd0, 0xf4acb7,
  0xe8a0bf, 0xffd6e0, 0xfadadd, 0xf5c6d6, 0xffb3c6,
];
const PASTEL_OTHERS = [
  0xe2cfea, 0xc9b1ff, 0xbde0fe, 0xffdab9, 0xd4f1e8,
];

const wrap = document.getElementById("canvas-wrap");
const hint = document.getElementById("hint");
const musicToggle = document.getElementById("music-toggle");
const navPrev = document.getElementById("nav-prev");
const navNext = document.getElementById("nav-next");
const navPrevWrap = document.getElementById("nav-prev-wrap");
const navNextWrap = document.getElementById("nav-next-wrap");
const navPrevHint = document.getElementById("nav-prev-hint");
const navNextHint = document.getElementById("nav-next-hint");

// ── renderer ─────────────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0xffffff);
renderer.outputColorSpace = THREE.SRGBColorSpace;
wrap.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);

const camera = new THREE.PerspectiveCamera(
  36,
  window.innerWidth / window.innerHeight,
  0.1,
  50
);

// ── initial camera view — edit these in script.js ────────────
const VIEW = {
  radius: 9,                        // zoom out/in (higher = further)
  theta: 0,                        // rotate left/right (radians)
  phi: 2.3,                          // tilt up/down (radians)
  target: new THREE.Vector3(0, 0, 0), // where the camera looks
};

const FLAT_RADIUS = 7;
const MOBILE_LAYOUT_MAX_WIDTH = 640;
const PAN_DAMPING = 0.72;

const panPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const panHit = new THREE.Vector3();
/** Shift card so the open spread fold (spine) sits on the view center when flat. */
const OPEN_LETTER_SHIFT_X = CARD_W / 2;

let opened = false;
let openT = 0;
let opening = false;
let closing = false;
let closeT = 0;
let flatT = 0;
let flatStartView = null;
let pan = { x: 0, y: 0 };
let currentPage = 0;
let pageAnim = null;

const birthdayMusic = new Audio("audio/happy-birthday-lofi.mp3");
birthdayMusic.loop = true;
birthdayMusic.preload = "auto";
birthdayMusic.volume = 0.35;
let musicEnabled = true;

function syncMusicToggleUi() {
  musicToggle.setAttribute("aria-pressed", musicEnabled ? "true" : "false");
  musicToggle.setAttribute(
    "aria-label",
    musicEnabled ? "Turn music off" : "Turn music on"
  );
}

function setMusicToggleVisible(visible) {
  musicToggle.classList.toggle("hidden", !visible);
}

function startBirthdayMusic(fromBeginning = false) {
  if (!musicEnabled) return;
  if (fromBeginning) birthdayMusic.currentTime = 0;
  birthdayMusic.play().catch(() => {});
}

function pauseBirthdayMusic() {
  birthdayMusic.pause();
}

function stopBirthdayMusic() {
  birthdayMusic.pause();
  birthdayMusic.currentTime = 0;
}

function toggleBirthdayMusic() {
  musicEnabled = !musicEnabled;
  syncMusicToggleUi();
  if (musicEnabled && opened && !closing) {
    startBirthdayMusic(false);
  } else {
    pauseBirthdayMusic();
  }
}

syncMusicToggleUi();
musicToggle.addEventListener("click", (e) => {
  e.stopPropagation();
  toggleBirthdayMusic();
});

function easeOut(t) {
  return 1 - (1 - t) ** 3;
}

function sphericalCameraPos(view) {
  const sinP = Math.sin(view.phi);
  return new THREE.Vector3(
    view.target.x + view.radius * sinP * Math.sin(view.theta),
    view.target.y + view.radius * Math.cos(view.phi),
    view.target.z + view.radius * sinP * Math.cos(view.theta)
  );
}

function isMobileLayout() {
  return window.innerWidth <= MOBILE_LAYOUT_MAX_WIDTH;
}

function panDamping() {
  return isMobileLayout() ? 0.62 : PAN_DAMPING;
}

/** Extra zoom-out and vertical framing when the open letter is viewed on a phone. */
function flatViewTuning() {
  if (!isMobileLayout()) {
    return { radius: FLAT_RADIUS, yOffset: 0 };
  }

  const aspect = window.innerHeight / Math.max(window.innerWidth, 1);
  const portraitBoost = aspect > 1.15 ? 1.2 : 0;
  return {
    radius: FLAT_RADIUS + 2.8 + portraitBoost,
    yOffset: 0.42 + portraitBoost * 0.12,
  };
}

function updateCamera() {
  if (opened) {
    const { radius, yOffset } = flatViewTuning();
    const viewY = pan.y - yOffset;
    const flatPos = new THREE.Vector3(pan.x, viewY, radius);
    const flatTarget = new THREE.Vector3(pan.x, viewY, 0);

    if (flatT < 1 && flatStartView) {
      const e = easeOut(flatT);
      const startPos = sphericalCameraPos(flatStartView);
      camera.position.lerpVectors(startPos, flatPos, e);
      camera.lookAt(
        new THREE.Vector3().lerpVectors(flatStartView.target, flatTarget, e)
      );
    } else {
      camera.position.copy(flatPos);
      camera.lookAt(flatTarget);
    }
    syncOpenLetterShift();
    return;
  }

  const { target, radius, theta, phi } = VIEW;
  const sinP = Math.sin(phi);
  camera.position.set(
    target.x + radius * sinP * Math.sin(theta),
    target.y + radius * Math.cos(phi),
    target.z + radius * sinP * Math.cos(theta)
  );
  camera.lookAt(target);
  syncOpenLetterShift();
}

// ── materials ────────────────────────────────────────────────
function paperMat() {
  return new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.FrontSide,
    depthWrite: true,
    depthTest: true,
  });
}

function solidPaper(w, h) {
  const group = new THREE.Group();
  const mat = paperMat();

  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, THICK), mat);
  group.add(body);

  const edgeMat = new THREE.LineBasicMaterial({
    color: PAPER_EDGE_COLOR,
    transparent: true,
    opacity: PAPER_EDGE_OPACITY,
    depthTest: true,
  });

  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, THICK)),
    edgeMat
  );
  group.add(edges);

  // Front-face border — reads clearly when the letter is flat against the white background.
  const z = THICK / 2 + 0.001;
  const hw = w / 2;
  const hh = h / 2;
  const faceBorder = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-hw, -hh, z),
      new THREE.Vector3(hw, -hh, z),
      new THREE.Vector3(hw, hh, z),
      new THREE.Vector3(-hw, hh, z),
    ]),
    edgeMat
  );
  group.add(faceBorder);

  return group;
}

function finishTextTexture(tex, { mipmaps = false } = {}) {
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.generateMipmaps = mipmaps;
  tex.minFilter = mipmaps ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  tex.needsUpdate = true;
  return tex;
}

function drawCenteredMixedText(ctx, cx, y, segments, { baseline = "middle" } = {}) {
  const prevAlign = ctx.textAlign;
  const prevBaseline = ctx.textBaseline;
  const prevSpacing = ctx.letterSpacing;
  ctx.textAlign = "left";
  ctx.textBaseline = baseline;

  let total = 0;
  const widths = [];
  for (const seg of segments) {
    ctx.font = seg.font;
    ctx.letterSpacing = seg.letterSpacing ?? "0px";
    const w = ctx.measureText(seg.text).width;
    widths.push(w);
    total += w;
  }

  let x = cx - total / 2;
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    ctx.font = seg.font;
    ctx.fillStyle = seg.color;
    ctx.letterSpacing = seg.letterSpacing ?? "0px";
    ctx.fillText(seg.text, x, y);
    x += widths[i];
  }

  ctx.textAlign = prevAlign;
  ctx.textBaseline = prevBaseline;
  ctx.letterSpacing = prevSpacing;
}

// Inside cover: mesh uses rotation.y = π, so +x here moves toward the outer left of the spread.
const LEFT_CAKE_X = CARD_W * 0.01;
const LEFT_CAKE_Y = 0.04;
const LEFT_CAKE_PLANE_W = CARD_W * 0.9;
const LEFT_CAKE_POP_DELAY = 1;

function easeOutBack(t) {
  const c1 = 1.15;
  const c3 = c1 + 1;
  return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
}

function drawSoftFlame(ctx, x, y, t, phase) {
  const flicker = Math.sin(t * 6 + phase) * 1.5;
  const fy = y + flicker;
  const g = ctx.createRadialGradient(x, fy, 0, x, fy, 12);
  g.addColorStop(0, "#fff8f0");
  g.addColorStop(0.55, "#ffd4b8");
  g.addColorStop(1, "rgba(200, 130, 160, 0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(x, fy, 5, 8, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawCandleDigit(ctx, char, x, surfaceY, t, phase) {
  const stickH = 11;
  const stickTop = surfaceY - stickH - 6;

  ctx.fillStyle = "#fff9fb";
  ctx.beginPath();
  ctx.roundRect(x - 3, stickTop, 6, stickH, 2);
  ctx.fill();
  ctx.strokeStyle = "#c882a0";
  ctx.lineWidth = 1.25;
  ctx.stroke();

  ctx.font = 'italic 500 44px "Cormorant Garamond", Georgia, serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillStyle = "#c882a0";
  ctx.fillText(char, x, stickTop - 2);

  drawSoftFlame(ctx, x, stickTop - 48, t, phase);
}

function drawCakeTier(ctx, cx, hw, y, h, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(cx - hw, y, hw * 2, h, 12);
  ctx.fill();
  ctx.strokeStyle = "#c882a0";
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawLeftPanelCake(ctx, w, h, t, enterT) {
  ctx.clearRect(0, 0, w, h);
  if (enterT <= 0.01) return;

  const enter = easeOut(enterT);
  const pop = easeOutBack(enterT);
  const cx = w * 0.5;
  const cy = h * 0.56;
  const tierH = 46;
  const bottomY = cy + 14;

  ctx.save();
  ctx.globalAlpha = enter;
  const slide = (1 - enter) * 36;
  ctx.translate(cx, cy + slide);
  ctx.scale(pop * 1.24, pop * 1.24);
  ctx.translate(-cx, -cy);
  ctx.translate(0, Math.sin(t * 1.5) * 2.5 * enter);

  ctx.fillStyle = "rgba(180, 120, 140, 0.15)";
  ctx.beginPath();
  ctx.ellipse(cx, bottomY + tierH + 10, w * 0.21, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  const midY = bottomY - tierH;
  const topY = midY - tierH;

  drawCakeTier(ctx, cx, w * 0.19, bottomY, tierH, "#e6d9cf");
  drawCakeTier(ctx, cx, w * 0.175, midY, tierH, "#efe8e2");
  drawCakeTier(ctx, cx, w * 0.16, topY, tierH, "#f5e6eb");

  drawCandleDigit(ctx, "2", cx - 30, topY, t, 0);
  drawCandleDigit(ctx, "0", cx + 30, topY, t, 1.2);

  ctx.restore();
}

function refreshLeftPanelCakeTexture() {
  if (!leftPanelCake) return;
  drawLeftPanelCake(
    leftPanelCake.ctx,
    leftPanelCake.canvas.width,
    leftPanelCake.canvas.height,
    leftPanelCake.animT,
    1
  );
  leftPanelCake.tex.needsUpdate = true;
}

function createLeftPanelCake(coverGroup) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 560;
  const ctx = canvas.getContext("2d");
  drawLeftPanelCake(ctx, canvas.width, canvas.height, 0, 1);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;

  const planeW = LEFT_CAKE_PLANE_W;
  const planeH = planeW * (560 / 512);
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(planeW, planeH), mat);
  mesh.renderOrder = 50;
  mesh.rotation.y = Math.PI;

  const root = new THREE.Group();
  root.position.set(LEFT_CAKE_X, LEFT_CAKE_Y, -(THICK / 2 + 0.012));
  root.add(mesh);
  coverGroup.add(root);
  root.visible = false;

  return { root, mesh, canvas, ctx, tex, animT: 0, enterT: 0, waitT: 0 };
}

function createLeftSpreadPage(coverGroup, texture) {
  const mat = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(CARD_W, CARD_H), mat);
  mesh.rotation.y = Math.PI;
  mesh.renderOrder = 40;

  const root = new THREE.Group();
  root.position.set(0, 0, -(THICK / 2 + 0.003));
  root.add(mesh);
  coverGroup.add(root);
  root.visible = false;

  return { root, mat };
}

let leftPanelCake = null;
let leftSpreadPage = null;

function syncLeftSpreadPage() {
  if (!leftSpreadPage) return;
  const leftIndex = LEFT_SPREAD_TEXTURE_BY_VIEW[currentPage];
  const show = pageGroup.visible && leftIndex != null && !pageAnim;
  leftSpreadPage.root.visible = show;
  leftSpreadPage.mat.visible = show;
  if (show) {
    const tex = pageTextures[leftIndex];
    if (leftSpreadPage.mat.map !== tex) {
      leftSpreadPage.mat.map = tex;
      leftSpreadPage.mat.needsUpdate = true;
    }
    if (pageEntities.length) {
      const ref = pageEntities[0].mat;
      leftSpreadPage.mat.opacity = ref.opacity;
      leftSpreadPage.mat.transparent = ref.transparent;
      leftSpreadPage.mat.depthWrite = ref.depthWrite;
    }
  } else {
    leftSpreadPage.mat.opacity = 0;
  }
  leftSpreadPage.mat.needsUpdate = true;
}

function updateLeftPanelCake(dt) {
  if (!leftPanelCake) return;
  const onFirstPage = currentPage === 0 && !pageAnim;
  const letterOpen =
    onFirstPage && !closing && (opening || opened);
  const popReady = onFirstPage && opened && !opening && !closing && openT >= 1;

  leftPanelCake.root.visible = letterOpen;
  if (!letterOpen) {
    leftPanelCake.mesh.scale.setScalar(1);
    leftPanelCake.enterT = 0;
    leftPanelCake.waitT = 0;
    drawLeftPanelCake(
      leftPanelCake.ctx,
      leftPanelCake.canvas.width,
      leftPanelCake.canvas.height,
      leftPanelCake.animT,
      0
    );
    leftPanelCake.tex.needsUpdate = true;
    return;
  }

  leftPanelCake.animT += dt;
  if (popReady) {
    leftPanelCake.waitT += dt;
  }
  if (leftPanelCake.waitT >= LEFT_CAKE_POP_DELAY) {
    leftPanelCake.enterT = Math.min(1, leftPanelCake.enterT + dt * 2.4);
  } else {
    leftPanelCake.enterT = 0;
  }

  drawLeftPanelCake(
    leftPanelCake.ctx,
    leftPanelCake.canvas.width,
    leftPanelCake.canvas.height,
    leftPanelCake.animT,
    leftPanelCake.enterT
  );
  leftPanelCake.tex.needsUpdate = true;
  if (leftPanelCake.enterT >= 1) {
    const pulse = 1 + Math.sin(leftPanelCake.animT * 2.2) * 0.012;
    leftPanelCake.mesh.scale.set(pulse, pulse, 1);
  } else {
    leftPanelCake.mesh.scale.set(1, 1, 1);
  }
}

const COVER_TEX_LOGICAL_W = 2048;
const COVER_TEX_MAX_SCALE = 2;

function coverTextureScale() {
  const dpr = Math.min(window.devicePixelRatio, 2);
  const byViewport = (window.innerWidth * dpr) / COVER_TEX_LOGICAL_W;
  return Math.min(COVER_TEX_MAX_SCALE, Math.max(1, byViewport));
}

function makeFrontCoverTexture() {
  const scale = coverTextureScale();
  const texW = Math.round(COVER_TEX_LOGICAL_W * scale);
  const texH = Math.round(texW * (FRONT_TEXT_H / FRONT_TEXT_W));
  const c = document.createElement("canvas");
  c.width = texW;
  c.height = texH;
  const ctx = c.getContext("2d");
  ctx.clearRect(0, 0, texW, texH);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.scale(scale, scale);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const cx = COVER_TEX_LOGICAL_W / 2;
  const cy = texH / scale / 2;

  ctx.fillStyle = "#7a6b72";
  drawCenteredMixedText(ctx, cx, cy - 96, [
    {
      text: "Happy ",
      font: '400 132px "Cormorant Garamond", Georgia, serif',
      color: "#7a6b72",
      letterSpacing: "0.04em",
    },
    {
      text: "20th",
      font: '500 174px "Cormorant Garamond", Georgia, serif',
      color: "#7a6b72",
      letterSpacing: "0.03em",
    },
    {
      text: " Birthday,",
      font: '400 132px "Cormorant Garamond", Georgia, serif',
      color: "#7a6b72",
      letterSpacing: "0.04em",
    },
  ]);

  ctx.fillStyle = "#b87a96";
  ctx.font = 'italic 500 236px "Cormorant Garamond", Georgia, serif';
  ctx.letterSpacing = "0.03em";
  ctx.fillText("Trixie", cx, cy + 86);

  return finishTextTexture(new THREE.CanvasTexture(c), { mipmaps: true });
}

function refreshFrontCoverTexture() {
  if (!frontCoverMat || !frontCoverFontsReady) return;
  frontCoverMat.map?.dispose();
  frontCoverMat.map = makeFrontCoverTexture();
  frontCoverMat.needsUpdate = true;
}

let frontCoverFontsReady = false;

function wrapPageTextLines(ctx, text, maxWidth) {
  const words = text.split(/\s+/);
  const lines = [];
  let current = "";
  for (const word of words) {
    const trial = current ? `${current} ${word}` : word;
    if (ctx.measureText(trial).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = trial;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function makePageTexture(pageIndex) {
  const texW = PAGE_TEX_W;
  const texH = Math.round(texW * (CARD_H / CARD_W));
  const c = document.createElement("canvas");
  c.width = texW;
  c.height = texH;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, texW, texH);
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  const scaleY = texH / 680;
  const maxTextW = texW - PAGE_PAD_X * 2;
  let cursorY = null;

  for (const line of PAGES[pageIndex]) {
    ctx.fillStyle = line.color;
    ctx.font = line.font;
    const sublines = wrapPageTextLines(ctx, line.text, maxTextW);
    const lineStep = (line.leading ?? 34) * scaleY;

    if (cursorY === null) {
      cursorY = (line.y ?? 185) * scaleY;
    } else if (line.y != null) {
      cursorY = Math.max(line.y * scaleY, cursorY);
    }

    for (const subline of sublines) {
      ctx.fillText(subline, texW / 2, cursorY);
      cursorY += lineStep;
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  return tex;
}

const pageTextures = PAGES.map((_, i) => makePageTexture(i));

function makePageEntity(texture) {
  const group = new THREE.Group();
  const sheet = solidPaper(PAGE_W, PAGE_H);
  group.add(sheet);

  const mat = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 0,
    depthWrite: true,
    side: THREE.FrontSide,
  });
  const textPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(CARD_W, CARD_H),
    mat
  );
  textPlane.position.z = THICK / 2 + 0.003;
  group.add(textPlane);

  return { group, mesh: textPlane, mat, sheet };
}

function setPagesOpacity(opacity) {
  for (const { mat } of pageEntities) {
    mat.opacity = opacity;
    mat.transparent = opacity < 1;
    mat.depthWrite = opacity >= 0.99;
    mat.needsUpdate = true;
  }
  if (leftSpreadPage) {
    const spreadShown = LEFT_SPREAD_TEXTURE_BY_VIEW[currentPage] != null;
    leftSpreadPage.mat.opacity = spreadShown ? opacity : 0;
    leftSpreadPage.mat.transparent = opacity < 1 || !spreadShown;
    leftSpreadPage.mat.depthWrite = spreadShown && opacity >= 0.99;
    leftSpreadPage.mat.needsUpdate = true;
  }
  pageGroup.visible = opacity > 0.01;
  syncPageVisibility();
}

function syncPageVisibility() {
  for (let i = 0; i < FLIP_PAGE_COUNT; i++) {
    const { group } = pageEntities[i];
    let show = false;

    if (pageAnim) {
      const { from, to, flipIndex } = pageAnim;
      if (i === flipIndex) show = true;
      else if (to > from && i === to) show = true;
      else if (to < from && (i === from || i === flipIndex)) show = true;
    } else {
      show = i === currentPage;
    }

    group.visible = show;
  }
  syncLeftSpreadPage();
}

// ── card — pivot at centre, matches sketch ───────────────────
const card = new THREE.Group();
scene.add(card);

function syncOpenLetterShift() {
  const t = opened && !closing ? easeOut(flatT) : 0;
  card.position.x = OPEN_LETTER_SHIFT_X * t;
}

const letterMeshes = [];

function addLetterMesh(mesh) {
  letterMeshes.push(mesh);
  return mesh;
}

// back sheet — solid opaque paper
const backSheet = solidPaper(CARD_W, CARD_H);
backSheet.traverse((c) => {
  if (c.isMesh && c.geometry?.type === "BoxGeometry") addLetterMesh(c);
});
card.add(backSheet);

// message pages — stacked hinged sheets on the back, like the cover
const pageGroup = new THREE.Group();
pageGroup.position.z = PAGE_BASE_Z;
pageGroup.visible = false;
card.add(pageGroup);

const pageHinges = [];
const pageEntities = [];

for (let i = 0; i < FLIP_PAGE_COUNT; i++) {
  const hinge = new THREE.Group();
  hinge.position.set(-PAGE_W / 2, 0, 0);
  pageGroup.add(hinge);

  const leaf = new THREE.Group();
  leaf.position.set(PAGE_W / 2, 0, 0);
  hinge.add(leaf);

  const entity = makePageEntity(pageTextures[FLIP_PAGE_TEXTURE_INDEX[i]]);
  leaf.add(entity.group);
  pageHinges.push(hinge);
  pageEntities.push(entity);
}

function syncPageStack() {
  for (let i = 0; i < FLIP_PAGE_COUNT; i++) {
    const hinge = pageHinges[i];

    if (!pageAnim || i !== pageAnim.flipIndex) {
      hinge.rotation.y = i < currentPage ? -PAGE_FLIP_ANGLE : 0;
    }

    if (pageAnim && i === pageAnim.flipIndex) {
      hinge.position.z = (FLIP_PAGE_COUNT - 1) * PAGE_STACK_STEP;
    } else if (i >= currentPage) {
      hinge.position.z = (FLIP_PAGE_COUNT - 1 - i) * PAGE_STACK_STEP;
    } else {
      hinge.position.z = -(currentPage - i) * PAGE_STACK_STEP * 0.5;
    }
  }
  syncPageVisibility();
}

syncPageStack();

function resetPages() {
  currentPage = 0;
  pageAnim = null;
  updateLeftPanelCake(0);
  for (const hinge of pageHinges) {
    hinge.rotation.y = 0;
  }
  setPagesOpacity(0);
  syncPageStack();
}

function finishPageFlip() {
  currentPage = pageAnim.to;
  pageAnim = null;
  syncPageStack();
  updateNav();
}

function updateNav() {
  const show = opened && !opening && !closing && openT >= 1 && !pageAnim;
  navPrevWrap.classList.toggle("hidden", !show);
  navNextWrap.classList.toggle("hidden", !show || currentPage >= FLIP_PAGE_COUNT - 1);
  navPrevHint.textContent = currentPage > 0 ? "tap for back" : "tap to close";
  navNextHint.textContent = "tap for next";
  navPrev.setAttribute("aria-label", currentPage > 0 ? "Previous page" : "Close letter");
}

function goToPage(index) {
  if (index < 0 || index >= FLIP_PAGE_COUNT || index === currentPage || pageAnim || closing) return;

  const forward = index > currentPage;
  const flipIndex = forward ? currentPage : index;

  pageAnim = {
    from: currentPage,
    to: index,
    flipIndex,
    startAngle: forward ? 0 : -PAGE_FLIP_ANGLE,
    endAngle: forward ? -PAGE_FLIP_ANGLE : 0,
    t: 0,
  };

  syncPageStack();
  updateNav();
}

function closeLetter() {
  if (closing || opening || pageAnim || !opened) return;
  closing = true;
  closeT = 0;
  panning = false;
  panPointerId = null;
  renderer.domElement.classList.remove("pan-ready");
  renderer.domElement.style.cursor = "pointer";
  updateNav();
  hint.textContent = "tap letter to open";
  setMusicToggleVisible(false);
}

// cover — same size, hinged on left spine, sits in front of back
const coverHinge = new THREE.Group();
coverHinge.position.set(-CARD_W / 2, 0, THICK + 0.012);
card.add(coverHinge);

const coverGroup = new THREE.Group();
coverGroup.position.set(CARD_W / 2, 0, 0);
coverHinge.add(coverGroup);

const coverSheet = solidPaper(CARD_W, CARD_H);
coverSheet.traverse((c) => {
  if (c.isMesh && c.geometry?.type === "BoxGeometry") addLetterMesh(c);
});
coverGroup.add(coverSheet);

// front cover text (texture applied after fonts load)
const frontCoverMat = new THREE.MeshBasicMaterial({
  transparent: true,
  depthWrite: false,
  side: THREE.FrontSide,
});
const frontCoverText = new THREE.Mesh(
  new THREE.PlaneGeometry(FRONT_TEXT_W, FRONT_TEXT_H),
  frontCoverMat
);
frontCoverText.position.set(0, 0.1, THICK / 2 + 0.003);
coverGroup.add(frontCoverText);

async function loadFrontCoverText() {
  await document.fonts.ready;
  await Promise.all([
    document.fonts.load('400 118px "Cormorant Garamond"'),
    document.fonts.load('italic 500 168px "Cormorant Garamond"'),
    document.fonts.load('italic 500 48px "Cormorant Garamond"'),
  ]);
  frontCoverFontsReady = true;
  refreshFrontCoverTexture();
  refreshLeftPanelCakeTexture();
}

loadFrontCoverText();

// crease on the left fold
const crease = new THREE.Mesh(
  new THREE.BoxGeometry(0.008, CARD_H, THICK * 0.6),
  new THREE.MeshBasicMaterial({ color: 0xd8d2d8 })
);
crease.position.set(-CARD_W / 2 + 0.004, 0, 0);
coverGroup.add(crease);

leftPanelCake = createLeftPanelCake(coverGroup);
leftSpreadPage = createLeftSpreadPage(coverGroup, pageTextures[1]);

// start slightly open
coverHinge.rotation.y = -FULL_OPEN * SLIGHT_OPEN;

updateCamera();

// ── flowers ──────────────────────────────────────────────────
const flowers = [];
const petalGeo = new THREE.CircleGeometry(0.04, 8);

function makeFlower(color) {
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 1,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  g.add(new THREE.Mesh(new THREE.CircleGeometry(0.015, 8), mat));
  for (let i = 0; i < 5; i++) {
    const p = new THREE.Mesh(petalGeo, mat);
    const a = (i / 5) * Math.PI * 2;
    p.position.set(Math.cos(a) * 0.035, Math.sin(a) * 0.035, 0);
    g.add(p);
  }
  return g;
}

function burstFlowers(n) {
  for (let i = 0; i < n; i++) {
    setTimeout(() => {
      const color =
        Math.random() < 0.75
          ? PASTEL_PINKS[(Math.random() * PASTEL_PINKS.length) | 0]
          : PASTEL_OTHERS[(Math.random() * PASTEL_OTHERS.length) | 0];
      const f = makeFlower(color);
      const origin = new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.4 + 0.1,
        0.15 + Math.random() * 0.3
      );
      card.localToWorld(origin);
      f.position.copy(origin);
      f.scale.setScalar(0.7 + Math.random() * 0.8);
      scene.add(f);
      const angle = Math.random() * Math.PI * 2;
      const spd = 0.018 + Math.random() * 0.04;
      flowers.push({
        mesh: f,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd + 0.015,
        vz: Math.random() * 0.015,
        rot: Math.random() * 6.28,
        rs: (Math.random() - 0.5) * 0.06,
        life: 1,
      });
    }, i * 14);
  }
}

// ── interaction ──────────────────────────────────────────────
const ray = new THREE.Raycaster();
const ptr = new THREE.Vector2();
let panning = false;
let panPointerId = null;
let grabHitX = 0;
let grabHitY = 0;

function setPointerFromClient(clientX, clientY) {
  ptr.x = (clientX / window.innerWidth) * 2 - 1;
  ptr.y = -(clientY / window.innerHeight) * 2 + 1;
  ray.setFromCamera(ptr, camera);
}

function getPanPlaneHit(clientX, clientY) {
  setPointerFromClient(clientX, clientY);
  return ray.ray.intersectPlane(panPlane, panHit) ? panHit : null;
}

function getDragTargets() {
  const targets = [...letterMeshes];
  if (opened && pageGroup.visible) {
    for (const { mesh, sheet } of pageEntities) {
      targets.push(mesh);
      sheet.traverse((c) => {
        if (c.isMesh && c.geometry?.type === "BoxGeometry") targets.push(c);
      });
    }
  }
  return targets;
}

function hitLetter(clientX, clientY) {
  setPointerFromClient(clientX, clientY);
  return ray.intersectObjects(getDragTargets(), false).length > 0;
}

function onPointerDown(e) {
  if (opened && flatT >= 1 && !closing && !pageAnim) {
    if (!hitLetter(e.clientX, e.clientY)) return;

    const hit = getPanPlaneHit(e.clientX, e.clientY);
    if (!hit) return;

    panning = true;
    panPointerId = e.pointerId;
    grabHitX = hit.x;
    grabHitY = hit.y;
    if (e.pointerType === "touch") e.preventDefault();
    renderer.domElement.setPointerCapture(e.pointerId);
    renderer.domElement.style.cursor = "grabbing";
    return;
  }

  if (!opened && !opening && !closing && hitLetter(e.clientX, e.clientY)) {
    openLetter();
  }
}

function onPointerMove(e) {
  if (panning && e.pointerId === panPointerId) {
    const hit = getPanPlaneHit(e.clientX, e.clientY);
    if (!hit) return;

    const damping = panDamping();
    const dx = (hit.x - grabHitX) * damping;
    const dy = (hit.y - grabHitY) * damping;
    pan.x -= dx;
    pan.y -= dy;
    grabHitX = hit.x;
    grabHitY = hit.y;
    if (e.pointerType === "touch") e.preventDefault();
    updateCamera();
    return;
  }

  if (opened && flatT >= 1 && !closing && !pageAnim) {
    updateHoverCursor(e.clientX, e.clientY);
  }
}

function onPointerUp(e) {
  if (panning && e.pointerId === panPointerId) {
    panning = false;
    panPointerId = null;
    renderer.domElement.releasePointerCapture(e.pointerId);
    updateHoverCursor(e.clientX, e.clientY);
  }
}

function updateHoverCursor(clientX, clientY) {
  if (opened && flatT >= 1 && !closing && !panning && !pageAnim) {
    renderer.domElement.style.cursor = hitLetter(clientX, clientY) ? "grab" : "default";
  }
}

navPrev.addEventListener("click", () => {
  if (currentPage > 0) goToPage(currentPage - 1);
  else closeLetter();
});

navNext.addEventListener("click", () => {
  goToPage(currentPage + 1);
});

function openLetter() {
  opened = true;
  opening = true;
  flatT = 0;
  pan = { x: 0, y: 0 };
  flatStartView = {
    radius: VIEW.radius,
    theta: VIEW.theta,
    phi: VIEW.phi,
    target: VIEW.target.clone(),
  };
  hint.textContent = "drag to move";
  hint.classList.remove("hidden");
  setMusicToggleVisible(true);
  startBirthdayMusic(true);
  setTimeout(() => burstFlowers(100), 450);
  setTimeout(() => burstFlowers(50), 750);
}

renderer.domElement.addEventListener("pointerdown", onPointerDown, { passive: false });
renderer.domElement.addEventListener("pointermove", onPointerMove, { passive: false });
renderer.domElement.addEventListener("pointerup", onPointerUp);
renderer.domElement.addEventListener("pointercancel", onPointerUp);

// ── loop ─────────────────────────────────────────────────────
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();

  if (opening && openT < 1) {
    openT = Math.min(1, openT + dt * 0.75);
    const e = easeOut(openT);
    const t = SLIGHT_OPEN + (1 - SLIGHT_OPEN) * e;
    coverHinge.rotation.y = -FULL_OPEN * t;
    if (!pageAnim) {
      setPagesOpacity(Math.max(0, (t - 0.35) / 0.65));
    }
    if (openT >= 1) {
      opening = false;
      updateNav();
    }
  }

  if (closing) {
    closeT = Math.min(1, closeT + dt * 0.65);
    const e = easeOut(closeT);
    openT = 1 - e;
    flatT = 1 - e;
    const t = SLIGHT_OPEN + (1 - SLIGHT_OPEN) * openT;
    coverHinge.rotation.y = -FULL_OPEN * t;
    setPagesOpacity(openT > 0.35 ? (openT - 0.35) / 0.65 : 0);
    updateCamera();
    if (closeT >= 1) {
      closing = false;
      opened = false;
      openT = 0;
      flatT = 0;
      stopBirthdayMusic();
      resetPages();
      coverHinge.rotation.y = -FULL_OPEN * SLIGHT_OPEN;
      pan = { x: 0, y: 0 };
      card.position.x = 0;
      updateCamera();
      updateNav();
    }
  }

  if (pageAnim) {
    pageAnim.t = Math.min(1, pageAnim.t + dt * 0.75);
    const e = easeOut(pageAnim.t);
    const { flipIndex, startAngle, endAngle } = pageAnim;
    pageHinges[flipIndex].rotation.y =
      startAngle + (endAngle - startAngle) * e;

    if (pageAnim.t >= 1) {
      finishPageFlip();
    }
  }

  updateLeftPanelCake(dt);

  if (opened && !closing && flatT < 1) {
    flatT = Math.min(1, flatT + dt * 0.55);
    updateCamera();
  }

  if (opened && !closing && flatT >= 1) {
    renderer.domElement.classList.add("pan-ready");
  } else {
    renderer.domElement.classList.remove("pan-ready");
  }

  for (let i = flowers.length - 1; i >= 0; i--) {
    const f = flowers[i];
    f.mesh.position.x += f.vx;
    f.mesh.position.y += f.vy;
    f.mesh.position.z += f.vz;
    f.vy -= 0.00035;
    f.rot += f.rs;
    f.mesh.rotation.z = f.rot;
    f.life -= 0.001;
    f.mesh.children.forEach((c) => {
      if (c.material) c.material.opacity = f.life;
    });
    f.mesh.lookAt(camera.position);
    if (f.life <= 0) {
      scene.remove(f.mesh);
      f.mesh.traverse((c) => {
        c.geometry?.dispose();
        c.material?.dispose();
      });
      flowers.splice(i, 1);
    }
  }

  renderer.render(scene, camera);
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  refreshFrontCoverTexture();
  updateCamera();
});

animate();
