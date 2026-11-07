/* ====================================================================
   CONTENIDO: todo lo que se lee en la página vive aquí.
   Arriba, los datos comunes a todos los idiomas; abajo, en i18n, los textos de cada idioma.
   Para añadir un idioma, copia el bloque "en" con otra clave (por ejemplo "eu") y tradúcelo.

   Marcadores que se sustituyen solos:
     {name}       → firstName
     {owner}      → owner
     {friend}     → nombre del viajero
     {instrument} → su instrumento
     {left}       → viajeros que faltan por encontrar
     {max}        → (solo en ui.help) número de viajeros
     {{contact}}  → (solo en friends.*.html) correo y enlaces
   ==================================================================== */
window.HOGUERA_CONTENT = {
  owner: 'Alejandro Vázquez Quintano',
  firstName: 'Alejandro',
  email: 'alejandro.v.quintano@gmail.com',
  links: [
    { label: 'GitHub', href: 'https://github.com/Jandro5vq' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/alejandro-vazquez-b810261a0/' },
    { label: 'X', href: 'https://x.com/ale_v_q' }
  ],

  // Idioma si el del navegador no está disponible
  defaultLang: 'es',

  // Obra que inspiró la página: aparece en la versión clásica y en el final. Pon null para quitarla.
  inspiration: { title: 'Outer Wilds', by: 'Mobius Digital, 2019', href: 'https://www.mobiusdigitalgames.com/' },

  /* Cada viajero es una sección del portfolio (sus textos están en i18n.*.friends, con el mismo id).
     voice: instrumento que toca (ocarina, kalimba, drum, cello o bells; ver js/settings.js → music.voices)
     layer: capa del bosque donde está (0 lejos … 3 cerca) · f: posición en la vuelta (0–1; la hoguera está en 0)
     Caben tantos como huecos haya junto al fuego (settings.world.seats, 5 por defecto). */
  friends: [
    { id: 'sobre-mi',    voice: 'ocarina', color: '#9fd8ff', layer: 2, f: 0.17 },
    { id: 'proyectos',   voice: 'kalimba', color: '#ffd27a', layer: 1, f: 0.35 },
    { id: 'habilidades', voice: 'drum',    color: '#ff9f8a', layer: 2, f: 0.53 },
    { id: 'experiencia', voice: 'cello',   color: '#c7b3ff', layer: 1, f: 0.70 },
    { id: 'contacto',    voice: 'bells',   color: '#a8f0d0', layer: 3, f: 0.86 }
  ],

  i18n: {
    /* ============================== ESPAÑOL ============================== */
    es: {
      label: 'Español', short: 'ES',
      role: 'Desarrollador full stack · IA a medida',
      // Pon un texto para mostrar un aviso de "contenido de ejemplo"; '' lo oculta.
      sampleNote: '',
      inspiration: {
        text: 'Esta hoguera es un homenaje a Outer Wilds: un universo que se apaga, viajeros que tocan la misma canción desde lugares distintos y una hoguera donde todo vuelve a empezar. De ahí viene la idea de encontrar a alguien siguiendo el sonido de su instrumento.',
        note: 'Los dibujos, la música y el código de esta página son originales. No tiene relación oficial con el juego ni con sus autores.'
      },
      friends: {
        'sobre-mi': {
          name: 'La Vigía', instrument: 'Ocarina', section: 'Sobre mí',
          greet: 'Llevo toda la noche viendo apagarse las estrellas. ¿Buscas a {name}? Siéntate, te cuento quién es.',
          html: `
            <p class="lead">Soy desarrollador full stack en Innovae. Últimamente me he centrado en construir servicios de IA a medida: asistentes virtuales, avatares que conversan por voz y agentes que automatizan tareas muy concretas.</p>
            <p>Vengo de la automatización y la robótica industrial, así que me gusta entender el sistema entero, de la base de datos a la interfaz.</p>
            <p>Fuera del trabajo sigo cacharreando: diseño piezas técnicas en 3D y las imprimo, he hecho muchos proyectos de electrónica con Arduino y ESP32 y autoalojo en casa mis propias herramientas. También piloto drones FPV; al empezar llegué a construirme uno.</p>
            <dl class="facts">
              <div><dt>Desde</dt><dd>San Sebastián</dd></div>
              <div><dt>Ahora</dt><dd>Developer en Innovae</dd></div>
              <div><dt>Aprendiendo</dt><dd>Rust, Go y agentes de IA</dd></div>
              <div><dt>Aficiones</dt><dd>Drones FPV, modelado e impresión 3D, electrónica y homelab</dd></div>
              <div><dt>Idiomas</dt><dd>Español, inglés y euskera</dd></div>
            </dl>`
        },
        proyectos: {
          name: 'El Cartógrafo', instrument: 'Kalimba', section: 'Proyectos',
          greet: 'Dibujo un mapa de cada cosa que {name} construye. Estos son los que guardo más a mano.',
          html: `
            <div class="cards">
              <article class="card">
                <header><span class="num">01</span><h4>WiseLogger</h4></header>
                <p>Registro de jornada autoalojado: turnos, tareas, pausas automáticas, línea de tiempo tipo Gantt, histórico y estadísticas de horas trabajadas frente a esperadas. Incluye un servidor MCP para que asistentes de IA como Claude o Copilot registren tareas por ti.</p>
                <ul class="tags"><li>TypeScript</li><li>Next.js</li><li>SQLite</li><li>Drizzle</li><li>MCP</li><li>Docker</li></ul>
                <a href="https://github.com/Jandro5vq/WiseLogger">Ver el código →</a>
              </article>
              <article class="card">
                <header><span class="num">02</span><h4>Foundry Price Checker</h4></header>
                <p>Interfaz de terminal para buscar, comparar y ordenar los precios de los modelos de Azure AI Foundry por millón de tokens, cruzados con su ventana de contexto, sus capacidades y su puntuación Elo de LMArena. Exporta a CSV.</p>
                <ul class="tags"><li>Rust</li><li>TUI</li><li>Azure</li><li>APIs REST</li></ul>
                <a href="https://github.com/Jandro5vq/foundry-price-checker">Ver el código →</a>
              </article>
              <article class="card">
                <header><span class="num">03</span><h4>OctoPrint GPIO PSU Control</h4></header>
                <p>Plugin de OctoPrint para encender y apagar la fuente de una impresora 3D desde los GPIO de una Raspberry Pi: arranque automático, conexión a la impresora, apagado al terminar y API HTTP.</p>
                <ul class="tags"><li>Python</li><li>Raspberry Pi</li><li>OctoPrint</li><li>Jinja</li></ul>
                <a href="https://github.com/Jandro5vq/OctoPrint-GPIO-PSUControl">Ver el código →</a>
              </article>
              <article class="card">
                <header><span class="num">04</span><h4>InnoCraft</h4></header>
                <p>Modpack de Fabric para Minecraft 1.21.1 que se actualiza solo en Prism Launcher, publicado con packwiz y GitHub Pages, con scripts para generar y publicar cada versión con su changelog.</p>
                <ul class="tags"><li>Python</li><li>Shell</li><li>GitHub Pages</li><li>packwiz</li></ul>
                <a href="https://github.com/Jandro5vq/InnoCraft">Ver el código →</a>
              </article>
              <article class="card">
                <header><span class="num">05</span><h4>Pill Assistant</h4></header>
                <p>Pastillero inteligente para personas mayores a las que les cuesta recordar qué pastilla toca y cuándo. Un familiar lo configura desde la app, así la persona que lo usa no tiene que preocuparse de nada.</p>
                <ul class="tags"><li>Hardware</li><li>App</li></ul>
                <a href="https://github.com/Jandro5vq/Pill-Assitant">Ver el proyecto →</a>
              </article>
              <article class="card">
                <header><span class="num">06</span><h4>Esta hoguera</h4></header>
                <p>Este mismo portfolio: un bosque dibujado en canvas con música que se genera en el navegador.</p>
                <ul class="tags"><li>Canvas</li><li>Web Audio</li><li>JavaScript</li></ul>
                <a href="https://github.com/Jandro5vq/Portfolio">Ver el código →</a>
              </article>
            </div>`
        },
        habilidades: {
          name: 'La Herrera', instrument: 'Tambor', section: 'Habilidades',
          greet: 'Todas sus herramientas han pasado por mi yunque. Las que más usa, aquí las tienes.',
          html: `
            <div class="skills">
              <div><h4>Lenguajes</h4><ul class="tags"><li>TypeScript</li><li>JavaScript</li><li>Python</li><li>Rust</li><li>Kotlin</li><li>C#</li><li>C</li><li>PHP</li><li>SQL</li></ul></div>
              <div><h4>Frameworks</h4><ul class="tags"><li>Next.js</li><li>Node.js</li><li>Flask</li><li>Laravel</li><li>Tailwind CSS</li><li>Drizzle ORM</li></ul></div>
              <div><h4>Datos</h4><ul class="tags"><li>PostgreSQL</li><li>MySQL</li><li>MariaDB</li><li>SQLite</li><li>Pandas</li><li>NumPy</li></ul></div>
              <div><h4>Inteligencia artificial</h4><ul class="tags"><li>Asistentes virtuales</li><li>Agentes y flujos agénticos</li><li>RAG</li><li>Voz multilingüe</li><li>MCP</li><li>Azure AI Foundry</li></ul></div>
              <div><h4>Hardware y automatización</h4><ul class="tags"><li>Automatización industrial</li><li>Robótica industrial</li><li>Arduino</li><li>ESP32</li><li>Raspberry Pi</li><li>Modelado 3D</li><li>Impresión 3D</li><li>Drones FPV</li></ul></div>
              <div><h4>Herramientas</h4><ul class="tags"><li>Git</li><li>Docker</li><li>Nginx</li><li>Azure</li><li>Unity</li><li>Android Studio</li><li>JWT</li></ul></div>
            </div>`
        },
        experiencia: {
          name: 'El Archivero', instrument: 'Violonchelo', section: 'Experiencia',
          greet: 'Yo llevo el registro de cada viaje. Este es el de {name}, del más reciente al primero.',
          html: `
            <ol class="timeline">
              <li><span class="when">Ago 2024 – hoy</span><strong>Developer · Innovae</strong><p>Desarrollo servicios de IA a medida integrados en aplicaciones:</p>
                <ul class="bullets">
                  <li>Asistentes conversacionales que, además de responder, generan flujos de trabajo a partir de documentos PDF y vídeos.</li>
                  <li>Avatares 3D en Unity con los que se habla por voz en varios idiomas y que responden con el conocimiento de cada cliente (RAG).</li>
                  <li>Agentes que vigilan un buzón de correo, interpretan cada mensaje, actúan en consecuencia y registran los datos.</li>
                </ul></li>
              <li><span class="when">Formación</span><strong>FP de grado superior · Desarrollo de Aplicaciones Multiplataforma (DAM) · CampusNet</strong><p>Desarrollo de aplicaciones de escritorio, móviles y web, y bases de datos.</p></li>
              <li><span class="when">Formación</span><strong>FP de grado superior · Automatización y Robótica Industrial · Salesianos Urnieta</strong><p>Sistemas automáticos, control y robótica industrial: de aquí viene mi gusto por el hardware.</p></li>
            </ol>`
        },
        contacto: {
          name: 'La Farera', instrument: 'Campanas', section: 'Contacto',
          greet: 'Desde mi faro se ve todo el bosque. Si quieres escribir a {name}, sigue esta luz.',
          html: `<p>¿Tienes un proyecto, una idea o te apetece charlar? Escríbeme.</p>{{contact}}`
        }
      },

      // Textos de la interfaz y de la historia
      texts: {
        pageTitle: 'La hoguera de {name}',
        ui: {
          eyebrow: 'Portfolio',
          home: 'Volver al inicio',
          classic: 'Versión clásica',
          classicShort: 'Clásica',
          volume: 'Volumen',
          percent: '{v} por ciento',
          silence: 'Silencio',
          tuning: 'Sintonía',
          atFire: 'Junto al fuego',
          radio: 'Radio de señales',
          scene: 'Bosque de noche con una hoguera. Usa las flechas para mirar alrededor.',
          help: 'Arrastra o <kbd>←</kbd> <kbd>→</kbd> para mirar · <kbd>1</kbd>–<kbd>{max}</kbd> sintoniza<br><kbd>Enter</kbd> habla con quien tengas delante · <kbd>+</kbd> <kbd>−</kbd> volumen',
          switchLang: 'Read in English'   // texto accesible del botón de idioma (en el idioma al que cambia)
        },
        intro: {
          title: 'Las estrellas se están',
          titleFade: 'apagando.',           // esta palabra se apaga letra a letra
          lede: 'Cinco viajeros tocan en algún lugar de este bosque y cada uno sabe algo de mí. Enciende la hoguera, sigue su música y reúnelos antes de que se haga noche cerrada.',
          start: 'Encender la hoguera',
          startAgain: 'Volver a la hoguera',
          classic: 'Prefiero la versión clásica',
          note: 'Mejor con sonido. Arrastra para mirar alrededor y haz clic en quien encuentres.',
          noteTouch: 'Mejor con sonido. Desliza para mirar alrededor y toca a quien encuentres.'
        },
        hints: {
          start: 'Sigue la música. Pulsa una señal del radio para sintonizarla.',
          found: '{friend} camina hacia la hoguera. Quedan {left}.',
          last: '{friend} se sienta con los demás. Ya estáis todos.',
          gathered: 'Ya estáis todos. Escuchad cómo suena junta la canción.'
        },
        signal: { all: 'todas las señales', far: 'lejos', near: 'cerca', here: 'aquí', found: 'en la hoguera' },
        sound: { on: 'Sonido: sí', off: 'Sonido: no', onShort: '♪ sí', offShort: '♪ no', none: 'Sin sonido' },
        talk: 'Hablar con {friend}',
        labelTalk: 'HABLAR',
        panel: { freq: 'Frecuencia', join: 'Ven a la hoguera', notNow: 'Ahora no', close: 'Cerrar' },
        copy: { idle: 'Copiar correo', done: 'Copiado', fail: 'Selecciónalo y cópialo' },
        classic: {
          back: 'Volver al bosque',
          teller: 'Te lo cuenta {friend} · {instrument}',
          inspiration: 'Inspiración',
          discover: 'Conocer {title} ↗'
        },
        enterOrb: 'Entrar en la esfera',
        // contador de quienes llegan al final ({n} = número)
        universe: {
          you: 'Eres la persona número {n} en llegar al centro del universo.'
        },
        ending: {
          eyebrow: 'Mucho tiempo después',
          title: 'En algún lugar, alguien enciende otra hoguera.',
          text: 'Gracias por encontrarlos a todos. Si quieres que construyamos algo juntos, escríbeme.',
          again: 'Volver al bosque',
          credit: 'Inspirado en {link} ({by}).'
        }
      }
    },

    /* ============================== ENGLISH ============================== */
    en: {
      label: 'English', short: 'EN',
      role: 'Full-stack developer · Custom AI',
      sampleNote: '',
      inspiration: {
        text: 'This campfire is a tribute to Outer Wilds: a universe that is going out, travellers playing the same song from different places, and a campfire where everything begins again. That is where the idea of finding someone by following the sound of their instrument comes from.',
        note: 'The drawings, music and code on this page are original. It has no official connection with the game or its creators.'
      },
      friends: {
        'sobre-mi': {
          name: 'The Lookout', instrument: 'Ocarina', section: 'About me',
          greet: "I've spent all night watching the stars go out. Looking for {name}? Sit down, I'll tell you who he is.",
          html: `
            <p class="lead">I'm a full-stack developer at Innovae. Lately I've been focused on building custom AI services: virtual assistants, avatars you can talk to, and agents that automate very specific tasks.</p>
            <p>I come from industrial automation and robotics, so I like to understand the whole system, from the database to the interface.</p>
            <p>Outside work I keep tinkering: I design technical parts in 3D and print them, I've built plenty of electronics projects with Arduino and ESP32, and I self-host my own tools at home. I also fly FPV drones; when I started, I built my own.</p>
            <dl class="facts">
              <div><dt>Based in</dt><dd>San Sebastián, Spain</dd></div>
              <div><dt>Now</dt><dd>Developer at Innovae</dd></div>
              <div><dt>Learning</dt><dd>Rust, Go and AI agents</dd></div>
              <div><dt>Hobbies</dt><dd>FPV drones, 3D modelling and printing, electronics and homelab</dd></div>
              <div><dt>Languages</dt><dd>Spanish, English and Basque</dd></div>
            </dl>`
        },
        proyectos: {
          name: 'The Cartographer', instrument: 'Kalimba', section: 'Projects',
          greet: 'I draw a map of everything {name} builds. These are the ones I keep closest at hand.',
          html: `
            <div class="cards">
              <article class="card">
                <header><span class="num">01</span><h4>WiseLogger</h4></header>
                <p>Self-hosted work-time tracker: shifts, tasks, automatic breaks, a Gantt-style timeline, history and stats of hours worked versus expected. It includes an MCP server so AI assistants such as Claude or Copilot can log tasks for you.</p>
                <ul class="tags"><li>TypeScript</li><li>Next.js</li><li>SQLite</li><li>Drizzle</li><li>MCP</li><li>Docker</li></ul>
                <a href="https://github.com/Jandro5vq/WiseLogger">View the code →</a>
              </article>
              <article class="card">
                <header><span class="num">02</span><h4>Foundry Price Checker</h4></header>
                <p>Terminal UI to search, compare and sort Azure AI Foundry model prices per million tokens, enriched with context window, capabilities and LMArena Elo rating. Exports to CSV.</p>
                <ul class="tags"><li>Rust</li><li>TUI</li><li>Azure</li><li>REST APIs</li></ul>
                <a href="https://github.com/Jandro5vq/foundry-price-checker">View the code →</a>
              </article>
              <article class="card">
                <header><span class="num">03</span><h4>OctoPrint GPIO PSU Control</h4></header>
                <p>OctoPrint plugin that switches a 3D printer's power supply on and off from a Raspberry Pi's GPIO: auto-on at startup, auto-connect to the printer, auto-off after printing, and an HTTP API.</p>
                <ul class="tags"><li>Python</li><li>Raspberry Pi</li><li>OctoPrint</li><li>Jinja</li></ul>
                <a href="https://github.com/Jandro5vq/OctoPrint-GPIO-PSUControl">View the code →</a>
              </article>
              <article class="card">
                <header><span class="num">04</span><h4>InnoCraft</h4></header>
                <p>Fabric modpack for Minecraft 1.21.1 that updates itself in Prism Launcher, published with packwiz and GitHub Pages, with scripts to build and release each version with its changelog.</p>
                <ul class="tags"><li>Python</li><li>Shell</li><li>GitHub Pages</li><li>packwiz</li></ul>
                <a href="https://github.com/Jandro5vq/InnoCraft">View the code →</a>
              </article>
              <article class="card">
                <header><span class="num">05</span><h4>Pill Assistant</h4></header>
                <p>Smart pill box for elderly people who find it hard to remember which pill to take and when. A family member sets it up from the app, so the person using it doesn't have to worry about anything.</p>
                <ul class="tags"><li>Hardware</li><li>App</li></ul>
                <a href="https://github.com/Jandro5vq/Pill-Assitant">View the project →</a>
              </article>
              <article class="card">
                <header><span class="num">06</span><h4>This campfire</h4></header>
                <p>This very portfolio: a forest drawn on canvas with music generated in the browser.</p>
                <ul class="tags"><li>Canvas</li><li>Web Audio</li><li>JavaScript</li></ul>
                <a href="https://github.com/Jandro5vq/Portfolio">View the code →</a>
              </article>
            </div>`
        },
        habilidades: {
          name: 'The Blacksmith', instrument: 'Drum', section: 'Skills',
          greet: 'Every one of his tools has been through my anvil. Here are the ones he uses most.',
          html: `
            <div class="skills">
              <div><h4>Languages</h4><ul class="tags"><li>TypeScript</li><li>JavaScript</li><li>Python</li><li>Rust</li><li>Kotlin</li><li>C#</li><li>C</li><li>PHP</li><li>SQL</li></ul></div>
              <div><h4>Frameworks</h4><ul class="tags"><li>Next.js</li><li>Node.js</li><li>Flask</li><li>Laravel</li><li>Tailwind CSS</li><li>Drizzle ORM</li></ul></div>
              <div><h4>Data</h4><ul class="tags"><li>PostgreSQL</li><li>MySQL</li><li>MariaDB</li><li>SQLite</li><li>Pandas</li><li>NumPy</li></ul></div>
              <div><h4>Artificial intelligence</h4><ul class="tags"><li>Virtual assistants</li><li>Agents and agentic workflows</li><li>RAG</li><li>Multilingual voice</li><li>MCP</li><li>Azure AI Foundry</li></ul></div>
              <div><h4>Hardware and automation</h4><ul class="tags"><li>Industrial automation</li><li>Industrial robotics</li><li>Arduino</li><li>ESP32</li><li>Raspberry Pi</li><li>3D modelling</li><li>3D printing</li><li>FPV drones</li></ul></div>
              <div><h4>Tools</h4><ul class="tags"><li>Git</li><li>Docker</li><li>Nginx</li><li>Azure</li><li>Unity</li><li>Android Studio</li><li>JWT</li></ul></div>
            </div>`
        },
        experiencia: {
          name: 'The Archivist', instrument: 'Cello', section: 'Experience',
          greet: 'I keep the record of every journey. This is {name}’s, from the most recent to the first.',
          html: `
            <ol class="timeline">
              <li><span class="when">Aug 2024 – present</span><strong>Developer · Innovae</strong><p>I build custom AI services integrated into applications:</p>
                <ul class="bullets">
                  <li>Conversational assistants that, besides answering, generate workflows from PDF documents and videos.</li>
                  <li>3D avatars in Unity you can talk to by voice in several languages, answering from each client's own knowledge (RAG).</li>
                  <li>Agents that watch a mailbox, interpret each message, act on it and record the data.</li>
                </ul></li>
              <li><span class="when">Education</span><strong>Higher VET diploma · Multiplatform Application Development (DAM) · CampusNet</strong><p>Desktop, mobile and web application development, and databases.</p></li>
              <li><span class="when">Education</span><strong>Higher VET diploma · Industrial Automation and Robotics · Salesianos Urnieta</strong><p>Automated systems, control and industrial robotics: this is where my love of hardware comes from.</p></li>
            </ol>`
        },
        contacto: {
          name: 'The Lighthouse Keeper', instrument: 'Bells', section: 'Contact',
          greet: 'From my lighthouse you can see the whole forest. If you want to write to {name}, follow this light.',
          html: `<p>Got a project, an idea, or just fancy a chat? Write to me.</p>{{contact}}`
        }
      },

      texts: {
        pageTitle: "{name}'s campfire",
        ui: {
          eyebrow: 'Portfolio',
          home: 'Back to the start',
          classic: 'Classic version',
          classicShort: 'Classic',
          volume: 'Volume',
          percent: '{v} percent',
          silence: 'Silent',
          tuning: 'Tuning',
          atFire: 'By the fire',
          radio: 'Signal radio',
          scene: 'A forest at night with a campfire. Use the arrow keys to look around.',
          help: 'Drag or <kbd>←</kbd> <kbd>→</kbd> to look · <kbd>1</kbd>–<kbd>{max}</kbd> to tune<br><kbd>Enter</kbd> talks to whoever is in front of you · <kbd>+</kbd> <kbd>−</kbd> volume',
          switchLang: 'Leer en español'
        },
        intro: {
          title: 'The stars are',
          titleFade: 'going out.',
          lede: 'Five travellers are playing somewhere in this forest, and each one knows something about me. Light the campfire, follow their music and gather them before the night closes in.',
          start: 'Light the campfire',
          startAgain: 'Back to the campfire',
          classic: "I'd rather see the classic version",
          note: 'Best with sound. Drag to look around and click on whoever you find.',
          noteTouch: 'Best with sound. Swipe to look around and tap on whoever you find.'
        },
        hints: {
          start: 'Follow the music. Press a signal on the radio to tune into it.',
          found: '{friend} walks towards the campfire. {left} to go.',
          last: '{friend} sits down with the others. Everyone is here.',
          gathered: 'Everyone is here. Listen to how the song sounds together.'
        },
        signal: { all: 'all signals', far: 'far', near: 'near', here: 'here', found: 'by the fire' },
        sound: { on: 'Sound: on', off: 'Sound: off', onShort: '♪ on', offShort: '♪ off', none: 'No sound' },
        talk: 'Talk to {friend}',
        labelTalk: 'TALK',
        panel: { freq: 'Frequency', join: 'Come to the campfire', notNow: 'Not now', close: 'Close' },
        copy: { idle: 'Copy email', done: 'Copied', fail: 'Select it and copy it' },
        classic: {
          back: 'Back to the forest',
          teller: 'Told by {friend} · {instrument}',
          inspiration: 'Inspiration',
          discover: 'Discover {title} ↗'
        },
        enterOrb: 'Enter the sphere',
        universe: {
          you: 'You are visitor number {n} to reach the centre of the universe.'
        },
        ending: {
          eyebrow: 'A long time later',
          title: 'Somewhere, someone lights another campfire.',
          text: 'Thank you for finding them all. If you would like to build something together, write to me.',
          again: 'Back to the forest',
          credit: 'Inspired by {link} ({by}).'
        }
      }
    }
  }
};
