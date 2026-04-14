

'use strict';

const START_DATE = new Date(2026, 2, 21);
const SECRET_KEY = 'diego';

const loveMessages = [
  "Eres la razón por la que sonrío al solo pensarte mi vida.",
  "Contigo, cada día se convierte especial.",
  "Gracias por elegirme todos los días. Te amo más de lo que las palabras y las acciónes puedn decir mi vida.",
  "Eres y seras mi lugar favorito en el mundo entero.",
  "Cuando te miro a los ojos me haces sentir tan seguro y amado. ",
  "Gracias por llegar a mi viday hacerme el hombre más feliz del universo.",
  "Eres lo más bonita de mi vida.",
  "Te amo profundamente mi vida",
  "Desde que estoy contigo nunca me habia sentido tan feliz mi vida",
  "Eres maravillosa mi vida y me haces sentir el hombre más amado y feliz del universo.",
  "Eres y seras mi persona favorita en el universo entero.",
  "Gracias por hacerme sentir que valgo la pena.",
  "Eres la mujer que siempre soñe tener a mi lado.",
  "Haces que mi corazón se siente tan lleno de amor cada día.",
  "Eres la razón por la cual trato de ser mejor cada día para darte la mejor versión de mi.",
  "Contigo el silencio se siente bonito.",
  "Fuiste la razón por la cual volvi a creer en el amor.",
  "Siempre te eligire a ti mi vida hermosa.",
  "Eres la mujer mas hermosa, maravillosa, perfecta del mundo.",
  "Me encanta saber que estoy contigo en esta vida y somos un equipo en todo",
  "Haberte conocido fue de lo mejor que me pudo pasar en la vida",
  "Te amooo puchisss",
  "Mi cabeza solo piensa en ti y siempre sera así mi vida hermosa",
  "Todas las canciones bonitas siempre me recordaran a ti",
  "Eres mi lugar seguro mi vida",
  "Contigo quiero todo en esta vida.",
  "Eres la mejor parte de mi vida y siempre lo seras mi vida hermosa.",
];

let lastMessageIndex = -1;
let audioEnabled = false;
let currentPhotoIndex = null;
let heartAnimFrame = null;

function goToMain() {
  const welcome = document.getElementById('welcomeScreen');
  const main    = document.getElementById('mainScreen');

  welcome.style.transition = 'opacity .5s ease';
  welcome.style.opacity = '0';

  setTimeout(() => {
    welcome.classList.remove('active');
    welcome.style.display = 'none';
    main.classList.add('active');
    main.style.opacity = '0';
    main.style.transition = 'opacity .5s ease';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        main.style.opacity = '1';
      });
    });
  }, 500);
}

function updateDayCounter() {
  const now   = new Date();
  const diff  = Math.floor((now - START_DATE) / (1000 * 60 * 60 * 24));
  const el    = document.getElementById('dayCounter');
  const dateEl = document.getElementById('counterDate');

  if (el) {
    animateCount(el, 0, diff, 1200);
  }

  if (dateEl) {
    const opts = { year: 'numeric', month: 'long', day: 'numeric' };
    dateEl.textContent = `Desde el ${START_DATE.toLocaleDateString('es-MX', opts)}`;
  }
}

