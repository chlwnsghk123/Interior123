import * as THREE from 'three';

// Scale: 1 unit = 1cm
const WALL_THICKNESS = 10;
const WALL_HEIGHT = 250;

// Side-by-side layout
export const FLOOR2_X_OFFSET = 380 + 100; // 1F width + gap

// Colors
const COLORS = {
  fixture: 0x6B7684,
  blockedArea: 0x4E5968,
  bookshelf: 0xA89F91,
  floor: 0xF7F3E9,
  wall: 0xE8E0D0,
  wallEdge: 0x333333,
  ceiling: 0xFFFFFF,
  door: 0x8B6914,
  stairStep: 0x5A6472,
  stairRail: 0x4A5462,
  partition: 0xCCC5B9,
};

function createBox(w, h, d, color, opacity = 1.0) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mat = new THREE.MeshPhongMaterial({
    color,
    transparent: opacity < 1,
    opacity,
    side: THREE.DoubleSide,
  });
  return new THREE.Mesh(geo, mat);
}

function createWall(x1, z1, x2, z2, height, yBase, color = COLORS.wall) {
  const dx = x2 - x1;
  const dz = z2 - z1;
  const length = Math.sqrt(dx * dx + dz * dz);
  const angle = Math.atan2(dz, dx);

  const wall = createBox(length, height, WALL_THICKNESS, color);
  wall.position.set(
    (x1 + x2) / 2,
    yBase + height / 2,
    (z1 + z2) / 2
  );
  wall.rotation.y = -angle;
  wall.userData.isWall = true;
  return wall;
}

function createFloor(w, d, y, color = COLORS.floor) {
  const geo = new THREE.PlaneGeometry(w, d);
  const mat = new THREE.MeshPhongMaterial({
    color,
    side: THREE.DoubleSide,
  });
  const floor = new THREE.Mesh(geo, mat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(w / 2, y, d / 2);
  floor.userData.isFloor = true;
  floor.receiveShadow = true;
  return floor;
}

function createCeiling(w, d, y) {
  const geo = new THREE.PlaneGeometry(w, d);
  const mat = new THREE.MeshPhongMaterial({
    color: COLORS.ceiling,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.3,
  });
  const ceiling = new THREE.Mesh(geo, mat);
  ceiling.rotation.x = -Math.PI / 2;
  ceiling.position.set(w / 2, y, d / 2);
  ceiling.userData.isCeiling = true;
  return ceiling;
}

function createGridHelper(w, d, y) {
  const size = Math.max(w, d);
  const divisions = size / 10; // 10cm grid
  const grid = new THREE.GridHelper(size, divisions, 0xCCCCCC, 0xEEEEEE);
  grid.position.set(w / 2, y + 0.1, d / 2);
  grid.userData.isGrid = true;
  return grid;
}

function createStairs(x, z, w, d, yBottom, yTop, color, descending = false) {
  const group = new THREE.Group();
  const stepCount = 12;
  const totalHeight = yTop - yBottom;
  const stepHeight = totalHeight / stepCount;
  const stepDepth = d / stepCount;

  for (let i = 0; i < stepCount; i++) {
    const stepY = descending
      ? yTop - stepHeight * (i + 0.5)   // descending: starts high, goes low
      : yBottom + stepHeight * (i + 0.5); // ascending: starts low, goes high
    const edgeY = descending
      ? yTop - stepHeight * i
      : yBottom + stepHeight * (i + 1);

    const step = createBox(w - 4, stepHeight, stepDepth - 1, color);
    step.position.set(
      x + w / 2,
      stepY,
      z + stepDepth * (i + 0.5)
    );
    step.castShadow = true;
    step.receiveShadow = true;
    group.add(step);

    // Step edge highlight
    const edge = createBox(w - 4, 1, stepDepth - 1, COLORS.stairStep);
    edge.position.set(
      x + w / 2,
      edgeY,
      z + stepDepth * (i + 0.5)
    );
    group.add(edge);
  }

  // Side rails
  const railHeight = yTop - yBottom + 40;
  const rail1 = createBox(2, railHeight, d, COLORS.stairRail, 0.3);
  rail1.position.set(x + 1, yBottom + railHeight / 2, z + d / 2);
  group.add(rail1);

  const rail2 = createBox(2, railHeight, d, COLORS.stairRail, 0.3);
  rail2.position.set(x + w - 1, yBottom + railHeight / 2, z + d / 2);
  group.add(rail2);

  group.userData.isFixture = true;
  return group;
}

function createFixtureLabel(text, x, y, z) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(0, 0, 256, 64);
  ctx.fillStyle = 'white';
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 128, 32);

  const texture = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: texture });
  const sprite = new THREE.Sprite(mat);
  sprite.position.set(x, y, z);
  sprite.scale.set(60, 15, 1);
  return sprite;
}

