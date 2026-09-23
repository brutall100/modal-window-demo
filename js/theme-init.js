// Loaded in <head> before the CSS paints, so the saved theme never flashes.
(function () {
  var root = document.documentElement
  root.classList.add('js')
  try {
    var saved = localStorage.getItem('theme')
    if (saved === 'light' || saved === 'dark') root.setAttribute('data-theme', saved)
  } catch (e) {
    // Storage can be blocked (private mode). The system theme is used then.
  }
})()
