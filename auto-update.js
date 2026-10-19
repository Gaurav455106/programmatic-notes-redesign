// Auto-update: when a new version is published on GitHub Pages, every open copy of the
// site reloads itself.
// How: GitHub stamps every deploy with a new Last-Modified date. We read the date of the
// copy this page was loaded from (the browser's cached response), then ask the server for
// its current date every 30 seconds. Different date = new deploy = reload.
// GitHub's CDN caches pages for up to 10 minutes, so a deploy can take that long to arrive.
(function () {
  "use strict";

  var CHECK_EVERY_MS = 30 * 1000;
  var PAGE_URL = location.pathname;
  var loadedVersion = null;

  function versionOf(res) {
    if (!res.ok) throw new Error("HTTP " + res.status);
    return res.headers.get("last-modified") || res.headers.get("etag");
  }

  // The copy this page came from: the browser cache answers without going to the network.
  function readLoadedVersion() {
    return fetch(PAGE_URL, { cache: "force-cache" }).then(versionOf);
  }

  function readLiveVersion() {
    return fetch(PAGE_URL, { method: "HEAD", cache: "no-store" }).then(versionOf);
  }

  function check() {
    readLiveVersion().then(function (live) {
      if (!live) return;
      if (loadedVersion === null) { loadedVersion = live; return; }
      if (live !== loadedVersion) location.reload();
    }).catch(function (err) {
      // Offline or a GitHub hiccup: keep the page as it is and try again next round.
      console.warn("[auto-update] check skipped:", err.message);
    });
  }

  if (location.protocol === "file:") return; // fetch cannot read local files
  readLoadedVersion()
    .then(function (v) { loadedVersion = v || null; })
    .catch(function () { loadedVersion = null; })
    .then(function () {
      check();
      setInterval(check, CHECK_EVERY_MS);
      document.addEventListener("visibilitychange", function () { if (!document.hidden) check(); });
    });
})();
