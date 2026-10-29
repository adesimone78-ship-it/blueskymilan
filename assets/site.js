// Blue Sky Milano — site.js
// Mobile nav toggle + cookie consent banner + mappa con consenso + statistiche Umami (anonime, senza cookie)
// Lo stesso file serve le pagine italiane e quelle inglesi (/en/): la lingua si legge da <html lang>.

var BSM_EN = (document.documentElement.getAttribute('lang') || '').toLowerCase().indexOf('en') === 0;

// --- Statistiche Umami -------------------------------------------------------
// Invio sicuro: se Umami non è caricato (adblock, rete, prova in locale) non succede niente.
// Regola: a Umami non arrivano MAI dati personali (nome, email, telefono, testo del messaggio).
const track = (n, d) => { try { if (window.umami && typeof window.umami.track === 'function') window.umami.track(n, d); } catch (_) {} };

// Zona della pagina in cui si trova un elemento cliccato
function bsmZona(el) {
  var zone = [
    ['.site-header', 'menu'],
    ['.site-footer', 'footer'],
    ['.cookie-banner', 'banner_cookie'],
    ['.form-error', 'errore_modulo'],
    ['.contact-info', 'contatti_diretti'],
    ['.cta-band', 'riquadro_finale'],
    ['.hero', 'testata'],
    ['.legal-content', 'testo_legale']
  ];
  for (var i = 0; i < zone.length; i++) {
    if (el.closest(zone[i][0])) return zone[i][1];
  }
  return 'contenuto';
}

// Ricava notti e mese di arrivo dal campo "Date del soggiorno" (testo libero).
// Restituisce solo numeri e nomi di mese, mai il testo scritto dall'ospite.
var BSM_MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
var BSM_MESI_ALIAS = {
  gennaio: 1, gen: 1, genn: 1, january: 1, jan: 1,
  febbraio: 2, feb: 2, february: 2,
  marzo: 3, mar: 3, march: 3,
  aprile: 4, apr: 4, april: 4,
  maggio: 5, mag: 5, may: 5,
  giugno: 6, giu: 6, june: 6, jun: 6,
  luglio: 7, lug: 7, july: 7, jul: 7,
  agosto: 8, ago: 8, august: 8, aug: 8,
  settembre: 9, set: 9, sett: 9, september: 9, sep: 9, sept: 9,
  ottobre: 10, ott: 10, october: 10, oct: 10,
  novembre: 11, nov: 11, november: 11,
  dicembre: 12, dic: 12, december: 12, dec: 12
};

