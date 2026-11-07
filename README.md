# La hoguera de Alejandro

Portfolio interactivo: un bosque de noche, una hoguera y cinco viajeros que tocan una misma canción. Cada viajero es una sección del portfolio.

## Estructura

```
index.html        estructura de la página (sin textos: los pone el JavaScript)
css/styles.css    estilos
js/content.js     TODO el contenido y los textos  ← lo que normalmente se edita
js/settings.js    ajustes del bosque, la cámara, los tiempos y la música
js/classic.js     versión clásica y utilidades de texto (las usan la página y tools/prerender.js)
js/audio.js       motor de sonido (Web Audio)
js/app.js         escena, interfaz y bucle de animación
img/og.png        imagen para previsualizaciones de enlaces (1200×630)
server/           servicio del contador del centro del universo
tools/            prerender.js (escribe metadatos y versión clásica en index.html) y og.sh (genera img/og.png)
deploy/           Dockerfile, nginx, docker-compose y script de despliegue
```

### Para agentes de IA

- `llms.txt` / `llms.en.txt`: todo el portfolio en Markdown ([llmstxt.org](https://llmstxt.org)). Los genera `tools/prerender.js` a partir de `js/content.js`.
- `para-agentes/`: un easter egg para los agentes que exploran la web. No aparece en buscadores (`noindex`). Se llega por las pistas de `robots.txt`, por `llms.txt` y por un enlace en `index.html` invisible para las personas y oculto a los lectores de pantalla. Es texto escrito a mano: si cambias el correo, cámbialo también ahí.

Después de cambiar `js/content.js`, ejecuta `node tools/prerender.js`: así el título, la descripción y la versión clásica quedan escritos en `index.html` y los ven buscadores, previsualizaciones (LinkedIn, WhatsApp…) y quien no tenga JavaScript. `deploy/deploy.sh` ya lo hace antes de publicar. Si cambias el nombre o el rol, regenera también la imagen con `bash tools/og.sh`.

No necesita compilación ni dependencias. Las fuentes se cargan desde Google Fonts. Los scripts son clásicos (no módulos), así que la página también funciona abriendo `index.html` con doble clic.

## Probarla en local

Abre `index.html` en el navegador o sírvela con cualquier servidor estático:

```bash
python -m http.server 8000
# y abre http://localhost:8000
```

## Cambiar el contenido (`js/content.js`)

Arriba están los datos comunes a todos los idiomas:

- `owner`, `firstName`, `email`, `links`, `defaultLang`
- `inspiration`: título, autor y enlace de la obra que inspira la página. Ponlo a `null` para quitarla
- `friends`: id, instrumento (`voice`), color y posición de cada viajero

Debajo, `i18n.es` e `i18n.en` tienen los textos de cada idioma:

- `role`, `sampleNote` y el texto de `inspiration`
- `friends`: por cada id, nombre del viajero, instrumento, sección, saludo y contenido HTML
- `texts`: todos los textos de la interfaz (intro, avisos, radio, panel, final…). Admiten marcadores como `{name}`, `{friend}` o `{left}`

Para añadir otro idioma (por ejemplo euskera), copia el bloque `en` con la clave `eu` y tradúcelo; el botón de idioma pasa a recorrer los tres.

## Idiomas

La primera vez se usa el idioma del navegador (si no está disponible, `defaultLang`). El botón ES/EN de la barra cambia el idioma al momento, sin perder el progreso, y la elección se recuerda. Para compartir un enlace en un idioma concreto: `?lang=en` o `?lang=es`.

## Ajustar el comportamiento (`js/settings.js`)

- `render`: resolución máxima del canvas (menor en pantallas táctiles) y el punto de corte de móvil
- `world`: capas del bosque, semilla, claros, sitios junto al fuego (`seats`: limita cuántos viajeros caben), estrellas
- `camera`, `signals`, `timing`: velocidades, alcance de las señales y duración de cada momento
- `music`: tempo, acordes, melodía, volumen de cada instrumento y acorde final

Si cambias el número de viajeros, el radio, los atajos de teclado y el contador se adaptan solos.

Al hacer clic en el nombre (arriba a la izquierda o en la versión clásica) se vuelve a la pantalla de inicio sin perder a los viajeros encontrados.

## Inspiración

Homenaje a [Outer Wilds](https://www.mobiusdigitalgames.com/) (Mobius Digital, 2019). Los dibujos, la música y el código son originales.

## Publicarla

Está publicada en **https://avq5.dev**: un contenedor Docker con nginx detrás de Traefik, que pone el HTTPS. Los archivos de despliegue están en `deploy/` (`Dockerfile`, `nginx.conf`, `docker-compose.yml`). Para publicar los cambios:

```bash
bash deploy/deploy.sh
```

El script sube `index.html`, `css/` y `js/` a `/docker/portfolio` en el servidor, reconstruye el contenedor `portfolio` y lo reinicia. La versión anterior queda en `/docker/portfolio.prev`. Para volver a ella:

```bash
ssh root@avq5.dev "cd /docker && mv portfolio portfolio.bad && mv portfolio.prev portfolio && cd portfolio && docker compose -p portfolio up -d --build"
```

### Contador del centro del universo

Al final, cada visitante ve qué número de persona es en llegar al centro del universo. La cuenta la lleva un servicio mínimo en Node, sin dependencias (`server/server.js`), en su propio contenedor (`portfolio-contador`). Traefik le envía `avq5.dev/api/…` y el número se guarda en el volumen `portfolio_contador-data`, que se conserva entre despliegues.

- `GET /api/universe` devuelve el total y `POST /api/universe` suma uno.
- Cada navegador cuenta una sola vez (lo recuerda). El servidor, además, cuenta como mucho una vez cada 12 h por IP. Las IP no se guardan en disco.
- En local (sin el servicio) el número simplemente no aparece. Se desactiva con `counter: null` en `js/settings.js`.
- Para ver la cuenta: `curl https://avq5.dev/api/universe`.

El nginx sirve los archivos con `Cache-Control: no-cache`: el navegador los guarda, pero comprueba en cada visita si han cambiado, así que los cambios se ven al momento.

Como son archivos estáticos, también vale cualquier otro hosting (GitHub Pages, Netlify, Cloudflare Pages…).

## Controles

- Arrastrar, flechas o rueda: mirar alrededor
- `1`–`5`: sintonizar una señal
- `Enter`: hablar con quien tengas delante
- `M`: silenciar · `+` / `−`: volumen
- `Esc`: cerrar paneles

En móvil: desliza para mirar, toca la flecha lateral para ir hacia la señal sintonizada y usa el botón «Hablar con…» cuando tengas a alguien delante. El volumen se controla con los botones del teléfono.
