import * as THREE from 'three';

/**
 * Furniture interaction controls - drag, rotate, delete
 */
export class FurnitureControls {
  constructor(camera, renderer, scene, orbitControls) {
    this.camera = camera;
    this.renderer = renderer;
    this.scene = scene;
    this.orbitControls = orbitControls;

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.selected = null;
    this.dragging = false;
    this.dragPlane = new THREE.Plane();
    this.dragOffset = new THREE.Vector3();
    this.intersection = new THREE.Vector3();

    // Highlight material
    this.highlightEdges = null;

    // UI elements
    this.selectionInfo = document.getElementById('selection-info');
    this.selectedName = document.getElementById('selected-name');

    this._onMouseDown = this._onMouseDown.bind(this);
    this._onMouseMove = this._onMouseMove.bind(this);
    this._onMouseUp = this._onMouseUp.bind(this);

    const canvas = renderer.domElement;
    canvas.addEventListener('mousedown', this._onMouseDown);
    canvas.addEventListener('mousemove', this._onMouseMove);
    canvas.addEventListener('mouseup', this._onMouseUp);

    // Rotate and delete buttons
    document.getElementById('btn-rotate').addEventListener('click', () => this.rotateSelected());
    document.getElementById('btn-delete').addEventListener('click', () => this.deleteSelected());
  }

  _updateMouse(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  _getFurnitureObjects() {
    const objects = [];
    this.scene.traverse((obj) => {
      if (obj.userData.isFurniture && obj.userData.isMovable) {
        objects.push(obj);
      }
    });
    return objects;
  }

  _findFurnitureParent(obj) {
    let current = obj;
    while (current) {
      if (current.userData.isFurniture && current.userData.isMovable) return current;
      current = current.parent;
    }
    return null;
  }

  _onMouseDown(event) {
    if (event.button !== 0) return; // left click only

    this._updateMouse(event);
    this.raycaster.setFromCamera(this.mouse, this.camera);

    // Raycast against all meshes, then find furniture parent
    const allMeshes = [];
    this.scene.traverse((obj) => {
      if (obj.isMesh) allMeshes.push(obj);
    });

    const intersects = this.raycaster.intersectObjects(allMeshes, false);

    for (const hit of intersects) {
      const furniture = this._findFurnitureParent(hit.object);
      if (furniture) {
        this.select(furniture);
        this.dragging = true;
        this.orbitControls.enabled = false;

        // Create drag plane at furniture's Y position
        this.dragPlane.setFromNormalAndCoplanarPoint(
          new THREE.Vector3(0, 1, 0),
          furniture.position
        );

        // Calculate offset
        this.raycaster.ray.intersectPlane(this.dragPlane, this.intersection);
        this.dragOffset.copy(furniture.position).sub(this.intersection);

        return;
      }
    }

    // Clicked on nothing - deselect
    if (!this.dragging) {
      this.deselect();
    }
  }

  _onMouseMove(event) {
    if (!this.dragging || !this.selected) return;

    this._updateMouse(event);
    this.raycaster.setFromCamera(this.mouse, this.camera);

    if (this.raycaster.ray.intersectPlane(this.dragPlane, this.intersection)) {
      const newPos = this.intersection.add(this.dragOffset);
      this.selected.position.x = newPos.x;
      this.selected.position.z = newPos.z;
      // Keep Y fixed (on floor)
    }
  }

  _onMouseUp(event) {
    if (event.button !== 0) return;
    if (this.dragging) {
      this.dragging = false;
      this.orbitControls.enabled = true;
    }
  }

  select(obj) {
    this.deselect();
    this.selected = obj;

    // Add highlight
    this._addHighlight(obj);

    // Show UI
    this.selectedName.textContent = obj.userData.name || '가구';
    this.selectionInfo.classList.add('visible');
  }

  deselect() {
    if (this.selected) {
      this._removeHighlight(this.selected);
    }
    this.selected = null;
    this.selectionInfo.classList.remove('visible');
  }

  _addHighlight(obj) {
    // Add a wireframe outline
    obj.traverse((child) => {
      if (child.isMesh && child.geometry) {
        const edges = new THREE.EdgesGeometry(child.geometry);
        const line = new THREE.LineSegments(
          edges,
          new THREE.LineBasicMaterial({ color: 0x00ff88, linewidth: 2 })
        );
        line.userData.isHighlight = true;
        child.add(line);
      }
    });
  }

  _removeHighlight(obj) {
    const toRemove = [];
    obj.traverse((child) => {
      if (child.userData.isHighlight) toRemove.push(child);
    });
    toRemove.forEach((child) => child.parent.remove(child));
  }

  rotateSelected() {
    if (!this.selected) return;
    this.selected.rotation.y += Math.PI / 4; // 45 degrees
  }

  deleteSelected() {
    if (!this.selected) return;
    this.selected.parent.remove(this.selected);
    this.deselect();
  }

  dispose() {
    const canvas = this.renderer.domElement;
    canvas.removeEventListener('mousedown', this._onMouseDown);
    canvas.removeEventListener('mousemove', this._onMouseMove);
    canvas.removeEventListener('mouseup', this._onMouseUp);
  }
}
