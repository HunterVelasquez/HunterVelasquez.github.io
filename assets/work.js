// Work page: project grid, filters, and the project viewer.
// Deep links: /work/?p=<slug> opens a project, &tab=video opens its Photo/Video tab, ?show=engineering|film|earlier filters.
(function () {
  var D = window.HV, P = D.projects, $ = function (id) { return document.getElementById(id); };
  var LABEL = { 'Engineering': 'Engineering', 'Photo/Video': 'Photo/Video', 'Both': 'Engineering + Photo/Video', 'Earlier Builds': 'Engineering · Earlier build' };
  var FILTERS = { engineering: ['Engineering', 'Both'], film: ['Photo/Video', 'Both'], earlier: ['Earlier Builds'] };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var params = new URLSearchParams(location.search);

  $('count').textContent = P.length + ' projects';
  $('grid').innerHTML = P.map(function (p, i) {
    var m = p.media[0], still = m.type === 'image' ? m.src : m.poster;
    return '<button type="button" class="tile" data-i="' + i + '"><div class="hp"><img src="' + still + '" alt="" loading="lazy">' +
      (m.type !== 'image' ? '<span class="play"></span>' : '') + '</div><h3>' + esc(p.t) + '</h3><span class="label muted">' + esc(LABEL[p.c] || p.c) + '</span></button>';
  }).join('');
  $('grid').querySelectorAll('.tile').forEach(function (t) {
    var p = P[+t.getAttribute('data-i')], m = p.media[0];
    window.HV_hoverPlay(t.querySelector('.hp'), m.type === 'video' ? { video: m.src } : m.type === 'yt' ? { yt: m.id } : {});
    t.addEventListener('click', function () { open(p, 0); });
  });

  function filter(key) {
    var cats = FILTERS[key] || null;
    $('grid').querySelectorAll('.tile').forEach(function (t) { var p = P[+t.getAttribute('data-i')]; t.hidden = !!cats && cats.indexOf(p.c) < 0; });
    document.querySelectorAll('.filters button').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-f') === (key || '')); });
    var u = new URL(location.href); if (key) u.searchParams.set('show', key); else u.searchParams.delete('show'); history.replaceState(null, '', u);
  }
  document.querySelectorAll('.filters button').forEach(function (b) { b.addEventListener('click', function () { filter(b.getAttribute('data-f')); }); });

  // ---------- viewer ----------
  var V = $('viewer'), cur = null, I = 0, lastFocus = null;
  function media(p) {
    return p.media.map(function (m) {
      if (m.type === 'yt') return { type: 'yt', id: m.id, thumb: 'https://i.ytimg.com/vi/' + m.id + '/mqdefault.jpg' };
      if (m.type === 'video') return { type: 'video', src: m.src, poster: m.poster, thumb: m.poster };
      return { type: 'image', src: m.src, thumb: m.src };
    });
  }
  function show(n) {
    var M = cur.M; if (!M.length) return;
    I = (n + M.length) % M.length; var m = M[I], v = $('vView'), el;
    v.querySelectorAll('video').forEach(function (x) { try { x.pause(); } catch (e) {} });
    if (m.type === 'yt') {
      el = document.createElement('iframe'); el.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture; fullscreen'); el.setAttribute('allowfullscreen', '');
      el.title = cur.p.t; el.src = 'https://www.youtube-nocookie.com/embed/' + m.id + '?autoplay=1&mute=1&playsinline=1&rel=0&modestbranding=1';
    } else if (m.type === 'video') {
      el = document.createElement('video'); el.muted = true; el.loop = true; el.autoplay = true; el.playsInline = true; el.controls = true;
      el.setAttribute('playsinline', ''); el.poster = m.poster || ''; el.src = m.src;
    } else { el = document.createElement('img'); el.alt = cur.p.t; el.src = m.src; }
    v.innerHTML = ''; v.appendChild(el);
    if (m.type === 'video') { var pr = el.play(); if (pr && pr.catch) pr.catch(function () {}); }
    [].forEach.call($('vThumbs').children, function (b, k) { b.classList.toggle('on', k === I); });
  }
  function list(id, hid, arr, tag) {
    var el = $(id); el.innerHTML = ''; (arr || []).forEach(function (t) { var e = document.createElement(tag); e.textContent = t; el.appendChild(e); });
    var on = !!(arr && arr.length); el.classList.toggle('hide', !on); $(hid).classList.toggle('hide', !on);
  }
  function part(k) {
    var x = cur.parts[k] || {};
    $('vShort').textContent = x.s || ''; $('vShort').classList.toggle('hide', !x.s);
    $('vBody').textContent = x.body || '';
    list('vDid', 'vDidH', x.did, 'li'); list('vTools', 'vToolsH', x.tools, 'span');
    var a = $('vCta'); if (x.link) { a.href = x.link; a.textContent = x.cta || 'Open'; a.classList.remove('hide'); } else a.classList.add('hide');
    [].forEach.call($('vTabs').children, function (b, j) { b.classList.toggle('on', j === k); b.setAttribute('aria-selected', j === k); });
  }
  function open(p, tab) {
    if (!p) return;
    lastFocus = document.activeElement;
    var parts = p.parts && p.parts.length ? p.parts : [{ s: p.s, body: p.body, link: p.link, cta: p.cta, did: p.did, tools: p.tools }];
    cur = { p: p, parts: parts, M: media(p) };
    $('vCat').textContent = LABEL[p.c] || p.c; $('vTitle').textContent = p.t;
    $('vNote').textContent = p.note || ''; $('vNote').classList.toggle('hide', !p.note);
    var tb = $('vTabs'); tb.innerHTML = '';
    if (parts.length > 1) {
      parts.forEach(function (x, k) { var b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'tab'); b.textContent = x.label || ('Part ' + (k + 1)); b.onclick = function () { part(k); }; tb.appendChild(b); });
      tb.classList.remove('hide');
    } else tb.classList.add('hide');
    part(Math.min(tab || 0, parts.length - 1));
    var th = $('vThumbs'); th.innerHTML = '';
    if (cur.M.length > 1) cur.M.forEach(function (m, k) {
      var b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', 'Show item ' + (k + 1));
      b.style.backgroundImage = 'url("' + m.thumb + '")'; if (m.type !== 'image') b.className = 'vid'; b.onclick = function () { show(k); }; th.appendChild(b);
    });
    var many = cur.M.length > 1; th.classList.toggle('hide', !many); $('vPrev').classList.toggle('hide', !many); $('vNext').classList.toggle('hide', !many);
    V.hidden = false; requestAnimationFrame(function () { V.classList.add('open'); });
    document.body.classList.add('lock');
    show(0); $('vClose').focus();
    var u = new URL(location.href); u.searchParams.set('p', p.slug); if (tab) u.searchParams.set('tab', 'video'); else u.searchParams.delete('tab'); history.replaceState(null, '', u);
  }
  function close() {
    V.classList.remove('open'); document.body.classList.remove('lock');
    setTimeout(function () { V.hidden = true; $('vView').innerHTML = ''; }, 260);
    var u = new URL(location.href); u.searchParams.delete('p'); u.searchParams.delete('tab'); history.replaceState(null, '', u);
    if (lastFocus) lastFocus.focus();
  }
  $('vClose').onclick = close; $('vPrev').onclick = function () { show(I - 1); }; $('vNext').onclick = function () { show(I + 1); };
  V.addEventListener('click', function (e) { if (e.target === V) close(); });
  document.addEventListener('keydown', function (e) {
    if (V.hidden) return;
    if (e.key === 'Escape') close(); if (e.key === 'ArrowLeft') show(I - 1); if (e.key === 'ArrowRight') show(I + 1);
  });
  var tx = null; $('vView').addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; }, { passive: true });
  $('vView').addEventListener('touchend', function (e) { if (tx == null) return; var dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 40) show(I + (dx < 0 ? 1 : -1)); tx = null; });

  filter(params.get('show') || '');
  var want = params.get('p');
  if (want) open(P.filter(function (x) { return x.slug === want; })[0], params.get('tab') === 'video' ? 1 : 0);
})();
