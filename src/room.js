import * as THREE from 'three';

// Scale: 1 unit = 1cm
const WALL_THICKNESS = 10;
const WALL_HEIGHT = 250;

// Side-by-side layout
export const FLOOR2_X_OFFSET = 380 + 100; // 1F width + gap

// Colors - matched to real apartment photos
const COLORS = {
  floor: 0xC4A87A,         // warm oak laminate
  wall: 0xF5F2EE,          // white/ivory walls
  wallEdge: 0xC9BDA8,      // wall edge trim (beige molding)
  ceiling: 0xFAFAFA,       // white ceiling
  stairWood: 0xDDD0BE,     // light ash wood (stair steps)
  stairEdge: 0x8B7D6B,     // darker wood edge on steps
  stairCabinet: 0xE5DACE,  // cabinet front color
  cabinetHandle: 0x6B5E50, // bronze handles
  doorMetal: 0x9EA0A3,     // gray metal front door
  doorWood: 0xDDD0BE,      // light wood interior door
  kitchenWhite: 0xF0F0F0,  // white kitchen cabinets
  tileGray: 0xB0B0B0,      // gray tile (entrance, backsplash)
  washer: 0xE8E8E8,        // washing machine white
  sinkTop: 0xD0D0D0,       // countertop
  bathroomInner: 0xE0E0E0, // bathroom interior
  blockedArea: 0x4E5968,
  bookshelfOak: 0xB8A080,   // oak color bookshelf (from photo)
  bookshelfInner: 0xC4AD8E, // inner shelf color
  partition: 0xCCC5B9,
  bathroomTile: 0xC8C4C0,   // gray marble tile
  bathroomFloorTile: 0xA8A4A0, // darker floor tile
  windowFrame: 0x444444,    // dark window frame
  windowGlass: 0x88AACC,    // blue-ish glass
  curtain: 0xD8D0C4,        // accordion curtain
  stairFrame: 0xB8A080,     // wooden frame around stair opening
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
  const divisions = size / 10;
  const grid = new THREE.GridHelper(size, divisions, 0xDDDDDD, 0xEEEEEE);
  grid.position.set(w / 2, y + 0.1, d / 2);
  grid.userData.isGrid = true;
  return grid;
}

/**
 * Storage staircase - stepped profile with cabinet doors underneath
 * Matches the real apartment's ash wood storage stairs
 */
