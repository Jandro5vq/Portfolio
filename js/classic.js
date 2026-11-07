/* Versión clásica: todo el portfolio como texto, en un idioma.
   La usa la página (js/app.js) y también tools/prerender.js, que la deja escrita en index.html
   para buscadores, previsualizaciones y visitantes sin JavaScript. Sin dependencias del DOM. */
(function (root) {
'use strict';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function forLang(base, lang){
  const L = base.i18n[lang], TX = L.texts;
  const cfg = Object.assign({}, base, {
    role: L.role, sampleNote: L.sampleNote || '',
    inspiration: base.inspiration ? Object.assign({}, base.inspiration, L.inspiration) : null
  });
  // Sustituye {clave} por su valor; {name} y {owner} siempre están disponibles
  const tpl = (s, vars = {}) => String(s).replace(/\{(\w+)\}/g, (m, k) => k in vars ? vars[k] : k === 'name' ? cfg.firstName : k === 'owner' ? cfg.owner : m);
  function contactHTML(){
    const e = esc(cfg.email);
    return `<div class="email-row"><a class="email" href="mailto:${e}">${e}</a><button class="btn copy" type="button" data-copy="${e}">${esc(TX.copy.idle)}</button></div>
    <ul class="linklist">${cfg.links.map(l => `<li><a class="btn" href="${esc(l.href)}" target="_blank" rel="noopener">${esc(l.label)} ↗</a></li>`).join('')}</ul>`;
  }
  const fill = (s) => tpl(s).replace('{{contact}}', contactHTML());
  // Viajeros con los textos de este idioma (copias: no toca los objetos originales)
  const friends = base.friends.map(f => Object.assign({}, f, L.friends[f.id]));

  function classicHTML(list = friends){
    const sections = list.map(fr => `
    <section class="classic-section content" id="${esc(fr.id)}" style="--c:${fr.color}">
      <h3>${esc(fr.section)}</h3>
      <p class="teller">${esc(tpl(TX.classic.teller, { friend: fr.name, instrument: fr.instrument }))}</p>
      ${fill(fr.html)}
    </section>`).join('');
    const ins = cfg.inspiration;
    const inspiration = ins ? `
    <section class="classic-section content inspiration" id="inspiracion" style="--c:var(--ember)">
      <h3>${esc(TX.classic.inspiration)}</h3>
      <p class="teller">${esc(ins.title)} · ${esc(ins.by)}</p>
      <p>${esc(ins.text)}</p>
      ${ins.note ? `<p class="muted">${esc(ins.note)}</p>` : ''}
      <a class="btn" href="${esc(ins.href)}" target="_blank" rel="noopener">${esc(tpl(TX.classic.discover, { title: ins.title }))}</a>
    </section>` : '';
    return `
    <header><h1><a class="home-link" href="./" title="${esc(TX.ui.home)}">${esc(cfg.owner)}</a></h1><p class="role">${esc(cfg.role)}</p></header>
    ${cfg.sampleNote ? `<p class="sample" style="margin-top:24px">${esc(cfg.sampleNote)}</p>` : ''}
    ${sections}${inspiration}`;
  }

  return { lang, L, TX, cfg, tpl, fill, contactHTML, friends, classicHTML };
}

root.HogueraClassic = { forLang, esc };
if (typeof module !== 'undefined' && module.exports) module.exports = root.HogueraClassic;
})(typeof window !== 'undefined' ? window : globalThis);
