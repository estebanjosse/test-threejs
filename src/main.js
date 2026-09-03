import * as THREE from 'three';
import './style.css';

const canvas = document.querySelector('#game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x080b14);
scene.fog = new THREE.FogExp2(0x080b14, 0.024);

const camera = new THREE.PerspectiveCamera(43, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(15, 19, 18);
camera.lookAt(0, 0, 0);

const clock = new THREE.Clock();
const world = new THREE.Group();
scene.add(world);

const palette = {
  stone: 0x222b3d,
  stoneDark: 0x121827,
  edge: 0x4b5a73,
  cyan: 0x58f5eb,
  violet: 0x8f77ff,
  danger: 0xff4668,
  gold: 0xf0c36c,
};

const stoneMaterial = new THREE.MeshStandardMaterial({ color: palette.stone, roughness: 0.82, metalness: 0.12 });
const darkStoneMaterial = new THREE.MeshStandardMaterial({ color: palette.stoneDark, roughness: 0.95 });
const edgeMaterial = new THREE.MeshStandardMaterial({ color: palette.edge, roughness: 0.75 });

function mesh(geometry, material, x, y, z, shadows = true) {
  const object = new THREE.Mesh(geometry, material);
  object.position.set(x, y, z);
  object.castShadow = shadows;
  object.receiveShadow = shadows;
  world.add(object);
  return object;
}

// Lighting
scene.add(new THREE.HemisphereLight(0x8ba8ce, 0x111321, 1.2));
const moon = new THREE.DirectionalLight(0x9dbdff, 2.8);
moon.position.set(-8, 18, 10);
moon.castShadow = true;
moon.shadow.mapSize.set(2048, 2048);
moon.shadow.camera.left = moon.shadow.camera.bottom = -18;
moon.shadow.camera.right = moon.shadow.camera.top = 18;
moon.shadow.bias = -0.0008;
scene.add(moon);

// Floating dust
const dustGeometry = new THREE.BufferGeometry();
const dustPositions = new Float32Array(420 * 3);
for (let i = 0; i < dustPositions.length; i += 3) {
  dustPositions[i] = (Math.random() - 0.5) * 34;
  dustPositions[i + 1] = Math.random() * 11;
  dustPositions[i + 2] = (Math.random() - 0.5) * 34;
}
dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
const dust = new THREE.Points(dustGeometry, new THREE.PointsMaterial({ color: 0x98cbd4, size: 0.035, transparent: true, opacity: 0.5 }));
scene.add(dust);

// Dungeon floor
mesh(new THREE.BoxGeometry(25, 0.8, 25), darkStoneMaterial, 0, -0.55, 0);
const tileGeo = new THREE.BoxGeometry(1.82, 0.12, 1.82);
for (let x = -6; x <= 6; x++) {
  for (let z = -6; z <= 6; z++) {
    const tile = mesh(tileGeo, (x + z) % 3 === 0 ? edgeMaterial : stoneMaterial, x * 1.85, -0.05 + Math.random() * 0.025, z * 1.85);
    tile.rotation.y = (Math.random() - 0.5) * 0.025;
  }
}

const obstacles = [];
function addWall(x, z, width, depth, height = 1.8) {
  const wall = mesh(new THREE.BoxGeometry(width, height, depth), stoneMaterial, x, height / 2, z);
  const cap = mesh(new THREE.BoxGeometry(width + 0.12, 0.13, depth + 0.12), edgeMaterial, x, height + 0.03, z);
  obstacles.push({ x, z, halfX: width / 2 + 0.36, halfZ: depth / 2 + 0.36 });
  return { wall, cap };
}

// Outer boundaries and maze fragments
addWall(0, -12.1, 25, 0.8, 2.6);
addWall(0, 12.1, 25, 0.8, 2.6);
addWall(-12.1, 0, 0.8, 25, 2.6);
addWall(12.1, 0, 0.8, 25, 2.6);
addWall(-5.5, -4, 5.4, 0.75);
addWall(4.8, -5.1, 0.75, 5.2);
addWall(-4.2, 4.5, 0.75, 5.5);
addWall(4.5, 4, 5.5, 0.75);
addWall(0, 0.2, 3.3, 0.75, 1.25);

// Ruined pillars
for (const [x, z, h] of [[-9,-9,3.2],[9,-9,2.3],[-9,9,2.6],[9,9,3.5],[-1,7,1.7],[7,0,1.4]]) {
  mesh(new THREE.CylinderGeometry(0.55, 0.7, h, 6), stoneMaterial, x, h / 2, z);
  mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.18, 6), edgeMaterial, x, 0.09, z);
  obstacles.push({ x, z, halfX: 0.9, halfZ: 0.9 });
}

