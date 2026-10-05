(function () {
    'use strict';
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    var snow = document.querySelector('.winter-snow');
    if (snow) {
        var fragment = document.createDocumentFragment();
        for (var i = 0; i < 32; i++) {
            var flake = document.createElement('span');
            flake.className = 'winter-flake';
            flake.textContent = i % 4 === 0 ? '❄' : '•';
            flake.style.cssText = 'left:' + ((i * 37) % 100) + '%;font-size:' +
                (i % 4 === 0 ? 18 + i % 9 : 8 + i % 6) + 'px;animation-duration:' +
                (16 + i % 13) + 's;animation-delay:-' + (i * 3.7) + 's;';
            fragment.appendChild(flake);
        }
        snow.appendChild(fragment);
    }
    var area = document.querySelector('.hero-copy');
    var title = document.querySelector('.home-title');
    if (!area || !title) return;
    var frame = 0;
    var point;
    function reset() {
        cancelAnimationFrame(frame);
        frame = 0;
        title.classList.remove('is-tracking');
        ['--ice-x', '--ice-y', '--tilt-x', '--tilt-y'].forEach(function (name) {
            title.style.removeProperty(name);
        });
    }
    area.addEventListener('pointermove', function (event) {
        if (reduced.matches || event.pointerType === 'touch') return;
        point = { x: event.clientX, y: event.clientY };
        if (frame) return;
        frame = requestAnimationFrame(function () {
            frame = 0;
            var box = area.getBoundingClientRect();
            var x = Math.max(0, Math.min(1, (point.x - box.left) / box.width));
            var y = Math.max(0, Math.min(1, (point.y - box.top) / box.height));
            title.style.setProperty('--ice-x', (x * 100) + '%');
            title.style.setProperty('--ice-y', (y * 100) + '%');
            title.style.setProperty('--tilt-x', ((.5 - y) * 12) + 'deg');
            title.style.setProperty('--tilt-y', ((x - .5) * 16) + 'deg');
            title.classList.add('is-tracking');
        });
    }, { passive: true });
    area.addEventListener('pointerleave', reset);
    window.addEventListener('blur', reset);
    reduced.addEventListener('change', reset);
})();
