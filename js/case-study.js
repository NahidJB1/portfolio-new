// =============================================================
// CASE STUDY TEMPLATE SCRIPT
// Reused unchanged across every case-study page. Unlike the
// homepage's script.js (which has a hardcoded SECTIONS array),
// this one reads its section list straight from the DOM via
// [data-path] attributes — so a new case study page only needs
// to add sections with that attribute; no JS edits required.
// =============================================================
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import gsap from 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/index.js';
import { ScrollTrigger } from 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/ScrollTrigger.js';

gsap.registerPlugin(ScrollTrigger);

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// =============================================================
// THREE.JS SCENE — same placeholder geometry as the homepage,
// kept deliberately ambient/quiet here since case-study pages
// are read-heavy. Swap coreGeometry for a custom model anytime.
// =============================================================
const canvas = document.getElementById('bg-canvas');

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  55,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.z = 8;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const sceneGroup = new THREE.Group();
scene.add(sceneGroup);

const coreGeometry = new THREE.IcosahedronGeometry(1.7, 1);
const coreMaterial = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  wireframe: true,
  transparent: true,
  opacity: 0.28,
});
const coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
sceneGroup.add(coreMesh);

const PARTICLE_COUNT = window.innerWidth < 700 ? 300 : 550;
const particlePositions = new Float32Array(PARTICLE_COUNT * 3);
for (let i = 0; i < PARTICLE_COUNT; i++) {
  const radius = 3 + Math.random() * 5;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  particlePositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
  particlePositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
  particlePositions[i * 3 + 2] = radius * Math.cos(phi);
}
const particleGeometry = new THREE.BufferGeometry();
particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
const particleMaterial = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 0.035,
  transparent: true,
  opacity: 0.45,
  sizeAttenuation: true,
});
const particles = new THREE.Points(particleGeometry, particleMaterial);
sceneGroup.add(particles);

function renderLoop() {
  requestAnimationFrame(renderLoop);
  if (!prefersReducedMotion) {
    coreMesh.rotation.x += 0.0007;
    coreMesh.rotation.y += 0.0011;
    particles.rotation.y -= 0.0003;
  }
  renderer.render(scene, camera);
}
renderLoop();

if (!prefersReducedMotion) {
  gsap.to(sceneGroup.rotation, {
    y: Math.PI * 1.4,
    ease: 'none',
    scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: true },
  });
  gsap.to(camera.position, {
    z: 6,
    ease: 'none',
    scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: true },
  });
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// =============================================================
// NAV SCROLLSPY + TERMINAL BREADCRUMB — driven entirely by
// section[data-path] elements already in the page markup.
// =============================================================
const terminalPathEl = document.getElementById('terminal-path');
const navDots = Array.from(document.querySelectorAll('.nav-dot'));
const sectionEls = Array.from(document.querySelectorAll('section[data-path]'));

function setActiveSection(id, path) {
  if (terminalPathEl) terminalPathEl.textContent = path;
  navDots.forEach((dot) => dot.classList.toggle('active', dot.dataset.target === id));
}

sectionEls.forEach((section) => {
  const id = section.id;
  const path = section.dataset.path;
  ScrollTrigger.create({
    trigger: section,
    start: 'top center',
    end: 'bottom center',
    onEnter: () => setActiveSection(id, path),
    onEnterBack: () => setActiveSection(id, path),
  });
});

navDots.forEach((dot) => {
  dot.addEventListener('click', () => {
    const target = document.getElementById(dot.dataset.target);
    if (target) target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  });
});

if (sectionEls.length) {
  setActiveSection(sectionEls[0].id, sectionEls[0].dataset.path);
}
