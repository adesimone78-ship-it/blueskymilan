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

// Dati del soggiorno dai campi Arrivo / Partenza / Ospiti (dall'8/11/2026).
// A Umami vanno solo numeri e nomi di mese, mai date esatte né dati personali.
var BSM_MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
var BSM_MESI_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// "2026-12-10" -> Date locale a mezzanotte (evita gli sfasamenti di fuso di new Date("2026-12-10"))
function bsmData(v) {
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || '');
  return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
}
function bsmIso(d) {
  return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
}
function bsmNotti(form) {
  var a = bsmData((form.querySelector('[name="arrivo"]') || {}).value);
  var b = bsmData((form.querySelector('[name="partenza"]') || {}).value);
  if (!a || !b) return null;
  var n = Math.round((b - a) / 86400000);
  return n >= 1 ? n : null;
}
function bsmDatiSoggiorno(form) {
  var out = {};
  var a = bsmData((form.querySelector('[name="arrivo"]') || {}).value);
  var n = bsmNotti(form);
  var o = parseInt((form.querySelector('[name="ospiti"]') || {}).value, 10);
  if (a) out.mese_arrivo = BSM_MESI[a.getMonth()];
  if (n) out.notti = n;
  if (o) out.ospiti = o;
  return out;
}
// Oggetto dell'email: "Nuova richiesta da blueskymilan.it — 10–15 dic, 5 notti, 2 ospiti"
function bsmOggetto(form, base) {
  var a = bsmData((form.querySelector('[name="arrivo"]') || {}).value);
  var b = bsmData((form.querySelector('[name="partenza"]') || {}).value);
  var o = (form.querySelector('[name="ospiti"]') || {}).value;
  var n = bsmNotti(form);
  if (!a || !b || !n) return base;
  var mesi = BSM_EN ? BSM_MESI_EN : BSM_MESI.map(function (x) { return x.slice(0, 3); });
  var txt = a.getDate() + (a.getMonth() !== b.getMonth() ? ' ' + mesi[a.getMonth()] : '') + '–' + b.getDate() + ' ' + mesi[b.getMonth()];
  txt += ', ' + n + (BSM_EN ? (n === 1 ? ' night' : ' nights') : (n === 1 ? ' notte' : ' notti'));
  if (o) txt += ', ' + o + (BSM_EN ? (o === '1' ? ' guest' : ' guests') : (o === '1' ? ' ospite' : ' ospiti'));
  return base + ' — ' + txt;
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

  // Arrivo / partenza: niente date passate, partenza almeno il giorno dopo l'arrivo
  if (form) {
    var fArrivo = form.querySelector('[name="arrivo"]');
    var fPartenza = form.querySelector('[name="partenza"]');
    if (fArrivo && fPartenza) {
      var oggi = new Date(); oggi.setHours(0, 0, 0, 0);
      fArrivo.min = bsmIso(oggi);
      var dopo = new Date(oggi); dopo.setDate(dopo.getDate() + 1);
      fPartenza.min = bsmIso(dopo);
      var controllaDate = function () {
        var a = bsmData(fArrivo.value);
        var b = bsmData(fPartenza.value);
        if (a) {
          var min = new Date(a); min.setDate(min.getDate() + 1);
          fPartenza.min = bsmIso(min);
        }
        var msg = '';
        if (a && b && b <= a) msg = BSM_EN ? 'Check-out must be after check-in.' : 'La partenza deve essere dopo l\'arrivo.';
        fPartenza.setCustomValidity(msg);
      };
      fArrivo.addEventListener('change', function () {
        controllaDate();
        // Se la partenza è vuota o non più valida, proponi la notte successiva come base
        var a = bsmData(fArrivo.value), b = bsmData(fPartenza.value);
        if (a && (!b || b <= a)) { var d = new Date(a); d.setDate(d.getDate() + 1); fPartenza.value = bsmIso(d); controllaDate(); }
      });
      fPartenza.addEventListener('change', controllaDate);
      fPartenza.addEventListener('input', controllaDate);
    }
  }

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
      var datiSoggiorno = bsmDatiSoggiorno(form);
      var fd = new FormData(form);
      var notti = bsmNotti(form);
      if (notti) fd.set('notti', String(notti));
      var campoOggetto = form.querySelector('[name="_subject"]');
      if (campoOggetto) fd.set('_subject', bsmOggetto(form, campoOggetto.value));
      fetch(form.action, {
        method: 'POST',
        body: fd,
        headers: { 'Accept': 'application/json' }
      }).then(function (res) {
        if (res.ok) {
          track('modulo_inviato', Object.keys(datiSoggiorno).length ? datiSoggiorno : undefined);
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
      var d = bsmDatiSoggiorno(form);
      track('modulo_inviato', Object.keys(d).length ? d : undefined);
    });
  }
});
