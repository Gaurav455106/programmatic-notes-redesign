// Auto-update: when a new version is pushed to GitHub Pages, every open copy of the
// site reloads itself. Checks once a minute (and when the tab is reopened), only while
// the tab is visible. GitHub Pages caches files for up to ~10 minutes, so a push can
// take that long to reach visitors.
(function () {
  "use strict";

  var CHECK_EVERY_MS = 60 * 1000;
  var WATCHED_FILES = [location.pathname, "config.js", "auto-update.js", "romance.js", "romance.css"];
  var baseline = null;

  function fingerprint(text) {
    var hash = 0;
    for (var i = 0; i < text.length; i++) hash = (hash * 31 + text.charCodeAt(i)) | 0;
    return hash;
  }

  function fetchText(path) {
    var url = path + (path.indexOf("?") === -1 ? "?" : "&") + "v=" + Date.now();
    return fetch(url, { cache: "no-store" }).then(function (res) {
      // A missing optional file (e.g. after rolling back the animation) is not a change.
      if (res.status === 404) return "";
      if (!res.ok) throw new Error("HTTP " + res.status + " for " + path);
      return res.text();
    });
  }

  function currentFingerprint() {
    return Promise.all(WATCHED_FILES.map(fetchText)).then(function (texts) {
      return fingerprint(texts.join("\n--\n"));
    });
  }

  function check() {
    if (document.hidden) return;
    currentFingerprint().then(function (fp) {
      if (baseline === null) { baseline = fp; return; }
      if (fp !== baseline) location.reload();
    }).catch(function (err) {
      // Offline or a GitHub hiccup: keep the page as it is and try again next round.
      console.warn("[auto-update] check skipped:", err.message);
    });
  }

  if (location.protocol === "file:") return; // fetch cannot read local files
  check();
  setInterval(check, CHECK_EVERY_MS);
  document.addEventListener("visibilitychange", check);
})();