function createStorageStairs(x, z, w, d, yBottom, yTop, descending = false) {
  const group = new THREE.Group();
  const stepCount = 8; // ~8 steps visible in photos
  const totalHeight = yTop - yBottom;
  const stepHeight = totalHeight / stepCount;
  const stepDepth = d / stepCount;

  for (let i = 0; i < stepCount; i++) {
    // Step tread (the flat part you walk on)
    const stepY = descending
      ? yTop - stepHeight * (i + 1)
      : yBottom + stepHeight * i;
    const stepZ = z + stepDepth * i;

    // Full height column for this step (the storage part below)
    const columnH = descending
      ? totalHeight - stepHeight * i
      : stepHeight * (i + 1);
    const columnY = descending
      ? yTop - columnH / 2
      : yBottom + columnH / 2;

    // Storage body (cabinet behind steps)
    const cabinet = createBox(w, columnH, stepDepth - 1, COLORS.stairCabinet);
    cabinet.position.set(x + w / 2, columnY, stepZ + stepDepth / 2);
    cabinet.castShadow = true;
    cabinet.receiveShadow = true;
    group.add(cabinet);

    // Step tread (top surface - slightly wider)
    const tread = createBox(w + 2, 3, stepDepth, COLORS.stairWood);
    tread.position.set(
      x + w / 2,
      stepY + columnH + 1.5,
      stepZ + stepDepth / 2
    );
    if (descending) {
      tread.position.y = yTop - stepHeight * i - 1.5;
    }
    tread.castShadow = true;
    group.add(tread);

    // Step edge (darker line on front of each step)
    const edge = createBox(w, 2, 1, COLORS.stairEdge);
    edge.position.set(
      x + w / 2,
      stepY + columnH,
      stepZ + 0.5
    );
    if (descending) {
      edge.position.y = yTop - stepHeight * i;
      edge.position.z = stepZ + stepDepth - 0.5;
    }
    group.add(edge);

    // Cabinet door lines (decorative) - only on the front face for taller sections
    if (columnH > 40) {
      // Door outline
      const doorH = Math.min(columnH - 10, 120);
      const doorOutline = createBox(w - 8, doorH, 0.5, COLORS.stairEdge);
      doorOutline.position.set(x + w / 2, columnY, stepZ + 0.3);
      if (descending) {
        doorOutline.position.z = stepZ + stepDepth - 0.3;
      }
      group.add(doorOutline);

      // Door fill (slightly lighter)
      const doorFill = createBox(w - 12, doorH - 4, 0.8, COLORS.stairCabinet);
      doorFill.position.set(x + w / 2, columnY, stepZ + 0.5);
      if (descending) {
        doorFill.position.z = stepZ + stepDepth - 0.5;
      }
      group.add(doorFill);

      // Handle (small dark dot)
      const handle = createBox(3, 8, 1.5, COLORS.cabinetHandle);
      handle.position.set(x + w / 2, columnY, stepZ + 1);
      if (descending) {
        handle.position.z = stepZ + stepDepth - 1;
      }
      group.add(handle);
    }
  }

  // Side panel (visible side of the staircase)
  const sidePanel = createBox(1.5, totalHeight, d, COLORS.stairCabinet);
  sidePanel.position.set(x, yBottom + totalHeight / 2, z + d / 2);
  group.add(sidePanel);

  const sidePanel2 = createBox(1.5, totalHeight, d, COLORS.stairCabinet);
  sidePanel2.position.set(x + w, yBottom + totalHeight / 2, z + d / 2);
  group.add(sidePanel2);

  group.userData.isFixture = true;
  return group;
}

/**
 * Kitchen/sink unit: lower cabinet + washing machine + countertop + upper cabinets + backsplash
 */
function createKitchenUnit(x, z, w, d, yBase) {
  const group = new THREE.Group();

  // Lower cabinet (left half) - white
  const cabinetW = w * 0.5;
  const cabinetH = 85;
  const cabinet = createBox(cabinetW, cabinetH, d, COLORS.kitchenWhite);
  cabinet.position.set(x + cabinetW / 2, yBase + cabinetH / 2, z + d / 2);
  cabinet.castShadow = true;
  group.add(cabinet);

  // Washing machine (right half) - slightly off-white
  const washerW = w * 0.45;
  const washerH = 82;
  const washer = createBox(washerW, washerH, d - 4, COLORS.washer);
  washer.position.set(x + cabinetW + washerW / 2, yBase + washerH / 2, z + d / 2);
  washer.castShadow = true;
  group.add(washer);

  // Countertop (full width, stone gray)
  const counterTop = createBox(w, 4, d + 2, COLORS.sinkTop);
  counterTop.position.set(x + w / 2, yBase + cabinetH + 2, z + d / 2);
  counterTop.castShadow = true;
  group.add(counterTop);

  // Sink basin
  const sinkBasin = createBox(30, 3, 20, 0xA0A0A0);
  sinkBasin.position.set(x + cabinetW / 2, yBase + cabinetH + 0.5, z + d / 2);
  group.add(sinkBasin);

  // Faucet (simple L-shape)
  const faucetPole = createBox(2, 20, 2, 0x888888);
  faucetPole.position.set(x + cabinetW / 2, yBase + cabinetH + 14, z + d * 0.25);
  group.add(faucetPole);
  const faucetArm = createBox(2, 2, 10, 0x888888);
  faucetArm.position.set(x + cabinetW / 2, yBase + cabinetH + 24, z + d * 0.35);
  group.add(faucetArm);

  // Backsplash (gray tile)
  const splashH = 60;
  const splash = createBox(w, splashH, 2, COLORS.tileGray);
  splash.position.set(x + w / 2, yBase + cabinetH + 4 + splashH / 2, z - 1);
  group.add(splash);

  // Tile lines on backsplash
  for (let i = 1; i < 4; i++) {
    const tileLine = createBox(w, 0.5, 2.5, 0xA8A8A8);
    tileLine.position.set(x + w / 2, yBase + cabinetH + 4 + splashH * i / 4, z - 1.2);
    group.add(tileLine);
  }

  // Upper cabinets (white, two sections)
  const upperH = 60;
  const upperY = yBase + cabinetH + 4 + splashH + 10;
  const upperCabL = createBox(w * 0.42, upperH, d * 0.7, COLORS.kitchenWhite);
  upperCabL.position.set(x + w * 0.21, upperY + upperH / 2, z + d * 0.35 / 2);
  upperCabL.castShadow = true;
  group.add(upperCabL);
  const upperCabR = createBox(w * 0.42, upperH, d * 0.7, COLORS.kitchenWhite);
  upperCabR.position.set(x + w * 0.79, upperY + upperH / 2, z + d * 0.35 / 2);
  upperCabR.castShadow = true;
  group.add(upperCabR);

  // Range hood (between upper cabinets)
  const hood = createBox(w * 0.3, 12, d * 0.5, 0xCCCCCC);
  hood.position.set(x + w / 2, upperY - 6, z + d * 0.25);
  group.add(hood);

  group.userData.isFixture = true;
  group.userData.name = '주방';
  return group;
}

