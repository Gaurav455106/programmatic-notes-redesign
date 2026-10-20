// Love burst: every 30 seconds, a full-screen love moment over the notes.
// Each time it picks a random background (7 canvas effects), a random title entrance (5 styles),
// a title and a message from their own shuffled decks, so nothing repeats until every one has shown.
// It closes by itself after a few seconds; a tap, click or Esc closes it sooner.
(function () {
  "use strict";

  var FIRST_DELAY_MS = 30 * 1000;
  var GAP_MS = 30 * 1000;
  var SHOW_MS = 10000;
  var FADE_MS = 800;
  var FONT_URL = "https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap";
  var MODES = ["fireworks", "rain", "beat", "petals", "stars", "spiral", "balloons"];
  var ENTRANCES = ["lb-t-pop", "lb-t-drop", "lb-t-blur", "lb-t-type", "lb-t-glow"];
  var PINKS = ["#ff4d7d", "#ff7aa2", "#ffb3c8", "#ff2e63", "#ffd1dc", "#ff8fab"];
  var GOLDEN_ANGLE = 2.39996;

  var LOVE = window.PN_LOVE || { names: ["My Love"], messages: ["I love you ❤️"] };
  var TITLES = LOVE.bigTitles || ["I love you"];
  var BIG_MESSAGES = LOVE.bigMessages || LOVE.messages;

  var showing = false;

  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
  function rand(min, max) { return min + Math.random() * (max - min); }

  function shuffled(list) {
    var copy = list.slice();
    for (var i = copy.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = copy[i]; copy[i] = copy[j]; copy[j] = tmp;
    }
    return copy;
  }

  // Hands out items in a shuffled order and reshuffles only after all of them have been used.
  function makeDeck(list) {
    var cards = [];
    return function next() {
      if (!cards.length) cards = shuffled(list);
      return cards.pop();
    };
  }

  var nextMode = makeDeck(MODES);
  var nextEntrance = makeDeck(ENTRANCES);
  var nextTitle = makeDeck(TITLES);
  var nextMessage = makeDeck(BIG_MESSAGES);

  function loadFont() {
    if (document.querySelector('link[href="' + FONT_URL + '"]')) return;
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = FONT_URL;
    document.head.appendChild(link);
  }

  function drawHeart(ctx, x, y, size, color, alpha, rot) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.fillStyle = color;
    ctx.translate(x, y);
    if (rot) ctx.rotate(rot);
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

  function drawPetal(ctx, p) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.life) * 0.9;
    ctx.fillStyle = p.color;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.scale(1, Math.abs(Math.cos(p.rot * 1.5)) * 0.6 + 0.4);
    ctx.beginPath();
    ctx.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawStar(ctx, p, frame) {
    ctx.save();
    ctx.globalAlpha = 0.35 + 0.65 * Math.abs(Math.sin(frame / 20 + p.phase));
    ctx.fillStyle = "#fff0f5";
    ctx.shadowColor = "#ffb3c8";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawBalloon(ctx, p) {
    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.strokeStyle = "#ffd1dc";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y + p.size * 1.3);
    ctx.quadraticCurveTo(p.x + Math.sin(p.phase) * 10, p.y + p.size * 2.2, p.x, p.y + p.size * 3.2);
    ctx.stroke();
    ctx.restore();
    drawHeart(ctx, p.x, p.y, p.size, p.color, p.life, 0);
  }

  function heart(x, y, vx, vy, extra) {
    var p = { kind: "heart", x: x, y: y, vx: vx, vy: vy, size: rand(8, 18), color: pick(PINKS), life: 1, decay: 0.01, gravity: 0, rot: 0, vr: 0, phase: rand(0, 6) };
    for (var k in extra) p[k] = extra[k];
    return p;
  }

  // Each effect adds particles for this frame; the shared loop moves and draws them.
  var EFFECTS = {
    fireworks: function (s) {
      if (s.frame % 35 !== 1) return;
      var cx = rand(s.w * 0.2, s.w * 0.8), cy = rand(s.h * 0.2, s.h * 0.6), color = pick(PINKS);
      for (var i = 0; i < 26; i++) {
        var a = (Math.PI * 2 * i) / 26, v = rand(2.5, 6);
        s.parts.push(heart(cx, cy, Math.cos(a) * v, Math.sin(a) * v, { color: color, decay: rand(0.008, 0.014), gravity: 0.05 }));
      }
    },
    rain: function (s) {
      if (s.frame % 3 === 0) s.parts.push(heart(rand(0, s.w), -40, rand(-0.6, 0.6), rand(1.5, 4), { size: rand(10, 28), decay: 0 }));
    },
    beat: function (s) {
      var pulse = 1 + 0.12 * Math.max(0, Math.sin(s.frame / 7)) + 0.06 * Math.max(0, Math.sin(s.frame / 7 + 1.2));
      var big = Math.min(s.w, s.h);
      drawHeart(s.ctx, s.w / 2, s.h / 2 - big * 0.3, big * 0.5 * pulse, "#ff2e63", 0.35, 0);
      if (s.frame % 6 === 0) s.parts.push(heart(s.w / 2 + rand(-60, 60), s.h / 2, rand(-3, 3), rand(-4, -1.5), { gravity: 0.02 }));
    },
    petals: function (s) {
      if (s.frame % 4 === 0) s.parts.push({ kind: "petal", x: rand(-50, s.w), y: -30, vx: rand(0.4, 1.4), vy: rand(1, 2.4), size: rand(7, 14), color: pick(PINKS), life: 1, decay: 0, gravity: 0, rot: rand(0, 6), vr: rand(-0.05, 0.05), phase: rand(0, 6), sway: rand(0.6, 1.6) });
    },
    stars: function (s) {
      if (s.frame === 1) {
        for (var i = 0; i < 90; i++) s.parts.push({ kind: "star", x: rand(0, s.w), y: rand(0, s.h), vx: 0, vy: 0, size: rand(0.8, 2.4), life: 1, decay: 0, gravity: 0, phase: rand(0, 6) });
      }
      if (s.frame % 40 === 5) s.parts.push(heart(rand(-100, s.w * 0.5), rand(-60, s.h * 0.3), rand(7, 10), rand(3, 5), { size: rand(12, 20), decay: 0.012, trail: true }));
    },
    spiral: function (s) {
      if (s.frame % 2 !== 0) return;
      var a = s.frame * GOLDEN_ANGLE, v = 2.2;
      s.parts.push(heart(s.w / 2, s.h / 2, Math.cos(a) * v, Math.sin(a) * v, { size: rand(8, 15), decay: 0.006, rot: a }));
    },
    balloons: function (s) {
      if (s.frame % 14 === 0) s.parts.push({ kind: "balloon", x: rand(30, s.w - 30), y: s.h + 40, vx: 0, vy: rand(-2.6, -1.4), size: rand(18, 34), color: pick(PINKS), life: 1, decay: 0, gravity: 0, phase: rand(0, 6), sway: rand(0.4, 1) });
    }
  };

  function drawParticle(ctx, p, frame) {
    if (p.kind === "petal") return drawPetal(ctx, p);
    if (p.kind === "star") return drawStar(ctx, p, frame);
    if (p.kind === "balloon") return drawBalloon(ctx, p);
    if (p.trail) drawHeart(ctx, p.x - p.vx * 3, p.y - p.vy * 3, p.size * 0.7, p.color, p.life * 0.3, 0);
    drawHeart(ctx, p.x, p.y, p.size, p.color, p.life, p.rot);
  }

  function runCanvas(canvas, mode) {
    var ctx = canvas.getContext("2d");
    var dpr = window.devicePixelRatio || 1;
    var w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
    var s = { ctx: ctx, w: w, h: h, parts: [], frame: 0 }, running = true;

    function step() {
      if (!running) return;
      s.frame += 1;
      ctx.clearRect(0, 0, w, h);
      EFFECTS[mode](s);
      s.parts = s.parts.filter(function (p) { return p.life > 0 && p.y < h + 80 && p.y > -200 && p.x < w + 200; });
      s.parts.forEach(function (p) {
        p.phase += 0.05;
        p.x += p.vx + (p.sway ? Math.sin(p.phase) * p.sway : 0);
        p.y += p.vy; p.vy += p.gravity; p.life -= p.decay;
        p.rot += p.vr || 0;
        drawParticle(ctx, p, s.frame);
      });
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
    return function stop() { running = false; };
  }

  function titleHtml(title) {
    return title.split("").map(function (ch, i) {
      return '<span style="animation-delay:' + (0.15 + i * 0.08) + 's">' + (ch === " " ? "&nbsp;" : ch) + "</span>";
    }).join("");
  }

  function nameLine(title, message) {
    var inTitle = LOVE.names.some(function (n) { return title.toLowerCase().indexOf(n.toLowerCase()) > -1; });
    if (inTitle) return "";
    return LOVE.nameIn ? LOVE.nameIn(message) : "My Love";
  }

  function show() {
    if (showing || document.hidden) return;
    showing = true;
    loadFont();
    var title = nextTitle();
    var message = nextMessage();
    var overlay = document.createElement("div");
    overlay.className = "lb-overlay " + nextEntrance();
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-label", title);
    overlay.innerHTML = '<canvas class="lb-canvas" aria-hidden="true"></canvas>' +
      '<div class="lb-text"><p class="lb-big">' + titleHtml(title) + '</p><p class="lb-name"></p><p class="lb-sub"></p></div>' +
      '<p class="lb-hint">tap anywhere to keep studying</p>';
    overlay.querySelector(".lb-name").textContent = nameLine(title, message);
    overlay.querySelector(".lb-sub").textContent = message;
    document.body.appendChild(overlay);

    var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    var stopCanvas = reduced ? function () {} : runCanvas(overlay.querySelector(".lb-canvas"), nextMode());
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
    setTimeout(function () { show(); scheduleNext(GAP_MS); }, delay);
  }

  scheduleNext(FIRST_DELAY_MS);
})();
