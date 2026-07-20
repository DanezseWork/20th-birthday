import * as THREE from "three";

const CARD_W = 2.5;
const CARD_H = 3.4;
const THICK = 0.014;
const FULL_OPEN = Math.PI * 0.92;
const SLIGHT_OPEN = 0.03;
const FRONT_TEXT_W = CARD_W * 0.78;
const FRONT_TEXT_H = CARD_H * 0.36;
const PAGE_W = CARD_W;
const PAGE_H = CARD_H;
const PAGE_FLIP_ANGLE = FULL_OPEN;
const PAGE_BASE_Z = THICK / 2 + 0.002;
const PAGE_STACK_STEP = 0.016;

// Edit page content here — each page is an array of text lines.
const PAGES = [
  [
    { text: "Happy Birthday,", color: "#8c7882", font: "400 46px Georgia, serif", y: 270 },
    { text: "Trixie", color: "#c882a0", font: "italic 52px Georgia, serif", y: 330 },
    { text: "Wishing you a day filled with joy,", color: "#a08f99", font: "400 24px Georgia, serif", y: 410 },
    { text: "love, and beautiful moments.", color: "#a08f99", font: "400 24px Georgia, serif", y: 445 },
  ],
  [
    { text: "You bring so much light", color: "#8c7882", font: "400 32px Georgia, serif", y: 280 },
    { text: "into every room you enter.", color: "#8c7882", font: "400 32px Georgia, serif", y: 325 },
    { text: "Thank you for being", color: "#a08f99", font: "italic 28px Georgia, serif", y: 400 },
    { text: "exactly who you are.", color: "#a08f99", font: "italic 28px Georgia, serif", y: 440 },
  ],
  [
    { text: "Here's to another year", color: "#8c7882", font: "400 32px Georgia, serif", y: 290 },
    { text: "of adventures, laughter,", color: "#8c7882", font: "400 32px Georgia, serif", y: 335 },
    { text: "and dreams coming true.", color: "#c882a0", font: "italic 34px Georgia, serif", y: 400 },
    { text: "With love always ♥", color: "#a08f99", font: "400 26px Georgia, serif", y: 470 },
  ],
];

const PASTEL_PINKS = [
  0xffb7c5, 0xffc8dd, 0xffafcc, 0xf8bbd0, 0xf4acb7,
  0xe8a0bf, 0xffd6e0, 0xfadadd, 0xf5c6d6, 0xffb3c6,
];
const PASTEL_OTHERS = [
  0xe2cfea, 0xc9b1ff, 0xbde0fe, 0xffdab9, 0xd4f1e8,
];

const wrap = document.getElementById("canvas-wrap");
const hint = document.getElementById("hint");
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
  radius: 8,                        // zoom out/in (higher = further)
  theta: 0,                        // rotate left/right (radians)
  phi: 2.3,                          // tilt up/down (radians)
  target: new THREE.Vector3(0, 0, 0), // where the camera looks
};

const FLAT_RADIUS = 7;
const PAN_DAMPING = .55;

const panPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const panHit = new THREE.Vector3();

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

function updateCamera() {
  if (opened) {
    const flatPos = new THREE.Vector3(pan.x, pan.y, FLAT_RADIUS);
    const flatTarget = new THREE.Vector3(pan.x, pan.y, 0);

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
}

updateCamera();

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

  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, THICK)),
    new THREE.LineBasicMaterial({ color: 0xd4ced4, transparent: true, opacity: 0.6 })
  );
  group.add(edges);

  return group;
}

function finishTextTexture(tex) {
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}

