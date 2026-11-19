/**
 * QuickKart image safety net.
 * Keeps the UI attractive if a local image is missing or a remote URL is unavailable.
 */
document.addEventListener('error', function (event) {
  const image = event.target;
  if (image && image.tagName === 'IMG' && !image.dataset.fallbackApplied) {
    image.dataset.fallbackApplied = 'true';
    image.src = '/static/assets/images/image-fallback.svg';
  }
}, true);
