// Blue Sky Milano — site.js
// Mobile nav toggle + cookie consent banner

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

  var acceptBtn = document.getElementById('cookie-accept');
  var rejectBtn = document.getElementById('cookie-reject');

  if (acceptBtn) {
    acceptBtn.addEventListener('click', function () {
      setChoice('accepted');
      banner.classList.remove('show');
    });
  }
  if (rejectBtn) {
    rejectBtn.addEventListener('click', function () {
      setChoice('rejected');
      banner.classList.remove('show');
    });
  }
});
