// Morning note: rotating sweet messages in a small corner card.
// Shows on every visit to the site. Open pages also reload themselves when reload.txt
// holds a higher number than they have seen: raise the number and push to refresh her screen.
(function () {
  "use strict";

  var SEEN_KEY = "pn-reload-seen";
  var ROTATE_MS = 15 * 1000;
  var SWAP_MS = 450;
  var CHECK_EVERY_MS = 30 * 1000;

  // Exam: 21 Oct 2026, 8:00 AM on her device's clock. Messages switch once it starts.
  var EXAM_AT = new Date(2026, 9, 21, 8, 0, 0);
  var HOUR_MS = 60 * 60 * 1000;

  var STUDY_MESSAGES = [
    "My love, every module you finish tonight is one step closer to acing that 8 AM exam. I'm so proud of you.",
    "You are the most beautiful thing on this screen, and DV360 doesn't even come close.",
    "Open auction, PMP, PG... none of them win as many bids as you win in my heart.",
    "If you were a line item, my frequency cap for thinking about you would be unlimited.",
    "Take a deep breath, jaan. You know this. You've worked so hard, and I've watched every bit of it.",
    "Brand safe, viewable, and 100% my favourite person. That's you.",
    "Drink some water, stretch for a minute, and come back. I'm right here with you.",
    "You're stronger than any exam. Tomorrow at 8, go show them what my girl can do.",
    "Every time you get tired, remember someone out here is completely, hopelessly in love with you.",
    "Your brain is brilliant, your heart is gold, and your smile is my whole world.",
    "Real-time bidding takes 100 milliseconds. Falling for you took even less.",
    "You don't need luck tomorrow. You have your hard work and all my love.",
    "One more module, my love. Then one more. You're doing amazing, and I adore you.",
    "If studying gets heavy, close your eyes for a second and imagine my hug. It's yours.",
    "Floodlight tracks conversions. I just track how many times you make me smile. I lost count.",
    "The strongest, smartest, most beautiful girl I know is studying right now. Lucky exam.",
    "However tonight goes, I'm proud of you. Always. Now go win this.",
    "Don't stay up too late, okay? A rested you is unstoppable at 8 AM. I want you sharp and smiling.",
    "Your effort is the most attractive thing in the world. Keep going, my love.",
    "I believe in you more than you believe in pacing reports. And that's a lot."
  ];

  var AFTER_MESSAGES = [
    "You did it, my love. Whatever the result, I'm so incredibly proud of you.",
    "Exam done. Now rest, smile, and let me spoil you.",
    "You were brave and strong through all of it. I love you so much.",
    "The hard part is over. You're amazing, and you're mine to celebrate.",
    "However it went, you gave it everything. That's my girl."
  ];

  function hoursToExam() {
    return Math.ceil((EXAM_AT.getTime() - Date.now()) / HOUR_MS);
  }

  function currentMessages() {
    return hoursToExam() > 0 ? STUDY_MESSAGES : AFTER_MESSAGES;
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

  function greeting() {
    var h = new Date().getHours();
    var hello = h < 5 ? "Still up, my love?" : h < 12 ? "Good morning, my love" : h < 17 ? "Hi, beautiful" : h < 21 ? "Good evening, jaan" : "My brave girl";
    var left = hoursToExam();
    if (left <= 0) return hello;
    return hello + " · " + (left === 1 ? "1 hour" : left + " hours") + " to your exam";
  }

  function build() {
    var card = document.createElement("aside");
    card.className = "mn-card";
    card.setAttribute("aria-live", "polite");
    card.innerHTML = '<p class="mn-hi"></p><p class="mn-msg"></p>' +
      '<div class="mn-sign"><span>all my love, always</span><span class="mn-heart" aria-hidden="true"></span></div>' +
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
    var deck = shuffled(currentMessages());
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
      if (index >= deck.length) { deck = shuffled(currentMessages()); index = 0; }
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
