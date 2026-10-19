// Recurring love note: types the question out, floats hearts, fades, and comes back.
// It grows a little every time it comes back. The × only hides the current appearance;
// the note always comes back after the usual gap.
(function () {
  "use strict";

  var MESSAGE = "Which type of boyfriend do you want?";
  var FIRST_DELAY_MS = 2500;
  var TYPE_MS = 70;
  var HOLD_MS = 5000;
  var GAP_MS = 5000;
  var HEART_COUNT = 12;
  var HOP_MS = 1100;           // how often it jumps to a new spot while showing
  var EDGE_PX = 16;
  var GROW_STEP = 0.3;         // each appearance is 30% bigger than the first
  var GROW_MAX = 3.5;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function buildNote() {
    var note = el("div", "love");
    note.setAttribute("aria-label", MESSAGE);
    var beat = el("span", "love-beat", "♥");
    beat.setAttribute("aria-hidden", "true");
    var text = el("span", "love-text");
    text.setAttribute("aria-hidden", "true");
    var close = el("button", "love-close", "×");
    close.type = "button";
    close.setAttribute("aria-label", "Hide this message");
    note.appendChild(beat);
    note.appendChild(text);
    note.appendChild(close);
    document.body.appendChild(note);
    return { note: note, text: text, close: close };
  }

  // Pick a random spot that keeps the whole note on screen.
  function jump(note) {
    var maxX = Math.max(EDGE_PX, window.innerWidth - note.offsetWidth - EDGE_PX);
    var maxY = Math.max(EDGE_PX, window.innerHeight - note.offsetHeight - EDGE_PX);
    note.style.setProperty("--x", Math.round(EDGE_PX + Math.random() * (maxX - EDGE_PX)) + "px");
    note.style.setProperty("--y", Math.round(EDGE_PX + Math.random() * (maxY - EDGE_PX)) + "px");
  }

  function floatHearts(anchor) {
    var box = anchor.getBoundingClientRect();
    for (var i = 0; i < HEART_COUNT; i++) {
      var heart = el("span", "love-heart", "♥");
      heart.setAttribute("aria-hidden", "true");
      heart.style.left = (box.left + Math.random() * box.width) + "px";
      heart.style.top = (box.top + box.height / 2) + "px";
      heart.style.fontSize = (14 + Math.random() * 18) + "px";
      heart.style.animationDelay = (i * 0.18) + "s";
      heart.style.setProperty("--dur", (2.8 + Math.random() * 1.6) + "s");
      heart.style.setProperty("--drift", (Math.random() * 120 - 60) + "px");
      heart.style.setProperty("--spin", (Math.random() * 50 - 25) + "deg");
      heart.addEventListener("animationend", function (e) { e.target.remove(); });
      document.body.appendChild(heart);
    }
  }

  // Types the message; returns a function that cancels the typing.
  function typeOut(target, done) {
    if (reduceMotion) { target.textContent = MESSAGE; done(); return function () {}; }
    var i = 0;
    target.textContent = "";
    var timer = setInterval(function () {
      i += 1;
      target.textContent = MESSAGE.slice(0, i);
      if (i >= MESSAGE.length) { clearInterval(timer); done(); }
    }, TYPE_MS);
    return function () { clearInterval(timer); };
  }

  function start() {
    // Clear the old "hidden for this visit" flag from an earlier version.
    try { sessionStorage.removeItem("love-note-dismissed"); } catch (e) { /* storage blocked: nothing to clear */ }
    var ui = buildNote();
    var appearances = 0;
    var run = 0;               // id of the current appearance; stale timers check it and stop
    var timers = [];
    var cancelTyping = function () {};

    function later(fn, ms, id) {
      timers.push(setTimeout(function () { if (id === run) fn(); }, ms));
    }

    function clearAll() {
      cancelTyping();
      timers.forEach(clearTimeout);
      timers = [];
    }

    function hopLoop(id) {
      jump(ui.note);
      if (!reduceMotion) later(function () { floatHearts(ui.note); }, 350, id);
      later(function () { hopLoop(id); }, HOP_MS, id);
    }

    function hide(id) {
      clearAll();
      ui.note.classList.remove("is-on");
      later(show, GAP_MS, id);
    }

    function show() {
      clearAll();
      run += 1;
      var id = run;
      var grow = Math.min(1 + appearances * GROW_STEP, GROW_MAX);
      appearances += 1;
      ui.note.style.setProperty("--grow", grow);
      ui.text.textContent = MESSAGE;   // measure at full size so the jump keeps it on screen
      jump(ui.note);
      ui.text.textContent = "";
      ui.note.classList.remove("is-done");
      ui.note.classList.add("is-on");
      if (!reduceMotion) floatHearts(ui.note);
      cancelTyping = typeOut(ui.text, function () {
        if (id !== run) return;
        ui.note.classList.add("is-done");
        if (!reduceMotion) later(function () { hopLoop(id); }, HOP_MS, id);
        later(function () { hide(id); }, HOLD_MS, id);
      });
    }

    // × hides this appearance only; it comes back after the usual gap.
    ui.close.addEventListener("click", function () { hide(run); });

    later(show, FIRST_DELAY_MS, run);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