/**
 * Entrance area with tile floor and metal door
 */
function createEntrance(x, z, doorW, doorH, tileW, tileD, yBase) {
  const group = new THREE.Group();

  // Tile floor area (slightly recessed - gray)
  const tile = createBox(tileW, 1, tileD, COLORS.tileGray);
  tile.position.set(x + tileW / 2, yBase - 0.5, z + tileD / 2);
  tile.receiveShadow = true;
  group.add(tile);

  // Step edge between tile and wood floor
  const stepEdge = createBox(tileW + 4, 2, 2, COLORS.wallEdge);
  stepEdge.position.set(x + tileW / 2, yBase + 1, z + tileD);
  group.add(stepEdge);

  // Metal front door
  const door = createBox(doorW, doorH, 6, COLORS.doorMetal, 0.9);
  door.position.set(x + tileW / 2, yBase + doorH / 2, z);
  door.userData.isFixture = true;
  door.userData.name = '현관문';
  group.add(door);

  // Door handle
  const handle = createBox(2, 8, 3, 0x666666);
  handle.position.set(x + tileW / 2 + doorW * 0.3, yBase + doorH * 0.45, z + 4);
  group.add(handle);

  // Door closer (top)
  const closer = createBox(20, 4, 6, 0x888888);
  closer.position.set(x + tileW / 2, yBase + doorH - 10, z + 4);
  group.add(closer);

  group.userData.isFixture = true;
  return group;
}

/**
 * Bathroom room - gray marble tiles, toilet with tank, wall-mount sink, mirror, cabinet
 * Based on actual apartment photo
 */