// Portal
const portal = new THREE.Group();
portal.position.set(0, 0, -10.3);
world.add(portal);
const portalStone = new THREE.MeshStandardMaterial({ color: 0x30394e, roughness: 0.7 });
for (const [x, y, sx, sy] of [[-1.5,1.5,.65,3],[1.5,1.5,.65,3],[0,3,3.6,.65]]) {
  const part = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, 0.72), portalStone);
  part.position.set(x, y, 0);
  part.castShadow = true;
  portal.add(part);
}
const portalSurface = new THREE.Mesh(
  new THREE.PlaneGeometry(2.35, 2.6, 24, 24),
  new THREE.MeshBasicMaterial({ color: palette.cyan, transparent: true, opacity: 0.06, side: THREE.DoubleSide })
);
portalSurface.position.y = 1.35;
portalSurface.visible = false;
portal.add(portalSurface);
const portalLight = new THREE.PointLight(palette.cyan, 0, 8, 2);
portalLight.position.y = 1.5;
portal.add(portalLight);

// Crystal factory
const crystalMaterial = new THREE.MeshStandardMaterial({ color: palette.cyan, emissive: palette.cyan, emissiveIntensity: 2.5, roughness: 0.18, metalness: 0.25 });
const crystalPositions = [[-9,-7],[8,-8],[-8,7],[8,7],[0,3]];
const crystals = crystalPositions.map(([x, z], index) => {
  const group = new THREE.Group();
  group.position.set(x, 0.9, z);
  const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.48, 0), crystalMaterial.clone());
  gem.scale.y = 1.5;
  gem.castShadow = true;
  group.add(gem);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.025, 8, 40), new THREE.MeshBasicMaterial({ color: palette.cyan, transparent: true, opacity: 0.5 }));
  ring.rotation.x = Math.PI / 2;
  group.add(ring);
  const light = new THREE.PointLight(palette.cyan, 2.4, 4.5, 2);
  group.add(light);
  world.add(group);
  return { group, gem, ring, baseY: 0.9, index, collected: false };
});

// Player
const player = new THREE.Group();
const playerBodyMaterial = new THREE.MeshStandardMaterial({ color: 0xe5ebf4, roughness: 0.52, metalness: 0.2 });
const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.38, 0.65, 5, 10), playerBodyMaterial);
body.position.y = 0.65;
body.castShadow = true;
player.add(body);
const hood = new THREE.Mesh(new THREE.ConeGeometry(0.52, 0.8, 8), new THREE.MeshStandardMaterial({ color: 0x46506a, roughness: 0.8 }));
hood.position.y = 1.15;
hood.rotation.y = Math.PI / 8;
hood.castShadow = true;
player.add(hood);
const playerLight = new THREE.PointLight(0x94baff, 1.6, 4, 2);
playerLight.position.y = 1;
player.add(playerLight);
player.position.set(0, 0, 9.5);
world.add(player);

// Sentinels patrol fixed lines
const sentinels = [];
function addSentinel(x, z, axis, distance, speed, offset) {
  const group = new THREE.Group();
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.48, 1), new THREE.MeshStandardMaterial({ color: palette.danger, emissive: palette.danger, emissiveIntensity: 1.8, roughness: 0.25 }));
  group.add(core);
  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.055, 8, 30), new THREE.MeshBasicMaterial({ color: palette.danger }));
  halo.rotation.x = Math.PI / 2;
  group.add(halo);
  group.add(new THREE.PointLight(palette.danger, 2, 4, 2));
  group.position.set(x, 0.85, z);
  world.add(group);
  sentinels.push({ group, core, halo, originX: x, originZ: z, axis, distance, speed, offset });
}
addSentinel(-7, -1, 'z', 3.1, 1.05, 0);
addSentinel(6, 1, 'x', 3.4, 0.8, 1.8);
addSentinel(0, -7.5, 'x', 3.2, 1.2, 3.4);

