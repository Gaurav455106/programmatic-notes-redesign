// Love burst: every few minutes, a full-screen heart animation with a big "I love you".
// Three styles picked at random: heart fireworks, heart rain, and one giant beating heart.
// It closes by itself after a few seconds; a tap, click or Esc closes it sooner.
(function () {
  "use strict";

  var FIRST_DELAY_MS = 90 * 1000;
  var MIN_GAP_MS = 5 * 60 * 1000;
  var MAX_GAP_MS = 9 * 60 * 1000;
  var SHOW_MS = 10000;
  var FADE_MS = 800;
  var FONT_URL = "https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap";
  var MODES = ["fireworks", "rain", "beat"];
  var PINKS = ["#ff4d7d", "#ff7aa2", "#ffb3c8", "#ff2e63", "#ffd1dc", "#ff8fab"];

  var LOVE = window.PN_LOVE || { names: ["My Love"], messages: ["I love you ❤️"] };

  var showing = false;

  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
  function rand(min, max) { return min + Math.random() * (max - min); }

  function loadFont() {
    if (document.querySelector('link[href="' + FONT_URL + '"]')) return;
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = FONT_URL;
    document.head.appendChild(link);
  }

  function drawHeart(ctx, x, y, size, color, alpha) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.fillStyle = color;
    ctx.translate(x, y);
    ctx.scale(size / 30, size / 30);
    ctx.beginPath();
    ctx.moveTo(0, 8);
    ctx.bezierCurveTo(0, 5, -5, -6, -15, -6);
    ctx.bezierCurveTo(-30, -6, -30, 12, -30, 12);
    ctx.bezierCurveTo(-30, 22, -18, 32, 0, 42);
    ctx.bezierCurveTo(18, 32, 30, 22, 30, 12);
    ctx.bezierCurveTo(30, 12, 30, -6, 15, -6);
    ctx.bezierCurveTo(5, -6, 0, 5, 0, 8);
    ctx.fill();
    ctx.restore();
  }

  function fireworkBurst(w, h) {
    var cx = rand(w * 0.2, w * 0.8), cy = rand(h * 0.2, h * 0.6), color = pick(PINKS), parts = [];
    for (var i = 0; i < 26; i++) {
      var angle = (Math.PI * 2 * i) / 26, speed = rand(2.5, 6);
      parts.push({ x: cx, y: cy, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, size: rand(8, 16), color: color, life: 1, decay: rand(0.008, 0.014), gravity: 0.05 });
    }
    return parts;
  }

  function rainDrop(w) {
    return { x: rand(0, w), y: rand(-80, -20), vx: rand(-0.6, 0.6), vy: rand(1.5, 4), size: rand(10, 28), color: pick(PINKS), life: 1, decay: 0, gravity: 0, spin: rand(0, Math.PI * 2) };
  }

  function runCanvas(canvas, mode) {
    var ctx = canvas.getContext("2d");
    var dpr = window.devicePixelRatio || 1;
    var w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
    var parts = [], frame = 0, running = true;

    function step() {
      if (!running) return;
      frame += 1;
      ctx.clearRect(0, 0, w, h);
      if (mode === "fireworks" && frame % 35 === 1) parts = parts.concat(fireworkBurst(w, h));
      if (mode === "rain" && frame % 3 === 0) parts.push(rainDrop(w));
      if (mode === "beat") {
        var pulse = 1 + 0.12 * Math.max(0, Math.sin(frame / 7)) + 0.06 * Math.max(0, Math.sin(frame / 7 + 1.2));
        drawHeart(ctx, w / 2, h / 2 - Math.min(w, h) * 0.3, Math.min(w, h) * 0.5 * pulse, "#ff2e63", 0.35);
        if (frame % 6 === 0) parts.push({ x: w / 2 + rand(-60, 60), y: h / 2, vx: rand(-3, 3), vy: rand(-4, -1.5), size: rand(8, 18), color: pick(PINKS), life: 1, decay: 0.01, gravity: 0.02 });
      }
      parts = parts.filter(function (p) { return p.life > 0 && p.y < h + 60; });
      parts.forEach(function (p) {
        p.x += p.vx; p.y += p.vy; p.vy += p.gravity; p.life -= p.decay;
        drawHeart(ctx, p.x, p.y, p.size, p.color, p.life);
      });
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
    return function stop() { running = false; };
  }

  function show() {
    if (showing || document.hidden) return;
    showing = true;
    loadFont();
    var overlay = document.createElement("div");
    overlay.className = "lb-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-label", "I love you");
    var letters = "I love you".split("").map(function (ch, i) {
      return '<span style="animation-delay:' + (0.15 + i * 0.09) + 's">' + (ch === " " ? "&nbsp;" : ch) + "</span>";
    }).join("");
    overlay.innerHTML = '<canvas class="lb-canvas" aria-hidden="true"></canvas>' +
      '<div class="lb-text"><p class="lb-big">' + letters + '</p><p class="lb-name"></p><p class="lb-sub"></p></div>' +
      '<p class="lb-hint">tap anywhere to keep studying</p>';
    var message = pick(LOVE.messages);
    overlay.querySelector(".lb-name").textContent = LOVE.nameIn ? LOVE.nameIn(message) : "My Love";
    overlay.querySelector(".lb-sub").textContent = message;
    document.body.appendChild(overlay);

    var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    var stopCanvas = reduced ? function () {} : runCanvas(overlay.querySelector(".lb-canvas"), pick(MODES));
    var autoClose = setTimeout(close, SHOW_MS);

    function onKey(e) { if (e.key === "Escape") close(); }
    function close() {
      clearTimeout(autoClose);
      document.removeEventListener("keydown", onKey);
      overlay.classList.add("lb-out");
      setTimeout(function () { stopCanvas(); overlay.remove(); showing = false; }, FADE_MS);
    }
    overlay.addEventListener("click", close);
    document.addEventListener("keydown", onKey);
  }

  function scheduleNext(delay) {
    setTimeout(function () { show(); scheduleNext(rand(MIN_GAP_MS, MAX_GAP_MS)); }, delay);
  }

  scheduleNext(FIRST_DELAY_MS);
})();
