(function () {
    var heading = document.querySelector('.hero-card h2');
    if (!heading || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    var frame = 0;
    var pointer = null;

    function reset() {
        if (frame) cancelAnimationFrame(frame);
        frame = 0;
        pointer = null;
        heading.classList.remove('is-following');
        ['--follow-x', '--follow-y', '--follow-rotate-x', '--follow-rotate-y'].forEach(function (name) {
            heading.style.removeProperty(name);
        });
    }

    heading.addEventListener('pointermove', function (event) {
        if (reducedMotion.matches || event.pointerType === 'touch') return;
        pointer = { x: event.clientX, y: event.clientY };
        if (frame) return;

        frame = requestAnimationFrame(function () {
            frame = 0;
            var rect = heading.getBoundingClientRect();
            var x = Math.max(-1, Math.min(1, ((pointer.x - rect.left) / rect.width - 0.5) * 2));
            var y = Math.max(-1, Math.min(1, ((pointer.y - rect.top) / rect.height - 0.5) * 2));

            heading.style.setProperty('--follow-x', (x * 5).toFixed(2) + 'px');
            heading.style.setProperty('--follow-y', (y * 4).toFixed(2) + 'px');
            heading.style.setProperty('--follow-rotate-x', (y * -2.5).toFixed(2) + 'deg');
            heading.style.setProperty('--follow-rotate-y', (x * 3.5).toFixed(2) + 'deg');
            heading.classList.add('is-following');
        });
    }, { passive: true });

    heading.addEventListener('pointerleave', reset);
    reducedMotion.addEventListener('change', function (event) {
        if (event.matches) reset();
    });
})();