function createBathroomRoom(x, z, w, d, height, yBase) {
  const group = new THREE.Group();

  // Bathroom floor (darker gray tile)
  const bathFloor = createBox(w, 1, d, COLORS.bathroomFloorTile);
  bathFloor.position.set(x + w / 2, yBase + 0.5, z + d / 2);
  bathFloor.receiveShadow = true;
  group.add(bathFloor);

  // Tile walls (gray marble look - cover inner walls)
  // Back wall (z=0, north)
  const tileBack = createBox(w - 2, height, 2, COLORS.bathroomTile);
  tileBack.position.set(x + w / 2, yBase + height / 2, z + 1);
  group.add(tileBack);
  // Left wall (x=0, west)
  const tileLeft = createBox(2, height, d - 2, COLORS.bathroomTile);
  tileLeft.position.set(x + 1, yBase + height / 2, z + d / 2);
  group.add(tileLeft);
  // East inner wall
  const tileEast = createBox(2, height, d, COLORS.bathroomTile);
  tileEast.position.set(x + w - 1, yBase + height / 2, z + d / 2);
  group.add(tileEast);
  // South inner wall
  const tileSouth = createBox(w, height, 2, COLORS.bathroomTile);
  tileSouth.position.set(x + w / 2, yBase + height / 2, z + d - 1);
  group.add(tileSouth);

  // Tile grid lines on back wall
  for (let row = 1; row < 8; row++) {
    const hLine = createBox(w - 6, 0.5, 2.5, 0xB8B4B0);
    hLine.position.set(x + w / 2, yBase + row * 30, z + 1.5);
    group.add(hLine);
  }
  for (let col = 1; col < 6; col++) {
    const vLine = createBox(0.5, height, 2.5, 0xB8B4B0);
    vLine.position.set(x + col * (w / 6), yBase + height / 2, z + 1.5);
    group.add(vLine);
  }

  // Structural walls (for wall color targeting)
  group.add(createWall(x + w, z, x + w, z + d, height, yBase, COLORS.bathroomTile));
  group.add(createWall(x, z + d, x + w, z + d, height, yBase, COLORS.bathroomTile));

  // === Toilet (with tank) ===
  // Bowl base
  const bowlBase = createBox(36, 8, 45, 0xF5F5F5);
  bowlBase.position.set(x + w / 2, yBase + 4, z + d - 30);
  group.add(bowlBase);
  // Bowl seat
  const bowlSeat = createBox(34, 3, 40, 0xFAFAFA);
  bowlSeat.position.set(x + w / 2, yBase + 40, z + d - 28);
  group.add(bowlSeat);
  // Bowl body (cylinder-ish via box)
  const bowlBody = createBox(34, 30, 42, 0xF0F0F0);
  bowlBody.position.set(x + w / 2, yBase + 23, z + d - 28);
  group.add(bowlBody);
  // Tank
  const tank = createBox(30, 35, 15, 0xF0F0F0);
  tank.position.set(x + w / 2, yBase + 30, z + d - 8);
  group.add(tank);
  // Flush button
  const flushBtn = createBox(8, 5, 1, 0xDDDDDD);
  flushBtn.position.set(x + w / 2, yBase + 50, z + d - 1);
  group.add(flushBtn);

  // === Wall-mounted sink/basin ===
  const sinkX = x + w - 50;
  const sinkZ = z + 40;
  // Basin shelf
  const basinShelf = createBox(45, 4, 30, 0xF5F5F5);
  basinShelf.position.set(sinkX, yBase + 78, sinkZ);
  group.add(basinShelf);
  // Basin bowl (recessed)
  const basinBowl = createBox(35, 12, 22, 0xEEEEEE);
  basinBowl.position.set(sinkX, yBase + 72, sinkZ);
  group.add(basinBowl);
  // Faucet
  const faucet = createBox(2, 15, 2, 0x999999);
  faucet.position.set(sinkX, yBase + 88, sinkZ - 8);
  group.add(faucet);
  // Basin legs
  const leg1 = createBox(2, 30, 2, 0xAAAAAA);
  leg1.position.set(sinkX - 15, yBase + 55, sinkZ + 10);
  group.add(leg1);
  const leg2 = createBox(2, 30, 2, 0xAAAAAA);
  leg2.position.set(sinkX + 15, yBase + 55, sinkZ + 10);
  group.add(leg2);

  // === Mirror (above sink) ===
  const mirror = createBox(40, 50, 1.5, 0xCCDDEE);
  mirror.position.set(sinkX, yBase + 130, z + 2);
  group.add(mirror);
  // Mirror frame
  const mirrorFrame = createBox(42, 52, 1, 0xDDDDDD);
  mirrorFrame.position.set(sinkX, yBase + 130, z + 1.5);
  group.add(mirrorFrame);

  // === Upper cabinet (above toilet) ===
  const upperCab = createBox(35, 30, 18, 0xF0F0F0);
  upperCab.position.set(x + w / 2, yBase + 170, z + d - 15);
  group.add(upperCab);
  // Cabinet door detail
  const cabDoor = createBox(33, 28, 1, 0xECECEC);
  cabDoor.position.set(x + w / 2, yBase + 170, z + d - 6);
  group.add(cabDoor);

  // === Ceiling light (round) ===
  const light = new THREE.Mesh(
    new THREE.SphereGeometry(8, 12, 8),
    new THREE.MeshBasicMaterial({ color: 0xFFF8E0 })
  );
  light.position.set(x + w / 2, yBase + height - 5, z + d / 2);
  group.add(light);

  // === Door (light wood, south wall) ===
  const doorW = 70;
  const doorH = 200;
  const doorX = x + w - doorW - 10;
  const door = createBox(doorW, doorH, 4, COLORS.doorWood, 0.85);
  door.position.set(doorX + doorW / 2, yBase + doorH / 2, z + d + 2);
  group.add(door);
  // Door handle
  const handle = createBox(2, 6, 2.5, 0x888888);
  handle.position.set(doorX + doorW * 0.85, yBase + doorH * 0.45, z + d + 4.5);
  group.add(handle);
  // Door frame
  const frameL = createBox(3, doorH, 4, COLORS.wallEdge);
  frameL.position.set(doorX, yBase + doorH / 2, z + d + 2);
  group.add(frameL);
  const frameR = createBox(3, doorH, 4, COLORS.wallEdge);
  frameR.position.set(doorX + doorW, yBase + doorH / 2, z + d + 2);
  group.add(frameR);
  const frameT = createBox(doorW + 6, 3, 4, COLORS.wallEdge);
  frameT.position.set(doorX + doorW / 2, yBase + doorH, z + d + 2);
  group.add(frameT);

  group.userData.isFixture = true;
  group.userData.name = '화장실';
  return group;
}

