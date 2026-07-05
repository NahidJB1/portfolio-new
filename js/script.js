// =============================================================
// IMPORTS
// Loaded as ES modules directly from a pinned, versioned CDN URL.
// Pinning versions (rather than @latest) avoids unreviewed code
// changing under you — a basic supply-chain safety practice.
// =============================================================
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import gsap from 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/index.js';
import { ScrollTrigger } from 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/ScrollTrigger.js';

gsap.registerPlugin(ScrollTrigger);

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// =============================================================
// SECTION CONFIG
// Single source of truth for section order, nav labels, and the
// terminal-breadcrumb text shown per section. Edit this array to
// add/remove/re-order sections — everything below reads from it.
// =============================================================
const SECTIONS = [
  { id: 'hero', path: 'guest@njb:~$ whoami' },
  { id: 'about', path: 'guest@njb:~$ cat about.md' },
  { id: 'projects', path: 'guest@njb:~/projects$ ls -la' },
  { id: 'skills', path: 'guest@njb:~$ cat skills.json' },
  { id: 'achievements', path: 'guest@njb:~$ ls -la ~/achievements' },
  { id: 'contact', path: 'guest@njb:~$ ping njb --connect' },
];

// =============================================================
// THREE.JS SCENE SETUP
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

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

// Group everything so we can rotate/scale as one unit
const sceneGroup = new THREE.Group();
scene.add(sceneGroup);

// ---- Placeholder geometry #1: wireframe core ----
// Swap this geometry for a custom model later if you like —
// everything else (rotation, scroll-tied scale) keeps working.
const coreGeometry = new THREE.IcosahedronGeometry(1.7, 1);
const coreMaterial = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  wireframe: true,
  transparent: true,
  opacity: 0.35,
});
const coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
sceneGroup.add(coreMesh);

// ---- Placeholder geometry #2: particle field ----
const PARTICLE_COUNT = window.innerWidth < 700 ? 350 : 700;
const particlePositions = new Float32Array(PARTICLE_COUNT * 3);

for (let i = 0; i < PARTICLE_COUNT; i++) {
  // Random point inside a spherical shell (radius 3 - 8)
  const radius = 3 + Math.random() * 5;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);

  particlePositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
  particlePositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
  particlePositions[i * 3 + 2] = radius * Math.cos(phi);
}

const particleGeometry = new THREE.BufferGeometry();
particleGeometry.setAttribute(
  'position',
  new THREE.BufferAttribute(particlePositions, 3)
);

const particleMaterial = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 0.035,
  transparent: true,
  opacity: 0.55,
  sizeAttenuation: true,
});

const particles = new THREE.Points(particleGeometry, particleMaterial);
sceneGroup.add(particles);

// =============================================================
// RENDER LOOP
// Continuous idle motion. Kept subtle — the scroll-tied motion
// below (GSAP) is the primary driver of perceived interactivity.
// =============================================================
function renderLoop() {
  requestAnimationFrame(renderLoop);

  if (!prefersReducedMotion) {
    coreMesh.rotation.x += 0.0009;
    coreMesh.rotation.y += 0.0014;
    particles.rotation.y -= 0.0004;
  }

  renderer.render(scene, camera);
}
renderLoop();

// =============================================================
// GSAP SCROLLTRIGGER — scene tied to scroll position
// =============================================================
if (!prefersReducedMotion) {
  // Whole-page scroll: continuous group rotation + camera dolly
  gsap.to(sceneGroup.rotation, {
    y: Math.PI * 2,
    ease: 'none',
    scrollTrigger: {
      trigger: document.body,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
    },
  });

  gsap.to(camera.position, {
    z: 5.5,
    ease: 'none',
    scrollTrigger: {
      trigger: document.body,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
    },
  });

  // Per-section: core wireframe "breathes" as each section enters view.
  // Edit SECTION_SCALE below to change how pronounced this is.
  const SECTION_SCALE = {
    hero: 1,
    about: 1.15,
    projects: 1.35,
    skills: 1.15,
    achievements: 1.25,
    contact: 0.9,
  };

  SECTIONS.forEach(({ id }) => {
    const targetScale = SECTION_SCALE[id] ?? 1;
    gsap.to(coreMesh.scale, {
      x: targetScale,
      y: targetScale,
      z: targetScale,
      ease: 'power1.inOut',
      scrollTrigger: {
        trigger: `#${id}`,
        start: 'top center',
        end: 'bottom center',
        scrub: true,
      },
    });
  });
}

// =============================================================
// RESIZE HANDLER
// =============================================================
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// =============================================================
// NAV SCROLLSPY + TERMINAL BREADCRUMB
// Uses GSAP ScrollTrigger (already loaded) instead of a second
// observer API, so there's one scroll-tracking mechanism in the
// whole file.
// =============================================================
const terminalPathEl = document.getElementById('terminal-path');
const navDots = Array.from(document.querySelectorAll('.nav-dot'));

function setActiveSection(id) {
  const section = SECTIONS.find((s) => s.id === id);
  if (!section) return;

  if (terminalPathEl) {
    terminalPathEl.textContent = section.path;
  }

  navDots.forEach((dot) => {
    dot.classList.toggle('active', dot.dataset.target === id);
  });
}

SECTIONS.forEach(({ id }) => {
  ScrollTrigger.create({
    trigger: `#${id}`,
    start: 'top center',
    end: 'bottom center',
    onEnter: () => setActiveSection(id),
    onEnterBack: () => setActiveSection(id),
  });
});

// Nav click -> smooth scroll to section
navDots.forEach((dot) => {
  dot.addEventListener('click', () => {
    const target = document.getElementById(dot.dataset.target);
    if (target) {
      target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    }
  });
});

// Set initial state on load
setActiveSection('hero');
