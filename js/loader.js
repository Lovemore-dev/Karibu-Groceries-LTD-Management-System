function loadPage(page) {
  fetch(page)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Could not load ${page}`);
      }
      return response.text();
    })
    .then((html) => {
      document.getElementById('mainContent').innerHTML = html;
    })
    .catch((err) => {
      document.getElementById('mainContent').innerHTML =
        `<div class ="alert alert-danger">Error loading page: ${err.message}</div>`;
    });
}
loadPage();