export function buildFloor1(scene) {
  const group = new THREE.Group();
  group.name = 'floor1';

  const W = 380, D = 510;

  // Floor
  const floor = createFloor(W, D, 0);
  floor.name = 'floor1-surface';
  group.add(floor);

  // Grid
  const grid = createGridHelper(W, D, 0);
  grid.name = 'floor1-grid';
  group.add(grid);

  // Ceiling (semi-transparent)
  const ceiling = createCeiling(W, D, WALL_HEIGHT);
  ceiling.name = 'floor1-ceiling';
  group.add(ceiling);

  // Outer walls
  // North wall (top, z=0)
  group.add(createWall(0, 0, W, 0, WALL_HEIGHT, 0));
  // East wall (right, x=380)
  group.add(createWall(W, 0, W, D, WALL_HEIGHT, 0));
  // South wall (bottom, z=510)
  group.add(createWall(W, D, 0, D, WALL_HEIGHT, 0));
  // West wall (left, x=0)
  group.add(createWall(0, D, 0, 0, WALL_HEIGHT, 0));

  // === Fixed Structures ===

  // 1. Bathroom (화장실) - 200x170 at (0,0), height 250
  const bathroom = createBox(200, WALL_HEIGHT, 170, COLORS.fixture, 0.7);
  bathroom.position.set(100, WALL_HEIGHT / 2, 85);
  bathroom.userData.isFixture = true;
  bathroom.userData.name = '화장실';
  group.add(bathroom);
  group.add(createFixtureLabel('화장실', 100, WALL_HEIGHT / 2 + 20, 85));

  // Bathroom inner walls (visible lines)
  group.add(createWall(200, 0, 200, 170, WALL_HEIGHT, 0, COLORS.wallEdge)); // east wall
  group.add(createWall(0, 170, 200, 170, WALL_HEIGHT, 0, COLORS.wallEdge)); // south wall

  // 2. Sink (싱크대) - 150x60 at (0,170), height 90
  const sink = createBox(150, 90, 60, COLORS.fixture, 0.8);
  sink.position.set(75, 45, 200);
  sink.userData.isFixture = true;
  sink.userData.name = '싱크대';
  group.add(sink);
  group.add(createFixtureLabel('싱크대', 75, 100, 200));

  // 3. Shoe rack (신발장) - 100x70 at (280,0), height 120
  const shoeRack = createBox(100, 120, 70, COLORS.fixture, 0.8);
  shoeRack.position.set(330, 60, 35);
  shoeRack.userData.isFixture = true;
  shoeRack.userData.name = '신발장';
  group.add(shoeRack);
  group.add(createFixtureLabel('신발장', 330, 130, 35));

  // 4. Stairs (계단) - 70x210 at (310,225), height 250
  const stairs = createStairs(310, 225, 70, 210, 0, WALL_HEIGHT, COLORS.fixture);
  stairs.userData.name = '계단';
  group.add(stairs);
  group.add(createFixtureLabel('계단', 345, WALL_HEIGHT / 2, 330));

  // 5. Back door (뒷문) - 100x6 at (280,504)
  const backDoor = createBox(100, 210, 6, COLORS.door, 0.6);
  backDoor.position.set(330, 105, 507);
  backDoor.userData.isFixture = true;
  backDoor.userData.name = '뒷문';
  group.add(backDoor);
  group.add(createFixtureLabel('뒷문', 330, 20, 507));

  // 6. Bookshelf (책장) - 30x100 at (0,410), height 180 - MOVABLE!
  const bookshelf = createBox(30, 180, 100, COLORS.bookshelf, 0.9);
  bookshelf.position.set(15, 90, 460);
  bookshelf.userData.isFurniture = true;
  bookshelf.userData.isMovable = true;
  bookshelf.userData.name = '책장';
  bookshelf.userData.floor = 1;
  bookshelf.castShadow = true;
  group.add(bookshelf);
  group.add(createFixtureLabel('책장 (이동가능)', 15, 190, 460));

  return group;
}

