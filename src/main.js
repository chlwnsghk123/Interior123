import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { buildFloor1, buildFloor2, getColorTargets } from './room.js';
import { createFurniture, FURNITURE_DEFS } from './furniture.js';
import { FurnitureControls } from './controls.js';

// ============ Scene Setup ============
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a2e);
scene.fog = new THREE.Fog(0x1a1a2e, 1500, 3000);

const camera = new THREE.PerspectiveCamera(
  60,
  container.clientWidth / container.clientHeight,
  1,
  5000
);
camera.position.set(500, 500, 700);
camera.lookAt(190, 125, 255);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

// ============ Lighting ============
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(300, 600, 400);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
dirLight.shadow.camera.left = -500;
dirLight.shadow.camera.right = 500;
dirLight.shadow.camera.top = 500;
dirLight.shadow.camera.bottom = -500;
scene.add(dirLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
fillLight.position.set(-200, 400, -200);
scene.add(fillLight);

// Point lights inside rooms
const light1F = new THREE.PointLight(0xFFF5E6, 0.5, 600);
light1F.position.set(190, 200, 340);
scene.add(light1F);

const light2F = new THREE.PointLight(0xFFF5E6, 0.5, 600);
light2F.position.set(190, 450, 340);
scene.add(light2F);

// ============ Controls ============
const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.target.set(190, 125, 255);
orbitControls.enableDamping = true;
orbitControls.dampingFactor = 0.08;
orbitControls.minDistance = 100;
orbitControls.maxDistance = 2000;
orbitControls.maxPolarAngle = Math.PI * 0.85;
orbitControls.update();

// ============ Build Room ============
const floor1Group = buildFloor1(scene);
scene.add(floor1Group);

const floor2Group = buildFloor2(scene);
scene.add(floor2Group);

// ============ Furniture Controls ============
const furnitureControls = new FurnitureControls(camera, renderer, scene, orbitControls);

// ============ Floor View State ============
let currentFloor = 'all';

function setFloorView(floor) {
  currentFloor = floor;
  floor1Group.visible = floor === '1' || floor === 'all';
  floor2Group.visible = floor === '2' || floor === 'all';

  // Update camera for floor view
  if (floor === '1') {
    camera.position.set(500, 300, 700);
    orbitControls.target.set(190, 80, 255);
  } else if (floor === '2') {
    camera.position.set(500, 550, 700);
    orbitControls.target.set(190, 330, 240);
  } else {
    camera.position.set(500, 500, 700);
    orbitControls.target.set(190, 200, 255);
  }
  orbitControls.update();
}

// Floor tab buttons
document.querySelectorAll('.floor-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.floor-tab').forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');
    setFloorView(tab.dataset.floor);
  });
});

// ============ Catalog - Add Furniture ============
document.querySelectorAll('.catalog-item:not(.ai-slot)').forEach((item) => {
  item.addEventListener('click', () => {
    const type = item.dataset.type;
    if (!FURNITURE_DEFS[type]) return;

    const floor = currentFloor === '2' ? 2 : 1;
    const furniture = createFurniture(type, floor);
    if (!furniture) return;

    // Add to appropriate floor group
    if (floor === 2) {
      floor2Group.add(furniture);
    } else {
      floor1Group.add(furniture);
    }

    // Auto-select the new furniture
    furnitureControls.select(furniture);

    // Brief visual feedback
    item.style.borderColor = '#00ff88';
    setTimeout(() => { item.style.borderColor = 'transparent'; }, 300);
  });
});

// ============ Color Pickers ============
const colorTargets = { floor1: null, floor2: null, walls: [], ceilings: [] };

function refreshColorTargets() {
  const t = getColorTargets(scene);
  Object.assign(colorTargets, t);
}

// Defer target refresh
setTimeout(refreshColorTargets, 100);

document.getElementById('color-floor1').addEventListener('input', (e) => {
  refreshColorTargets();
  if (colorTargets.floor1) {
    colorTargets.floor1.material.color.set(e.target.value);
  }
});

document.getElementById('color-floor2').addEventListener('input', (e) => {
  refreshColorTargets();
  if (colorTargets.floor2) {
    colorTargets.floor2.material.color.set(e.target.value);
  }
});

document.getElementById('color-wall').addEventListener('input', (e) => {
  refreshColorTargets();
  colorTargets.walls.forEach((w) => w.material.color.set(e.target.value));
});

document.getElementById('color-ceiling').addEventListener('input', (e) => {
  refreshColorTargets();
  colorTargets.ceilings.forEach((c) => c.material.color.set(e.target.value));
});

// ============ Toolbar ============
document.getElementById('btn-view-reset').addEventListener('click', () => {
  setFloorView(currentFloor);
});

let gridVisible = true;
document.getElementById('btn-grid-toggle').addEventListener('click', () => {
  gridVisible = !gridVisible;
  scene.traverse((obj) => {
    if (obj.userData.isGrid) obj.visible = gridVisible;
  });
  document.getElementById('btn-grid-toggle').classList.toggle('active', !gridVisible);
});

// ============ Resize ============
window.addEventListener('resize', () => {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
});

// ============ Animation Loop ============
function animate() {
  requestAnimationFrame(animate);
  orbitControls.update();
  renderer.render(scene, camera);
}

animate();

console.log('3D 인테리어 앱 로드 완료!');
