import * as THREE from 'three';

// Furniture definitions - using primitive shapes (extendable to OBJ/GLB loading)
const FURNITURE_DEFS = {
  'sofa': {
    name: '소파',
    width: 200, height: 80, depth: 80,
    color: 0x6B8E9B,
    build: (w, h, d) => buildSofa(w, h, d),
  },
  'table': {
    name: '테이블',
    width: 120, height: 45, depth: 60,
    color: 0x8B6914,
    build: (w, h, d) => buildTable(w, h, d),
  },
  'tv-stand': {
    name: 'TV 스탠드',
    width: 150, height: 50, depth: 40,
    color: 0x2C2C2C,
    build: (w, h, d) => buildBox(w, h, d, 0x2C2C2C),
  },
  'shelf': {
    name: '선반',
    width: 80, height: 180, depth: 30,
    color: 0x8B7355,
    build: (w, h, d) => buildShelf(w, h, d),
  },
  'bed': {
    name: '침대',
    width: 200, height: 50, depth: 150,
    color: 0xE8D5B7,
    build: (w, h, d) => buildBed(w, h, d),
  },
  'desk': {
    name: '책상',
    width: 120, height: 75, depth: 60,
    color: 0x9B8B6B,
    build: (w, h, d) => buildTable(w, h, d),
  },
  'chair': {
    name: '의자',
    width: 50, height: 85, depth: 50,
    color: 0x4A6B8A,
    build: (w, h, d) => buildChair(w, h, d),
  },
  'wardrobe': {
    name: '옷장',
    width: 120, height: 200, depth: 60,
    color: 0x6B5B4B,
    build: (w, h, d) => buildBox(w, h, d, 0x6B5B4B),
  },
  'lamp': {
    name: '스탠드 조명',
    width: 30, height: 150, depth: 30,
    color: 0xFFD700,
    build: (w, h, d) => buildLamp(w, h, d),
  },
  'plant': {
    name: '화분',
    width: 40, height: 100, depth: 40,
    color: 0x228B22,
    build: (w, h, d) => buildPlant(w, h, d),
  },
  'rug': {
    name: '러그',
    width: 200, height: 2, depth: 150,
    color: 0x8B4513,
    build: (w, h, d) => buildBox(w, h, d, 0x8B4513),
  },
};

function buildBox(w, h, d, color) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mat = new THREE.MeshPhongMaterial({ color });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function buildSofa(w, h, d) {
  const group = new THREE.Group();
  // Seat
  const seat = buildBox(w, h * 0.4, d, 0x6B8E9B);
  seat.position.y = h * 0.2;
  group.add(seat);
  // Back
  const back = buildBox(w, h * 0.6, d * 0.2, 0x5A7D8A);
  back.position.set(0, h * 0.5, -d * 0.4);
  group.add(back);
  // Arms
  const arm1 = buildBox(w * 0.05, h * 0.5, d * 0.8, 0x5A7D8A);
  arm1.position.set(-w * 0.475, h * 0.35, -d * 0.05);
  group.add(arm1);
  const arm2 = arm1.clone();
  arm2.position.x = w * 0.475;
  group.add(arm2);
  return group;
}

function buildTable(w, h, d) {
  const group = new THREE.Group();
  // Top
  const top = buildBox(w, h * 0.08, d, 0x8B6914);
  top.position.y = h * 0.96;
  group.add(top);
  // Legs
  const legGeo = new THREE.CylinderGeometry(2, 2, h * 0.92, 8);
  const legMat = new THREE.MeshPhongMaterial({ color: 0x6B5010 });
  const positions = [
    [-w * 0.42, h * 0.46, -d * 0.38],
    [w * 0.42, h * 0.46, -d * 0.38],
    [-w * 0.42, h * 0.46, d * 0.38],
    [w * 0.42, h * 0.46, d * 0.38],
  ];
  positions.forEach(([x, y, z]) => {
    const leg = new THREE.Mesh(legGeo, legMat);
    leg.position.set(x, y, z);
    leg.castShadow = true;
    group.add(leg);
  });
  return group;
}

function buildShelf(w, h, d) {
  const group = new THREE.Group();
  // Frame
  const frame = buildBox(w, h, d * 0.1, 0x8B7355);
  frame.position.set(0, h / 2, -d * 0.45);
  group.add(frame);
  // Shelves
  const shelfCount = 5;
  for (let i = 0; i < shelfCount; i++) {
    const shelf = buildBox(w * 0.95, h * 0.02, d, 0x9B8365);
    shelf.position.y = (h / shelfCount) * (i + 0.5);
    group.add(shelf);
  }
  // Sides
  const side1 = buildBox(w * 0.04, h, d, 0x7B6345);
  side1.position.set(-w * 0.48, h / 2, 0);
  group.add(side1);
  const side2 = side1.clone();
  side2.position.x = w * 0.48;
  group.add(side2);
  return group;
}

