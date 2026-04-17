(function () {
  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');
  if (!toggle || !links) return;
  toggle.addEventListener('click', function () {
    var opened = links.classList.toggle('is-open');
    toggle.classList.toggle('is-open', opened);
    toggle.setAttribute('aria-expanded', opened ? 'true' : 'false');
  });
})();
