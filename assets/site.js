// Shared header, footer and hover-play behaviour for every page.
(function () {
  var STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><g transform="translate(12 12)">' +
    [0, 45, 90, 135].map(function (r) { return '<rect x="-1.6" y="-11" width="3.2" height="22" rx="1.4" transform="rotate(' + r + ')"/>'; }).join('') +
    '</g></svg>';
  window.HV_STAR = STAR;
  var here = location.pathname.replace(/index\.html$/, '');
  var cur = function (p) { return here === p ? ' aria-current="page"' : ''; };

  var header = document.getElementById('site-header');
  if (header) {
    header.className = 'site-header';
    header.innerHTML =
      '<a class="logo" href="/">' + STAR + '<span>Hunter Velasquez</span></a>' +
      '<nav class="nav" id="nav" aria-label="Main">' +
      '<a href="/#about">About</a><a href="/work/"' + cur('/work/') + '>Work</a><a href="/resume/"' + cur('/resume/') + '>Resume</a></nav>' +
      '<a class="pill" href="/#contact">Let’s talk</a>' +
      '<button class="menu-btn" aria-label="Menu" aria-expanded="false" aria-controls="nav"><span></span><span></span></button>';
    var btn = header.querySelector('.menu-btn');
    btn.addEventListener('click', function () {
      var open = !document.body.classList.contains('menu-open');
      document.body.classList.toggle('menu-open', open); btn.setAttribute('aria-expanded', open);
    });
    header.querySelectorAll('.nav a').forEach(function (a) { a.addEventListener('click', function () { document.body.classList.remove('menu-open'); btn.setAttribute('aria-expanded', 'false'); }); });
    var onScroll = function () { header.classList.toggle('solid', window.scrollY > 40); };
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  }

  var footer = document.getElementById('site-footer');
  if (footer) {
    footer.className = 'site-footer';
    footer.innerHTML =
      '<ul><li><a href="/">Home</a></li><li><a href="/#about">About</a></li><li><a href="/work/">Work</a></li><li><a href="/#contact">Let’s talk</a></li></ul>' +
      '<ul><li><a href="https://www.youtube.com/@HunterVelasquez" target="_blank" rel="noopener">YouTube</a></li><li><a href="https://www.linkedin.com/in/huntervelasquez" target="_blank" rel="noopener">LinkedIn</a></li><li><a href="https://www.instagram.com/hunter.velasquez/" target="_blank" rel="noopener">Instagram</a></li><li><a href="mailto:velasquezhunter@gmail.com">Email</a></li></ul>' +
      '<ul><li><a href="/resume/">Resume</a></li></ul>' +
      '<p class="copy">© ' + new Date().getFullYear() + ' Hunter Velasquez</p>';
  }

  // Hover-play: after a short hover, a tile swaps its still for the video (or a muted YouTube embed).
  // Phones and tablets keep the still; tapping opens the project instead.
  var canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  window.HV_hoverPlay = function (box, item) {
    if (!canHover || (!item.video && !item.yt)) return;
    var timer = null, el = null;
    var start = function () {
      if (!el) {
        if (item.video) {
          el = document.createElement('video');
          el.muted = true; el.loop = true; el.playsInline = true; el.preload = 'none'; el.src = item.video;
          el.setAttribute('muted', ''); el.setAttribute('playsinline', '');
          el.addEventListener('playing', function () { el.classList.add('on'); });
        } else {
          el = document.createElement('iframe');
          el.setAttribute('allow', 'autoplay; encrypted-media');
          el.setAttribute('tabindex', '-1'); el.title = '';
          el.addEventListener('load', function () { setTimeout(function () { el && el.classList.add('on'); }, 700); });
        }
        box.appendChild(el);
      }
      box.classList.add('playing');
      if (item.video) { var p = el.play(); if (p && p.catch) p.catch(function () {}); }
      else el.src = 'https://www.youtube-nocookie.com/embed/' + item.yt + '?autoplay=1&mute=1&controls=0&loop=1&playlist=' + item.yt + '&playsinline=1&rel=0&modestbranding=1';
    };
    var stop = function () {
      clearTimeout(timer); box.classList.remove('playing');
      if (!el) return;
      if (item.video) { el.pause(); }
      else { var f = el; el = null; f.classList.remove('on'); setTimeout(function () { f.remove(); }, 400); }
    };
    var host = box.closest('a,button') || box;
    host.addEventListener('mouseenter', function () { clearTimeout(timer); timer = setTimeout(start, 900); });
    host.addEventListener('mouseleave', stop);
  };
})();
