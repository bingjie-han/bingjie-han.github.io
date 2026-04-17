(function () {
  'use strict';

  function ready(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback, { once: true });
      return;
    }
    callback();
  }

  ready(function initSnowPhysics() {
    var canvas = document.getElementById('snow-canvas');

    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'snow-canvas';
      canvas.setAttribute('aria-hidden', 'true');
      document.body.appendChild(canvas);
    }

    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var flakes = [];
    var pointer = { x: -9999, y: -9999, active: false };
    var size = { width: 0, height: 0, ratio: 1 };
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var last = performance.now();
    var wind = 0;
    var rafId = null;

    document.documentElement.classList.add('has-snow-physics');

    function random(min, max) {
      return min + Math.random() * (max - min);
    }

    function targetCount() {
      var raw = Math.floor((size.width * size.height) / (reduceMotion ? 42000 : 9500));
      return Math.min(reduceMotion ? 48 : 220, Math.max(reduceMotion ? 22 : 96, raw));
    }

    function makeFlake(initial) {
      var depth = Math.random();
      var radius = random(1.2, 3.8) + depth * 2.8;

      return {
        x: random(-30, size.width + 30),
        y: initial ? random(0, size.height) : random(-120, -16),
        vx: random(-0.18, 0.18),
        vy: random(0.34, 0.9) + depth * 0.5,
        ay: random(0.004, 0.012) + depth * 0.004,
        radius: radius,
        depth: depth,
        alpha: random(0.45, 0.95),
        angle: random(0, Math.PI * 2),
        spin: random(-0.018, 0.018),
        phase: random(0, Math.PI * 2)
      };
    }

    function syncFlakes() {
      var target = targetCount();
      while (flakes.length < target) flakes.push(makeFlake(true));
      flakes.length = target;
    }

    function resize() {
      size.width = window.innerWidth || document.documentElement.clientWidth || 1;
      size.height = window.innerHeight || document.documentElement.clientHeight || 1;
      size.ratio = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.floor(size.width * size.ratio);
      canvas.height = Math.floor(size.height * size.ratio);
      canvas.style.width = size.width + 'px';
      canvas.style.height = size.height + 'px';
      ctx.setTransform(size.ratio, 0, 0, size.ratio, 0, 0);
      syncFlakes();
    }

    function drawFlake(f) {
      var glowRadius = f.radius * (2.4 + f.depth);

      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(f.angle);
      ctx.globalAlpha = f.alpha;

      var glow = ctx.createRadialGradient(0, 0, 0, 0, 0, glowRadius);
      glow.addColorStop(0, 'rgba(255,255,255,0.98)');
      glow.addColorStop(0.45, 'rgba(220,244,255,0.86)');
      glow.addColorStop(1, 'rgba(82,174,255,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, glowRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255,255,255,0.92)';
      ctx.lineWidth = Math.max(0.7, f.radius * 0.18);
      ctx.lineCap = 'round';

      for (var arm = 0; arm < 6; arm++) {
        ctx.rotate(Math.PI / 3);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -f.radius * 2.25);
        ctx.stroke();

        if (f.radius > 3) {
          ctx.beginPath();
          ctx.moveTo(0, -f.radius * 1.25);
          ctx.lineTo(f.radius * 0.42, -f.radius * 1.78);
          ctx.moveTo(0, -f.radius * 1.25);
          ctx.lineTo(-f.radius * 0.42, -f.radius * 1.78);
          ctx.stroke();
        }
      }

      ctx.restore();
    }

    function applyPointerForce(f, dt) {
      if (!pointer.active) return;

      var dx = f.x - pointer.x;
      var dy = f.y - pointer.y;
      var distSq = dx * dx + dy * dy;
      var radius = 180;

      if (distSq > radius * radius) return;

      var dist = Math.sqrt(distSq) || 1;
      var force = (1 - dist / radius) * (0.55 + f.depth * 0.32);
      f.vx += (dx / dist) * force * dt;
      f.vy += (dy / dist) * force * 0.58 * dt;
      f.angle += force * 0.12;
    }

    function step(now) {
      rafId = requestAnimationFrame(step);

      var dt = Math.min(34, now - last) / 16.67;
      if (reduceMotion) dt *= 0.48;
      last = now;

      ctx.clearRect(0, 0, size.width, size.height);
      wind += (Math.sin(now / 2300) * 0.05 - wind) * 0.018;

      for (var i = 0; i < flakes.length; i++) {
        var f = flakes[i];
        var swirl = Math.sin(now / 720 + f.phase + f.y * 0.012) * (0.009 + f.depth * 0.014);

        f.vx += (wind + swirl) * dt;
        f.vy += f.ay * dt;
        applyPointerForce(f, dt);

        f.vx *= 0.988;
        f.vy *= 0.997;
        f.x += f.vx * dt;
        f.y += f.vy * dt;
        f.angle += f.spin * dt + f.vx * 0.006;

        if (f.y > size.height + 40 || f.x < -70 || f.x > size.width + 70) {
          flakes[i] = makeFlake(false);
          continue;
        }

        drawFlake(f);
      }
    }

    function start() {
      if (rafId) return;
      last = performance.now();
      rafId = requestAnimationFrame(step);
    }

    function stop() {
      if (!rafId) return;
      cancelAnimationFrame(rafId);
      rafId = null;
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
    window.addEventListener('blur', function () {
      pointer.active = false;
    });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop();
      else start();
    });

    resize();
    start();
  });
})();
