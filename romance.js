// Recurring love note: types the question out, floats hearts, fades, and comes back.
// The × hides it for the rest of the visit.
(function () {
  "use strict";

  var MESSAGE = "Which type of boyfriend do you want?";
  var FIRST_DELAY_MS = 2500;
  var TYPE_MS = 70;
  var HOLD_MS = 5000;
  var GAP_MS = 20000;
  var HEART_COUNT = 12;
  var DISMISS_KEY = "love-note-dismissed";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function isDismissed() {
    try { return sessionStorage.getItem(DISMISS_KEY) === "1"; } catch (e) { return false; }
  }
  function rememberDismissed() {
    try { sessionStorage.setItem(DISMISS_KEY, "1"); } catch (e) { /* private mode: hide for this page only */ }
  }

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

  function typeOut(target, done) {
    if (reduceMotion) { target.textContent = MESSAGE; done(); return; }
    var i = 0;
    target.textContent = "";
    var timer = setInterval(function () {
      i += 1;
      target.textContent = MESSAGE.slice(0, i);
      if (i >= MESSAGE.length) { clearInterval(timer); done(); }
    }, TYPE_MS);
  }

  function start() {
    if (isDismissed()) return;
    var ui = buildNote();
    var nextTimer = null;
    var stopped = false;

    function cycle() {
      if (stopped) return;
      ui.note.classList.remove("is-done");
      ui.note.classList.add("is-on");
      if (!reduceMotion) floatHearts(ui.note);
      typeOut(ui.text, function () {
        ui.note.classList.add("is-done");
        nextTimer = setTimeout(function () {
          ui.note.classList.remove("is-on");
          nextTimer = setTimeout(cycle, GAP_MS);
        }, HOLD_MS);
      });
    }

    ui.close.addEventListener("click", function () {
      stopped = true;
      clearTimeout(nextTimer);
      ui.note.classList.remove("is-on");
      rememberDismissed();
    });

    nextTimer = setTimeout(cycle, FIRST_DELAY_MS);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
