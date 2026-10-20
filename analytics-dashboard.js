// Session analytics dashboard (analytics.html): reads get_sessions() from Supabase with the dashboard passcode.
(function () {
  "use strict";

  var PASS_KEY = "pn-dash";
  var DAY_PARTS = [
    { label: "Morning", hint: "5 AM – 12 PM", from: 5, to: 12 },
    { label: "Afternoon", hint: "12 – 5 PM", from: 12, to: 17 },
    { label: "Evening", hint: "5 – 9 PM", from: 17, to: 21 },
    { label: "Night", hint: "9 PM – 5 AM", from: 21, to: 29 }
  ];
  var WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  var IST_OFFSET_MS = 5.5 * 3600e3;
  var DAY_MS = 864e5;

  var cfg = window.PN_CONFIG || {};
  var url = (cfg.supabaseUrl || "").replace(/\/+$/, "");
  var key = cfg.supabaseKey || "";
  var $ = function (s) { return document.querySelector(s); };
  var pass = "";
  var days = 30;
  var charts = {};

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function duration(sec) {
    sec = Math.round(+sec || 0);
    if (sec < 60) return sec ? sec + "s" : "0m";
    var h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60);
    return h ? h + "h " + m + "m" : m + "m " + (sec % 60) + "s";
  }

  function hourLabel(h) { return (h % 12 || 12) + (h < 12 ? " AM" : " PM"); }

  function cssColor(name, alpha) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return alpha == null ? "hsl(" + v + ")" : "hsl(" + v + " / " + alpha + ")";
  }

  // ---- data ----
  function fetchSessions() {
    var headers = { apikey: key, "Content-Type": "application/json" };
    if (/^eyJ/.test(key)) headers.Authorization = "Bearer " + key;
    return fetch(url + "/rest/v1/rpc/get_sessions", {
      method: "POST", headers: headers, body: JSON.stringify({ p_pass: pass, p_days: days })
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok) throw new Error(j.message || "Request failed (HTTP " + r.status + ")");
        return j;
      });
    });
  }

  function show() {
    $("#err").textContent = "";
    fetchSessions().then(function (data) {
      try { sessionStorage.setItem(PASS_KEY, pass); } catch (e) { /* stays unlocked for this page only */ }
      $("#login").style.display = "none";
      $("#dash").style.display = "grid";
      $("#ctrl").classList.remove("hidden");
      $("#ctrl").classList.add("flex");
      render(data);
    }).catch(function (err) {
      $("#err").textContent = /passcode/.test(err.message) ? "Wrong passcode." : "Could not load: " + err.message;
      $("#login").style.display = "";
      $("#dash").style.display = "none";
    });
  }

  // ---- rendering ----
  function kpi(label, value, sub, featured) {
    return '<div class="rounded-xl border border-border p-4 shadow-sm ' + (featured ? "col-span-2 bg-primary text-primary-foreground" : "bg-card") + '">' +
      '<p class="text-sm ' + (featured ? "opacity-80" : "text-muted-foreground") + '">' + esc(label) + "</p>" +
      '<p class="num mt-1 font-mono text-2xl font-semibold tracking-tight' + (featured ? " sm:text-3xl" : "") + '">' + esc(value) + "</p>" +
      (sub ? '<p class="mt-1 text-xs ' + (featured ? "opacity-70" : "text-muted-foreground") + '">' + esc(sub) + "</p>" : "") + "</div>";
  }

  function renderKpis(t) {
    var perVisitor = t.visitors ? (t.sessions / t.visitors).toFixed(1) : "0";
    $("#kpis").innerHTML =
      kpi("Average session duration", duration(t.avg_duration_s), "Median " + duration(t.median_duration_s) + " · time the tab was open and visible", true) +
      kpi("Sessions", t.sessions || 0, perVisitor + " per visitor") +
      kpi("Visitors", t.visitors || 0, "unique browsers") +
      kpi("Total time", duration(t.total_time_s)) +
      kpi("Longest session", duration(t.longest_s));
  }

  function lastDays(rows) {
    var byDay = {};
    rows.forEach(function (d) { byDay[d.day] = d; });
    var out = [];
    for (var i = days - 1; i >= 0; i--) {
      var day = new Date(Date.now() + IST_OFFSET_MS - i * DAY_MS).toISOString().slice(0, 10);
      out.push(byDay[day] || { day: day, sessions: 0, avg_duration_s: null });
    }
    return out;
  }

  function baseOptions(extra) {
    var grid = cssColor("--border"), ink = cssColor("--muted-foreground");
    var opts = {
      responsive: true, maintainAspectRatio: false, animation: { duration: 400 },
      plugins: { legend: { display: false }, tooltip: { backgroundColor: cssColor("--foreground"), titleColor: cssColor("--background"), bodyColor: cssColor("--background"), padding: 10, cornerRadius: 8 } },
      scales: {
        x: { grid: { display: false }, ticks: { color: ink, maxRotation: 0, autoSkipPadding: 12 }, border: { color: grid } },
        y: { beginAtZero: true, grid: { color: grid }, ticks: { color: ink, precision: 0 }, border: { display: false } }
      }
    };
    return Object.assign(opts, extra || {});
  }

  function draw(id, config) {
    if (charts[id]) charts[id].destroy();
    charts[id] = new Chart(document.getElementById(id), config);
  }

  function renderDaily(rows) {
    var list = lastDays(rows);
    var opts = baseOptions();
    opts.scales.y2 = { position: "right", beginAtZero: true, grid: { display: false }, border: { display: false },
      ticks: { color: cssColor("--muted-foreground"), callback: function (v) { return Math.round(v / 60) + "m"; } } };
    opts.plugins.tooltip.callbacks = { label: function (c) { return c.datasetIndex ? "Avg duration: " + duration(c.raw) : "Sessions: " + c.raw; } };
    draw("dailyChart", {
      data: {
        labels: list.map(function (d) { return new Date(d.day + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" }); }),
        datasets: [
          { type: "bar", data: list.map(function (d) { return d.sessions; }), backgroundColor: cssColor("--chart-1"), borderRadius: 4, maxBarThickness: 28 },
          { type: "line", yAxisID: "y2", data: list.map(function (d) { return d.avg_duration_s; }), borderColor: cssColor("--chart-2"), backgroundColor: cssColor("--chart-2"), tension: 0.35, pointRadius: 2, spanGaps: true }
        ]
      },
      options: opts
    });
  }

  function renderHours(rows) {
    var counts = [], avg = [];
    for (var h = 0; h < 24; h++) { counts.push(0); avg.push(0); }
    rows.forEach(function (r) { counts[r.hour] = r.sessions; avg[r.hour] = r.avg_duration_s; });
    var max = Math.max.apply(null, counts);
    var peak = counts.indexOf(max);
    $("#peak").textContent = max ? "Busiest: " + hourLabel(peak) + " – " + hourLabel((peak + 1) % 24) : "No sessions yet";
    var opts = baseOptions();
    opts.plugins.tooltip.callbacks = { label: function (c) { return c.raw + " sessions · avg " + duration(avg[c.dataIndex]); } };
    draw("hourChart", {
      type: "bar",
      data: { labels: counts.map(function (_, i) { return i % 3 ? "" : hourLabel(i); }),
        datasets: [{ data: counts, borderRadius: 4, backgroundColor: counts.map(function (c, i) { return i === peak && max ? cssColor("--chart-2") : cssColor("--chart-1", 0.85); }) }] },
      options: opts
    });
    renderParts(rows);
  }

  function renderParts(rows) {
    var total = rows.reduce(function (s, r) { return s + r.sessions; }, 0);
    $("#parts").innerHTML = DAY_PARTS.map(function (p) {
      var n = rows.filter(function (r) { var h = r.hour < 5 ? r.hour + 24 : r.hour; return h >= p.from && h < p.to; })
        .reduce(function (s, r) { return s + r.sessions; }, 0);
      var pct = total ? Math.round(n / total * 100) : 0;
      return '<div><div class="flex items-baseline justify-between text-sm"><span class="font-medium">' + p.label +
        ' <span class="text-muted-foreground font-normal">' + p.hint + '</span></span><span class="num font-mono">' + n + " · " + pct + "%</span></div>" +
        '<div class="mt-1.5 h-2 overflow-hidden rounded-full bg-muted"><div class="h-full rounded-full bg-chart1" style="width:' + pct + '%"></div></div></div>';
    }).join("");
  }

  function renderWeek(rows) {
    var counts = WEEKDAYS.map(function () { return 0; });
    rows.forEach(function (r) { counts[r.dow - 1] = r.sessions; });
    draw("weekChart", { type: "bar", data: { labels: WEEKDAYS, datasets: [{ data: counts, backgroundColor: cssColor("--chart-1", 0.85), borderRadius: 4 }] }, options: baseOptions() });
  }

  function place(r) { return [r.city, r.region, r.country].filter(function (x) { return x && x !== "Unknown"; }).join(", ") || "Unknown"; }

  function renderPlaces(rows) {
    var max = Math.max.apply(null, rows.map(function (r) { return r.sessions; }).concat([1]));
    var head = '<thead><tr class="border-b border-border text-left text-muted-foreground"><th class="py-2 pr-3 font-medium">Location</th><th class="py-2 pr-3 font-medium">Share</th>' +
      '<th class="py-2 pr-3 text-right font-medium">Sessions</th><th class="py-2 text-right font-medium">Avg duration</th></tr></thead>';
    var body = rows.length ? rows.map(function (r) {
      return '<tr class="border-b border-border last:border-0"><td class="py-2.5 pr-3 font-medium">' + esc(place(r)) + "</td>" +
        '<td class="py-2.5 pr-3"><div class="h-2 min-w-[80px] overflow-hidden rounded-full bg-muted"><div class="h-full rounded-full bg-chart1" style="width:' + (r.sessions / max * 100) + '%"></div></div></td>' +
        '<td class="num py-2.5 pr-3 text-right font-mono">' + r.sessions + '</td><td class="num py-2.5 text-right font-mono">' + duration(r.avg_duration_s) + "</td></tr>";
    }).join("") : '<tr><td colspan="4" class="py-6 text-center text-muted-foreground">No locations yet.</td></tr>';
    $("#places").innerHTML = head + "<tbody>" + body + "</tbody>";
  }

  function renderDevices(rows) {
    var total = rows.reduce(function (s, r) { return s + r.sessions; }, 0);
    $("#devices").innerHTML = rows.length ? rows.map(function (r) {
      var pct = total ? Math.round(r.sessions / total * 100) : 0;
      return '<div><div class="flex justify-between text-sm"><span class="font-medium capitalize">' + esc(r.device) + '</span><span class="num font-mono">' + r.sessions + " · " + pct + "%</span></div>" +
        '<div class="mt-1.5 h-2 overflow-hidden rounded-full bg-muted"><div class="h-full rounded-full bg-chart2" style="width:' + pct + '%"></div></div></div>';
    }).join("") : '<p class="text-sm text-muted-foreground">No data yet.</p>';
  }

  function renderRecent(rows) {
    var head = '<thead><tr class="border-b border-border text-left text-muted-foreground"><th class="py-2 pr-3 font-medium">Started (IST)</th><th class="py-2 pr-3 text-right font-medium">Duration</th>' +
      '<th class="py-2 pr-3 font-medium">Location</th><th class="py-2 pr-3 font-medium">Device</th><th class="py-2 font-medium">Name</th></tr></thead>';
    var body = rows.length ? rows.map(function (r) {
      var started = new Date(r.started_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" });
      return '<tr class="border-b border-border last:border-0"><td class="py-2.5 pr-3">' + esc(started) + '</td><td class="num py-2.5 pr-3 text-right font-mono">' + duration(r.duration_s) +
        '</td><td class="py-2.5 pr-3">' + esc(place(r)) + '</td><td class="py-2.5 pr-3 capitalize">' + esc(r.device || "–") + '</td><td class="py-2.5">' + esc(r.name || "–") + "</td></tr>";
    }).join("") : '<tr><td colspan="5" class="py-6 text-center text-muted-foreground">No sessions yet.</td></tr>';
    $("#recent").innerHTML = head + "<tbody>" + body + "</tbody>";
  }

  function render(data) {
    renderKpis(data.totals || {});
    renderDaily(data.daily || []);
    renderHours(data.hours || []);
    renderWeek(data.weekdays || []);
    renderPlaces(data.places || []);
    renderDevices(data.devices || []);
    renderRecent(data.recent || []);
  }

  // ---- controls ----
  Array.prototype.forEach.call(document.querySelectorAll("#range .tab"), function (tab) {
    tab.addEventListener("click", function () {
      Array.prototype.forEach.call(document.querySelectorAll("#range .tab"), function (t) { t.setAttribute("aria-selected", String(t === tab)); });
      days = +tab.dataset.days;
      show();
    });
  });
  $("#refresh").addEventListener("click", show);
  $("#lock").addEventListener("click", function () {
    try { sessionStorage.removeItem(PASS_KEY); } catch (e) { /* nothing stored */ }
    location.reload();
  });
  $("#login").addEventListener("submit", function (e) { e.preventDefault(); pass = $("#pass").value; show(); });

  if (!url || !key) {
    $("#cfgNote").innerHTML = "<b>Analytics isn't connected yet.</b> Add your Supabase URL and key to <code>config.js</code>.";
    $("#pass").disabled = true;
    return;
  }
  try { pass = sessionStorage.getItem(PASS_KEY) || ""; } catch (e) { pass = ""; }
  if (pass) show();
})();
