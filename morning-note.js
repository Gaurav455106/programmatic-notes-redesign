// Morning note: rotating sweet messages in a small corner card.
// Shows on every visit to the site. Open pages also reload themselves when reload.txt
// holds a higher number than they have seen: raise the number and push to refresh her screen.
(function () {
  "use strict";

  var SEEN_KEY = "pn-reload-seen";
  var ROTATE_MS = 15 * 1000;
  var SWAP_MS = 450;
  var CHECK_EVERY_MS = 30 * 1000;

  var MESSAGES = [
    "Good morning, beautiful. The sun got up early just to see you smile.",
    "You are stronger than you know, and I love that about you.",
    "Rise and shine, superstar. You've survived every hard day so far. That's a 100% record.",
    "Reminder: you are amazing. Not an opinion, a verified fact.",
    "Good morning, my favourite person. Drink some water and go be brilliant.",
    "You don't have to be perfect today. Just be you. I already love that version.",
    "Whatever's on your list today, you've got this. And I've got you.",
    "Morning, sleepyhead. Your smile is my favourite part of the day.",
    "You are brave, kind, clever, and a little bit magic.",
    "Little steps still count. I'm proud of every single one.",
    "Good morning to the strongest girl I know.",
    "If today feels heavy, take a breath. You've carried more and still shined.",
    "Studying again? Look at you, being unstoppable. I'm so proud of you.",
    "Coffee first. Then conquer the world. Then come tell me all about it.",
    "You're doing so much better than you think you are.",
    "Sending you a big warm hug and a tiny forehead kiss.",
    "Today's forecast: 100% chance of you being awesome, with a few showers of love.",
    "Be gentle with yourself today. You're my favourite work of art.",
    "Your hard work is noticed. Your heart is noticed. You are loved.",
    "Shine bright, cutie. The world is better with you in it, and so am I.",
    "Strong girls don't wait for good days. They make them. Go make one.",
    "You are capable of amazing things. Loving you is my favourite one.",
    "Take a break if you need it. I'll be right here cheering for you.",
    "Every time you doubt yourself, remember someone thinks you're the best thing ever."
  ];

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

  function greeting() {
    var h = new Date().getHours();
    if (h < 12) return "Good morning, sunshine";
    if (h < 17) return "Hi, superstar";
    if (h < 21) return "Good evening, love";
    return "Sleep well, strong girl";
  }

  function build() {
    var card = document.createElement("aside");
    card.className = "mn-card";
    card.setAttribute("aria-live", "polite");
    card.innerHTML = '<p class="mn-hi"></p><p class="mn-msg"></p>' +
      '<div class="mn-sign"><span>always cheering for you</span><span class="mn-heart" aria-hidden="true"></span></div>' +
      '<button class="mn-x" type="button" aria-label="Hide note">×</button>';
    var pill = document.createElement("button");
    pill.className = "mn-pill";
    pill.type = "button";
    pill.hidden = true;
    pill.setAttribute("aria-label", "Show note");
    pill.innerHTML = '<span class="mn-heart" aria-hidden="true"></span>';
    document.body.appendChild(card);
    document.body.appendChild(pill);
    return { card: card, pill: pill, hi: card.querySelector(".mn-hi"), msg: card.querySelector(".mn-msg"), x: card.querySelector(".mn-x") };
  }

  function startNotes() {
    var ui = build();
    var deck = shuffled(MESSAGES);
    var index = 0;

    function show(text) {
      ui.msg.classList.add("mn-swap");
      setTimeout(function () {
        ui.hi.textContent = greeting();
        ui.msg.textContent = text;
        ui.msg.classList.remove("mn-swap");
      }, SWAP_MS);
    }

    function next() {
      index += 1;
      if (index >= deck.length) { deck = shuffled(MESSAGES); index = 0; }
      show(deck[index]);
    }

    ui.hi.textContent = greeting();
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
