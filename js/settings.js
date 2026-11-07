/* ====================================================================
   AJUSTES: cómo se ve, se mueve y suena el bosque.
   No hace falta tocarlos para cambiar el contenido (eso está en js/content.js).
   ==================================================================== */
window.HOGUERA_SETTINGS = {
  render: {
    maxDPR: 2,            // resolución máxima del canvas (2 = retina)
    maxDPRTouch: 1.75,    // en pantallas táctiles: algo menos para ahorrar batería
    mobileBreakpoint: 680 // px; debe coincidir con @media (max-width:680px) de css/styles.css
  },

  world: {
    seed: 20261106,        // semilla: misma semilla, mismo bosque
    panoramaAspect: 1.5,   // ancho mínimo de la panorámica respecto al alto (evita que se aplaste en vertical)
    // Capas del bosque (lejos → cerca). k = cuántas pantallas mide la vuelta completa (da paralaje).
    layers: [
      { k: 2.0, base: 0.655, color: '#0f1931', hMin: 0.06, hMax: 0.12, count: 95, figScale: 0.5 },
      { k: 2.6, base: 0.69,  color: '#0a1225', hMin: 0.10, hMax: 0.19, count: 72, figScale: 0.68 },
      { k: 3.3, base: 0.745, color: '#070d1a', hMin: 0.17, hMax: 0.30, count: 52, figScale: 0.88 },
      { k: 4.2, base: 0.835, color: '#04070f', hMin: 0.32, hMax: 0.56, count: 30, figScale: 1.05 }
    ],
    fireLayer: 3,
    // Claros sin árboles alrededor de la hoguera (half = media anchura, en fracción de vuelta)
    clearings: [{ layer: 3, half: 0.13 }, { layer: 2, half: 0.03 }],
    // Sitios alrededor del fuego [x, y] en px a escala 1. El último queda detrás de la hoguera.
    seats: [[-190, 0], [-112, -10], [112, -10], [190, 0], [36, -34]],
    stars: 280,
    minStarsAlive: 0.35,   // fracción de estrellas que nunca se apaga
    starDeathEvery: 3.2    // segundos entre estrella y estrella que se apaga
  },

  camera: {
    keySpeed: 0.16,        // vueltas por segundo con las flechas
    wheelSpeed: 0.00035,
    introDrift: 0.004,     // giro lento detrás de la intro
    maxFling: 0.6,         // inercia máxima al soltar un arrastre
    friction: 0.03,        // fracción de velocidad que queda tras 1 s
    tapThreshold: 7        // px que puede moverse un dedo y seguir contando como toque
  },

  signals: {
    range: 0.22,           // a qué distancia (fracción de vuelta) empieza a oírse un viajero
    talkAt: 0.6,           // intensidad a partir de la cual aparece «Hablar con…»
    nearAt: 0.22,          // intensidad para «cerca»
    hudHz: 10              // refrescos por segundo del radio y de los niveles de audio
  },

  // Contador de visitantes que llegan al centro del universo (servicio en server/). null lo desactiva.
  counter: { endpoint: '/api/universe', timeoutMs: 4000 },

  timing: {
    fireIgnite: 1.6,       // s hasta que la hoguera arde del todo
    gatherReady: 8,        // s desde que estáis todos hasta que aparece la esfera
    flash: 1.7,            // s de destello antes del nuevo universo
    endingDelay: 4.6       // s hasta que aparece el texto final
  },

  /* Música generativa: compás de 8 pasos, 4 acordes, 32 pasos en total. Notas en MIDI (69 = La 440). */
  music: {
    bpm: 80,
    chords: [
      { bass: 50, arp: [62, 65, 69, 74] },  // Rem
      { bass: 46, arp: [58, 62, 65, 70] },  // Sib
      { bass: 53, arp: [60, 65, 69, 72] },  // Fa
      { bass: 48, arp: [60, 64, 67, 72] }   // Do
    ],
    // [paso, nota, duración en pasos]
    melody: [[0,69,3],[3,72,1],[4,74,4],[8,74,2],[10,72,2],[12,70,3],[15,69,1],[16,69,3],[19,72,1],[20,77,2],[22,76,2],[24,76,3],[27,74,1],[28,72,2],[30,69,2]],
    // Volumen de cada instrumento cuando lo tienes delante
    voices: { ocarina: 0.95, kalimba: 0.85, drum: 0.8, cello: 0.85, bells: 0.7 },
    finalChord: [50, 54, 57, 62, 66, 69], // Re mayor
    reverb: 2.8,           // segundos de cola de reverberación
    defaultVolume: 25      // 0–100; bajo a propósito: quien quiera disfrutarlo, lo sube
  }
};