function bsmDatiDate(testo) {
  var out = {};
  if (!testo) return out;
  var t = String(testo).toLowerCase();
  var re = /(\d+)[\/.](\d+)(?:[\/.](\d+))?|(\d+)|([a-zàèéìòù]+)/g;
  var tok = [], m;
  while ((m = re.exec(t)) !== null) tok.push(m);

  var date = [];          // { g: giorno, m: mese|null }
  var notti = null;
  var meseCorrente = null;
  var meseSolo = null;    // mese citato senza giorni
  var prevMese = false;   // il token precedente era un mese

  for (var i = 0; i < tok.length; i++) {
    var k = tok[i];
    var next = tok[i + 1] && tok[i + 1][5];
    if (k[1]) {                       // 10/11 o 10.11.2026
      var g1 = +k[1], m1 = +k[2];
      if (g1 >= 1 && g1 <= 31 && m1 >= 1 && m1 <= 12) date.push({ g: g1, m: m1 });
      prevMese = false;
    } else if (k[4]) {                // numero da solo
      var n = +k[4];
      if (next && /^(notti|notte|nights?|nuits?|nächte|noches)$/.test(next)) {
        if (n >= 1 && n <= 90) notti = n;
      } else if (next && /^(persone|persona|ospiti|ospite|adulti|adulto|bambini|people|persons?|guests?|adults?)$/.test(next)) {
        // numero di persone: ignorato
      } else if (k[4].length <= 2 && n >= 1 && n <= 31) {
        date.push({ g: n, m: prevMese ? meseCorrente : null });
      }
      prevMese = false;
    } else if (k[5]) {                // parola
      var mm = BSM_MESI_ALIAS[k[5]];
      if (mm) {
        var assegnati = 0;
        for (var j = 0; j < date.length; j++) {
          if (date[j].m === null) { date[j].m = mm; assegnati++; }
        }
        if (!assegnati && !date.length) meseSolo = meseSolo || mm;
        meseCorrente = mm;
        prevMese = true;
      } else {
        prevMese = false;
      }
    }
  }
  for (var z = 0; z < date.length; z++) {
    if (date[z].m === null && meseCorrente) date[z].m = meseCorrente;
  }
  date = date.filter(function (d) { return d.m; });

  var meseArrivo = date.length ? date[0].m : meseSolo;
  if (meseArrivo) out.mese_arrivo = BSM_MESI[meseArrivo - 1];

  if (date.length >= 2) {
    var oggi = new Date();
    var anno = oggi.getFullYear();
    if (date[0].m < oggi.getMonth() + 1) anno++;  // mese già passato: anno prossimo
    var a = new Date(anno, date[0].m - 1, date[0].g);
    var b = new Date(anno, date[1].m - 1, date[1].g);
    if (b < a) b = new Date(anno + 1, date[1].m - 1, date[1].g);
    var diff = Math.round((b - a) / 86400000);
    if (diff >= 1 && diff <= 90) notti = diff;
  }
  if (notti) out.notti = notti;
  return out;
}

// Un unico listener delegato per i clic sui link
document.addEventListener('click', function (e) {
  var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
  if (!a) return;
  var href = a.getAttribute('href') || '';
  var zona = bsmZona(a);
  var low = href.toLowerCase();

  if (/^https?:\/\/(wa\.me|api\.whatsapp\.com|web\.whatsapp\.com|chat\.whatsapp\.com)\//.test(low) || low.indexOf('whatsapp://') === 0) {
    track('whatsapp_click', { zona: zona });
  } else if (low.indexOf('mailto:') === 0) {
    track('email_click', { zona: zona });
  } else if (/^https?:\/\/(www\.)?(google\.[a-z.]+\/maps|maps\.google\.[a-z.]+|maps\.app\.goo\.gl|goo\.gl\/maps|maps\.apple\.com)/.test(low)) {
    track('maps_click', { zona: zona });
  } else if (a.classList.contains('nav-lang')) {
    track('lingua_click', { verso: a.getAttribute('hreflang') || '' });
  } else {
    var url;
    var reContatti = /\/(contatti|contact)\.html$/;
    try { url = new URL(a.href, window.location.href); } catch (_) { return; }
    if (url.origin === window.location.origin && reContatti.test(url.pathname) &&
        !reContatti.test(window.location.pathname)) {
      track('disponibilita_click', { zona: zona });
    }
  }
});