/**
 * Open bookshelf - oak color, 2 columns x 4 rows
 * Based on actual apartment photo
 */
function createOpenBookshelf(x, z, w, d, h, yBase) {
  const group = new THREE.Group();
  const cols = 2;
  const rows = 5;
  const shelfThick = 2;
  const sideThick = 2;
  const cellW = (w - sideThick * (cols + 1)) / cols;
  const cellH = (h - shelfThick * (rows + 1)) / rows;

  // Back panel
  const back = createBox(w, h, 1, COLORS.bookshelfOak);
  back.position.set(x + w / 2, yBase + h / 2, z);
  back.castShadow = true;
  group.add(back);

  // Side panels (left, middle, right)
  for (let c = 0; c <= cols; c++) {
    const sx = x + sideThick / 2 + c * (cellW + sideThick);
    const side = createBox(sideThick, h, d, COLORS.bookshelfOak);
    side.position.set(sx, yBase + h / 2, z + d / 2);
    side.castShadow = true;
    group.add(side);
  }

  // Horizontal shelves
  for (let r = 0; r <= rows; r++) {
    const sy = yBase + shelfThick / 2 + r * (cellH + shelfThick);
    const shelf = createBox(w, shelfThick, d, COLORS.bookshelfOak);
    shelf.position.set(x + w / 2, sy, z + d / 2);
    group.add(shelf);
  }

  // Inner cell backing (slightly lighter color for depth effect)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = x + sideThick + c * (cellW + sideThick) + cellW / 2;
      const cy = yBase + shelfThick + r * (cellH + shelfThick) + cellH / 2;
      const cellBack = createBox(cellW - 1, cellH - 1, 0.5, COLORS.bookshelfInner);
      cellBack.position.set(cx, cy, z + 1);
      group.add(cellBack);
    }
  }

  group.userData.isFurniture = true;
  group.userData.isMovable = true;
  group.userData.name = '책장';
  group.userData.floor = 1;
  group.castShadow = true;
  return group;
}

/**
 * 2F horizontal window (low on wall, wide)
 */
