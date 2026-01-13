// eo-utils.js
(function () {
  function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  // Expose as a small namespace to avoid multiple globals
  window.EO = window.EO || {};
  window.EO.getQueryParam = getQueryParam;
})();
