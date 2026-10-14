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

  // Switch: click, keyboard, or drag the knob.
  var track = document.querySelector('.track'), knob = track.querySelector('.knob'), sides = document.querySelectorAll('.switch .side');
  function paintSwitch(m) {
    track.setAttribute('aria-checked', m === 'film'); knob.style.left = m === 'film' ? '54%' : '4%';
    sides.forEach(function (s) { s.classList.toggle('on', s.getAttribute('data-to') === m); });
  }
  function setMode(m, instant) {
    if (m === mode && !instant) return;
    mode = m; paintSwitch(m);
    document.body.classList.toggle('film', m === 'film');
    var u = new URL(location.href); if (m === 'film') u.searchParams.set('mode', 'film'); else u.searchParams.delete('mode');
    history.replaceState(null, '', u);
    if (instant) { fill(m); return; }
    document.body.classList.add('swapping');
    setTimeout(function () { fill(m); document.body.classList.remove('swapping'); }, 230);
  }
  sides.forEach(function (s) { s.addEventListener('click', function () { setMode(s.getAttribute('data-to')); }); });
  var drag = null;
  track.addEventListener('pointerdown', function (e) { drag = { x: e.clientX, moved: false }; track.setPointerCapture(e.pointerId); });
  track.addEventListener('pointermove', function (e) {
    if (!drag) return; var dx = e.clientX - drag.x; if (Math.abs(dx) < 4 && !drag.moved) return;
    drag.moved = true; track.classList.add('dragging');
    var r = track.getBoundingClientRect(), kw = knob.offsetWidth, min = r.width * .04, max = r.width * .96 - kw;
    var x = Math.max(min, Math.min(max, e.clientX - r.left - kw / 2)); knob.style.left = x + 'px'; drag.frac = (x - min) / (max - min);
  });
  track.addEventListener('pointerup', function () {
    if (!drag) return; track.classList.remove('dragging');
    var m = drag.moved ? (drag.frac >= .5 ? 'film' : 'build') : (mode === 'film' ? 'build' : 'film');
    drag = null; if (m === mode) paintSwitch(m); else setMode(m);
  });
  track.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { e.preventDefault(); setMode('film'); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); setMode('build'); }
  });
  track.addEventListener('click', function (e) { if (e.detail === 0) setMode(mode === 'film' ? 'build' : 'film'); }); // keyboard Enter/Space

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

  document.body.classList.toggle('film', mode === 'film');
  paintSwitch(mode); fill(mode);
})();
