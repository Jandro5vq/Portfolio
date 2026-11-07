/* Escribe en index.html, a partir de js/content.js:
   - los metadatos de la cabecera (título, descripción, Open Graph, idiomas alternativos)
   - la versión clásica completa en el idioma por defecto
   Así la ven los buscadores, las previsualizaciones de enlaces y quien no tenga JavaScript.
   Uso: node tools/prerender.js   (deploy/deploy.sh lo ejecuta antes de publicar) */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');

// content.js asigna window.HOGUERA_CONTENT: se ejecuta con un "window" falso
const sandbox = { window: {} };
vm.runInNewContext(read('js/content.js'), sandbox, { filename: 'js/content.js' });
const BASE = sandbox.window.HOGUERA_CONTENT;
const { forLang, esc } = require(path.join(root, 'js/classic.js'));

const lang = BASE.defaultLang;
const H = forLang(BASE, lang);
const site = BASE.siteUrl.replace(/\/?$/, '/');
const title = H.tpl(H.TX.pageTitle);
const desc = H.tpl(H.TX.description);
const image = BASE.ogImage ? site + BASE.ogImage : '';
const langs = Object.keys(BASE.i18n);

const head = [
  `<title>${esc(title)}</title>`,
  `<meta name="description" content="${esc(desc)}">`,
  `<link rel="canonical" href="${esc(site)}">`,
  ...langs.map(l => `<link rel="alternate" hreflang="${l}" href="${esc(site)}?lang=${l}">`),
  `<link rel="alternate" hreflang="x-default" href="${esc(site)}">`,
  // resumen en texto plano para agentes de IA (también lo genera este script)
  ...langs.map(l => `<link rel="alternate" type="text/plain" hreflang="${l}" href="${esc(site)}${l === lang ? 'llms.txt' : `llms.${l}.txt`}" title="llms.txt">`),
  `<meta property="og:type" content="website">`,
  `<meta property="og:url" content="${esc(site)}">`,
  `<meta property="og:site_name" content="${esc(H.cfg.owner)}">`,
  `<meta property="og:title" content="${esc(title)}">`,
  `<meta property="og:description" content="${esc(desc)}">`,
  `<meta property="og:locale" content="${esc(H.L.locale || lang)}">`,
  ...langs.filter(l => l !== lang && BASE.i18n[l].locale).map(l => `<meta property="og:locale:alternate" content="${esc(BASE.i18n[l].locale)}">`),
  ...(image ? [
    `<meta property="og:image" content="${esc(image)}">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta property="og:image:alt" content="${esc(title)}">`,
    `<meta name="twitter:card" content="summary_large_image">`
  ] : [`<meta name="twitter:card" content="summary">`])
].join('\n');

function between(html, name, body, inline){
  const re = new RegExp(`(<!-- auto:${name}[^>]*-->)[\\s\\S]*?(<!-- /auto:${name} -->)`);
  if (!re.test(html)) throw new Error(`Falta el bloque <!-- auto:${name} --> en index.html`);
  return html.replace(re, (m, a, b) => inline ? `${a}${body}${b}` : `${a}\n${body}\n${b}`);
}

let html = read('index.html');
html = html.replace(/<html lang="[^"]*"/, `<html lang="${lang}"`);
html = between(html, 'head', head);
html = between(html, 'classic', H.classicHTML() + '\n', true);
fs.writeFileSync(path.join(root, 'index.html'), html);
console.log(`index.html actualizado (${lang}): "${title}"`);

/* ---------- llms.txt: el mismo contenido en Markdown para agentes de IA (https://llmstxt.org) ----------
   llms.txt en el idioma por defecto y llms.<idioma>.txt en los demás. */
const decode = (s) => s.replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const strip = (s) => decode(s.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
// Conversor pensado para el HTML de content.js (tarjetas, etiquetas, datos, línea temporal), no para HTML arbitrario
function toMarkdown(src){
  let s = src.replace(/\{\{contact\}\}/g, '');
  s = s.replace(/<span class="num">[\s\S]*?<\/span>/g, '');
  s = s.replace(/<li><span class="when">([\s\S]*?)<\/span><strong>([\s\S]*?)<\/strong>/g, (m, when, what) => `\n### ${strip(what)}\n_${strip(when)}_\n`);
  s = s.replace(/<h4>([\s\S]*?)<\/h4>/g, (m, t) => `\n### ${strip(t)}\n`);
  s = s.replace(/<ul class="tags[^"]*">([\s\S]*?)<\/ul>/g, (m, inner) => '\n' + [...inner.matchAll(/<li>([\s\S]*?)<\/li>/g)].map(x => strip(x[1])).join(' · ') + '\n');
  s = s.replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g, (m, href, t) => `[${strip(t).replace(/\s*[→↗]$/, '')}](${href})`);
  s = s.replace(/<dt>([\s\S]*?)<\/dt>\s*<dd>([\s\S]*?)<\/dd>/g, (m, k, v) => `\n- ${strip(k)}: ${strip(v)}`);
  s = s.replace(/<li>/g, '\n- ');
  s = s.replace(/<\/(p|article|header|ol|ul|dl|div)>/g, '\n');
  s = decode(s.replace(/<[^>]+>/g, ''));
  s = s.split('\n').map(l => l.replace(/\s+/g, ' ').trim()).join('\n').replace(/\n{3,}/g, '\n\n');
  // los elementos de una lista van seguidos, sin línea en blanco entre ellos
  while (/^(- .*)\n\n(?=- )/m.test(s)) s = s.replace(/^(- .*)\n\n(?=- )/gm, '$1\n');
  return s.trim();
}
const llmsFile = (l) => (l === lang ? 'llms.txt' : `llms.${l}.txt`);
for (const l of langs) {
  const T = forLang(BASE, l), X = T.TX, M = X.llms;
  // M.other nombra la otra versión en el idioma de este archivo (p. ej. «English version» en llms.txt)
  const others = langs.filter(o => o !== l).map(o => `${M.other || BASE.i18n[o].label}: ${site}${llmsFile(o)}`);
  const out = [
    `# ${T.cfg.owner}`,
    '',
    `> ${T.tpl(X.intro.quick)}`,
    '',
    M.intro,
    '',
    `- ${M.site}: ${site}?lang=${l}`,
    ...others.map(o => `- ${o}`),
    ''
  ];
  for (const fr of T.friends) {
    out.push(`## ${fr.section}`, '');
    const body = toMarkdown(T.tpl(fr.html));
    if (body) out.push(body, '');
    if (fr.html.includes('{{contact}}')) {
      out.push(`- ${M.email}: ${T.cfg.email}`, ...T.cfg.links.map(k => `- ${k.label}: ${k.href}`), '');
    }
  }
  if (T.cfg.inspiration) out.push(`## ${X.classic.inspiration}`, '', `${T.cfg.inspiration.title} (${T.cfg.inspiration.by}): ${T.cfg.inspiration.text}`, '');
  out.push('---', '', `${M.agents} ${site}para-agentes/`, '');
  fs.writeFileSync(path.join(root, llmsFile(l)), out.join('\n'));
  console.log(`${llmsFile(l)} actualizado`);
}