function makeFrontCoverTexture() {
  const texW = 2048;
  const texH = Math.round(texW * (FRONT_TEXT_H / FRONT_TEXT_W));
  const c = document.createElement("canvas");
  c.width = texW;
  c.height = texH;
  const ctx = c.getContext("2d");
  ctx.clearRect(0, 0, texW, texH);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const cx = texW / 2;
  const cy = texH / 2;

  ctx.fillStyle = "#7a6b72";
  ctx.font = '400 118px "Cormorant Garamond", Georgia, serif';
  ctx.letterSpacing = "0.08em";
  ctx.fillText("Happy Birthday,", cx, cy - 72);

  ctx.fillStyle = "#b87a96";
  ctx.font = 'italic 500 168px "Cormorant Garamond", Georgia, serif';
  ctx.letterSpacing = "0.04em";
  ctx.fillText("Trixie", cx, cy + 62);

  return finishTextTexture(new THREE.CanvasTexture(c));
}

function makePageTexture(pageIndex) {
  const texW = 512;
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

  for (const line of PAGES[pageIndex]) {
    ctx.fillStyle = line.color;
    ctx.font = line.font;
    ctx.fillText(line.text, texW / 2, line.y * scaleY);
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
  pageGroup.visible = opacity > 0.01;
  syncPageVisibility();
}

function syncPageVisibility() {
  for (let i = 0; i < PAGES.length; i++) {
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
}

// ── card — pivot at centre, matches sketch ───────────────────
const card = new THREE.Group();
scene.add(card);

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

for (let i = 0; i < PAGES.length; i++) {
  const hinge = new THREE.Group();
  hinge.position.set(-PAGE_W / 2, 0, 0);
  pageGroup.add(hinge);

  const leaf = new THREE.Group();
  leaf.position.set(PAGE_W / 2, 0, 0);
  hinge.add(leaf);

  const entity = makePageEntity(pageTextures[i]);
  leaf.add(entity.group);
  pageHinges.push(hinge);
  pageEntities.push(entity);
}

function syncPageStack() {
  for (let i = 0; i < PAGES.length; i++) {
    const hinge = pageHinges[i];

    if (!pageAnim || i !== pageAnim.flipIndex) {
      hinge.rotation.y = i < currentPage ? -PAGE_FLIP_ANGLE : 0;
    }

    if (pageAnim && i === pageAnim.flipIndex) {
      hinge.position.z = (PAGES.length - 1) * PAGE_STACK_STEP;
    } else if (i >= currentPage) {
      hinge.position.z = (PAGES.length - 1 - i) * PAGE_STACK_STEP;
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
  navNextWrap.classList.toggle("hidden", !show || currentPage >= PAGES.length - 1);
  navPrevHint.textContent = currentPage > 0 ? "tap for back" : "tap to close";
  navNextHint.textContent = "tap for next";
  navPrev.setAttribute("aria-label", currentPage > 0 ? "Previous page" : "Close letter");
}

function goToPage(index) {
  if (index < 0 || index >= PAGES.length || index === currentPage || pageAnim || closing) return;

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
  ]);
  frontCoverMat.map = makeFrontCoverTexture();
  frontCoverMat.needsUpdate = true;
}

loadFrontCoverText();

// crease on the left fold
const crease = new THREE.Mesh(
  new THREE.BoxGeometry(0.008, CARD_H, THICK * 0.6),
  new THREE.MeshBasicMaterial({ color: 0xd8d2d8 })
);
crease.position.set(-CARD_W / 2 + 0.004, 0, 0);
coverGroup.add(crease);

// start slightly open
coverHinge.rotation.y = -FULL_OPEN * SLIGHT_OPEN;

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
let panStartX = 0;
let panStartY = 0;
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
    panStartX = pan.x;
    panStartY = pan.y;
    grabHitX = hit.x;
    grabHitY = hit.y;
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

    pan.x = panStartX - (hit.x - grabHitX) * PAN_DAMPING;
    pan.y = panStartY - (hit.y - grabHitY) * PAN_DAMPING;
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
  setTimeout(() => burstFlowers(100), 450);
  setTimeout(() => burstFlowers(50), 750);
}

renderer.domElement.addEventListener("pointerdown", onPointerDown);
renderer.domElement.addEventListener("pointermove", onPointerMove);
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
      resetPages();
      coverHinge.rotation.y = -FULL_OPEN * SLIGHT_OPEN;
      pan = { x: 0, y: 0 };
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
});

animate();