function createHorizontalWindow(x, z, w, h, yBase) {
  const group = new THREE.Group();

  // Window frame (dark)
  const frame = createBox(w + 6, h + 6, 4, COLORS.windowFrame);
  frame.position.set(x, yBase + h / 2, z);
  group.add(frame);

  // Glass (blue-ish, semi-transparent)
  const glass = createBox(w, h, 2, COLORS.windowGlass, 0.5);
  glass.position.set(x, yBase + h / 2, z);
  group.add(glass);

  // Window divider (horizontal bar)
  const divider = createBox(w, 2, 5, COLORS.windowFrame);
  divider.position.set(x, yBase + h / 2, z);
  group.add(divider);

  group.userData.isFixture = true;
  return group;
}

/**
 * 2F stair opening - rectangular hole in floor with wooden frame
 */
function createStairOpening(x, z, w, d, yBase) {
  const group = new THREE.Group();
  const frameW = 4;

  // Wooden frame around the opening
  // North edge
  const north = createBox(w + frameW * 2, 6, frameW, COLORS.stairFrame);
  north.position.set(x + w / 2, yBase + 3, z - frameW / 2);
  group.add(north);
  // South edge
  const south = createBox(w + frameW * 2, 6, frameW, COLORS.stairFrame);
  south.position.set(x + w / 2, yBase + 3, z + d + frameW / 2);
  group.add(south);
  // West edge
  const west = createBox(frameW, 6, d, COLORS.stairFrame);
  west.position.set(x - frameW / 2, yBase + 3, z + d / 2);
  group.add(west);
  // East edge
  const east = createBox(frameW, 6, d, COLORS.stairFrame);
  east.position.set(x + w + frameW / 2, yBase + 3, z + d / 2);
  group.add(east);

  // Dark void inside the opening (represents the hole)
  const void_ = createBox(w, 2, d, 0x222222, 0.85);
  void_.position.set(x + w / 2, yBase - 1, z + d / 2);
  group.add(void_);

  // Visible stairs going down inside the opening
  const stepCount = 5;
  const stepDepth = d / stepCount;
  for (let i = 0; i < stepCount; i++) {
    const step = createBox(w - 4, 2, stepDepth - 2, COLORS.stairWood);
    step.position.set(x + w / 2, yBase - 15 - i * 25, z + stepDepth * (i + 0.5));
    group.add(step);
    // Step edge
    const edge = createBox(w - 4, 1, 1, COLORS.stairEdge);
    edge.position.set(x + w / 2, yBase - 14 - i * 25, z + stepDepth * i + 1);
    group.add(edge);
  }

  group.userData.isFixture = true;
  return group;
}

/**
 * 2F attic storage space (다락방) - low ceiling with accordion curtain/door
 */
function createAtticStorage(x, z, w, d, height, yBase) {
  const group = new THREE.Group();

  // Attic floor (same oak laminate)
  const atticFloor = createBox(w, 1, d, COLORS.floor);
  atticFloor.position.set(x + w / 2, yBase + 0.5, z + d / 2);
  atticFloor.receiveShadow = true;
  group.add(atticFloor);

  // Low ceiling (the shelf/overhang above)
  const atticCeiling = createBox(w + 5, 5, d, COLORS.wall);
  atticCeiling.position.set(x + w / 2, yBase + height, z + d / 2);
  group.add(atticCeiling);

  // Back wall
  const backWall = createBox(w, height, 2, COLORS.wall);
  backWall.position.set(x + w / 2, yBase + height / 2, z + 1);
  group.add(backWall);

  // Side wall (left)
  const sideWall = createBox(2, height, d, COLORS.wall);
  sideWall.position.set(x + 1, yBase + height / 2, z + d / 2);
  group.add(sideWall);

  // Accordion curtain/door at entrance (partially open)
  const curtainPanels = 4;
  const panelW = 15;
  for (let i = 0; i < curtainPanels; i++) {
    const panel = createBox(panelW, height - 5, 2, COLORS.curtain, 0.8);
    panel.position.set(x + w - 5 - i * (panelW + 1), yBase + height / 2, z + d - 1);
    panel.rotation.y = 0.15; // slight angle to show accordion fold
    group.add(panel);
  }

  // Storage boxes inside (representing the actual clutter)
  const box1 = createBox(30, 25, 25, 0xC4A060);
  box1.position.set(x + w * 0.6, yBase + 13, z + d * 0.4);
  group.add(box1);
  const box2 = createBox(35, 30, 30, 0x4488AA, 0.8);
  box2.position.set(x + w * 0.35, yBase + 15, z + d * 0.4);
  group.add(box2);
  const box3 = createBox(28, 22, 22, 0xBBAA88);
  box3.position.set(x + w * 0.15, yBase + 11, z + d * 0.4);
  group.add(box3);

  group.userData.isFixture = true;
  group.userData.name = '다락방 수납';
  return group;
}