function animateCount(el, from, to, duration) {
  const start = performance.now();
  function step(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); 
    el.textContent = Math.floor(from + (to - from) * eased).toLocaleString();
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function showLoveMessage() {
  const textEl = document.getElementById('messageText');
  const card   = document.getElementById('messageCard');
  const btn    = document.getElementById('loveBtn');

  btn.style.transform = 'scale(0.96)';
  setTimeout(() => btn.style.transform = '', 150);

  let idx;
  do { idx = Math.floor(Math.random() * loveMessages.length); }
  while (idx === lastMessageIndex);
  lastMessageIndex = idx;

  textEl.style.transition = 'opacity .25s ease, transform .25s ease';
  textEl.style.opacity = '0';
  textEl.style.transform = 'translateY(8px)';

  setTimeout(() => {
    textEl.textContent = loveMessages[idx];
    textEl.style.opacity = '1';
    textEl.style.transform = 'translateY(0)';
  }, 260);

  card.classList.remove('pop');
  void card.offsetWidth;
  card.classList.add('pop');


  spawnHeartBurst(btn);
}

// ─── NAVEGACIÓN POR TABS ─────────────────────────────────────────────────

let currentTab = 'home';

function switchTab(tab, btnEl) {
  // Actualizar botones de nav
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');

  // Ocultar/mostrar secciones
  const galleryTab = document.getElementById('galleryTab');
  const secretTab  = document.getElementById('secretTab');
  const mainContent = document.getElementById('mainScreen');

  galleryTab.classList.add('hidden');
  secretTab.classList.add('hidden');

  if (tab === 'gallery') {
    galleryTab.classList.remove('hidden');
    loadSavedPhotos();
  } else if (tab === 'secret') {
    secretTab.classList.remove('hidden');
    // Resetear estado del secreto
    document.getElementById('secretHint').textContent = '';
  }

  currentTab = tab;
}

// ─── GALERÍA DE FOTOS ────────────────────────────────────────────────────

let activePhotoSlot = 0;

function addPhoto(index) {
  const existingImg = document.getElementById(`photo${index}`);
  if (existingImg && !existingImg.classList.contains('hidden')) {
    openLightbox(existingImg.src);
    return;
  }

  activePhotoSlot = index;
  document.getElementById('fileInput').click();
}

function loadPhoto(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const slot = activePhotoSlot;
    const imgEl = document.getElementById(`photo${slot}`);
    const placeholder = imgEl.previousElementSibling;

    imgEl.src = e.target.result;
    imgEl.classList.remove('hidden');
    if (placeholder) placeholder.style.display = 'none';

    // Guardar en localStorage
    try {
      localStorage.setItem(`lovenote_photo_${slot}`, e.target.result);
    } catch(err) {
      // Silently ignore storage quota errors
    }
  };
  reader.readAsDataURL(file);
  event.target.value = ''; // reset input
}

function loadSavedPhotos() {
  for (let i = 0; i < 6; i++) {
    const saved = localStorage.getItem(`lovenote_photo_${i}`);
    if (saved) {
      const imgEl = document.getElementById(`photo${i}`);
      const placeholder = imgEl ? imgEl.previousElementSibling : null;
      if (imgEl) {
        imgEl.src = saved;
        imgEl.classList.remove('hidden');
        if (placeholder) placeholder.style.display = 'none';
      }
    }
  }
}

function openLightbox(src) {
  const lb    = document.getElementById('lightbox');
  const lbImg = document.getElementById('lightboxImg');
  lbImg.src = src;
  lb.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  document.getElementById('lightbox').classList.add('hidden');
  document.body.style.overflow = '';
}

// ─── MENSAJE SECRETO ─────────────────────────────────────────────────────

function unlockSecret() {
  const input  = document.getElementById('secretInput');
  const hint   = document.getElementById('secretHint');
  const val    = input.value.trim().toLowerCase();

  if (val === SECRET_KEY) {
    hint.textContent = '';
    document.getElementById('secretLock').classList.add('hidden');
    document.getElementById('secretReveal').classList.remove('hidden');
    spawnHeartRain();
  } else if (val === '') {
    hint.textContent = 'Escribe el nombre del que te gusta';
  } else {
    hint.textContent = '¡Neeel incorrecto! La contra es mi nombre ';
    input.value = '';
    input.style.borderColor = 'var(--coral)';
    setTimeout(() => input.style.borderColor = '', 1500);
  }
}

function lockSecret() {
  document.getElementById('secretReveal').classList.add('hidden');
  document.getElementById('secretLock').classList.remove('hidden');
  document.getElementById('secretInput').value = '';
}

// ─── AUDIO ───────────────────────────────────────────────────────────────

function toggleAudio() {
  const audio   = document.getElementById('bgMusic');
  const btn     = document.getElementById('audioBtn');
  const icon    = document.getElementById('audioIcon');

  if (!audio.src && !audio.querySelector('source')) {
    // Sin fuente de audio configurada
    icon.textContent = '🎵';
    btn.title = 'Agrega una canción en el HTML (etiqueta <source>)';
    return;
  }

  if (audioEnabled) {
    audio.pause();
    audioEnabled = false;
    icon.textContent = '🔇';
    btn.classList.add('muted');
  } else {
    audio.play().then(() => {
      audioEnabled = true;
      icon.textContent = '🎵';
      btn.classList.remove('muted');
    }).catch(() => {
      icon.textContent = '🎵';
    });
  }
}

// ─── CORAZONES FLOTANTES (CANVAS) ────────────────────────────────────────

const canvas = document.getElementById('heartCanvas');
const ctx    = canvas.getContext('2d');
let hearts   = [];

class FloatingHeart {
  constructor() { this.reset(true); }