// --- Funzioni del sito -------------------------------------------------------
document.addEventListener('DOMContentLoaded', function () {
  // Mobile nav toggle
  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      links.classList.toggle('open');
    });
  }

  // Cookie consent
  var COOKIE_KEY = 'bsm_cookie_choice';
  var banner = document.getElementById('cookie-banner');

  function getChoice() {
    try { return localStorage.getItem(COOKIE_KEY); } catch (e) { return null; }
  }
  function setChoice(value) {
    try { localStorage.setItem(COOKIE_KEY, value); } catch (e) { /* ignore */ }
  }

  if (banner && !getChoice()) {
    banner.classList.add('show');
  }

  // Mappa Google: caricata solo dopo il consenso ("Accetta" nel banner o "Mostra la mappa")
  function loadMaps() {
    var boxes = document.querySelectorAll('[data-map-src]');
    for (var i = 0; i < boxes.length; i++) {
      var box = boxes[i];
      if (box.getAttribute('data-map-loaded')) continue;
      var iframe = document.createElement('iframe');
      iframe.src = box.getAttribute('data-map-src');
      iframe.loading = 'lazy';
      iframe.referrerPolicy = 'no-referrer-when-downgrade';
      iframe.title = box.getAttribute('data-map-title') || 'Map';
      box.innerHTML = '';
      box.appendChild(iframe);
      box.setAttribute('data-map-loaded', '1');
    }
  }
  if (getChoice() === 'accepted') loadMaps();
  var mapButtons = document.querySelectorAll('.map-load');
  for (var b = 0; b < mapButtons.length; b++) {
    mapButtons[b].addEventListener('click', function () {
      setChoice('accepted');
      if (banner) banner.classList.remove('show');
      loadMaps();
      track('mappa_mostrata');
    });
  }

  var acceptBtn = document.getElementById('cookie-accept');
  var rejectBtn = document.getElementById('cookie-reject');

  if (acceptBtn) {
    acceptBtn.addEventListener('click', function () {
      setChoice('accepted');
      banner.classList.remove('show');
      loadMaps();
    });
  }
  if (rejectBtn) {
    rejectBtn.addEventListener('click', function () {
      setChoice('rejected');
      banner.classList.remove('show');
    });
  }

  var form = document.getElementById('contact-form');

  // Statistiche del modulo (nessun dato personale: solo nomi dei campi e numeri)
  if (form) {
    // modulo_iniziato: primo input, una sola volta (tenuto in memoria: nulla viene salvato nel browser;
    // il Funnel di Umami conta comunque le visite uniche)
    var iniziato = false;
    var onPrimoInput = function (ev) {
      var f = ev.target;
      if (iniziato || !f || !f.name || f.name.charAt(0) === '_' || f.type === 'hidden') return;
      iniziato = true;
      track('modulo_iniziato', { campo: f.name });
    };
    form.addEventListener('input', onPrimoInput);
    form.addEventListener('change', onPrimoInput);

    // modulo_errore: tentativo di invio con campi mancanti o non validi
    // (il browser blocca l'invio e segnala ogni campo con un evento "invalid": ne contiamo uno per tentativo)
    var erroreSegnalato = false;
    form.addEventListener('invalid', function (ev) {
      if (erroreSegnalato) return;
      erroreSegnalato = true;
      setTimeout(function () { erroreSegnalato = false; }, 0);
      var f = ev.target;
      track('modulo_errore', {
        tipo: f && f.validity && f.validity.valueMissing ? 'campo_mancante' : 'campo_non_valido',
        campo: (f && f.name) || 'sconosciuto'
      });
    }, true);
  }

  // Modulo contatti: invio a Formspree in background, poi pagina di ringraziamento sul sito
  if (form && window.fetch && window.FormData) {
    var errorBox = document.getElementById('form-error');
    var submitBtn = form.querySelector('button[type="submit"]');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (errorBox) errorBox.hidden = true;
      var label = submitBtn ? submitBtn.textContent : '';
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = BSM_EN ? 'Sending…' : 'Invio in corso…'; }
      var campoDate = form.querySelector('[name="date"]');
      var datiDate = bsmDatiDate(campoDate ? campoDate.value : '');
      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      }).then(function (res) {
        if (res.ok) {
          track('modulo_inviato', Object.keys(datiDate).length ? datiDate : undefined);
          window.location.href = form.getAttribute('data-thanks') || (BSM_EN ? 'thank-you.html' : 'grazie.html');
        } else {
          throw new Error('invio non riuscito');
        }
      }).catch(function () {
        track('modulo_errore', { tipo: 'invio_non_riuscito' });
        if (errorBox) errorBox.hidden = false;
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = label; }
      });
    });
  } else if (form) {
    // Browser molto vecchi: invio classico, il modulo funziona come prima
    form.addEventListener('submit', function () {
      var campoDate = form.querySelector('[name="date"]');
      var d = bsmDatiDate(campoDate ? campoDate.value : '');
      track('modulo_inviato', Object.keys(d).length ? d : undefined);
    });
  }
});