function createFixtureLabel(text, x, y, z) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(50,50,50,0.6)';
  ctx.roundRect(0, 0, 256, 64, 8);
  ctx.fill();
  ctx.fillStyle = 'white';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 128, 32);

  const texture = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: texture });
  const sprite = new THREE.Sprite(mat);
  sprite.position.set(x, y, z);
  sprite.scale.set(55, 14, 1);
  return sprite;
}

export function buildFloor1(scene) {
  const group = new THREE.Group();
  group.name = 'floor1';

  const W = 380, D = 510;

  // Floor (warm oak laminate)
  const floor = createFloor(W, D, 0);
  floor.name = 'floor1-surface';
  group.add(floor);

  // Grid
  const grid = createGridHelper(W, D, 0);
  grid.name = 'floor1-grid';
  group.add(grid);

  // Ceiling
  const ceiling = createCeiling(W, D, WALL_HEIGHT);
  ceiling.name = 'floor1-ceiling';
  group.add(ceiling);

  // Outer walls (white)
  group.add(createWall(0, 0, W, 0, WALL_HEIGHT, 0));
  group.add(createWall(W, 0, W, D, WALL_HEIGHT, 0));
  group.add(createWall(W, D, 0, D, WALL_HEIGHT, 0));
  group.add(createWall(0, D, 0, 0, WALL_HEIGHT, 0));

  // Wall edge molding (beige trim at top of walls)
  const moldingH = 3;
  const molding1 = createBox(W, moldingH, 1, COLORS.wallEdge);
  molding1.position.set(W / 2, WALL_HEIGHT - moldingH / 2, WALL_THICKNESS / 2);
  group.add(molding1);
  const molding2 = createBox(1, moldingH, D, COLORS.wallEdge);
  molding2.position.set(WALL_THICKNESS / 2, WALL_HEIGHT - moldingH / 2, D / 2);
  group.add(molding2);

  // === Fixed Structures ===

  // 1. Bathroom (화장실) - 200x170 at (0,0)
  const bathroom = createBathroomRoom(0, 0, 200, 170, WALL_HEIGHT, 0);
  group.add(bathroom);
  group.add(createFixtureLabel('화장실', 100, 140, 85));

  // 2. Kitchen/Sink unit (주방) - along the left wall, below bathroom
  // 150x60 at (0,170)
  const kitchen = createKitchenUnit(0, 175, 150, 55, 0);
  group.add(kitchen);
  group.add(createFixtureLabel('주방', 75, 160, 200));

  // 3. Entrance area (현관) - with front door at the top-right area
  // Shoe area at (280,0), front door faces z=0 (north wall)
  const entrance = createEntrance(270, -3, 80, 210, 100, 70, 0);
  group.add(entrance);
  group.add(createFixtureLabel('현관', 320, 100, 35));

  // 4. Storage Stairs (수납 계단) - 70x210 at (310,225)
  const stairs = createStorageStairs(310, 225, 70, 210, 0, WALL_HEIGHT);
  stairs.userData.name = '계단';
  group.add(stairs);
  group.add(createFixtureLabel('계단', 345, WALL_HEIGHT / 2 + 30, 330));

  // Ceiling opening above stairs (darker area showing 2F access)
  const stairOpening = createBox(72, 2, 75, 0x333344, 0.7);
  stairOpening.position.set(345, WALL_HEIGHT - 1, 230);
  group.add(stairOpening);

  // 5. Back door (뒷문) - 100x6 at (280,504)
  const backDoor = createBox(100, 210, 6, COLORS.doorMetal, 0.7);
  backDoor.position.set(330, 105, 507);
  backDoor.userData.isFixture = true;
  backDoor.userData.name = '뒷문';
  group.add(backDoor);
  group.add(createFixtureLabel('뒷문', 330, 30, 507));

  // 6. Open Bookshelf (책장) - oak 2x4 compartment shelf, ~60x30x180cm - MOVABLE!
  const bookshelf = createOpenBookshelf(0, 410, 60, 30, 180, 0);
  group.add(bookshelf);
  group.add(createFixtureLabel('책장 (이동가능)', 30, 190, 425));

  return group;
}

