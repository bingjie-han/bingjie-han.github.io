(function () {
    'use strict';
    var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    var cursor = document.createElement('div');
    cursor.className = 'snowflake-pointer';
    cursor.setAttribute('aria-hidden', 'true');
    cursor.innerHTML = '<span></span>';
    document.body.appendChild(cursor);

    function hide() {
        document.documentElement.classList.remove('snowflake-active');
        cursor.classList.remove('is-visible', 'is-pressed');
    }

    document.addEventListener('pointermove', function (event) {
        if (!finePointer.matches || reducedMotion.matches || event.pointerType === 'touch' ||
            event.target.closest('input, textarea, [contenteditable="true"], iframe')) {
            hide();
            return;
        }
        cursor.style.transform = 'translate3d(' + event.clientX + 'px,' + event.clientY + 'px,0)';
        cursor.classList.add('is-visible');
        document.documentElement.classList.add('snowflake-active');
    }, { passive: true });
    document.addEventListener('pointerdown', function () { cursor.classList.add('is-pressed'); });
    document.addEventListener('pointerup', function () { cursor.classList.remove('is-pressed'); });
    document.addEventListener('pointercancel', hide);
    document.documentElement.addEventListener('pointerleave', hide);
    window.addEventListener('blur', hide);
    finePointer.addEventListener('change', hide);
    reducedMotion.addEventListener('change', hide);
})();
