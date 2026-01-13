// eo-sponsors.js
(function () {
  const CAROUSEL_INTERVAL_MS = 4500;
  const LOGOS_JSON_URL = 'logos.json'; // override by editing here if needed
  const ASSETS_PREFIX = 'assets/';

  const $logo = document.querySelector('.sponsor-logo');
  const $logoBox = document.querySelector('.logo-box');
  const $name = document.querySelector('.sponsor-name');
  const $level = document.querySelector('.sponsor-level-badge');
  const $dots = document.querySelector('.sponsor-dots');
  const $carousel = document.querySelector('.sponsor-carousel');

  // If the sponsor carousel isn't on this page, just do nothing.
  if (!$logo || !$logoBox || !$name || !$level || !$dots || !$carousel) return;

  let sponsors = [];
  let index = 0;
  let timer = null;

  function preload(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ ok: true, src });
      img.onerror = () => resolve({ ok: false, src });
      img.src = src;
    });
  }

  function parseWhitespace(ws) {
    if (ws == null) return 0;
    let num;
    if (typeof ws === 'string') {
      num = parseFloat(ws.replace('%', ''));
    } else {
      num = Number(ws);
    }
    if (!isFinite(num)) num = 0;
    num = Math.max(0, Math.min(40, num)); // clamp [0, 40]%
    return num;
  }

  function normalizeLevel(level) {
    if (!level) return '';
    const map = {
      platinum: 'Platinum',
      gold: 'Gold',
      silver: 'Silver',
      bronze: 'Bronze',
      partner: 'Partner',
      supporter: 'Supporter',
    };
    const key = String(level).toLowerCase().trim();
    return map[key] || level;
  }

  function renderDots(count) {
    $dots.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const d = document.createElement('button');
      d.className = 'sponsor-dot' + (i === index ? ' active' : '');
      d.setAttribute('type', 'button');
      d.setAttribute('role', 'tab');
      d.setAttribute('aria-label', `Sponsor ${i + 1}`);
      d.addEventListener('click', () => {
        index = i;
        showCurrent();
        resetTimer();
      });
      $dots.appendChild(d);
    }
  }

  async function showCurrent() {
    if (!sponsors.length) return;

    const s = sponsors[index];
    const imgSrc = ASSETS_PREFIX + s.filename;

    // Hide current logo (fade-out)
    $logo.classList.remove('show');

    // Preload next image
    const res = await preload(imgSrc);

    // Apply whitespace instantly
    const ws = parseWhitespace(s['Whitespace']);
    $logoBox.style.setProperty('--ws', ws + '%');

    // Update content
    $name.textContent = s['Sponsor Name'] || '';
    $level.textContent = normalizeLevel(s['Sponsor Level']) || '';

    if (res.ok) {
      $logo.src = imgSrc;
      $logo.alt = s['Sponsor Name'] ? `${s['Sponsor Name']} logo` : 'Sponsor logo';
    } else {
      $logo.removeAttribute('src');
      $logo.alt = 'Logo not available';
    }

    // Fade-in next logo
    requestAnimationFrame(() => {
      $logo.classList.add('show');
    });

    // Update dots
    [...$dots.children].forEach((d, i) => {
      d.classList.toggle('active', i === index);
    });
  }

  function next() {
    if (!sponsors.length) return;
    index = (index + 1) % sponsors.length;
    showCurrent();
  }

  function resetTimer() {
    if (timer) clearInterval(timer);
    timer = setInterval(next, CAROUSEL_INTERVAL_MS);
  }

  async function init() {
    try {
      const res = await fetch(LOGOS_JSON_URL, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch logos.json');
      const data = await res.json();

      const arr = Array.isArray(data)
        ? data
        : (Array.isArray(data.results) ? data.results : []);

      sponsors = arr
        .filter(s => s && s.filename)
        .map(s => ({
          'Sponsor Level': s['Sponsor Level'] ?? '',
          'Sponsor Name': s['Sponsor Name'] ?? '',
          'Whitespace': s['Whitespace'],
          filename: s.filename
        }));

      if (!sponsors.length) {
        const err = document.createElement('div');
        err.className = 'sponsor-error';
        err.textContent = 'No sponsors available.';
        $carousel.appendChild(err);
        return;
      }

      renderDots(sponsors.length);
      index = 0;
      await showCurrent();
      resetTimer();
    } catch (e) {
      const err = document.createElement('div');
      err.className = 'sponsor-error';
      err.textContent = 'Unable to load sponsors.';
      $carousel.appendChild(err);
      console.error(e);
    }
  }

  init();
})();
