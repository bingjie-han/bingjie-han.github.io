(function () {
  var canvas = document.getElementById('snow-canvas');
  if (!canvas) return;

  var ctx = canvas.getContext('2d');
  var flakes = [];
  var pointer = { x: -9999, y: -9999, active: false };
  var last = performance.now();
  var wind = 0;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function resize() {
    var ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(window.innerWidth * ratio);
    canvas.height = Math.floor(window.innerHeight * ratio);
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    seed();
  }

  function count() {
    return Math.min(130, Math.max(45, Math.floor(window.innerWidth * window.innerHeight / 17000)));
  }

  function makeFlake(initial) {
    var radius = 1.2 + Math.random() * 3.8;
    return {
      x: Math.random() * window.innerWidth,
      y: initial ? Math.random() * window.innerHeight : -12 - Math.random() * 80,
      vx: -0.25 + Math.random() * 0.5,
      vy: 0.35 + Math.random() * 0.95 + radius * 0.08,
      ax: 0,
      ay: 0.006 + Math.random() * 0.008,
      r: radius,
      spin: Math.random() * Math.PI * 2,
      spinV: -0.018 + Math.random() * 0.036,
      alpha: 0.45 + Math.random() * 0.5
    };
  }

  function seed() {
    var target = reduceMotion ? 0 : count();
    while (flakes.length < target) flakes.push(makeFlake(true));
    flakes.length = target;
  }

  function step(now) {
    var dt = Math.min(32, now - last) / 16.67;
    last = now;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    wind += (Math.sin(now / 2400) * 0.028 - wind) * 0.012;

    for (var i = 0; i < flakes.length; i++) {
      var f = flakes[i];
      var dx = f.x - pointer.x;
      var dy = f.y - pointer.y;
      var distSq = dx * dx + dy * dy;

      f.ax = wind + Math.sin((now / 900) + f.y * 0.012) * 0.006;
      f.vx += f.ax * dt;
      f.vy += f.ay * dt;

      if (pointer.active && distSq < 13000) {
        var force = (13000 - distSq) / 13000;
        var dist = Math.sqrt(distSq) || 1;
        f.vx += (dx / dist) * force * 0.42;
        f.vy += (dy / dist) * force * 0.26;
      }

      f.vx *= 0.992;
      f.vy *= 0.998;
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      f.spin += f.spinV * dt;

      if (f.y > window.innerHeight + 18 || f.x < -40 || f.x > window.innerWidth + 40) {
        flakes[i] = makeFlake(false);
        continue;
      }

      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(f.spin);
      ctx.globalAlpha = f.alpha;
      var gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, f.r * 2.8);
      gradient.addColorStop(0, 'rgba(255,255,255,0.96)');
      gradient.addColorStop(0.55, 'rgba(230,247,255,0.72)');
      gradient.addColorStop(1, 'rgba(180,225,255,0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, f.r * 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    requestAnimationFrame(step);
  }

  window.addEventListener('resize', resize);
  window.addEventListener('pointermove', function (event) {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.active = true;
  }, { passive: true });
  window.addEventListener('pointerleave', function () {
    pointer.active = false;
  });

  resize();
  if (!reduceMotion) requestAnimationFrame(step);
})();