// Morning note: rotating sweet messages in a small corner card.
// Shows on every visit to the site. Open pages also reload themselves when reload.txt
// holds a higher number than they have seen: raise the number and push to refresh her screen.
(function () {
  "use strict";

  var SEEN_KEY = "pn-reload-seen";
  var ROTATE_MS = 15 * 1000;
  var SWAP_MS = 450;
  var CHECK_EVERY_MS = 30 * 1000;
  var EFFECTS = ["mn-a-bounce", "mn-a-flip", "mn-a-beat", "mn-a-slide", "mn-a-jello", "mn-a-hearts"];
  var BURST_COUNT = 8;

  // Exam: 21 Oct 2026, 8:00 AM on her device's clock. The countdown disappears once it starts.
  var EXAM_AT = new Date(2026, 9, 21, 8, 0, 0);
  var HOUR_MS = 60 * 60 * 1000;

  var LOVE = window.PN_LOVE || { names: ["My Love"], messages: ["I love you ❤️"] };

  function hoursToExam() {
    return Math.ceil((EXAM_AT.getTime() - Date.now()) / HOUR_MS);
  }

  function currentMessages() {
    return LOVE.messages;
  }

  function store(action, key, value) {
    try {
      if (action === "get") return localStorage.getItem(key);
      if (action === "set") localStorage.setItem(key, value);
    } catch (e) { /* storage blocked: reload check falls back to this page only */ }
    return null;
  }

  function shuffled(list) {
    var copy = list.slice();
    for (var i = copy.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = copy[i]; copy[i] = copy[j]; copy[j] = tmp;
    }
    return copy;
  }

  function greeting(message) {
    var h = new Date().getHours();
    var name = LOVE.nameIn ? LOVE.nameIn(message) : "My Love";
    var hello = (h < 5 ? "Still up, " : h < 12 ? "Good morning, " : h < 17 ? "Hi, " : h < 21 ? "Good evening, " : "Good night, ") + name;
    var left = hoursToExam();
    if (left <= 0) return hello;
    return hello + " · " + (left === 1 ? "1 hour" : left + " hours") + " to your exam";
  }

  function heartBurst(card) {
    for (var i = 0; i < BURST_COUNT; i++) {
      var b = document.createElement("span");
      b.className = "mn-burst";
      b.innerHTML = '<span class="mn-heart"></span>';
      b.style.setProperty("--x", (10 + Math.random() * 80) + "%");
      b.style.setProperty("--dx", ((Math.random() - 0.5) * 120) + "px");
      b.style.setProperty("--t", (1.2 + Math.random() * 0.8) + "s");
      b.addEventListener("animationend", function (e) { e.currentTarget.remove(); });
      card.appendChild(b);
    }
  }

  function playEffect(card) {
    var effect = EFFECTS[Math.floor(Math.random() * EFFECTS.length)];
    EFFECTS.forEach(function (name) { card.classList.remove(name); });
    void card.offsetWidth;
    card.classList.add(effect);
    if (effect === "mn-a-hearts") heartBurst(card);
  }

  function build() {
    var card = document.createElement("aside");
    card.className = "mn-card";
    card.setAttribute("aria-live", "polite");
    card.innerHTML = '<p class="mn-hi"></p><p class="mn-msg"></p>' +
      '<div class="mn-player" hidden></div>' +
      '<div class="mn-sign"><button class="mn-music" type="button" hidden>♫ Play our songs</button>' +
      '<span>all my love, always</span><span class="mn-heart" aria-hidden="true"></span></div>' +
      '<button class="mn-x" type="button" aria-label="Hide note">×</button>';
    var pill = document.createElement("button");
    pill.className = "mn-pill";
    pill.type = "button";
    pill.hidden = true;
    pill.setAttribute("aria-label", "Show note");
    pill.innerHTML = '<span class="mn-heart" aria-hidden="true"></span>';
    document.body.appendChild(card);
    document.body.appendChild(pill);
    setUpMusic(card.querySelector(".mn-music"), card.querySelector(".mn-player"));
    return { card: card, pill: pill, hi: card.querySelector(".mn-hi"), msg: card.querySelector(".mn-msg"), x: card.querySelector(".mn-x") };
  }

  // Pulls the video ID out of a YouTube link, or "" if it isn't one.
  function youtubeId(link) {
    var match = /(?:youtu\.be\/|[?&]v=|\/shorts\/|\/embed\/)([A-Za-z0-9_-]{11})/.exec(link || "");
    return match ? match[1] : "";
  }

  // One embed that plays the first song, then the rest of the list in order.
  function songsEmbedUrl(links) {
    var ids = (links || []).map(youtubeId).filter(Boolean);
    if (!ids.length) return "";
    return "https://www.youtube-nocookie.com/embed/" + ids[0] + "?playlist=" + ids.slice(1).concat(ids[0]).join(",") + "&loop=1&rel=0";
  }

  // The player loads only when she taps the button; browsers never let sound start on its own.
  function setUpMusic(button, slot) {
    var embed = songsEmbedUrl(LOVE.songs);
    if (!embed) return;
    button.hidden = false;
    button.addEventListener("click", function () {
      if (!slot.firstChild) {
        var frame = document.createElement("iframe");
        frame.src = embed;
        frame.title = "Our songs";
        frame.loading = "lazy";
        frame.allow = "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture";
        slot.appendChild(frame);
      }
      slot.hidden = !slot.hidden;
      button.textContent = slot.hidden ? "♫ Play our songs" : "♫ Hide player";
    });
  }

  function startNotes() {
    var ui = build();
    var deck = shuffled(currentMessages());
    var index = 0;

    function show(text) {
      ui.msg.classList.add("mn-swap");
      setTimeout(function () {
        ui.hi.textContent = greeting(text);
        ui.msg.textContent = text;
        ui.msg.classList.remove("mn-swap");
        playEffect(ui.card);
      }, SWAP_MS);
    }

    function next() {
      index += 1;
      if (index >= deck.length) { deck = shuffled(currentMessages()); index = 0; }
      show(deck[index]);
    }

    ui.hi.textContent = greeting(deck[0]);
    ui.msg.textContent = deck[0];
    ui.x.addEventListener("click", function () { ui.card.hidden = true; ui.pill.hidden = false; });
    ui.pill.addEventListener("click", function () { ui.pill.hidden = true; ui.card.hidden = false; next(); });
    setInterval(function () { if (!document.hidden && !ui.card.hidden) next(); }, ROTATE_MS);
  }

  function startReloadSignal() {
    if (location.protocol === "file:") return;
    var seen = null;
    function check() {
      fetch("reload.txt?t=" + Date.now(), { cache: "no-store" }).then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.text();
      }).then(function (text) {
        var live = parseInt(text, 10);
        if (isNaN(live)) throw new Error("reload.txt is not a number");
        if (seen === null) { seen = Math.max(live, parseInt(store("get", SEEN_KEY), 10) || 0); store("set", SEEN_KEY, String(seen)); return; }
        if (live > seen) { store("set", SEEN_KEY, String(live)); location.reload(); }
      }).catch(function (err) {
        console.warn("[morning-note] reload check skipped:", err.message);
      });
    }
    check();
    setInterval(check, CHECK_EVERY_MS);
  }

  startNotes();
  startReloadSignal();
})();
