// Manual reload signal. Open pages reload ONLY when reload.txt holds a higher number
// than the one they have already seen. Normal deploys never reload anyone.
// To reload everyone: increase the number in reload.txt and push.
// The highest number seen is remembered, so GitHub's CDN serving an older copy
// (it caches for up to 10 minutes) can never cause a reload loop.
(function () {
  "use strict";

  var CHECK_EVERY_MS = 30 * 1000;
  var SIGNAL_URL = "reload.txt";
  var SEEN_KEY = "pn-reload-seen";

  function readSeen() {
    try { return parseInt(localStorage.getItem(SEEN_KEY), 10) || 0; } catch (e) { return 0; }
  }
  function saveSeen(n) {
    try { localStorage.setItem(SEEN_KEY, String(n)); } catch (e) { /* storage blocked: this page only */ }
  }

  function readSignal() {
    return fetch(SIGNAL_URL + "?t=" + Date.now(), { cache: "no-store" }).then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.text();
    }).then(function (text) {
      var n = parseInt(text, 10);
      if (isNaN(n)) throw new Error("reload.txt is not a number");
      return n;
    });
  }

  var seen = null;

  function check() {
    readSignal().then(function (live) {
      if (seen === null) { seen = Math.max(live, readSeen()); saveSeen(seen); return; }
      if (live > seen) { saveSeen(live); location.reload(); }
    }).catch(function (err) {
      console.warn("[reload-signal] check skipped:", err.message);
    });
  }

  if (location.protocol === "file:") return;
  check();
  setInterval(check, CHECK_EVERY_MS);
})();