export function buildFloor2(scene) {
  const group = new THREE.Group();
  group.name = 'floor2';

  const W = 380, D = 480;
  const Y_BASE = 0;

  // Floor (warm oak laminate)
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

  // Outer walls (white)
  group.add(createWall(0, 0, W, 0, WALL_HEIGHT, Y_BASE));
  group.add(createWall(W, 0, W, D, WALL_HEIGHT, Y_BASE));
  group.add(createWall(W, D, 0, D, WALL_HEIGHT, Y_BASE));
  group.add(createWall(0, D, 0, 0, WALL_HEIGHT, Y_BASE));

  // Wall edge molding (beige trim)
  const moldingH = 3;
  const molding1 = createBox(W, moldingH, 1, COLORS.wallEdge);
  molding1.position.set(W / 2, Y_BASE + WALL_HEIGHT - moldingH / 2, WALL_THICKNESS / 2);
  group.add(molding1);
  const molding2 = createBox(1, moldingH, D, COLORS.wallEdge);
  molding2.position.set(WALL_THICKNESS / 2, Y_BASE + WALL_HEIGHT - moldingH / 2, D / 2);
  group.add(molding2);

  // === Fixed Structures ===

  // 1. Attic storage (다락방 수납) - low ceiling room with accordion curtain
  // Replaces the old "blocked space" - 215x170 at (0,0), but with ~150cm ceiling
  const atticHeight = 150; // low ceiling
  const attic = createAtticStorage(0, 0, 215, 170, atticHeight, Y_BASE);
  group.add(attic);
  group.add(createFixtureLabel('다락방 수납', 107, Y_BASE + 80, 85));

  // Upper wall above attic (from attic ceiling to room ceiling)
  const upperWallH = WALL_HEIGHT - atticHeight;
  const upperWall = createBox(215, upperWallH, 2, COLORS.wall);
  upperWall.position.set(107.5, Y_BASE + atticHeight + upperWallH / 2, 170);
  group.add(upperWall);

  // Dividing wall (east side of attic area)
  group.add(createWall(215, 0, 215, 170, WALL_HEIGHT, Y_BASE, COLORS.wall));
  // South wall of attic area (partial - below attic ceiling)
  group.add(createWall(0, 170, 215, 170, atticHeight, Y_BASE, COLORS.wall));

  // 2. Partition area (칸막이) - right side of attic
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

  // 3. Horizontal window (low on left wall, ~80x40cm)
  const windowObj = createHorizontalWindow(WALL_THICKNESS / 2 + 1, D * 0.5, 80, 40, Y_BASE + 30);
  // Rotate to face the left wall
  windowObj.rotation.y = Math.PI / 2;
  windowObj.position.set(WALL_THICKNESS / 2 + 1, 0, D * 0.5);
  group.add(windowObj);
  group.add(createFixtureLabel('창문', 10, Y_BASE + 60, D * 0.5));

  // 4. Stair opening in floor (rectangular hole with wooden frame)
  // Position near the right-rear area, matching where stairs come up
  const openingX = 310;
  const openingZ = D - 140;
  const stairOpen = createStairOpening(openingX, openingZ, 70, 100, Y_BASE);
  group.add(stairOpen);
  group.add(createFixtureLabel('계단 개구부', openingX + 35, Y_BASE + 20, openingZ + 50));

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
