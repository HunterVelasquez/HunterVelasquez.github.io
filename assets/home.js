// Home page: the Engineering / Photo-Video switch and everything that changes with it.
(function () {
  var D = window.HV, $ = function (id) { return document.getElementById(id); };
  var params = new URLSearchParams(location.search);
  var mode = params.get('mode') === 'film' ? 'film' : 'build';
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  $('star').innerHTML = window.HV_STAR;

  function fill(m) {
    var c = D.content[m];
    document.querySelectorAll('[data-k]').forEach(function (el) { var k = el.getAttribute('data-k'); if (c[k] != null) el.textContent = c[k]; });
    $('caps').innerHTML = c.services.map(function (s) { return '<div class="cap"><h3>' + esc(s.title) + '</h3><p>' + esc(s.body) + '</p></div>'; }).join('');
    $('stats').innerHTML = c.stats.map(function (s) { return '<div class="stat"><b>' + esc(s[0]) + '</b><span>' + esc(s[1]) + '</span></div>'; }).join('');
    var cs = D.case[m];
    $('caseImg').src = cs.img; $('caseImg').alt = c.caseTitle; $('caseImg').style.objectPosition = cs.pos || '50% 50%';
    $('caseBtn').href = cs.link;
    // About reel
    var a = D.about[m], v = $('reelVideo');
    $('reelPoster').src = a.poster; $('reelPoster').alt = m === 'film' ? 'A storyteller reel' : 'An engineer reel';
    if (v.getAttribute('src') !== a.video) { v.classList.remove('on'); v.src = a.video; var p = v.play(); if (p && p.catch) p.catch(function () {}); }
    // Featured slider
    $('slides').innerHTML = D.featured[m].map(function (f, i) {
      var href = '/work/?p=' + f.slug + (f.tab ? '&tab=video' : '');
      return '<a class="slide" href="' + href + '"><div class="media hp" data-i="' + i + '"><img src="' + f.img + '" alt="" loading="lazy"><span class="play"></span></div><h3>' + esc(f.title) + '</h3><p>' + esc(f.description) + '</p></a>';
    }).join('');
    $('slides').querySelectorAll('.hp').forEach(function (box) {
      var f = D.featured[m][+box.getAttribute('data-i')];
      if (!f.video && !f.yt) box.querySelector('.play').remove();
      window.HV_hoverPlay(box, f);
    });
    $('slides').scrollLeft = 0; arrows();
    document.title = m === 'film' ? 'Hunter Velasquez | Photo/Video' : 'Hunter Velasquez | Engineering';
  }

  // Switch: click, keyboard, or drag the knob. --mix (0 = Engineering, 1 = Photo/Video) blends every color,
  // so dragging slides the whole page between the two looks; the words swap when it crosses the middle.
  var body = document.body, track = document.querySelector('.track'), knob = track.querySelector('.knob'), sides = document.querySelectorAll('.switch .side');
  var mix = mode === 'film' ? 1 : 0, anim = null, pending = null;
  function remember(m) {
    try { localStorage.setItem('hv-mode', m); } catch (e) {}
    var u = new URL(location.href); if (m === 'film') u.searchParams.set('mode', 'film'); else u.searchParams.delete('mode');
    history.replaceState(null, '', u);
  }
  function swapTo(m) {
    mode = m; body.classList.toggle('film', m === 'film');
    track.setAttribute('aria-checked', m === 'film');
    sides.forEach(function (s) { s.classList.toggle('on', s.getAttribute('data-to') === m); });
    remember(m);
    if (pending) return;
    body.classList.add('swapping');
    pending = setTimeout(function () { pending = null; fill(mode); body.classList.remove('swapping'); }, 230);
  }
  function applyMix(v) {
    mix = Math.max(0, Math.min(1, v));
    body.style.setProperty('--mix', mix.toFixed(3));
    knob.style.left = (4 + 50 * mix) + '%';
    var m = mix >= .5 ? 'film' : 'build'; if (m !== mode) swapTo(m);
  }
  function animateTo(target) {
    cancelAnimationFrame(anim);
    var from = mix, dist = Math.abs(target - from); if (!dist) return;
    var dur = 300 + 600 * dist, t0 = performance.now();
    var ease = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
    (function frame(now) {
      var t = Math.min(1, (now - t0) / dur); applyMix(from + (target - from) * ease(t));
      if (t < 1) anim = requestAnimationFrame(frame);
    })(t0);
  }
  sides.forEach(function (s) { s.addEventListener('click', function () { animateTo(s.getAttribute('data-to') === 'film' ? 1 : 0); }); });
  var drag = null;
  track.addEventListener('pointerdown', function (e) { cancelAnimationFrame(anim); drag = { x: e.clientX, moved: false }; track.setPointerCapture(e.pointerId); });
  track.addEventListener('pointermove', function (e) {
    if (!drag) return; if (!drag.moved && Math.abs(e.clientX - drag.x) < 4) return;
    drag.moved = true; track.classList.add('dragging');
    var r = track.getBoundingClientRect(), kw = knob.offsetWidth, min = r.width * .04, max = r.width * .96 - kw;
    applyMix((e.clientX - r.left - kw / 2 - min) / (max - min));
  });
  var release = function () {
    if (!drag) return; track.classList.remove('dragging');
    var moved = drag.moved; drag = null;
    animateTo(moved ? (mix >= .5 ? 1 : 0) : (mode === 'film' ? 0 : 1));
  };
  track.addEventListener('pointerup', release); track.addEventListener('pointercancel', release);
  track.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { e.preventDefault(); animateTo(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); animateTo(0); }
  });
  track.addEventListener('click', function (e) { if (e.detail === 0) animateTo(mode === 'film' ? 0 : 1); }); // keyboard Enter/Space

  // Process statement leans gently toward the pointer.
  var proc = $('process'), stmt = proc.querySelector('.stmt'), tilt = { x: 0, y: 0, tx: 0, ty: 0 }, tiltOn = false;
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    proc.addEventListener('pointermove', function (e) {
      var r = stmt.getBoundingClientRect();
      tilt.tx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width / 2)));
      tilt.ty = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (r.height * 1.2)));
      if (!tiltOn) { tiltOn = true; requestAnimationFrame(lean); }
    });
    proc.addEventListener('pointerleave', function () { tilt.tx = 0; tilt.ty = 0; });
  }
  function lean() {
    tilt.x += (tilt.tx - tilt.x) * .08; tilt.y += (tilt.ty - tilt.y) * .08;
    stmt.style.transform = 'rotateY(' + (tilt.x * 9).toFixed(2) + 'deg) rotateX(' + (-tilt.y * 7).toFixed(2) + 'deg) translate3d(' + (tilt.x * 6).toFixed(1) + 'px,' + (tilt.y * 4).toFixed(1) + 'px,0)';
    if (Math.abs(tilt.x) + Math.abs(tilt.y) + Math.abs(tilt.tx) + Math.abs(tilt.ty) > .002) requestAnimationFrame(lean); else { tiltOn = false; stmt.style.transform = ''; }
  }

  // Reel fades in once it is actually playing; resumes when the tab comes back.
  var rv = $('reelVideo');
  rv.addEventListener('playing', function () { rv.classList.add('on'); });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) { var p = rv.play(); if (p && p.catch) p.catch(function () {}); } });

  // Slider arrows
  var sl = $('slides');
  function arrows() { $('prevSlide').disabled = sl.scrollLeft < 8; $('nextSlide').disabled = sl.scrollLeft + sl.clientWidth > sl.scrollWidth - 8; }
  sl.addEventListener('scroll', arrows, { passive: true }); window.addEventListener('resize', arrows);
  var step = function (d) { var w = sl.querySelector('.slide'); sl.scrollBy({ left: d * (w ? w.getBoundingClientRect().width + 20 : 400), behavior: 'smooth' }); };
  $('prevSlide').addEventListener('click', function () { step(-1); }); $('nextSlide').addEventListener('click', function () { step(1); });

  body.classList.toggle('film', mode === 'film');
  applyMix(mix); swapTo(mode); clearTimeout(pending); pending = null; body.classList.remove('swapping'); fill(mode);
})();
