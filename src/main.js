import * as THREE from 'three';
import './style.css';

const canvas = document.getElementById('bg-canvas');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer({
  canvas,
  alpha: true,
  antialias: false,
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
camera.position.z = 50;

const isMobile = window.innerWidth < 768;
const PARTICLE_COUNT = isMobile ? 600 : 1800;
const positions = new Float32Array(PARTICLE_COUNT * 3);
const velocities = new Float32Array(PARTICLE_COUNT);

for (let i = 0; i < PARTICLE_COUNT; i++) {
  positions[i * 3] = (Math.random() - 0.5) * 200;
  positions[i * 3 + 1] = (Math.random() - 0.5) * 200;
  positions[i * 3 + 2] = (Math.random() - 0.5) * 200;
  velocities[i] = Math.random() * 0.02 + 0.005;
}

const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

const material = new THREE.PointsMaterial({
  color: 0xffffff,
  size: isMobile ? 1.2 : 1.5,
  sizeAttenuation: true,
  transparent: true,
  opacity: 0.8,
});

const particles = new THREE.Points(geometry, material);
scene.add(particles);

let mouseX = 0;
let mouseY = 0;
let targetMouseX = 0;
let targetMouseY = 0;

document.addEventListener('mousemove', (e) => {
  targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
  targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
});

function animate() {
  requestAnimationFrame(animate);

  mouseX += (targetMouseX - mouseX) * 0.05;
  mouseY += (targetMouseY - mouseY) * 0.05;

  particles.rotation.y += 0.0003;
  particles.rotation.x += 0.0001;

  camera.position.x = mouseX * 3;
  camera.position.y = -mouseY * 3;
  camera.lookAt(scene.position);

  const pos = geometry.attributes.position.array;
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    pos[i * 3 + 1] -= velocities[i];
    if (pos[i * 3 + 1] < -100) {
      pos[i * 3 + 1] = 100;
    }
  }
  geometry.attributes.position.needsUpdate = true;

  renderer.render(scene, camera);
}

animate();

let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }, 150);
});

function typeText(element, text, speed = 60) {
  return new Promise((resolve) => {
    let i = 0;
    element.textContent = '';
    function step() {
      if (i < text.length) {
        element.textContent += text.charAt(i);
        i++;
        setTimeout(step, speed);
      } else {
        resolve();
      }
    }
    step();
  });
}

const heroEl = document.getElementById('hero-typing');
if (heroEl) {
  const lines = [
    "Full-stack developer.",
    "Building AI microservices, responsibly caffeinated.",
    "Curious about robotics & IoT — and where the robots hide.",
    "Vue · Node · Python",
    "Automating everything I can (including my coffee timer).",
    "Always learning, always shipping — on schedule, mostly.",
    "Designing clean, scalable APIs.",
    "Optimizing performance, one query at a time.",
    "Shipping delightful user experiences.",
    "Learning by building in public.",
    "Turning ideas into reliable systems.",
  ];

  async function runTypingSequence() {
    for (const line of lines) {
      await typeText(heroEl, line, 55);
      await new Promise((r) => setTimeout(r, 2000));
    }
    runTypingSequence();
  }

  setTimeout(() => runTypingSequence(), 600);
}

const fadeObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  },
  { threshold: 0.1 }
);

document.querySelectorAll('.fade-in').forEach((el) => fadeObserver.observe(el));

document.querySelectorAll('.nav-list a').forEach((link) => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

const konamiSequence = [
  'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
  'b', 'a',
];
let konamiIdx = 0;

document.addEventListener('keydown', (e) => {
  if (e.key === konamiSequence[konamiIdx]) {
    konamiIdx++;
    if (konamiIdx === konamiSequence.length) {
      triggerGlitch();
      konamiIdx = 0;
    }
  } else {
    konamiIdx = 0;
  }
});

function triggerGlitch() {
  const wrapper = document.querySelector('.terminal-wrapper');
  wrapper.classList.add('glitch-active');

  document.body.style.filter = 'invert(1)';
  setTimeout(() => {
    document.body.style.filter = 'none';
  }, 100);
  setTimeout(() => {
    document.body.style.filter = 'invert(1)';
  }, 200);
  setTimeout(() => {
    document.body.style.filter = 'none';
    wrapper.classList.remove('glitch-active');
  }, 300);
}
