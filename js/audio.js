/* ---------- audio: todo generado en el navegador, melodía original ---------- */
window.HogueraAudio = ((music) => {
'use strict';

const STEP = 60 / music.bpm / 2;
const STEPS = music.chords.length * 8;
const ARP_ORDER = [0, 2, 1, 3, 2, 1, 3, 1];
const DRUM = [['low', 1], null, ['tap', 0.4], ['tap', 0.9], ['low', 0.7], null, ['tap', 0.8], ['tap', 0.35]];
// Melodía indexada por paso: evita recorrerla entera en cada paso
const MELODY_AT = Array.from({ length: STEPS }, () => []);
for (const [step, note, len] of music.melody) if (step < STEPS) MELODY_AT[step].push([note, len]);
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

return {
  ctx: null, out: null, master: null, bus: null, busAn: null, fin: null, voices: {}, times: {}, step: 0, next: 0, timer: 0,
  muted: false, volume: music.defaultVolume / 100,
  init(){
    if (this.ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    let c; try { c = this.ctx = new AC(); } catch (e) { return false; }
    this.out = c.createGain(); this.out.gain.value = this.muted ? 0 : this.volume * this.volume; this.out.connect(c.destination);
    const comp = c.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 4; comp.connect(this.out);
    this.master = c.createGain(); this.master.gain.value = 0.0001; this.master.connect(comp);
    const imp = this.impulse(music.reverb);
    this.bus = c.createGain(); this.busAn = c.createAnalyser(); this.busAn.fftSize = 512;
    this.bus.connect(this.busAn); this.busAn.connect(this.master);
    const rev = c.createConvolver(); rev.buffer = imp; const wet = c.createGain(); wet.gain.value = 0.34;
    this.bus.connect(rev); rev.connect(wet); wet.connect(this.master);
    this.fin = c.createGain(); this.fin.gain.value = 1; this.fin.connect(comp);
    const rev2 = c.createConvolver(); rev2.buffer = imp; const wet2 = c.createGain(); wet2.gain.value = 0.5; this.fin.connect(rev2); rev2.connect(wet2); wet2.connect(comp);
    for (const v of Object.keys(music.voices)) {
      const g = c.createGain(); g.gain.value = 0; const an = c.createAnalyser(); an.fftSize = 512;
      g.connect(an); an.connect(this.bus); this.voices[v] = { g, an }; this.times[v] = [];
    }
    this.noise = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
    const d = this.noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    // viento
    const wn = c.createBufferSource(); wn.buffer = this.noise; wn.loop = true;
    const wf = c.createBiquadFilter(); wf.type = 'lowpass'; wf.frequency.value = 420;
    const wg = c.createGain(); wg.gain.value = 0.05;
    const lfo = c.createOscillator(); lfo.frequency.value = 0.07; const lg = c.createGain(); lg.gain.value = 0.03; lfo.connect(lg); lg.connect(wg.gain);
    wn.connect(wf); wf.connect(wg); wg.connect(this.master); wn.start(); lfo.start();
    this.fireGain = c.createGain(); this.fireGain.gain.value = 0; this.fireGain.connect(this.master);
    return true;
  },
  impulse(sec){
    const c = this.ctx, len = Math.floor(c.sampleRate * sec), b = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
    return b;
  },
  start(){
    if (!this.ctx) return;
    try { this.ctx.resume(); } catch (e) {}
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t); this.master.gain.setValueAtTime(Math.max(0.0001, this.master.gain.value), t);
    this.master.gain.linearRampToValueAtTime(0.9, t + 2.5);
    if (!this.timer) { this.next = t + 0.15; this.timer = setInterval(() => this.tick(), 30); }
  },
  tick(){
    const c = this.ctx;
    while (this.next < c.currentTime + 0.2) { this.schedule(this.step, this.next); this.next += STEP; this.step = (this.step + 1) % STEPS; }
  },
  // Guarda cuándo suena cada golpe (para que las figuras "respiren" al ritmo).
  // Se poda aquí: si una figura no se dibuja, su lista no crece sin límite.
  mark(v, t){
    const arr = this.times[v], old = this.ctx.currentTime - 1;
    while (arr.length > 1 && arr[1] <= old) arr.shift();
    arr.push(t);
  },
  pulse(v){
    if (!this.ctx || !this.times[v]) return 0.3 + 0.2 * Math.sin(performance.now() / 400 + v.length);
    const arr = this.times[v], ct = this.ctx.currentTime;
    while (arr.length > 1 && arr[1] <= ct) arr.shift();
    if (!arr.length || arr[0] > ct) return 0;
    return Math.exp(-(ct - arr[0]) * 5);
  },
  env(g, t, a, peak, dec){ g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec); },
  osc(type, f, t, stop, dest){ const o = this.ctx.createOscillator(); o.type = type; o.frequency.value = f; o.connect(dest); o.start(t); o.stop(stop); return o; },
  schedule(step, t){
    const s = step & 7, ch = music.chords[step >> 3];
    if (s === 0) { this.cello(t, ch.bass, STEP * 7.6); this.mark('cello', t); }
    if (s === 4) this.mark('cello', t);
    this.kalimba(t, ch.arp[ARP_ORDER[s]], s % 2 ? 0.7 : 1); this.mark('kalimba', t);
    if (s === 0) { this.bells(t, ch.arp[3] + 12, 1); this.mark('bells', t); }
    if (s === 5) { this.bells(t, ch.arp[1] + 12, 0.6); this.mark('bells', t); }
    const dp = DRUM[s];
    if (dp) { this.drum(t, dp[0], dp[1]); if (dp[1] > 0.5) this.mark('drum', t); }
    for (const [note, len] of MELODY_AT[step]) { this.ocarina(t, note, len * STEP); this.mark('ocarina', t); }
    if (Math.random() < 0.7) this.crackle(t + Math.random() * STEP);
  },
  kalimba(t, m, v){
    const c = this.ctx, f = mtof(m), g = c.createGain(); this.env(g, t, 0.004, 0.3 * v, 1.1); g.connect(this.voices.kalimba.g);
    this.osc('sine', f, t, t + 1.3, g);
    const g2 = c.createGain(); this.env(g2, t, 0.002, 0.25 * v, 0.1); g2.connect(g); this.osc('sine', f * 5.43, t, t + 0.25, g2);
  },
  bells(t, m, v){
    const c = this.ctx, f = mtof(m), g = c.createGain(); this.env(g, t, 0.003, 0.16 * v, 2.4); g.connect(this.voices.bells.g);
    this.osc('triangle', f, t, t + 2.6, g);
    const g2 = c.createGain(); this.env(g2, t, 0.002, 0.06 * v, 0.6); g2.connect(this.voices.bells.g); this.osc('sine', f * 2.76, t, t + 0.8, g2);
  },
  cello(t, m, dur){
    const c = this.ctx, f = mtof(m), g = c.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.13, t + 0.4); g.gain.setValueAtTime(0.13, t + dur); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.7);
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 680; lp.Q.value = 0.8; lp.connect(g); g.connect(this.voices.cello.g);
    const lfo = c.createOscillator(); lfo.frequency.value = 5.1; const lg = c.createGain(); lg.gain.value = f * 0.004; lfo.connect(lg);
    for (const det of [1, 1.003]) { const o = this.osc('sawtooth', f * det, t, t + dur + 0.8, lp); lg.connect(o.frequency); }
    lfo.start(t); lfo.stop(t + dur + 0.8);
  },
  ocarina(t, m, dur){
    const c = this.ctx, f = mtof(m), g = c.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.2, t + 0.06); g.gain.setValueAtTime(0.2, t + dur); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.3);
    g.connect(this.voices.ocarina.g);
    const lfo = c.createOscillator(); lfo.frequency.value = 5.5; const lg = c.createGain(); lg.gain.value = f * 0.006; lfo.connect(lg);
    const o = this.osc('sine', f, t, t + dur + 0.35, g); lg.connect(o.frequency);
    const g2 = c.createGain(); g2.gain.value = 0.08; g2.connect(g); this.osc('sine', f * 2, t, t + dur + 0.35, g2);
    lfo.start(t); lfo.stop(t + dur + 0.35);
  },
  drum(t, kind, v){
    const c = this.ctx, g = c.createGain(); g.connect(this.voices.drum.g);
    if (kind === 'low') {
      const o = c.createOscillator(); o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(48, t + 0.18);
      this.env(g, t, 0.002, 0.5 * v, 0.32); o.connect(g); o.start(t); o.stop(t + 0.4);
    } else {
      const n = c.createBufferSource(); n.buffer = this.noise; const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1700; bp.Q.value = 1.4;
      this.env(g, t, 0.001, 0.22 * v, 0.08); n.connect(bp); bp.connect(g); n.start(t, Math.random()); n.stop(t + 0.12);
    }
  },
  crackle(t){
    const c = this.ctx, n = c.createBufferSource(); n.buffer = this.noise; const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2400;
    const g = c.createGain(); this.env(g, t, 0.001, 0.05 + Math.random() * 0.16, 0.02 + Math.random() * 0.05);
    n.connect(hp); hp.connect(g); g.connect(this.fireGain); n.start(t, Math.random() * 1.5); n.stop(t + 0.1);
  },
  setLevels(levels, fire){
    if (!this.ctx) return; const t = this.ctx.currentTime;
    for (const v in levels) if (this.voices[v]) this.voices[v].g.gain.setTargetAtTime(levels[v], t, 0.12);
    this.fireGain.gain.setTargetAtTime(fire, t, 0.2);
  },
  setMuted(m){ this.muted = m; this.applyOut(); },
  setVolume(v){ this.volume = v; this.applyOut(); },
  applyOut(){ if (this.out) this.out.gain.setTargetAtTime(this.muted ? 0 : this.volume * this.volume, this.ctx.currentTime, 0.06); },
  finale(){
    if (!this.ctx) return; const c = this.ctx, t = c.currentTime;
    this.master.gain.cancelScheduledValues(t); this.master.gain.setValueAtTime(this.master.gain.value, t); this.master.gain.linearRampToValueAtTime(0.0001, t + 1.2);
    this.fin.gain.cancelScheduledValues(t); this.fin.gain.setValueAtTime(1, t);
    const b = t + 1.4;
    const o = c.createOscillator(); o.frequency.setValueAtTime(70, b); o.frequency.exponentialRampToValueAtTime(22, b + 3);
    const g = c.createGain(); this.env(g, b, 0.03, 0.55, 3.6); o.connect(g); g.connect(this.fin); o.start(b); o.stop(b + 4);
    const n = c.createBufferSource(); n.buffer = this.noise; n.loop = true; const lp = c.createBiquadFilter(); lp.type = 'lowpass';
    lp.frequency.setValueAtTime(900, b); lp.frequency.exponentialRampToValueAtTime(60, b + 3.5);
    const ng = c.createGain(); this.env(ng, b, 0.05, 0.35, 3.4); n.connect(lp); lp.connect(ng); ng.connect(this.fin); n.start(b); n.stop(b + 4);
    // acorde final
    const p = b + 2.2;
    for (const m of music.finalChord) {
      const pg = c.createGain(); pg.gain.setValueAtTime(0.0001, p); pg.gain.exponentialRampToValueAtTime(0.045, p + 3.5);
      pg.gain.setValueAtTime(0.045, p + 12); pg.gain.exponentialRampToValueAtTime(0.0001, p + 18); pg.connect(this.fin);
      this.osc('sine', mtof(m), p, p + 18.5, pg); this.osc('triangle', mtof(m) * 1.002, p, p + 18.5, pg);
    }
  },
  restore(){
    if (!this.ctx) return; const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t); this.master.gain.setValueAtTime(Math.max(0.0001, this.master.gain.value), t); this.master.gain.linearRampToValueAtTime(0.9, t + 2);
  },
  // Al volver al inicio: se apaga la música (y el acorde final, si sonaba)
  quiet(){
    if (!this.ctx) return; const t = this.ctx.currentTime;
    for (const g of [this.master.gain, this.fin.gain]) { g.cancelScheduledValues(t); g.setValueAtTime(Math.max(0.0001, g.value), t); g.linearRampToValueAtTime(0.0001, t + 1.2); }
  },
  // En segundo plano (otra pestaña, móvil bloqueado) se calla y no gasta batería.
  setPaused(p){
    if (!this.ctx) return;
    try { p ? this.ctx.suspend() : this.ctx.resume(); } catch (e) {}
  }
};
})(window.HOGUERA_SETTINGS.music);

document.addEventListener('visibilitychange', () => window.HogueraAudio.setPaused(document.hidden));
