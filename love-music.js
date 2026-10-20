// Love music: background songs with a small round pause / play button.
// Songs come from three places:
//   1. Every audio file uploaded to the music/ folder of the GitHub repo (found through the GitHub API),
//      so a new upload plays on every device without any code change.
//   2. PN_LOVE.tracks in love-messages.js, for extra file paths.
//   3. Songs she adds with "⬆ Upload song": saved in her browser (IndexedDB) on her device only,
//      never uploaded, and still there after reloads.
// It tries to start as soon as the page loads. Most browsers block sound until the visitor interacts,
// so if that is refused it starts on her first tap, click or key press instead. A pause is remembered,
// and the song and position are saved so an auto-reload carries on where it left off.
(function () {
  "use strict";

  var PAUSED_KEY = "pn-music-paused";
  var DB_NAME = "pn-music";
  var STORE = "songs";
  var RESUME_KEY = "pn-music-resume";
  var RESUME_SAVE_MS = 3000;
  var START_EVENTS = ["pointerdown", "mousedown", "touchend", "click", "keydown"];
  var VOLUME = 0.6;
  var MUSIC_FOLDER_API = "https://api.github.com/repos/Gaurav455106/programmatic-notes-redesign/contents/music";
  var AUDIO_FILE = /\.(mp3|m4a|aac|wav|ogg)$/i;

  var LOVE = window.PN_LOVE || {};
  var configured = (LOVE.tracks || []).filter(function (t) { return typeof t === "string" && t; });
  var folderSongs = [];
  var savedSongs = [];

  // Lists the audio files in the repo's music/ folder, in name order, as paths on this site.
  function loadFolderSongs() {
    if (location.protocol === "file:") return Promise.resolve([]);
    return fetch(MUSIC_FOLDER_API, { headers: { Accept: "application/vnd.github+json" } }).then(function (res) {
      if (res.status === 404) return [];
      if (!res.ok) throw new Error("GitHub API HTTP " + res.status);
      return res.json();
    }).then(function (items) {
      return (Array.isArray(items) ? items : [])
        .filter(function (item) { return item.type === "file" && AUDIO_FILE.test(item.name); })
        .map(function (item) { return item.name; })
        .sort(function (a, b) { return a.localeCompare(b); })
        .map(function (name) { return "music/" + encodeURIComponent(name); });
    }).catch(function (err) {
      console.warn("[love-music] could not list the music folder:", err.message);
      return [];
    });
  }

  function readPaused() {
    try { return localStorage.getItem(PAUSED_KEY) === "1"; } catch (e) { return false; }
  }
  function savePaused(paused) {
    try { localStorage.setItem(PAUSED_KEY, paused ? "1" : "0"); } catch (e) { /* storage blocked: this page only */ }
  }

  function readResume() {
    try { return JSON.parse(localStorage.getItem(RESUME_KEY) || "null"); } catch (e) { return null; }
  }
  function saveResume() {
    if (!queue.length || !audio.currentSrc) return;
    try { localStorage.setItem(RESUME_KEY, JSON.stringify({ track: queue[index], time: audio.currentTime })); } catch (e) { /* storage blocked: start from the top next time */ }
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
    '<button type="button" class="lm-add">⬆ Upload song</button>' +
    '<input type="file" id="lm-file" accept="audio/*" multiple hidden>';
  document.body.appendChild(bar);
  var toggle = bar.querySelector(".lm-toggle");
  var addBtn = bar.querySelector(".lm-add");
  var fileInput = bar.querySelector("#lm-file");

  function render() {
    var playing = !audio.paused;
    toggle.hidden = !queue.length;
    addBtn.textContent = queue.length ? "+" : "⬆ Upload song";
    addBtn.setAttribute("aria-label", "Upload more songs");
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

  // Starts from the song and second saved before the last reload, if that song is still in the queue.
  function loadResumed() {
    var resume = readResume();
    var at = resume ? queue.indexOf(resume.track) : -1;
    load(at > -1 ? at : 0);
    if (at < 0 || !(resume.time > 0)) return;
    audio.addEventListener("loadedmetadata", function seek() {
      audio.removeEventListener("loadedmetadata", seek);
      if (resume.time < audio.duration) audio.currentTime = resume.time;
    });
  }

  function rebuildQueue() {
    var wasEmpty = !queue.length;
    queue = folderSongs.concat(configured, savedSongs.map(function (song) { return song.url; }));
    if (wasEmpty && queue.length) loadResumed();
    render();
    if (wasEmpty && queue.length) tryAutoplay();
  }

  function setSaved(saved) {
    savedSongs.forEach(function (song) { URL.revokeObjectURL(song.url); });
    savedSongs = saved.map(function (s) { return { url: URL.createObjectURL(s.blob) }; });
    rebuildQueue();
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
      if (wasEmpty) savePaused(false);
      setSaved(saved);
      if (wasEmpty) play();
    }).catch(function (err) {
      console.warn("[love-music] could not save songs:", err.message);
      addBtn.textContent = "Couldn't save. Try again";
    });
  });

  setInterval(function () { if (!audio.paused) saveResume(); }, RESUME_SAVE_MS);
  window.addEventListener("pagehide", saveResume);
  START_EVENTS.forEach(function (name) { document.addEventListener(name, startOnFirstInteraction, true); });
  // Each source joins the queue as soon as it answers; the first one with songs starts the music.
  rebuildQueue();
  loadFolderSongs().then(function (songs) { folderSongs = songs; if (songs.length) rebuildQueue(); });
  loadSavedSongs().then(function (saved) { if (saved.length) setSaved(saved); });
})();
