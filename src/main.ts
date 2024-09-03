import * as THREE from 'three';
import { Vector3 } from 'three';
import * as TWEEN from '@tweenjs/tween.js';
import { CHINESE_SENTENCES } from './constants';
import { Mesh, MeshBasicMaterial, TextureLoader } from 'three';

console.log('Script started');

try {
  // Scene setup
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f0f0);
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ antialias: true });

  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  console.log('Renderer added to DOM');

  // Camera position
  camera.position.z = 5;

  // Select a random sentence
  const selectedSentence = CHINESE_SENTENCES[Math.floor(Math.random() * CHINESE_SENTENCES.length)];
  const CHINESE_SENTENCE = selectedSentence.simplified;

  // Character tiles
  const tiles: THREE.Group[] = [];
  const tileGeometry = new THREE.BoxGeometry(1., 1., 0.1);
  const tileMaterial = new THREE.MeshPhongMaterial({ color: 0x2196F3 }); // Changed to a blue color

  CHINESE_SENTENCE.split('').forEach((char, index) => {
    const tileGroup = new THREE.Group();
    const tileBackground = new THREE.Mesh(tileGeometry, tileMaterial);
    tileGroup.add(tileBackground);

    // Add text to the tile
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 256;
    if (context) {
      context.fillStyle = '#FFFFFF'; // Changed to white
      context.font = 'bold 160px Arial, "Microsoft YaHei", "SimHei"';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(char, 128, 128);
    }
    const texture = new THREE.CanvasTexture(canvas);
    const textMaterial = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
    const textGeometry = new THREE.PlaneGeometry(1., 1.);
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);
    textMesh.position.z = 0.051;
    tileGroup.add(textMesh);

    tileGroup.position.set(
      Math.random() * 4 - 2,
      Math.random() * 2 + 1,
      Math.random() * 2 - 1
    );
    scene.add(tileGroup);
    tiles.push(tileGroup);
  });

  console.log('Tiles created');

  // Target boxes
  const boxGeometry = new THREE.BoxGeometry(1, 1, 0.1);
  const boxMaterial = new THREE.MeshPhongMaterial({ color: 0xcccccc, opacity: 0.5, transparent: true });
  const targetBoxes: THREE.Mesh[] = [];

  // Calculate total width and spacing
  const totalBoxes = CHINESE_SENTENCE.length;
  const boxWidth = 1; // Since we're using a 1x1x0.1 geometry
  const spacing = 0.2; // Adjust this value to increase/decrease space between boxes
  const totalWidth = (boxWidth * totalBoxes) + (spacing * (totalBoxes - 1));
  const startX = -totalWidth / 2 + boxWidth / 2;

  CHINESE_SENTENCE.split('').forEach((_, index) => {
    const box = new THREE.Mesh(boxGeometry, boxMaterial);
    const xPosition = startX + (boxWidth + spacing) * index;
    box.position.set(xPosition, 0, 0);
    scene.add(box);
    targetBoxes.push(box);
  });

  console.log('Target boxes created');

  // Raycaster for mouse interaction
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let draggingTile: THREE.Group | null = null;
  let dragOffset = new THREE.Vector3();

  // Mouse event handlers
  function onMouseDown(event: MouseEvent) {
    event.preventDefault();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(tiles.flatMap(tile => tile.children));
    if (intersects.length > 0) {
      draggingTile = intersects[0].object.parent as THREE.Group;
      dragOffset.copy(draggingTile.position).sub(intersects[0].point);
    }
  }

  function onMouseMove(event: MouseEvent) {
    event.preventDefault();
    if (draggingTile) {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const planeNormal = new THREE.Vector3(0, 0, 1);
      const plane = new THREE.Plane(planeNormal, 0);
      const intersectionPoint = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane, intersectionPoint);
      draggingTile.position.copy(intersectionPoint).add(dragOffset);
    }
  }

  function onMouseUp() {
    if (draggingTile) {
      snapTileToNearestBox(draggingTile);
      checkSentenceCompletion();
    }
    draggingTile = null;
  }

  function snapTileToNearestBox(tile: THREE.Group) {
    let closestBox: THREE.Mesh | null = null;
    let closestDistance = Infinity;

    targetBoxes.forEach(box => {
      const distance = tile.position.distanceTo(box.position);
      if (distance < closestDistance && distance < 0.3) {
        closestDistance = distance;
        closestBox = box;
      }
    });

    if (closestBox) {
      tile.position.copy(closestBox.position);
    }
  }

  function checkSentenceCompletion() {
    const orderedTiles = targetBoxes.map(box => {
      return tiles.find(tile => tile.position.equals(box.position));
    });

    const isComplete = orderedTiles.every((tile, index) => {
      if (!tile) return false;
      const textMesh = tile.children[1] as Mesh;
      const material = textMesh.material as MeshBasicMaterial;
      const texture = material.map as THREE.Texture;
      const char = texture.image.toDataURL();
      const expectedChar = createCharCanvas(CHINESE_SENTENCE[index]).toDataURL();
      return char === expectedChar;
    });

    if (isComplete) {
      celebrateCompletion();
    }
  }

  function createCharCanvas(char: string): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 256;
    if (context) {
      context.fillStyle = '#FFFFFF'; // Changed to white
      context.font = 'bold 160px Arial, "Microsoft YaHei", "SimHei"';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(char, 128, 128);
    }
    return canvas;
  }

  function celebrateCompletion() {
    // Create particle system for confetti effect
    const particleCount = 500;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const x = Math.random() * 6 - 3;
      const y = Math.random() * 4 + 2;
      const z = Math.random() * 2 - 1;

      particlePositions[i * 3] = x;
      particlePositions[i * 3 + 1] = y;
      particlePositions[i * 3 + 2] = z;

      particleColors[i * 3] = Math.random();
      particleColors[i * 3 + 1] = Math.random();
      particleColors[i * 3 + 2] = Math.random();
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
    });

    const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particleSystem);

    // Animate tiles and particles
    tiles.forEach((tile, index) => {
      new TWEEN.Tween(tile.position)
        .to({ y: tile.position.y + 0.5 }, 500)
        .easing(TWEEN.Easing.Quadratic.Out)
        .yoyo(true)
        .repeat(3)
        .delay(index * 100)
        .start();

      new TWEEN.Tween(tile.rotation)
        .to({ y: Math.PI * 2 }, 1000)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .start();
    });

    // Animate particle system
    new TWEEN.Tween(particleSystem.position)
      .to({ y: -5 }, 3000)
      .easing(TWEEN.Easing.Quadratic.In)
      .start();

    // Remove particle system after animation
    setTimeout(() => {
      scene.remove(particleSystem);
    }, 3000);
  }

  window.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);

  console.log('Event listeners added');

  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    TWEEN.update();
    renderer.render(scene, camera);
  }
  animate();

  console.log('Animation loop started');

  // Window resize handler
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  console.log('Setup complete');
} catch (error) {
  console.error('An error occurred during initialization:', error);
}