  reset(initial = false) {
    this.x    = Math.random() * canvas.width;
    this.y    = initial ? Math.random() * canvas.height : canvas.height + 20;
    this.size = 10 + Math.random() * 18;
    this.speed = 0.4 + Math.random() * 0.6;
    this.sway  = Math.random() * 2 - 1;
    this.swaySpeed = 0.01 + Math.random() * 0.015;
    this.swayAngle = Math.random() * Math.PI * 2;
    this.opacity = 0.06 + Math.random() * 0.12;
    this.rotation = (Math.random() - 0.5) * 0.3;
    this.hue  = 330 + Math.random() * 30; 
  }

  update() {
    this.y -= this.speed;
    this.swayAngle += this.swaySpeed;
    this.x += Math.sin(this.swayAngle) * this.sway;

    if (this.y < -this.size * 2) this.reset();
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    const s = this.size;
    ctx.fillStyle = `hsl(${this.hue}, 80%, 70%)`;
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.3);
    ctx.bezierCurveTo( s * 0.5, -s, s, -s * 0.4,  s * 0.5, s * 0.2);
    ctx.bezierCurveTo( s * 0.2,  s * 0.6, 0, s,      0,     s);
    ctx.bezierCurveTo(0, s,     -s * 0.2, s * 0.6, -s * 0.5, s * 0.2);
    ctx.bezierCurveTo(-s, -s * 0.4, -s * 0.5, -s,    0,     -s * 0.3);
    ctx.fill();
    ctx.restore();
  }
}

function resizeCanvas() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}

function initHearts(count = 22) {
  hearts = [];
  for (let i = 0; i < count; i++) hearts.push(new FloatingHeart());
}

function animateHearts() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  hearts.forEach(h => { h.update(); h.draw(); });
  heartAnimFrame = requestAnimationFrame(animateHearts);
}

// ─── EFECTO AL TOCAR LA PANTALLA ─────────────────────────────────────────

const touchParticles = document.getElementById('touchParticles');

document.addEventListener('touchstart', (e) => {
  const touch = e.touches[0];
  spawnTouchHeart(touch.clientX, touch.clientY);
}, { passive: true });

document.addEventListener('mousedown', (e) => {
  spawnTouchHeart(e.clientX, e.clientY);
}, { passive: true });

function spawnTouchHeart(x, y) {
  const emojis = ['💕', '❤️', '💖'];
  const count  = 1 + Math.floor(Math.random() * 2);

  for (let i = 0; i < count; i++) {
    const el = document.createElement('span');
    el.className = 'touch-heart';
    el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    el.style.left   = `${x - 12 + (Math.random() - 0.5) * 24}px`;
    el.style.top    = `${y - 12}px`;
    el.style.fontSize = `${0.9 + Math.random() * 0.7}rem`;
    touchParticles.appendChild(el);
    setTimeout(() => el.remove(), 1300);
  }
}

// ─── RÁFAGA DE CORAZONES (clic en botón) ─────────────────────────────────

function spawnHeartBurst(el) {
  const rect = el.getBoundingClientRect();
  const cx   = rect.left + rect.width / 2;
  const cy   = rect.top  + rect.height / 2;

  const emojis = ['💖', '💕', '❤️'];
  for (let i = 0; i < 7; i++) {
    setTimeout(() => {
      const heart = document.createElement('span');
      heart.className = 'touch-heart';
      heart.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      heart.style.left     = `${cx - 10 + (Math.random() - 0.5) * 60}px`;
      heart.style.top      = `${cy - 10}px`;
      heart.style.fontSize = `${1.2 + Math.random() * 0.6}rem`;
      touchParticles.appendChild(heart);
      setTimeout(() => heart.remove(), 1300);
    }, i * 70);
  }
}

// ─── LLUVIA DE CORAZONES (secreto desbloqueado) ──────────────────────────

function spawnHeartRain() {
  for (let i = 0; i < 30; i++) {
    setTimeout(() => {
      const x = Math.random() * window.innerWidth;
      const y = Math.random() * (window.innerHeight * 0.5);
      spawnTouchHeart(x, y);
    }, i * 80);
  }
}

// ─── SERVICE WORKER ──────────────────────────────────────────────────────

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js')
      .then(reg => console.log('SW registrado:', reg.scope))
      .catch(err => console.warn('SW error:', err));
  }
}

// ─── INIT ────────────────────────────────────────────────────────────────

function init() {
  resizeCanvas();
  window.addEventListener('resize', () => {
    resizeCanvas();
    initHearts();
  });
  initHearts();
  animateHearts();
  updateDayCounter();
  registerServiceWorker();

  // Cargar fotos guardadas al entrar en galería
  // (se llama también en switchTab)

  const secretInput = document.getElementById('secretInput');
  if (secretInput) {
    secretInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') unlockSecret();
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