const keys = new Set();
let playing = false;
let ended = false;
let collected = 0;
let energy = 3;
let elapsed = 0;
let hitCooldown = 0;
let messageTimeout;
let muted = false;
let audioContext;

const ui = {
  intro: document.querySelector('#intro'),
  result: document.querySelector('#result'),
  count: document.querySelector('#crystalCount'),
  timer: document.querySelector('#timer'),
  energy: document.querySelector('#energy'),
  progress: document.querySelector('#progressBar'),
  objective: document.querySelector('#objective'),
  message: document.querySelector('#message'),
  finalTime: document.querySelector('#finalTime'),
  resultTitle: document.querySelector('#resultTitle'),
  resultEyebrow: document.querySelector('#resultEyebrow'),
};

function formatTime(seconds) {
  const min = Math.floor(seconds / 60).toString().padStart(2, '0');
  const sec = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${min}:${sec}`;
}

function showMessage(text) {
  ui.message.textContent = text;
  ui.message.classList.add('visible');
  clearTimeout(messageTimeout);
  messageTimeout = setTimeout(() => ui.message.classList.remove('visible'), 1500);
}

function playTone(frequency, duration = 0.12, type = 'sine', volume = 0.05) {
  if (muted) return;
  audioContext ??= new AudioContext();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
  gain.gain.setValueAtTime(volume, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + duration);
}

function collides(position) {
  return obstacles.some((o) => Math.abs(position.x - o.x) < o.halfX && Math.abs(position.z - o.z) < o.halfZ);
}

function updatePlayer(delta) {
  const direction = new THREE.Vector3();
  if (keys.has('ArrowUp') || keys.has('KeyW') || keys.has('KeyZ')) direction.z -= 1;
  if (keys.has('ArrowDown') || keys.has('KeyS')) direction.z += 1;
  if (keys.has('ArrowLeft') || keys.has('KeyA') || keys.has('KeyQ')) direction.x -= 1;
  if (keys.has('ArrowRight') || keys.has('KeyD')) direction.x += 1;
  if (!direction.lengthSq()) return;

  direction.normalize();
  const speed = 5.1 * delta;
  const old = player.position.clone();
  player.position.x += direction.x * speed;
  if (collides(player.position)) player.position.x = old.x;
  player.position.z += direction.z * speed;
  if (collides(player.position)) player.position.z = old.z;
  player.rotation.y = Math.atan2(direction.x, direction.z);
  body.position.y = 0.65 + Math.sin(elapsed * 12) * 0.045;
}

function collectCrystal(crystal) {
  crystal.collected = true;
  crystal.group.visible = false;
  collected += 1;
  ui.count.textContent = `${collected} / ${crystals.length}`;
  ui.progress.style.width = `${(collected / crystals.length) * 100}%`;
  showMessage(`CRISTAL ${collected} RÉCUPÉRÉ`);
  playTone(520 + collected * 90, 0.22, 'sine', 0.06);
  if (collected === crystals.length) {
    portalSurface.visible = true;
    portalLight.intensity = 4;
    ui.objective.textContent = 'Rejoignez le portail';
    showMessage('LE PORTAIL EST OUVERT');
    setTimeout(() => playTone(1040, 0.35, 'triangle', 0.045), 100);
  }
}

function damagePlayer() {
  if (hitCooldown > 0) return;
  hitCooldown = 1.7;
  energy -= 1;
  ui.energy.textContent = energy;
  document.body.classList.remove('hit');
  void document.body.offsetWidth;
  document.body.classList.add('hit');
  playTone(110, 0.3, 'sawtooth', 0.045);
  player.position.set(0, 0, 9.5);
  showMessage('LE GARDIEN VOUS REPOUSSE');
  if (energy <= 0) finish(false);
}

function finish(won) {
  playing = false;
  ended = true;
  keys.clear();
  ui.resultEyebrow.textContent = won ? 'SANCTUAIRE ÉVEILLÉ' : 'EXPÉDITION INTERROMPUE';
  ui.resultTitle.innerHTML = won ? 'Évasion<br /><em>réussie</em>' : 'Les gardiens<br /><em>ont gagné</em>';
  ui.finalTime.textContent = formatTime(elapsed);
  ui.result.hidden = false;
  playTone(won ? 784 : 90, 0.55, won ? 'triangle' : 'sawtooth', 0.05);
}

function resetGame() {
  collected = 0;
  energy = 3;
  elapsed = 0;
  hitCooldown = 0;
  ended = false;
  player.position.set(0, 0, 9.5);
  player.rotation.set(0, 0, 0);
  ui.count.textContent = `0 / ${crystals.length}`;
  ui.energy.textContent = '3';
  ui.timer.textContent = '00:00';
  ui.progress.style.width = '0%';
  ui.objective.textContent = 'Récupérez les cristaux';
  portalSurface.visible = false;
  portalLight.intensity = 0;
  crystals.forEach((crystal) => {
    crystal.collected = false;
    crystal.group.visible = true;
    crystal.group.scale.setScalar(1);
  });
  ui.result.hidden = true;
  playing = true;
  document.body.classList.add('playing');
}

document.querySelector('#startButton').addEventListener('click', () => {
  ui.intro.classList.add('leaving');
  setTimeout(() => { ui.intro.hidden = true; }, 650);
  resetGame();
});
document.querySelector('#restartButton').addEventListener('click', resetGame);
document.querySelector('.brand').addEventListener('click', (event) => { event.preventDefault(); if (playing || ended) resetGame(); });
document.querySelector('#soundButton').addEventListener('click', (event) => {
  muted = !muted;
  event.currentTarget.classList.toggle('muted', muted);
});

window.addEventListener('keydown', (event) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) event.preventDefault();
  keys.add(event.code);
});
window.addEventListener('keyup', (event) => keys.delete(event.code));
document.querySelectorAll('.mobile-controls button').forEach((button) => {
  const code = button.dataset.key;
  button.addEventListener('pointerdown', (event) => { event.preventDefault(); keys.add(code); button.setPointerCapture(event.pointerId); });
  button.addEventListener('pointerup', () => keys.delete(code));
  button.addEventListener('pointercancel', () => keys.delete(code));
});

function resize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}
window.addEventListener('resize', resize);

function animate() {
  const delta = Math.min(clock.getDelta(), 0.05);
  const time = clock.elapsedTime;
  dust.rotation.y = time * 0.012;

  crystals.forEach((crystal) => {
    if (crystal.collected || !crystal.group.visible) return;
    crystal.group.position.y = crystal.baseY + Math.sin(time * 2.2 + crystal.index) * 0.16;
    crystal.gem.rotation.y += delta * 1.4;
    crystal.ring.rotation.z -= delta * 0.65;
    if (playing && player.position.distanceTo(crystal.group.position) < 1.15) collectCrystal(crystal);
  });

  sentinels.forEach((sentinel) => {
    const motion = Math.sin(time * sentinel.speed + sentinel.offset) * sentinel.distance;
    sentinel.group.position[sentinel.axis] = (sentinel.axis === 'x' ? sentinel.originX : sentinel.originZ) + motion;
    sentinel.group.position.y = 0.85 + Math.sin(time * 3 + sentinel.offset) * 0.11;
    sentinel.core.rotation.x += delta * 0.8;
    sentinel.core.rotation.y += delta;
    sentinel.halo.rotation.z += delta * 1.2;
    if (playing && player.position.distanceTo(sentinel.group.position) < 1.15) damagePlayer();
  });

  if (portalSurface.visible) {
    portalSurface.material.opacity = 0.35 + Math.sin(time * 4) * 0.08;
    portalSurface.rotation.y = Math.sin(time * 0.7) * 0.07;
    portalLight.intensity = 3.8 + Math.sin(time * 3) * 0.8;
    if (playing && player.position.distanceTo(portal.position) < 1.5) finish(true);
  }

  if (playing) {
    elapsed += delta;
    hitCooldown = Math.max(0, hitCooldown - delta);
    ui.timer.textContent = formatTime(elapsed);
    updatePlayer(delta);
  }

  // Subtle camera tracking preserves the isometric composition.
  const targetCamera = new THREE.Vector3(15 + player.position.x * 0.12, 19, 18 + player.position.z * 0.12);
  camera.position.lerp(targetCamera, 1 - Math.pow(0.001, delta));
  camera.lookAt(player.position.x * 0.12, 0, player.position.z * 0.12);
  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);
