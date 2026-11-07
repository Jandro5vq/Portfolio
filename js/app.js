/* Plan: una sola noche. Bosque panorámico a 360° en canvas, oscuridad casi total,
   la hoguera es el único color fuerte; la interfaz es un "radio de señales" discreto. */
(() => {
'use strict';

const BASE = window.HOGUERA_CONTENT;
const SET = window.HOGUERA_SETTINGS;
const AudioEng = window.HogueraAudio;

/* ---------- idioma ----------
   CONFIG = datos comunes + los del idioma activo; TX = textos de la interfaz.
   Al cambiar de idioma se reemplazan y se vuelve a pintar el texto, sin recargar ni perder el progreso. */
const LANGS = Object.keys(BASE.i18n);
let LANG = '', CONFIG = BASE, TX = null;
function pickLang(){
  const ok = (l) => (l && BASE.i18n[l] ? l : null);
  let fromUrl = null, saved = null;
  try { fromUrl = new URLSearchParams(location.search).get('lang'); } catch (e) {}
  try { saved = localStorage.getItem('hoguera-lang'); } catch (e) {}
  const fromBrowser = (navigator.languages || [navigator.language || '']).map(l => String(l).slice(0, 2).toLowerCase()).find(ok);
  return ok(fromUrl) || ok(saved) || fromBrowser || ok(BASE.defaultLang) || LANGS[0];
}
function setLangData(lang){
  const L = BASE.i18n[lang];
  LANG = lang; TX = L.texts;
  CONFIG = Object.assign({}, BASE, {
    role: L.role, sampleNote: L.sampleNote || '',
    inspiration: BASE.inspiration ? Object.assign({}, BASE.inspiration, L.inspiration) : null
  });
  for (const fr of BASE.friends) Object.assign(fr, L.friends[fr.id]);
}
setLangData(pickLang());

/* ---------- utilidades ---------- */
const $ = (s) => document.querySelector(s);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const TAU = Math.PI * 2;
const wrapHalf = (d) => { d = d - Math.floor(d); return d >= 0.5 ? d - 1 : d; };
const hexRgb = (h) => { const n = parseInt(h.slice(1), 16); return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`; };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function mulberry32(a){ return function(){ a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const media = (q) => !!(window.matchMedia && matchMedia(q).matches);
const reduced = media('(prefers-reduced-motion: reduce)');
const coarse = media('(pointer: coarse)');
// Sustituye {clave} por su valor; {name} y {owner} siempre están disponibles
const tpl = (s, vars = {}) => String(s).replace(/\{(\w+)\}/g, (m, k) => k in vars ? vars[k] : k === 'name' ? CONFIG.firstName : k === 'owner' ? CONFIG.owner : m);

function contactHTML(){
  const e = esc(CONFIG.email);
  return `<div class="email-row"><a class="email" href="mailto:${e}">${e}</a><button class="btn copy" type="button" data-copy="${e}">${esc(TX.copy.idle)}</button></div>
    <ul class="linklist">${CONFIG.links.map(l => `<li><a class="btn" href="${esc(l.href)}" target="_blank" rel="noopener">${esc(l.label)} ↗</a></li>`).join('')}</ul>`;
}
const fill = (s) => tpl(s).replace('{{contact}}', contactHTML());

/* ---------- referencias del DOM (se buscan una sola vez) ---------- */
const el = {
  hud: $('#hud'), signals: $('#signals'), tunedName: $('#tuned-name'), count: $('#count'), total: $('#total'),
  toast: $('#toast'), edgeL: $('#edge-left'), edgeR: $('#edge-right'), talk: $('#btn-talk'), enter: $('#btn-enter'),
  panel: $('#panel'), panelBody: $('.panel-body'), panelFreq: $('#panel-freq'), panelName: $('#panel-name'), panelGreet: $('#panel-greet'),
  panelSection: $('#panel-section'), panelContent: $('#panel-content'), panelJoin: $('#panel-join'), panelClose: $('#panel-close'),
  intro: $('#intro'), introTitle: $('#intro-title'), introLede: $('#intro-lede'), introNote: $('#intro-note'), start: $('#btn-start'), startClassic: $('#btn-start-classic'),
  classic: $('#classic'), classicInner: $('#classic-inner'), classicClose: $('#classic-close'), btnClassic: $('#btn-classic'),
  sound: $('#btn-sound'), volWrap: $('.vol'), vol: $('#vol'), volOut: $('#vol-out'),
  ending: $('#ending'), endingEyebrow: $('#ending-eyebrow'), endingTitle: $('#ending-title'), endingText: $('#ending-text'),
  endingContact: $('#ending-contact'), endingCredit: $('#ending-credit'), again: $('#btn-again'), scope: $('#scope')
};
el.edgeLText = el.edgeL.querySelector('span'); el.edgeRText = el.edgeR.querySelector('span');

/* ---------- canvas ---------- */
const canvas = $('#scene');
const ctx = canvas.getContext('2d');
const mask = document.createElement('canvas');
const mctx = mask.getContext('2d');
const LAYERS = SET.world.layers;
const FIRE_LAYER = SET.world.fireLayer;
const SEATS = SET.world.seats;
// GH: alto del "mundo" (en móvil deja sitio al radio para que no tape la hoguera).
// PW: ancho de referencia de la panorámica; en vertical no se estrecha, solo se ve una ventana más pequeña.
let W = 0, H = 0, GH = 0, PW = 0, DPR = 1, S = 1;
// Degradados y fuentes que solo dependen del tamaño: se crean en resize, no en cada fotograma
const G = { sky: null, dark: null, fog: [], fontName: '', fontTag: '' };
function resize(){
  DPR = Math.min(coarse ? SET.render.maxDPRTouch : SET.render.maxDPR, window.devicePixelRatio || 1);
  W = window.innerWidth; H = window.innerHeight;
  const hudH = el.hud.offsetHeight;
  document.documentElement.style.setProperty('--hud-h', hudH + 'px');
  // nunca menos de la mitad de la pantalla (ni negativo si la ventana es muy baja o aún mide 0)
  GH = W < SET.render.mobileBreakpoint ? Math.max(H * 0.5, H - hudH * 0.8) : H;
  PW = Math.max(W, GH * SET.world.panoramaAspect);
  S = GH / 900;
  canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  // La máscara son degradados suaves: a 1x no se nota y cuesta mucho menos.
  mask.width = Math.round(W); mask.height = Math.round(H);
  const r = el.scope.getBoundingClientRect();
  if (r.width) { el.scope.width = Math.round(r.width * DPR); el.scope.height = Math.round(r.height * DPR); }

  G.sky = ctx.createLinearGradient(0, 0, 0, GH * 0.8);
  G.sky.addColorStop(0, '#02040a'); G.sky.addColorStop(0.55, '#0b1226'); G.sky.addColorStop(1, '#1a2242');
  G.dark = mctx.createLinearGradient(0, 0, 0, H);
  G.dark.addColorStop(0, 'rgba(2,3,9,.42)'); G.dark.addColorStop(0.58, 'rgba(2,3,9,.74)'); G.dark.addColorStop(1, 'rgba(2,3,9,.95)');
  G.fog = LAYERS.slice(0, -1).map((L, li) => {
    const nb = LAYERS[li + 1].base * GH, top = nb - GH * 0.24, g = ctx.createLinearGradient(0, top, 0, nb + GH * 0.03);
    g.addColorStop(0, 'rgba(58,76,122,0)'); g.addColorStop(0.8, 'rgba(58,76,122,0.09)'); g.addColorStop(1, 'rgba(58,76,122,0)');
    return { g, top };
  });
  G.fontName = `400 ${Math.round(clamp(16 * S, 13, 18))}px Gloock, Georgia, serif`;
  G.fontTag = `400 ${Math.round(clamp(10 * S, 9, 11))}px "Martian Mono", monospace`;
}
let resizeRaf = 0;
window.addEventListener('resize', () => { cancelAnimationFrame(resizeRaf); resizeRaf = requestAnimationFrame(resize); });
window.addEventListener('orientationchange', () => setTimeout(resize, 250));

function makeSprite(rgb, stops = [[0, 1], [0.22, 0.55], [0.55, 0.14], [1, 0]]){
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'); const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  for (const [o, a] of stops) gr.addColorStop(o, `rgba(${rgb},${a})`);
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return c;
}
const SP = {
  core: makeSprite('255,240,200'), flame: makeSprite('255,150,60'), ember: makeSprite('255,80,30'),
  warm: makeSprite('255,140,60'), white: makeSprite('235,240,255'), orb: makeSprite('150,170,255'), violet: makeSprite('190,150,255'),
  // "agujero" de luz en la máscara de oscuridad; la intensidad se da con globalAlpha
  hole: makeSprite('0,0,0', [[0, 1], [0.5, 0.55], [1, 0]])
};
function sprite(sp, x, y, r, a){ if (a <= 0.003 || r <= 0) return; ctx.globalAlpha = Math.min(1, a); ctx.drawImage(sp, x - r, y - r, r * 2, r * 2); }
function hole(x, y, r, a){ if (a <= 0 || r <= 0) return; mctx.globalAlpha = Math.min(1, a); mctx.drawImage(SP.hole, x - r, y - r, r * 2, r * 2); }

/* ---------- mundo ---------- */
let FRIENDS = BASE.friends;
if (FRIENDS.length > SEATS.length) { console.warn(`Hay ${FRIENDS.length} viajeros y solo ${SEATS.length} sitios junto al fuego (settings.world.seats).`); FRIENDS = FRIENDS.slice(0, SEATS.length); }
FRIENDS.forEach((fr, i) => {
  if (!SET.music.voices[fr.voice]) console.warn(`La voz "${fr.voice}" de ${fr.name} no existe en settings.music.voices.`);
  Object.assign(fr, { index: i, rgb: hexRgb(fr.color), labelA: 0, bbox: null, glow: null, strength: 0, slot: -1, found: false, ui: {} });
  fr.sp = makeSprite(fr.rgb); fr.instFill = `rgba(${fr.rgb},.55)`;
});
const BEHIND_SEAT = SEATS.length - 1;

const rnd = mulberry32(SET.world.seed);
function excluded(li, f, w){
  const k = LAYERS[li].k;
  for (const c of SET.world.clearings) if (c.layer === li && Math.abs(wrapHalf(f)) < c.half) return true;
  for (const fr of FRIENDS) {
    if (fr.layer <= li) { const ex = (w / 2 + 0.06) / (1.6 * k); if (Math.abs(wrapHalf(f - fr.f)) < ex) return true; }
  }
  return false;
}
const TREES = LAYERS.map((L, li) => {
  const arr = []; let tries = 0;
  while (arr.length < L.count && tries < L.count * 30) {
    tries++;
    const f = rnd(), h = L.hMin + rnd() * (L.hMax - L.hMin), w = h * (0.3 + rnd() * 0.18);
    if (excluded(li, f, w)) continue;
    arr.push({ f, h, w, tiers: 3 + Math.floor(rnd() * 3), gy: 0 });
  }
  return arr;
});
const STARS = Array.from({ length: SET.world.stars }, () => ({ f: rnd(), y: Math.pow(rnd(), 1.3) * 0.62, r: rnd() < 0.08 ? 2 : (rnd() < 0.5 ? 1.4 : 1), b: 0.35 + rnd() * 0.65, tw: 0.5 + rnd() * 2.5, ph: rnd() * TAU, die: 0 }));
let starsAlive = STARS.length;

const groundRel = (li, f) => LAYERS[li].base + 0.006 * Math.sin(TAU * f * 6 + li * 1.7) + 0.004 * Math.sin(TAU * f * 13 + li);
// La altura del suelo bajo cada árbol no cambia: se calcula una vez
TREES.forEach((arr, li) => arr.forEach(t => { t.gy = groundRel(li, t.f); }));
const groundY = (li, f) => groundRel(li, f) * GH;
const sxOf = (li, f) => W / 2 + wrapHalf(f - camF) * LAYERS[li].k * PW;
const ridgeY = (f) => GH * (0.645 - 0.03 - 0.028 * Math.sin(TAU * f * 3 + 0.7) - 0.018 * Math.sin(TAU * f * 8 + 2.1) - 0.008 * Math.sin(TAU * f * 19));

/* ---------- estado ---------- */
let phase = 'intro';
let camF = 0.02, camVel = 0, keyDir = 0, panTo = null;
let fireLitAt = -1, fireLevel = 0;
let gatherStart = 0, gatherReturn = false, flashStart = 0, uniStart = 0;
const foundOrder = [];
let tuned = null, openFriend = null, hovered = null;
const pointer = { x: 0, y: 0, active: false, touch: false };
let lastStarDeath = 0;
const flames = [], sparks = [];
let bang = [], planets = [];
const inPlay = () => phase === 'forest' || phase === 'gathered';

/* ---------- textos (se repintan al cambiar de idioma) ---------- */
el.total.textContent = FRIENDS.length;
el.hud.style.setProperty('--n', FRIENDS.length);
function renderLanguage(){
  document.documentElement.lang = LANG;
  document.title = tpl(TX.pageTitle);
  $('#brand-name').textContent = CONFIG.owner;
  // textos sueltos del HTML: data-i18n (texto), data-i18n-html (con marcado), data-i18n-aria / data-i18n-title (atributos)
  for (const n of document.querySelectorAll('[data-i18n]')) n.textContent = TX.ui[n.dataset.i18n];
  for (const n of document.querySelectorAll('[data-i18n-html]')) n.innerHTML = tpl(TX.ui[n.dataset.i18nHtml], { max: MAX_KEY });
  for (const n of document.querySelectorAll('[data-i18n-aria]')) n.setAttribute('aria-label', TX.ui[n.dataset.i18nAria]);
  for (const n of document.querySelectorAll('[data-i18n-title]')) n.title = TX.ui[n.dataset.i18nTitle];
  const next = LANGS[(LANGS.indexOf(LANG) + 1) % LANGS.length];
  for (const b of document.querySelectorAll('.lang-toggle')) {
    b.textContent = BASE.i18n[next].short; b.lang = next;
    b.setAttribute('aria-label', TX.ui.switchLang); b.title = TX.ui.switchLang;
  }
  // intro: la última palabra del título se apaga letra a letra
  el.introTitle.innerHTML = `${esc(TX.intro.title)} <span class="out" aria-label="${esc(TX.intro.titleFade)}">${
    Array.from(TX.intro.titleFade).map((ch, i) => ch === ' ' ? ' ' : `<span aria-hidden="true" style="animation-delay:${1.2 + i * 0.28}s">${esc(ch)}</span>`).join('')}</span>`;
  el.introLede.textContent = tpl(TX.intro.lede);
  el.introNote.textContent = coarse ? TX.intro.noteTouch : TX.intro.note;
  el.start.textContent = foundOrder.length ? TX.intro.startAgain : TX.intro.start;
  el.startClassic.textContent = TX.intro.classic;
  el.classicClose.textContent = TX.classic.back;
  el.enter.textContent = TX.enterOrb;
  el.panelJoin.textContent = TX.panel.join;
  el.endingEyebrow.textContent = TX.ending.eyebrow;
  el.endingTitle.textContent = TX.ending.title;
  el.endingText.textContent = tpl(TX.ending.text);
  el.again.textContent = TX.ending.again;
  renderCounter();
  el.endingContact.innerHTML = contactHTML();
  el.endingCredit.innerHTML = '';
  if (CONFIG.inspiration) {
    const ins = CONFIG.inspiration;
    const link = `<a href="${esc(ins.href)}" target="_blank" rel="noopener">${esc(ins.title)}</a>`;
    el.endingCredit.innerHTML = esc(TX.ending.credit).replace('{link}', link).replace('{by}', esc(ins.by));
  }
  // radio, botones y paneles abiertos
  for (const fr of FRIENDS) { fr.ui.name.textContent = fr.found ? fr.section : fr.instrument; fr.ui.lastState = ''; }
  el.edgeLText.textContent = el.edgeRText.textContent = '';
  tune(tuned);
  const t = talkFriend; talkFriend = null; setTalk(t);
  if (el.sound.disabled) el.sound.textContent = TX.sound.none; else setMutedUI(AudioEng.muted);
  applyVolume(+el.vol.value, false);
  classicBuilt = false; if (!el.classic.hidden) buildClassic();
  if (openFriend && !el.panel.hidden) openPanel(openFriend);
}
function switchLang(){
  const next = LANGS[(LANGS.indexOf(LANG) + 1) % LANGS.length];
  setLangData(next);
  try { localStorage.setItem('hoguera-lang', next); } catch (e) {}
  // si el enlace traía ?lang=, se actualiza para que recargar no devuelva al idioma anterior
  try { const u = new URL(location.href); if (u.searchParams.has('lang')) { u.searchParams.set('lang', next); history.replaceState(null, '', u); } } catch (e) {}
  renderLanguage();
}

/* ---------- radio de señales ---------- */
FRIENDS.forEach((fr, i) => {
  const li = document.createElement('li');
  li.style.setProperty('--c', fr.color);
  li.innerHTML = `<button type="button" aria-pressed="false" data-id="${esc(fr.id)}">
    <span class="sig-i">${String(i + 1).padStart(2, '0')}</span><span class="sig-name">${esc(fr.instrument)}</span>
    <span class="meter"><i></i></span><span class="sig-state">${esc(TX.signal.far)}</span></button>`;
  const btn = li.querySelector('button');
  btn.addEventListener('click', () => tune(tuned === fr ? null : fr));
  fr.ui = { row: li, btn, meter: li.querySelector('.meter i'), state: li.querySelector('.sig-state'), name: li.querySelector('.sig-name'), lastMeter: -1, lastState: '' };
  el.signals.appendChild(li);
});
function tune(fr){
  tuned = fr;
  for (const f of FRIENDS) f.ui.btn.setAttribute('aria-pressed', String(f === fr));
  el.tunedName.textContent = fr ? fr.instrument : TX.signal.all;
}

// Botón para hablar sin tener que acertar con el dedo en la figura
let talkFriend = null;
el.talk.addEventListener('click', () => { if (talkFriend) openPanel(talkFriend); });
function setTalk(fr){
  if (fr === talkFriend) return;
  talkFriend = fr; el.talk.hidden = !fr;
  if (fr) { el.talk.textContent = tpl(TX.talk, { friend: fr.name }); el.talk.style.setProperty('--c', fr.color); el.talk.style.setProperty('--rgb', fr.rgb); }
}
// Las flechas laterales llevan la vista hacia la señal sintonizada
for (const b of [el.edgeL, el.edgeR]) b.addEventListener('click', () => { if (tuned) panTo = tuned.f; });

let toastTimer = 0;
function toast(msg, ms = 3400){
  el.toast.textContent = msg; el.toast.classList.add('on');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.toast.classList.remove('on'), ms);
}

function setPhase(p){ phase = p; document.body.dataset.phase = p; }

/* ---------- panel ---------- */
function openPanel(fr){
  openFriend = fr;
  el.panel.style.setProperty('--c', fr.color);
  el.panelFreq.innerHTML = `${esc(TX.panel.freq)} ${String(fr.index + 1).padStart(2, '0')} · <b>${esc(fr.instrument)}</b>`;
  el.panelName.textContent = fr.name;
  el.panelGreet.textContent = fill(fr.greet);
  el.panelSection.textContent = fr.section;
  el.panelContent.innerHTML = (CONFIG.sampleNote ? `<p class="sample">${esc(CONFIG.sampleNote)}</p>` : '') + fill(fr.html);
  el.panelJoin.hidden = fr.found;
  el.panelClose.textContent = fr.found ? TX.panel.close : TX.panel.notNow;
  el.panel.hidden = false; setTalk(null);
  el.panelBody.scrollTop = 0;
  el.panelName.focus({ preventScroll: true });
}
function closePanel(){
  el.panel.hidden = true; const fr = openFriend; openFriend = null;
  if (fr && foundOrder.length === FRIENDS.length && phase === 'forest') setTimeout(startGathering, 500);
  canvas.focus({ preventScroll: true });
}
el.panelClose.addEventListener('click', closePanel);
el.panelJoin.addEventListener('click', () => { if (openFriend) markFound(openFriend); closePanel(); });

function markFound(fr, silent){
  if (fr.found) return;
  fr.found = true; foundOrder.push(fr.id); fr.slot = foundOrder.length - 1;
  fr.ui.name.textContent = fr.section;
  fr.ui.row.classList.add('found');
  el.count.textContent = foundOrder.length;
  if (silent) return;
  if (tuned === fr) tune(null);
  const left = FRIENDS.length - foundOrder.length;
  toast(tpl(left ? TX.hints.found : TX.hints.last, { friend: fr.name, left }));
}

function startGathering(){
  if (phase !== 'forest') return;
  setPhase('gathered'); gatherStart = performance.now() / 1000; gatherReturn = false;
  toast(TX.hints.gathered, 5200);
}

/* ---------- intro e inicio ---------- */
let introTimer = 0, introTimer2 = 0;
function beginForest(){
  if (phase !== 'intro') return;
  const ok = AudioEng.init(); if (ok) AudioEng.start();
  if (!ok) { el.sound.disabled = true; el.sound.textContent = TX.sound.none; }
  fireLitAt = performance.now() / 1000;
  panTo = 0; // la vista vuelve a la hoguera (en móvil se ve una ventana estrecha)
  el.intro.classList.add('leaving');
  clearTimeout(introTimer); introTimer = setTimeout(() => { el.intro.hidden = true; }, 1400);
  if (foundOrder.length === FRIENDS.length) { setPhase('gathered'); gatherStart = performance.now() / 1000 - 12; gatherReturn = true; }
  else { setPhase('forest'); introTimer2 = setTimeout(() => toast(TX.hints.start, 5200), 1800); }
}
el.start.addEventListener('click', beginForest);
el.startClassic.addEventListener('click', () => openClassic());

// Volver al inicio (clic en el nombre): conserva a los viajeros ya encontrados
function goHome(){
  if (!el.panel.hidden) { el.panel.hidden = true; openFriend = null; }
  closeClassic();
  if (phase === 'intro') return;
  clearTimeout(introTimer); clearTimeout(introTimer2);
  el.toast.classList.remove('on');
  el.enter.hidden = true; setTalk(null);
  setPhase('intro'); fireLitAt = -1; panTo = null; camVel = 0; keyDir = 0;
  AudioEng.quiet();
  el.start.textContent = foundOrder.length ? TX.intro.startAgain : TX.intro.start;
  el.intro.hidden = false;
  requestAnimationFrame(() => el.intro.classList.remove('leaving'));
  el.start.focus({ preventScroll: true });
}

/* ---------- sonido y volumen (el volumen se recuerda en este navegador) ---------- */
function setMutedUI(m){
  AudioEng.setMuted(m);
  el.sound.innerHTML = `<span class="long">${esc(m ? TX.sound.off : TX.sound.on)}</span><span class="short">${esc(m ? TX.sound.offShort : TX.sound.onShort)}</span>`;
  el.sound.setAttribute('aria-pressed', String(!m));
  el.volWrap.classList.toggle('off', m);
}
el.sound.addEventListener('click', () => setMutedUI(!AudioEng.muted));
function applyVolume(v, save){
  v = clamp(Math.round(v), 0, 100);
  el.vol.value = v; el.volOut.textContent = v; el.vol.style.setProperty('--p', v + '%');
  el.vol.setAttribute('aria-valuetext', v ? tpl(TX.ui.percent, { v }) : TX.ui.silence);
  AudioEng.setVolume(v / 100);
  if (save) { try { localStorage.setItem('hoguera-vol', String(v)); } catch (e) {} }
}
let savedVol = null;
try { savedVol = localStorage.getItem('hoguera-vol'); } catch (e) {}
applyVolume(savedVol !== null && !isNaN(+savedVol) ? +savedVol : SET.music.defaultVolume, false);
setMutedUI(false);
el.vol.addEventListener('input', () => { if (AudioEng.muted && +el.vol.value > 0) setMutedUI(false); applyVolume(+el.vol.value, true); });

/* ---------- versión clásica (se construye una sola vez) ---------- */
let classicBuilt = false;
function buildClassic(){
  if (classicBuilt) return; classicBuilt = true;
  const sections = FRIENDS.map(fr => `
    <section class="classic-section content" id="${esc(fr.id)}" style="--c:${fr.color}">
      <h3>${esc(fr.section)}</h3>
      <p class="teller">${esc(tpl(TX.classic.teller, { friend: fr.name, instrument: fr.instrument }))}</p>
      ${fill(fr.html)}
    </section>`).join('');
  const ins = CONFIG.inspiration;
  const inspiration = ins ? `
    <section class="classic-section content inspiration" id="inspiracion" style="--c:var(--ember)">
      <h3>${esc(TX.classic.inspiration)}</h3>
      <p class="teller">${esc(ins.title)} · ${esc(ins.by)}</p>
      <p>${esc(ins.text)}</p>
      ${ins.note ? `<p class="muted">${esc(ins.note)}</p>` : ''}
      <a class="btn" href="${esc(ins.href)}" target="_blank" rel="noopener">${esc(tpl(TX.classic.discover, { title: ins.title }))}</a>
    </section>` : '';
  el.classicInner.innerHTML = `
    <header><h1><a class="home-link" href="./" title="${esc(TX.ui.home)}">${esc(CONFIG.owner)}</a></h1><p class="role">${esc(CONFIG.role)}</p></header>
    ${CONFIG.sampleNote ? `<p class="sample" style="margin-top:24px">${esc(CONFIG.sampleNote)}</p>` : ''}
    ${sections}${inspiration}`;
}
function openClassic(){ buildClassic(); el.classic.hidden = false; el.classicClose.focus(); }
function closeClassic(){ el.classic.hidden = true; }
el.btnClassic.addEventListener('click', openClassic);
el.classicClose.addEventListener('click', closeClassic);

// Clics delegados: copiar correo y volver al inicio
document.addEventListener('click', async (e) => {
  const t = e.target.closest && e.target;
  if (!t) return;
  const home = t.closest('.home-link');
  if (home) { e.preventDefault(); goHome(); return; }
  if (t.closest('.lang-toggle')) { switchLang(); return; }
  const b = t.closest('.copy'); if (!b) return;
  try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = TX.copy.done; }
  catch (err) { b.textContent = TX.copy.fail; }
  setTimeout(() => { b.textContent = TX.copy.idle; }, 2200);
});

/* ---------- final ---------- */
el.enter.addEventListener('click', enterOrb);
function enterOrb(){
  if (phase !== 'gathered') return;
  el.enter.hidden = true;
  setPhase('flash'); flashStart = performance.now() / 1000;
  AudioEng.finale();
  countArrival();
}

/* ---------- contador de quienes llegan al centro del universo ----------
   Cuenta una vez por navegador (se recuerda el número) y el servidor, además, una vez cada 12 h por IP.
   Si el servicio no responde (por ejemplo, en local), simplemente no se muestra. */
let myUniverseNumber = 0;
try { myUniverseNumber = +localStorage.getItem('hoguera-universe') || 0; } catch (e) {}
function renderCounter(){
  const p = $('#ending-count');
  p.hidden = !myUniverseNumber;
  if (!myUniverseNumber) return;
  let n = String(myUniverseNumber);
  try { n = new Intl.NumberFormat(LANG).format(myUniverseNumber); } catch (e) {}
  p.textContent = tpl(TX.universe.you, { n });
}
async function countArrival(){
  if (myUniverseNumber || !SET.counter || !SET.counter.endpoint) { renderCounter(); return; }
  try {
    const opts = { method: 'POST', cache: 'no-store' };
    if (window.AbortSignal && AbortSignal.timeout) opts.signal = AbortSignal.timeout(SET.counter.timeoutMs);
    const r = await fetch(SET.counter.endpoint, opts);
    const d = r.ok ? await r.json() : null;
    if (!d || typeof d.count !== 'number' || d.count < 1) return;
    myUniverseNumber = d.count;
    // si esta IP ya contó hace poco, se muestra el total pero no se guarda: la próxima vez puede contar
    if (d.counted) { try { localStorage.setItem('hoguera-universe', String(myUniverseNumber)); } catch (e) {} }
    renderCounter();
  } catch (e) {}
}
el.again.addEventListener('click', () => {
  el.ending.classList.remove('show'); setTimeout(() => { el.ending.hidden = true; }, 600);
  setPhase('gathered'); gatherStart = performance.now() / 1000 - 12; gatherReturn = true; camF = 0;
  AudioEng.restore();
});

function makeUniverse(){
  const r = mulberry32((Math.random() * 1e9) | 0);
  const colors = ['#e8eeff', '#ffd8a8', '#b9c6ff'];
  bang = Array.from({ length: 900 }, () => { const c = r(); return { a: r() * TAU, sp: Math.pow(r(), 0.6), size: r() < 0.06 ? 2.2 : 1 + r(), col: colors[c < 0.6 ? 0 : c < 0.85 ? 1 : 2], tw: r() * TAU }; });
  // agrupados por color: un solo cambio de fillStyle por grupo
  bang.sort((a, b) => (a.col < b.col ? -1 : a.col > b.col ? 1 : 0));
  planets = [70, 118, 172, 236, 305].map((rx, i) => ({ rx, a0: r() * TAU, w: (0.9 - i * 0.14) * 0.5, size: [3, 4.5, 5, 7, 4][i], home: i === 2 }));
}

/* ---------- entrada ---------- */
const CAM = SET.camera;
let drag = null;
canvas.tabIndex = 0;
canvas.addEventListener('pointerdown', (e) => {
  pointer.x = e.clientX; pointer.y = e.clientY; pointer.active = true; pointer.touch = e.pointerType !== 'mouse';
  drag = { x: e.clientX, last: e.clientX, t: performance.now(), moved: 0, v: 0 };
  camVel = 0; panTo = null; canvas.setPointerCapture(e.pointerId); canvas.classList.add('dragging');
});
canvas.addEventListener('pointermove', (e) => {
  pointer.x = e.clientX; pointer.y = e.clientY; pointer.active = true;
  if (drag && phase !== 'flash' && phase !== 'universe') {
    const dx = e.clientX - drag.last, now = performance.now(), dt = Math.max(1, now - drag.t) / 1000, span = LAYERS[FIRE_LAYER].k * PW;
    camF -= dx / span; drag.moved += Math.abs(dx);
    drag.v = 0.7 * drag.v + 0.3 * (-dx / span / dt);
    drag.last = e.clientX; drag.t = now;
  }
  hovered = friendAt(e.clientX, e.clientY);
  canvas.classList.toggle('over', !!hovered || overOrb(e.clientX, e.clientY));
});
canvas.addEventListener('pointerup', (e) => {
  canvas.classList.remove('dragging');
  if (!drag) return;
  if (drag.moved < CAM.tapThreshold) clickAt(e.clientX, e.clientY);
  else if (!reduced) camVel = clamp(drag.v, -CAM.maxFling, CAM.maxFling);
  drag = null;
});
canvas.addEventListener('pointercancel', () => { drag = null; canvas.classList.remove('dragging'); });
canvas.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') pointer.active = false; });
canvas.addEventListener('wheel', (e) => {
  if (!inPlay()) return;
  e.preventDefault(); panTo = null; camF += (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) * CAM.wheelSpeed;
}, { passive: false });

function clickAt(x, y){
  if (!inPlay()) return;
  if (phase === 'gathered' && overOrb(x, y) && !el.enter.hidden) { enterOrb(); return; }
  const fr = friendAt(x, y); if (fr) openPanel(fr);
}
function friendAt(x, y){
  if (!inPlay()) return null;
  let best = null, bd = 1e9; const pad = pointer.touch ? 26 : 8;
  for (const fr of FRIENDS) {
    const b = fr.bbox; if (!b || !b.on) continue;
    if (x >= b.x0 - pad && x <= b.x1 + pad && y >= b.y0 - pad && y <= b.y1 + pad) {
      const d = Math.abs(x - (b.x0 + b.x1) / 2); if (d < bd) { bd = d; best = fr; }
    }
  }
  return best;
}
let orbScreen = null;
function overOrb(x, y){ return orbScreen && Math.hypot(x - orbScreen.x, y - orbScreen.y) < orbScreen.r * 1.4; }

const MAX_KEY = Math.min(9, FRIENDS.length);
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { if (!el.panel.hidden) closePanel(); else if (!el.classic.hidden) closeClassic(); return; }
  if (!el.panel.hidden || !el.classic.hidden || phase === 'intro') return;
  const tag = e.target && e.target.tagName;
  if (tag === 'INPUT') return;
  if ((tag === 'BUTTON' || tag === 'A') && (e.key === 'Enter' || e.key === ' ')) return;
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { keyDir = -1; panTo = null; e.preventDefault(); }
  else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { keyDir = 1; panTo = null; e.preventDefault(); }
  else if (e.key >= '1' && e.key <= String(MAX_KEY) && e.key.length === 1) { const fr = FRIENDS[+e.key - 1]; tune(tuned === fr ? null : fr); }
  else if (e.key === 'Enter') {
    if (phase === 'gathered' && !el.enter.hidden) { enterOrb(); return; }
    let best = null, bd = W * 0.22;
    for (const fr of FRIENDS) { if (!fr.bbox || !fr.bbox.on) continue; const d = Math.abs((fr.bbox.x0 + fr.bbox.x1) / 2 - W / 2); if (d < bd) { bd = d; best = fr; } }
    if (best) openPanel(best);
  }
  else if (e.key === 'm' || e.key === 'M') el.sound.click();
  else if (e.key === '+' || e.key === '=') applyVolume(+el.vol.value + 10, true);
  else if (e.key === '-' || e.key === '_') applyVolume(+el.vol.value - 10, true);
});
window.addEventListener('keyup', (e) => {
  if (['ArrowLeft', 'ArrowRight', 'a', 'A', 'd', 'D'].includes(e.key)) keyDir = 0;
});

/* ---------- dibujo ---------- */
function treePath(x, by, h, w, tiers){
  const tw = Math.max(1.5, w * 0.07), trunkH = h * 0.12;
  ctx.rect(x - tw / 2, by - trunkH, tw, trunkH + 2);
  const crownB = by - trunkH * 0.6, crownH = h - trunkH * 0.6;
  for (let i = 0; i < tiers; i++) {
    const k = i / tiers;
    const yb = crownB - k * crownH * 0.78;
    const wi = (w / 2) * (1 - k * 0.72);
    const yt = i === tiers - 1 ? by - h : yb - crownH * 0.42;
    ctx.moveTo(x - wi, yb); ctx.lineTo(x, yt); ctx.lineTo(x + wi, yb); ctx.closePath();
  }
}
function drawLayer(li){
  const L = LAYERS[li], lw = L.k * PW;
  ctx.fillStyle = L.color;
  // suelo y árboles de la capa en un único relleno
  ctx.beginPath(); ctx.moveTo(-10, H + 10);
  for (let x = -10; x <= W + 12; x += 12) ctx.lineTo(x, groundY(li, camF + (x - W / 2) / lw));
  ctx.lineTo(W + 12, H + 10); ctx.closePath();
  for (const t of TREES[li]) {
    const x = W / 2 + wrapHalf(t.f - camF) * lw, wpx = t.w * GH;
    if (x < -wpx || x > W + wpx) continue;
    treePath(x, t.gy * GH + 3, t.h * GH, wpx, t.tiers);
  }
  ctx.fill('nonzero');
}
function fog(li){
  const f = G.fog[li]; if (!f) return;
  ctx.fillStyle = f.g; ctx.fillRect(0, f.top, W, GH * 0.27);
}
function drawFigure(fr, x, y, s, seated){
  const pulse = AudioEng.pulse(fr.voice);
  const h = (seated ? 46 : 64) * s * (1 + 0.025 * pulse);
  ctx.fillStyle = '#2a3452';
  ctx.beginPath();
  ctx.moveTo(x - 15 * s, y);
  ctx.quadraticCurveTo(x - 17 * s, y - h * 0.55, x - 7 * s, y - h * 0.8);
  ctx.lineTo(x + 7 * s, y - h * 0.8);
  ctx.quadraticCurveTo(x + 17 * s, y - h * 0.55, x + 15 * s, y);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#343f61';
  ctx.beginPath(); ctx.arc(x, y - h * 0.88, 8.5 * s, 0, TAU);
  // capucha
  ctx.moveTo(x - 10 * s, y - h * 0.84); ctx.quadraticCurveTo(x, y - h * 1.1, x + 10 * s, y - h * 0.84); ctx.closePath(); ctx.fill();
  // instrumento
  ctx.fillStyle = fr.instFill;
  const ix = x + 9 * s, iy = y - h * 0.5;
  ctx.beginPath(); ctx.ellipse(ix, iy, 5 * s, 3 * s, -0.5, 0, TAU); ctx.fill();
  const g = fr.glow || (fr.glow = {}), b = fr.bbox || (fr.bbox = {});
  g.x = ix; g.y = iy; g.s = s; g.pulse = pulse; g.on = true;
  b.x0 = x - 17 * s; b.x1 = x + 17 * s; b.y0 = y - h * 1.02; b.y1 = y; b.on = true;
}

function renderForest(now, dt){
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  ctx.fillStyle = G.sky; ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = '#e4eaff';
  const starSpan = 1.4 * PW;
  for (const st of STARS) {
    const x = W / 2 + wrapHalf(st.f - camF) * starSpan; if (x < -3 || x > W + 3) continue;
    let a = st.b * (0.72 + 0.28 * Math.sin(now * st.tw + st.ph));
    if (st.die) { a *= Math.max(0, 1 - (now - st.die) / 3); if (a <= 0) continue; }
    ctx.globalAlpha = a; ctx.fillRect(x, st.y * GH, st.r, st.r);
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = '#121c36'; ctx.beginPath(); ctx.moveTo(-10, H);
  for (let x = -10; x <= W + 14; x += 14) ctx.lineTo(x, ridgeY(camF + (x - W / 2) / (1.6 * PW)));
  ctx.lineTo(W + 14, H); ctx.closePath(); ctx.fill();

  for (const fr of FRIENDS) { if (fr.bbox) fr.bbox.on = false; if (fr.glow) fr.glow.on = false; }
  const fireX = sxOf(FIRE_LAYER, 0), fireY = groundY(FIRE_LAYER, 0) + 0.02 * GH;
  const fs = Math.min(S, W / 460); // en vertical, el corro cabe en el ancho de la pantalla

  for (let li = 0; li < LAYERS.length; li++) {
    drawLayer(li);
    for (const fr of FRIENDS) {
      if (fr.layer !== li || fr.found) continue;
      const x = sxOf(li, fr.f);
      if (x < -60 || x > W + 60) continue;
      drawFigure(fr, x, groundY(li, fr.f) + 2, LAYERS[li].figScale * S, false);
    }
    if (li === FIRE_LAYER && fireX > -500 && fireX < W + 500) {
      // quien se sienta detrás del fuego
      for (const fr of FRIENDS) if (fr.found && fr.slot === BEHIND_SEAT) drawFigure(fr, fireX + SEATS[BEHIND_SEAT][0] * fs, fireY + SEATS[BEHIND_SEAT][1] * fs, fs * 0.86, true);
      // piedras y leña
      ctx.fillStyle = '#141924'; ctx.beginPath();
      for (let i = 0; i < 9; i++) { const a = (i / 9) * TAU, cx = fireX + Math.cos(a) * 34 * fs, cy = fireY + Math.sin(a) * 9 * fs; ctx.moveTo(cx + 8 * fs, cy); ctx.ellipse(cx, cy, 8 * fs, 5 * fs, 0, 0, TAU); }
      ctx.fill();
      ctx.fillStyle = '#24170e';
      ctx.save(); ctx.translate(fireX, fireY - 3 * fs);
      ctx.rotate(0.28); ctx.fillRect(-28 * fs, -4 * fs, 56 * fs, 8 * fs);
      ctx.rotate(-0.56); ctx.fillRect(-28 * fs, -4 * fs, 56 * fs, 8 * fs);
      ctx.restore();
      for (const fr of FRIENDS) if (fr.found && fr.slot !== BEHIND_SEAT) drawFigure(fr, fireX + SEATS[fr.slot][0] * fs, fireY + SEATS[fr.slot][1] * fs, fs, true);
    }
    fog(li);
  }

  // ---- luces: máscara de oscuridad ----
  const flick = reduced ? 1 : 0.9 + 0.06 * Math.sin(now * 13) + 0.04 * Math.sin(now * 23.7 + 1);
  const lanternR = Math.max(110, 165 * S);
  const lx = pointer.active ? pointer.x : W / 2, ly = pointer.active ? pointer.y : H * 0.7;
  const showLantern = inPlay() && (pointer.active || pointer.touch);
  mctx.globalCompositeOperation = 'copy'; mctx.globalAlpha = 1;
  mctx.fillStyle = G.dark; mctx.fillRect(0, 0, W, H);
  mctx.globalCompositeOperation = 'destination-out';
  if (showLantern) hole(lx, ly, lanternR, 0.88);
  if (fireLevel > 0) hole(fireX, fireY - 30 * fs, 430 * fs * flick, 0.94 * fireLevel);
  let orbR = 0; const ox = fireX, oy = fireY - 175 * fs;
  if (phase === 'gathered' || phase === 'flash') {
    const g = phase === 'gathered' ? clamp((now - gatherStart - 2) / 9, 0, 1) : 1;
    orbR = 66 * fs * (reduced ? g : 1 - Math.pow(1 - g, 2));
    if (phase === 'flash') orbR *= 1 + Math.pow(now - flashStart, 2) * 10;
    hole(ox, oy, orbR * 4, 0.9);
  }
  mctx.globalAlpha = 1;
  ctx.drawImage(mask, 0, 0, W, H);

  // ---- luces aditivas ----
  ctx.globalCompositeOperation = 'lighter';
  if (fireLevel > 0) {
    sprite(SP.warm, fireX, fireY - 24 * fs, 300 * fs * flick, 0.32 * fireLevel);
    sprite(SP.core, fireX, fireY - 16 * fs, 55 * fs * flick, 0.5 * fireLevel);
    const rate = (reduced ? 18 : 44) * fireLevel;
    let n = rate * dt; while (n > 0) { if (Math.random() < n) flames.push({ x: (Math.random() - 0.5) * 30, y: 0, vx: (Math.random() - 0.5) * 12, vy: -(40 + Math.random() * 55), life: 0, max: 0.55 + Math.random() * 0.5, size: 13 + Math.random() * 12, ph: Math.random() * 9 }); n -= 1; }
    if (Math.random() < dt * (reduced ? 2 : 6) * fireLevel) sparks.push({ x: (Math.random() - 0.5) * 20, y: -10, vx: (Math.random() - 0.5) * 30, vy: -(70 + Math.random() * 90), life: 0, max: 1.2 + Math.random() * 1.4 });
  }
  stepParticles(flames, dt, (p, k) => {
    p.x += Math.sin(now * 9 + p.ph) * 12 * dt; p.x *= 1 - dt * 1.4;
    const sp = k > 0.62 ? SP.core : k > 0.3 ? SP.flame : SP.ember;
    sprite(sp, fireX + p.x * fs, fireY - 10 * fs + p.y * fs, p.size * fs * (0.45 + k * 0.8), k * 0.8 * Math.max(0.3, fireLevel));
  });
  stepParticles(sparks, dt, (p, k, i) => {
    p.x += Math.sin(now * 3 + i) * 10 * dt;
    sprite(SP.ember, fireX + p.x * fs, fireY + p.y * fs, 4 * fs, k * 0.9);
  });
  for (const fr of FRIENDS) {
    const g = fr.glow; if (!g || !g.on) continue;
    const vis = fr.found ? 0.8 : 0.45 + 0.55 * fr.strength;
    sprite(fr.sp, g.x, g.y, (10 + 22 * g.pulse) * g.s * 1.4, (0.28 + 0.6 * g.pulse) * vis);
  }
  orbScreen = null;
  if (orbR > 0.5) {
    const rot = now * 0.6;
    sprite(SP.orb, ox, oy, orbR * 4.2, 0.55);
    sprite(SP.violet, ox + Math.cos(rot) * orbR * 0.3, oy + Math.sin(rot) * orbR * 0.3, orbR * 2.2, 0.45);
    sprite(SP.white, ox, oy, orbR * 1.3, 0.85);
    ctx.globalAlpha = 0.35; ctx.strokeStyle = 'rgba(200,210,255,1)'; ctx.lineWidth = 1.2;
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(ox, oy, orbR * (1.05 + i * 0.18), orbR * (0.35 + i * 0.1), rot * (i % 2 ? -1 : 1) + i, 0, TAU); ctx.stroke(); }
    orbScreen = { x: ox, y: oy, r: orbR };
  }
  if (showLantern) sprite(SP.warm, lx, ly, lanternR, 0.05);

  // ---- etiquetas ----
  ctx.globalCompositeOperation = 'source-over'; ctx.textAlign = 'center';
  for (const fr of FRIENDS) {
    const b = fr.bbox && fr.bbox.on ? fr.bbox : null; let target = 0;
    if (b && inPlay()) {
      const cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2;
      const lit = fr.found ? (hovered === fr) : (showLantern && Math.hypot(lx - cx, ly - cy) < lanternR * 0.95) || hovered === fr;
      target = lit ? 1 : 0;
    }
    fr.labelA += (target - fr.labelA) * Math.min(1, dt * 7);
    if (!b || fr.labelA < 0.02) continue;
    const cx = (b.x0 + b.x1) / 2, ty = b.y0 - 14;
    ctx.globalAlpha = fr.labelA;
    ctx.fillStyle = '#efe6d6'; ctx.font = G.fontName;
    ctx.fillText(fr.name, cx, ty - 14);
    ctx.fillStyle = fr.color; ctx.font = G.fontTag;
    ctx.fillText(hovered === fr ? TX.labelTalk : fr.instrument.toUpperCase(), cx, ty);
  }
  ctx.globalAlpha = 1;
}
// Avanza partículas y borra las muertas sin splice (intercambio con la última)
function stepParticles(arr, dt, draw){
  for (let i = arr.length - 1; i >= 0; i--) {
    const p = arr[i]; p.life += dt;
    if (p.life > p.max) { arr[i] = arr[arr.length - 1]; arr.pop(); continue; }
    p.y += p.vy * dt; p.x += p.vx * dt;
    draw(p, 1 - p.life / p.max, i);
  }
}

function renderUniverse(now){
  const t = now - uniStart;
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'lighter';
  const cx = W / 2, cy = H * 0.4, maxR = Math.hypot(W, H) * 0.62;
  const e = 1 - Math.pow(1 - Math.min(1, t / (reduced ? 1.5 : 3.4)), 3);
  let col = '';
  for (const p of bang) {
    const r = p.sp * e * maxR, x = cx + Math.cos(p.a) * r, y = cy + Math.sin(p.a) * r * 0.86;
    if (x < -4 || x > W + 4 || y < -4 || y > H + 4) continue;
    ctx.globalAlpha = t < 3 ? 1 - p.sp * 0.4 : 0.3 + 0.35 * (0.5 + 0.5 * Math.sin(now * 1.3 + p.tw));
    if (p.col !== col) { col = p.col; ctx.fillStyle = col; }
    ctx.fillRect(x, y, p.size, p.size);
  }
  const sa = clamp((t - 2.4) / 2.5, 0, 1);
  if (sa > 0) {
    const s = S;
    sprite(SP.warm, cx, cy, 150 * s, 0.55 * sa); sprite(SP.core, cx, cy, 42 * s, 0.95 * sa); sprite(SP.white, cx, cy, 14 * s, sa);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    ctx.strokeStyle = `rgba(239,230,214,${0.07 * sa})`; ctx.lineWidth = 1;
    ctx.beginPath();
    for (const p of planets) { ctx.moveTo(cx + p.rx * s * 1.4, cy); ctx.ellipse(cx, cy, p.rx * s * 1.4, p.rx * s * 0.46, 0, 0, TAU); }
    ctx.stroke();
    for (const p of planets) {
      const a = p.a0 + t * p.w * (90 / p.rx), x = cx + Math.cos(a) * p.rx * s * 1.4, y = cy + Math.sin(a) * p.rx * s * 0.46;
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = sa;
      ctx.fillStyle = p.home ? '#7f9b8c' : '#7e8bb0'; ctx.beginPath(); ctx.arc(x, y, p.size * s, 0, TAU); ctx.fill();
      if (p.home) { ctx.globalCompositeOperation = 'lighter'; const f = 0.7 + 0.3 * Math.sin(now * 11); sprite(SP.flame, x + p.size * s * 0.6, y - p.size * s * 0.6, 9 * s * f, sa * 0.9); }
    }
  }
  if (t < 1.4) { ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1 - t / 1.4; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
}

/* ---------- osciloscopio ---------- */
const sctx = el.scope.getContext('2d'); const scopeBuf = new Uint8Array(512);
function drawScope(now){
  const w = el.scope.width, h = el.scope.height; if (!w || !el.scope.offsetWidth) return;
  sctx.clearRect(0, 0, w, h);
  sctx.strokeStyle = 'rgba(159,216,255,.08)'; sctx.lineWidth = 1; sctx.beginPath();
  for (let i = 1; i < 4; i++) { sctx.moveTo(0, (h * i) / 4); sctx.lineTo(w, (h * i) / 4); }
  sctx.stroke();
  const an = AudioEng.ctx ? (tuned && AudioEng.voices[tuned.voice] ? AudioEng.voices[tuned.voice].an : AudioEng.busAn) : null;
  sctx.strokeStyle = tuned ? tuned.color : '#9fd8ff'; sctx.lineWidth = 1.5 * DPR; sctx.beginPath();
  if (an && !AudioEng.muted) {
    an.getByteTimeDomainData(scopeBuf);
    const n = scopeBuf.length, sx = w / (n - 1), sy = h * 1.6 / 128;
    sctx.moveTo(0, h / 2 + (scopeBuf[0] - 128) * sy);
    for (let i = 1; i < n; i++) sctx.lineTo(i * sx, h / 2 + (scopeBuf[i] - 128) * sy);
  } else {
    const amp = tuned ? tuned.strength : 0.4;
    for (let i = 0; i <= 120; i++) { const x = (i / 120) * w, y = h / 2 + Math.sin(i * 0.35 + now * 6) * amp * h * 0.3; i ? sctx.lineTo(x, y) : sctx.moveTo(x, y); }
  }
  sctx.stroke();
}

/* ---------- bucle ---------- */
const SIG = SET.signals, TIM = SET.timing;
let lastTs = performance.now(), hudAcc = 0, endingTimer = 0;
const levels = {};
function update(dt, now){
  // cámara
  if (inPlay()) {
    if (keyDir) camF += keyDir * CAM.keySpeed * dt;
    if (panTo !== null && !drag) {
      const d = wrapHalf(panTo - camF);
      if (reduced || Math.abs(d) < 0.002) { camF = panTo; panTo = null; }
      else camF += Math.sign(d) * Math.min(Math.abs(d), Math.max(0.02, Math.abs(d) * 2.4) * dt);
    }
    if (!drag && camVel) { camF += camVel * dt; camVel *= Math.pow(CAM.friction, dt); if (Math.abs(camVel) < 0.0005) camVel = 0; }
    if (phase === 'gathered' && !gatherReturn && now - gatherStart < 2.6 && !drag) {
      const d = wrapHalf(0 - camF); camF += reduced ? d : d * Math.min(1, dt * 2.2);
    }
  } else if (phase === 'intro') {
    camF += dt * CAM.introDrift;
  }
  camF = camF - Math.floor(camF);

  // hoguera
  if (fireLitAt > 0) {
    let target = clamp((now - fireLitAt) / TIM.fireIgnite, 0, 1);
    if (phase === 'gathered') target *= 1 - 0.65 * clamp((now - gatherStart - 9) / 3, 0, 1);
    fireLevel += (target - fireLevel) * Math.min(1, dt * 3);
  } else if (fireLevel > 0) {
    fireLevel = Math.max(0, fireLevel - dt * 0.8);
  }

  // estrellas que se apagan (elige al azar entre las vivas sin crear listas nuevas)
  if (!reduced && phase === 'forest' && now - lastStarDeath > SET.world.starDeathEvery) {
    lastStarDeath = now;
    if (starsAlive > STARS.length * SET.world.minStarsAlive) {
      let pick = (Math.random() * starsAlive) | 0;
      for (const st of STARS) if (!st.die && pick-- === 0) { st.die = now; starsAlive--; break; }
    }
  }

  // señales
  const facingFire = Math.max(0, 1 - Math.abs(wrapHalf(0 - camF)) / 0.25);
  for (const fr of FRIENDS) {
    let s;
    if (phase === 'gathered') s = 1;
    else if (fr.found) s = 0.55 + 0.45 * facingFire;
    else { const d = Math.abs(wrapHalf(fr.f - camF)); s = 0.05 + 0.95 * Math.pow(Math.max(0, 1 - d / SIG.range), 1.6); }
    fr.strength = s;
  }

  // final
  if (phase === 'gathered' && el.enter.hidden && now - gatherStart > TIM.gatherReady) el.enter.hidden = false;
  if (phase === 'flash' && now - flashStart > TIM.flash) {
    setPhase('universe'); uniStart = now; makeUniverse();
    clearTimeout(endingTimer);
    endingTimer = setTimeout(() => { el.ending.hidden = false; requestAnimationFrame(() => el.ending.classList.add('show')); }, (reduced ? 1.2 : TIM.endingDelay) * 1000);
  }

  // HUD y niveles de audio (a baja frecuencia; solo se toca el DOM si algo cambia)
  hudAcc += dt;
  if (hudAcc > 1 / SIG.hudHz) {
    hudAcc = 0;
    const lit = fireLitAt > 0 ? 1 : 0;
    for (const fr of FRIENDS) {
      levels[fr.voice] = (SET.music.voices[fr.voice] || 0) * (0.06 + 0.94 * Math.pow(fr.strength, 1.4)) * lit;
      const m = Math.round(fr.strength * 50) / 50;
      if (m !== fr.ui.lastMeter) { fr.ui.lastMeter = m; fr.ui.meter.style.transform = `scaleX(${m})`; }
      const st = fr.found ? TX.signal.found : fr.strength > SIG.talkAt ? TX.signal.here : fr.strength > SIG.nearAt ? TX.signal.near : TX.signal.far;
      if (st !== fr.ui.lastState) { fr.ui.lastState = st; fr.ui.state.textContent = st; }
    }
    if (inPlay()) AudioEng.setLevels(levels, (0.15 + 0.6 * facingFire) * fireLevel);
    // pista de dirección
    if (tuned && !tuned.found && phase === 'forest' && el.panel.hidden) {
      const d = wrapHalf(tuned.f - camF);
      el.edgeL.classList.toggle('on', d < -0.06); el.edgeR.classList.toggle('on', d > 0.06);
      if (el.edgeLText.textContent !== tuned.instrument) el.edgeLText.textContent = el.edgeRText.textContent = tuned.instrument;
    } else { el.edgeL.classList.remove('on'); el.edgeR.classList.remove('on'); }
    // botón "Hablar con…" para quien tengas delante
    let near = null;
    if (phase === 'forest' && el.panel.hidden) {
      for (const fr of FRIENDS) {
        const b = fr.bbox;
        if (fr.found || !b || !b.on || fr.strength < SIG.talkAt) continue;
        const cx = (b.x0 + b.x1) / 2; if (cx < 20 || cx > W - 20) continue;
        if (!near || fr.strength > near.strength) near = fr;
      }
    }
    setTalk(near);
  }
}
function loop(ts){
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, (ts - lastTs) / 1000); lastTs = ts; const now = ts / 1000;
  update(dt, now);
  // La versión clásica tapa toda la pantalla: no hace falta pintar el bosque debajo
  if (!el.classic.hidden) return;
  if (phase === 'universe') renderUniverse(now); else renderForest(now, dt);
  if (phase === 'flash') { ctx.globalAlpha = clamp((now - flashStart) / 1.3, 0, 1); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  if (phase !== 'intro' && phase !== 'universe') drawScope(now);
}

/* ---------- arranque (conserva el progreso al republicar) ---------- */
function start(data){
  resize();
  if (data && Array.isArray(data.found)) {
    for (const id of data.found) { const fr = FRIENDS.find(f => f.id === id); if (fr) markFound(fr, true); }
  }
  renderLanguage();
  requestAnimationFrame((ts) => { lastTs = ts; loop(ts); });
}
const hot = window.claude && window.claude.hot;
if (hot && hot.snapshot) hot.snapshot(() => ({ found: foundOrder.slice() }));
if (hot && hot.ready) hot.ready(start); else start((hot && hot.data) || {});
})();
