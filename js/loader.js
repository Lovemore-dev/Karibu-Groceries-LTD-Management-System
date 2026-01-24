function loadPage(page) {
  fetch(page)
    .then((response) => response.text())
    .then((html) => {
      document.getElementById('mainContent').innerHTML = html;
    })
    .catch((err) => console.error('Error loading page:', err));
}
loadPage();
