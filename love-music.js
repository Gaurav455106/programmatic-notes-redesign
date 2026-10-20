// Love music: background songs with a small round pause / play button.
// Songs come from two places:
//   1. PN_LOVE.tracks in love-messages.js: audio files in the music/ folder that may be published.
//   2. Songs she adds with "+ Add our songs": saved in her browser (IndexedDB) on her device only,
//      never uploaded, and still there after reloads.
// It tries to start as soon as the page loads. Most browsers block sound until the visitor interacts,
// so if that is refused it starts on her first tap, click or key press instead. A pause is remembered.
(function () {
  "use strict";

  var PAUSED_KEY = "pn-music-paused";
  var DB_NAME = "pn-music";
  var STORE = "songs";
  var START_EVENTS = ["pointerdown", "keydown", "touchstart"];
  var VOLUME = 0.6;

  var LOVE = window.PN_LOVE || {};
  var published = (LOVE.tracks || []).filter(function (t) { return typeof t === "string" && t; });

  function readPaused() {
    try { return localStorage.getItem(PAUSED_KEY) === "1"; } catch (e) { return false; }
  }
  function savePaused(paused) {
    try { localStorage.setItem(PAUSED_KEY, paused ? "1" : "0"); } catch (e) { /* storage blocked: this page only */ }
  }

  // ---- songs saved on this device ----
  function openDb() {
    return new Promise(function (resolve, reject) {
      if (!window.indexedDB) return reject(new Error("IndexedDB unavailable"));
      var req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = function () { req.result.createObjectStore(STORE, { keyPath: "id", autoIncrement: true }); };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
  }

  function loadSavedSongs() {
    return openDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var req = db.transaction(STORE, "readonly").objectStore(STORE).getAll();
        req.onsuccess = function () { resolve(req.result || []); };
        req.onerror = function () { reject(req.error); };
      });
    }).catch(function (err) {
      console.warn("[love-music] saved songs unavailable:", err.message);
      return [];
    });
  }

  function saveSongs(files) {
    return openDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(STORE, "readwrite");
        files.forEach(function (f) { tx.objectStore(STORE).add({ name: f.name, blob: f }); });
        tx.oncomplete = function () { resolve(); };
        tx.onerror = function () { reject(tx.error); };
      });
    });
  }

  // ---- player ----
  var queue = [];
  var index = 0;
  var audio = new Audio();
  audio.preload = "auto";
  audio.volume = VOLUME;

  var bar = document.createElement("div");
  bar.className = "lm-bar";
  bar.innerHTML = '<button type="button" class="lm-toggle" hidden></button>' +
    '<button type="button" class="lm-add">+ Add our songs</button>' +
    '<input type="file" id="lm-file" accept="audio/*" multiple hidden>';
  document.body.appendChild(bar);
  var toggle = bar.querySelector(".lm-toggle");
  var addBtn = bar.querySelector(".lm-add");
  var fileInput = bar.querySelector("#lm-file");

  function render() {
    var playing = !audio.paused;
    toggle.hidden = !queue.length;
    addBtn.textContent = queue.length ? "+" : "+ Add our songs";
    addBtn.setAttribute("aria-label", "Add more songs");
    addBtn.classList.toggle("lm-add-small", queue.length > 0);
    toggle.classList.toggle("lm-playing", playing);
    toggle.setAttribute("aria-label", playing ? "Pause our song" : "Play our song");
    toggle.innerHTML = playing
      ? '<span class="lm-bars" aria-hidden="true"><i></i><i></i><i></i></span><span class="lm-icon" aria-hidden="true">❚❚</span>'
      : '<span class="lm-icon" aria-hidden="true">▶</span>';
  }

  function play() {
    if (!queue.length) return;
    var attempt = audio.play();
    if (attempt && attempt.catch) attempt.catch(function (err) { console.warn("[love-music] could not play:", err.message); render(); });
  }

  function load(i) {
    index = i % queue.length;
    audio.src = queue[index];
  }

  function nextTrack() {
    if (!queue.length) return;
    load(index + 1);
    play();
  }

  function stopWaiting() {
    START_EVENTS.forEach(function (name) { document.removeEventListener(name, startOnFirstInteraction, true); });
  }

  function startOnFirstInteraction(e) {
    if (e && bar.contains(e.target)) return;
    stopWaiting();
    if (!readPaused()) play();
  }

  function tryAutoplay() {
    if (readPaused() || !queue.length) return;
    var attempt = audio.play();
    if (attempt && attempt.then) attempt.then(stopWaiting).catch(function () { /* blocked until she interacts */ });
  }

  function setQueue(saved) {
    var urls = published.concat(saved.map(function (s) { return URL.createObjectURL(s.blob); }));
    var wasEmpty = !queue.length;
    queue = urls;
    if (wasEmpty && queue.length) load(0);
    render();
  }

  audio.addEventListener("ended", nextTrack);
  audio.addEventListener("play", render);
  audio.addEventListener("pause", render);
  audio.addEventListener("error", function () {
    console.warn("[love-music] skipped a song that failed to load");
    if (queue.length > 1) nextTrack();
  });

  toggle.addEventListener("click", function () {
    stopWaiting();
    if (audio.paused) { savePaused(false); play(); } else { savePaused(true); audio.pause(); }
  });

  addBtn.addEventListener("click", function () { fileInput.click(); });
  fileInput.addEventListener("change", function () {
    var files = Array.prototype.slice.call(fileInput.files || []).filter(function (f) { return /^audio\//.test(f.type) || /\.(mp3|m4a|aac|wav|ogg)$/i.test(f.name); });
    fileInput.value = "";
    if (!files.length) return;
    saveSongs(files).then(loadSavedSongs).then(function (saved) {
      var wasEmpty = !queue.length;
      setQueue(saved);
      if (wasEmpty) { savePaused(false); play(); }
    }).catch(function (err) {
      console.warn("[love-music] could not save songs:", err.message);
      addBtn.textContent = "Couldn't save. Try again";
    });
  });

  START_EVENTS.forEach(function (name) { document.addEventListener(name, startOnFirstInteraction, true); });
  // Published tracks start straight away; songs saved on this device join the queue once they load.
  setQueue([]);
  tryAutoplay();
  loadSavedSongs().then(function (saved) {
    if (!saved.length) return;
    var hadQueue = queue.length > 0;
    setQueue(saved);
    if (!hadQueue) tryAutoplay();
  });
})();