function buildBed(w, h, d) {
  const group = new THREE.Group();
  // Frame
  const frame = buildBox(w, h * 0.4, d, 0xA08060);
  frame.position.y = h * 0.2;
  group.add(frame);
  // Mattress
  const mattress = buildBox(w * 0.95, h * 0.3, d * 0.95, 0xE8D5B7);
  mattress.position.y = h * 0.55;
  group.add(mattress);
  // Pillow
  const pillow = buildBox(w * 0.35, h * 0.2, d * 0.15, 0xFFFFF0);
  pillow.position.set(0, h * 0.8, -d * 0.35);
  group.add(pillow);
  // Headboard
  const headboard = buildBox(w, h * 0.8, d * 0.05, 0x7B5B3B);
  headboard.position.set(0, h * 0.6, -d * 0.475);
  group.add(headboard);
  return group;
}

function buildChair(w, h, d) {
  const group = new THREE.Group();
  // Seat
  const seat = buildBox(w, h * 0.06, d, 0x4A6B8A);
  seat.position.y = h * 0.47;
  group.add(seat);
  // Back
  const back = buildBox(w * 0.9, h * 0.45, d * 0.08, 0x3A5B7A);
  back.position.set(0, h * 0.73, -d * 0.46);
  group.add(back);
  // Legs
  const legGeo = new THREE.CylinderGeometry(1.5, 1.5, h * 0.44, 8);
  const legMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
    const leg = new THREE.Mesh(legGeo, legMat);
    leg.position.set(sx * w * 0.4, h * 0.22, sz * d * 0.4);
    leg.castShadow = true;
    group.add(leg);
  });
  return group;
}

function buildLamp(w, h, d) {
  const group = new THREE.Group();
  // Base
  const base = buildBox(w * 0.8, h * 0.03, d * 0.8, 0x333333);
  base.position.y = h * 0.015;
  group.add(base);
  // Pole
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(1.5, 1.5, h * 0.7, 8),
    new THREE.MeshPhongMaterial({ color: 0x666666 })
  );
  pole.position.y = h * 0.38;
  group.add(pole);
  // Shade
  const shade = new THREE.Mesh(
    new THREE.ConeGeometry(w * 0.5, h * 0.2, 16, 1, true),
    new THREE.MeshPhongMaterial({ color: 0xFFD700, side: THREE.DoubleSide })
  );
  shade.position.y = h * 0.8;
  group.add(shade);
  // Light bulb (glow)
  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(3, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xFFFACD })
  );
  bulb.position.y = h * 0.72;
  group.add(bulb);
  return group;
}

function buildPlant(w, h, d) {
  const group = new THREE.Group();
  // Pot
  const pot = new THREE.Mesh(
    new THREE.CylinderGeometry(w * 0.35, w * 0.25, h * 0.3, 12),
    new THREE.MeshPhongMaterial({ color: 0x8B4513 })
  );
  pot.position.y = h * 0.15;
  group.add(pot);
  // Plant
  const plant = new THREE.Mesh(
    new THREE.SphereGeometry(w * 0.5, 12, 8),
    new THREE.MeshPhongMaterial({ color: 0x228B22 })
  );
  plant.position.y = h * 0.6;
  group.add(plant);
  return group;
}

/**
 * Create a furniture item and return a placeable group
 */
export function createFurniture(type, floor = 1) {
  const def = FURNITURE_DEFS[type];
  if (!def) return null;

  const group = new THREE.Group();
  const model = def.build(def.width, def.height, def.depth);
  group.add(model);

  // Set metadata
  group.userData.isFurniture = true;
  group.userData.isMovable = true;
  group.userData.type = type;
  group.userData.name = def.name;
  group.userData.floor = floor;
  group.userData.width = def.width;
  group.userData.height = def.height;
  group.userData.depth = def.depth;

  // Position at floor level
  const yBase = floor === 1 ? def.height / 2 : 250 + def.height / 2;
  group.position.set(190, yBase, floor === 1 ? 350 : 350);

  group.castShadow = true;

  return group;
}

/**
 * Load a model from URL (for future AI model generation)
 * Supports GLB/GLTF and OBJ formats
 */
export async function loadModelFromURL(url, format = 'glb') {
  // Placeholder for future AI model loading
  // Will use GLTFLoader or OBJLoader depending on format
  console.log(`Model loading from URL not yet implemented: ${url} (${format})`);
  return null;
}

export { FURNITURE_DEFS };