export function buildFloor2(scene) {
  const group = new THREE.Group();
  group.name = 'floor2';

  const W = 380, D = 480;
  const Y_BASE = 0; // same level as 1F (side-by-side layout)

  // Floor
  const floor = createFloor(W, D, Y_BASE);
  floor.name = 'floor2-surface';
  group.add(floor);

  // Grid
  const grid = createGridHelper(W, D, Y_BASE);
  grid.name = 'floor2-grid';
  group.add(grid);

  // Ceiling
  const ceiling = createCeiling(W, D, Y_BASE + WALL_HEIGHT);
  ceiling.name = 'floor2-ceiling';
  group.add(ceiling);

  // Outer walls
  group.add(createWall(0, 0, W, 0, WALL_HEIGHT, Y_BASE));
  group.add(createWall(W, 0, W, D, WALL_HEIGHT, Y_BASE));
  group.add(createWall(W, D, 0, D, WALL_HEIGHT, Y_BASE));
  group.add(createWall(0, D, 0, 0, WALL_HEIGHT, Y_BASE));

  // === Fixed Structures ===

  // 1. Blocked space (막힌공간 X) - 215x170 at (0,0), height 250
  const blocked = createBox(215, WALL_HEIGHT, 170, COLORS.blockedArea, 0.75);
  blocked.position.set(107.5, Y_BASE + WALL_HEIGHT / 2, 85);
  blocked.userData.isFixture = true;
  blocked.userData.name = '막힌공간(X)';
  group.add(blocked);
  group.add(createFixtureLabel('X (막힌공간)', 107.5, Y_BASE + WALL_HEIGHT / 2 + 20, 85));

  // Blocked space walls
  group.add(createWall(215, 0, 215, 170, WALL_HEIGHT, Y_BASE, COLORS.wallEdge));
  group.add(createWall(0, 170, 215, 170, WALL_HEIGHT, Y_BASE, COLORS.wallEdge));

  // 2. Partition area (칸막이) - 165x170 at (215,0) - dashed boundary
  // Create partition boundary line (dashed)
  const partitionGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(215, Y_BASE + 0.5, 0),
    new THREE.Vector3(215, Y_BASE + 0.5, 170),
    new THREE.Vector3(380, Y_BASE + 0.5, 170),
  ]);
  const partitionMat = new THREE.LineDashedMaterial({
    color: COLORS.partition,
    dashSize: 10,
    gapSize: 5,
    linewidth: 2,
  });
  const partitionLine = new THREE.Line(partitionGeo, partitionMat);
  partitionLine.computeLineDistances();
  group.add(partitionLine);
  group.add(createFixtureLabel('칸막이', 297, Y_BASE + 30, 85));

  // 3. Stairs 2F (계단) - 70x140 at (310, 480-140-85=255)
  // Descending: shows stairs coming up from 1F (high at entrance, low at far end)
  const stairsZ = D - 140 - 85; // 255
  const stairs2 = createStairs(310, stairsZ, 70, 140, Y_BASE, Y_BASE + WALL_HEIGHT, COLORS.fixture, true);
  stairs2.userData.name = '2층 계단';
  group.add(stairs2);
  group.add(createFixtureLabel('계단', 345, Y_BASE + WALL_HEIGHT / 2, stairsZ + 70));

  return group;
}

export function getColorTargets(scene) {
  const targets = {
    floor1: null,
    floor2: null,
    walls: [],
    ceilings: [],
  };

  scene.traverse((obj) => {
    if (obj.name === 'floor1-surface') targets.floor1 = obj;
    if (obj.name === 'floor2-surface') targets.floor2 = obj;
    if (obj.userData.isWall) targets.walls.push(obj);
    if (obj.userData.isCeiling) targets.ceilings.push(obj);
  });

  return targets;
}
