// Love music: plays the tracks listed in love-messages.js (PN_LOVE.tracks) in the background.
// Browsers only allow sound after the visitor interacts, so it starts on her first tap, click or key press.
// A small round button pauses and resumes it; a pause is remembered across reloads.
(function () {
  "use strict";

  var PAUSED_KEY = "pn-music-paused";
  var START_EVENTS = ["pointerdown", "keydown", "touchstart"];
  var VOLUME = 0.6;

  var LOVE = window.PN_LOVE || {};
  var tracks = (LOVE.tracks || []).filter(function (t) { return typeof t === "string" && t; });
  if (!tracks.length) return;

  function readPaused() {
    try { return localStorage.getItem(PAUSED_KEY) === "1"; } catch (e) { return false; }
  }
  function savePaused(paused) {
    try { localStorage.setItem(PAUSED_KEY, paused ? "1" : "0"); } catch (e) { /* storage blocked: this page only */ }
  }

  var index = 0;
  var audio = new Audio();
  audio.preload = "auto";
  audio.volume = VOLUME;
  audio.src = tracks[index];

  var button = document.createElement("button");
  button.type = "button";
  button.className = "lm-toggle";
  document.body.appendChild(button);

  function render() {
    var playing = !audio.paused;
    button.classList.toggle("lm-playing", playing);
    button.setAttribute("aria-label", playing ? "Pause our song" : "Play our song");
    button.innerHTML = playing
      ? '<span class="lm-bars" aria-hidden="true"><i></i><i></i><i></i></span><span class="lm-icon" aria-hidden="true">❚❚</span>'
      : '<span class="lm-icon" aria-hidden="true">▶</span>';
  }

  function play() {
    var attempt = audio.play();
    if (attempt && attempt.catch) {
      attempt.catch(function (err) { console.warn("[love-music] could not play:", err.message); render(); });
    }
  }

  function nextTrack() {
    index = (index + 1) % tracks.length;
    audio.src = tracks[index];
    play();
  }

  function startOnFirstInteraction(e) {
    if (e && e.target === button) return;
    START_EVENTS.forEach(function (name) { document.removeEventListener(name, startOnFirstInteraction, true); });
    if (!readPaused()) play();
  }

  audio.addEventListener("ended", nextTrack);
  audio.addEventListener("play", render);
  audio.addEventListener("pause", render);
  audio.addEventListener("error", function () {
    console.warn("[love-music] skipped a track that failed to load:", tracks[index]);
    if (tracks.length > 1) nextTrack();
  });

  button.addEventListener("click", function () {
    START_EVENTS.forEach(function (name) { document.removeEventListener(name, startOnFirstInteraction, true); });
    if (audio.paused) { savePaused(false); play(); } else { savePaused(true); audio.pause(); }
  });

  START_EVENTS.forEach(function (name) { document.addEventListener(name, startOnFirstInteraction, true); });
  render();
})();
