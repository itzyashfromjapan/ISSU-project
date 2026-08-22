/**
 * ISSU v0.2 Trial UI — embedded workbench page (vanilla, zero dependencies).
 * Served only on 127.0.0.1. All dynamic values rendered via textContent.
 */

export const WORKBENCH_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>ISSU v0.2 — Controlled Trial Workbench</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: ui-sans-serif, system-ui, sans-serif; background: #0b1020; color: #e7ecf5; }
  header { display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; background: #111a33; border-bottom: 1px solid #23325c; }
  h1 { font-size: 18px; margin: 0; letter-spacing: .4px; }
  .badge { font-size: 12px; padding: 4px 10px; border-radius: 999px; border: 1px solid #2c3f78; }
  .badge.stub { color: #7ee2a8; border-color: #2b6a45; }
  .badge.live { color: #ffd479; border-color: #8a6d2b; }
  .badge.missing-credentials, .badge.unconfigured { color: #ff9c9c; border-color: #8a3b3b; }
  main { max-width: 980px; margin: 0 auto; padding: 20px; display: grid; gap: 16px; }
  section { background: #101a36; border: 1px solid #23325c; border-radius: 10px; padding: 16px; }
  h2 { font-size: 14px; text-transform: uppercase; letter-spacing: .8px; color: #9fb3d9; margin: 0 0 12px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; }
  .card { text-align: left; padding: 12px; border-radius: 8px; border: 1px solid #2c3f78; background: #0d1731; color: inherit; cursor: pointer; }
  .card.active { outline: 2px solid #6ea8ff; }
  .card .phase { display: block; font-size: 11px; color: #8fa3c8; margin-top: 4px; }
  label { display: block; font-size: 12px; color: #9fb3d9; margin: 10px 0 4px; }
  textarea, input[type=text] { width: 100%; background: #0b1226; color: #e7ecf5; border: 1px solid #2c3f78; border-radius: 6px; padding: 8px; font: inherit; }
  textarea { min-height: 70px; resize: vertical; }
  .row { display: flex; gap: 8px; margin-top: 8px; }
  button.primary { background: #2451b3; border: none; color: white; padding: 10px 18px; border-radius: 6px; font-weight: 600; cursor: pointer; }
  button.primary:disabled { opacity: .45; cursor: default; }
  .status { font-weight: 700; }
  .status.succeeded, .state-COMPLETED { color: #7ee2a8; }
  .status.failed, .state-FAILED, .state-PARTIAL { color: #ffb4a8; }
  .status.running, .status.queued { color: #9ecbff; }
  pre { background: #0b1226; border: 1px solid #23325c; border-radius: 8px; padding: 12px; overflow: auto; font-size: 12px; }
  .events div { font-family: ui-monospace, monospace; font-size: 11.5px; padding: 2px 0; border-bottom: 1px dashed #1d2a52; }
  .lvl-warn { color: #ffd479; } .lvl-error, .lvl-fatal { color: #ff9c9c; }
  footer { text-align: center; color: #66799e; font-size: 11px; padding: 12px; }
  .hidden { display: none; }
  .note { font-size: 12px; color: #9fb3d9; }
  input.small { width: 220px; }
</style>
</head>
<body>
<header>
  <h1>ISSU v0.2 — Controlled Trial Workbench</h1>
  <span id="modeBadge" class="badge">…</span>
</header>
<main>
  <section>
    <h2>Provider Mode</h2>
    <div id="modeDetail" class="note"></div>
  </section>

  <section>
    <h2>1 · Choose a domain workflow</h2>
    <div id="domains" class="grid"></div>
  </section>

  <section>
    <h2>2 · Describe the trial task</h2>
    <label for="objective">Objective (1–200 characters)</label>
    <textarea id="objective" maxlength="200" placeholder="e.g. Summarize Q3 invoice processing outcomes"></textarea>
    <label for="inputs">Inline inputs (optional, JSON array of {id, content})</label>
    <textarea id="inputs" placeholder='[{"id":"doc1","content":"invoice total: 1200"}]'></textarea>
    <label for="corr">Correlation ID (optional)</label>
    <input type="text" id="corr" class="small" maxlength="64" placeholder="trial-001" />
    <div class="row">
      <button id="runBtn" class="primary" disabled>Select a domain first</button>
      <span id="runStatus" class="status"></span>
    </div>
  </section>

  <section id="resultSection" class="hidden">
    <h2>3 · Execution result</h2>
    <div>Status: <span id="resState" class="status"></span></div>
    <div class="note" id="resMeta"></div>
    <div id="aiWrap" class="hidden">
      <label>AI summary (provider-generated)</label>
      <pre id="aiSummary"></pre>
    </div>
    <label>Audit events (content-free)</label>
    <div id="audit" class="events"></div>
  </section>

  <footer>
    Local-only · 127.0.0.1 · stub mode by default · live mode requires environment credentials · no destructive operations
  </footer>
</main>
<script>
(function () {
  "use strict";
  var selected = null;
  var modeInfo = null;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  fetch("/api/state").then(function (r) { return r.json(); }).then(function (s) {
    if (!s.ok) return;
    modeInfo = s;
    var badge = document.getElementById("modeBadge");
    badge.textContent = s.mode.toUpperCase();
    badge.className = "badge " + s.mode;
    document.getElementById("modeDetail").textContent =
      (s.detail || "") + (s.error ? " — " + s.error : "") +
      " · provider=" + (s.provider || "-") + " model=" + (s.model || "-");
    var grid = document.getElementById("domains");
    (s.domains || []).forEach(function (d) {
      var b = document.createElement("button");
      b.className = "card";
      b.type = "button";
      b.appendChild(document.createTextNode(d.label));
      var ph = document.createElement("span");
      ph.className = "phase";
      ph.textContent = d.phase + " · " + d.id;
      b.appendChild(ph);
      b.addEventListener("click", function () {
        Array.prototype.forEach.call(grid.children, function (c) { c.classList.remove("active"); });
        b.classList.add("active");
        selected = d.id;
        document.getElementById("runBtn").disabled = false;
        document.getElementById("runBtn").textContent = "Run " + d.label + " workflow";
      });
      grid.appendChild(b);
    });
  });

  function setStatus(txt, cls) {
    var el = document.getElementById("runStatus");
    el.textContent = txt || "";
    el.className = "status " + (cls || "");
  }

  document.getElementById("runBtn").addEventListener("click", function () {
    if (!selected) return;
    var btn = this;
    btn.disabled = true;
    setStatus("running", "running");
    document.getElementById("resultSection").classList.remove("hidden");
    document.getElementById("resState").textContent = "";
    document.getElementById("resMeta").textContent = "";
    document.getElementById("audit").textContent = "";

    var payload = { domain: selected, objective: document.getElementById("objective").value };
    var rawInputs = document.getElementById("inputs").value.trim();
    if (rawInputs) {
      try { payload.inputs = JSON.parse(rawInputs); }
      catch (e) { setStatus("failed — inputs must be a JSON array", "failed"); btn.disabled = false; return; }
    }
    var corr = document.getElementById("corr").value.trim();
    if (corr) payload.correlationId = corr;

    fetch("/api/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(function (r) { return r.json().then(function (j) { return { code: r.status, j: j }; }); })
      .then(function (res) {
        btn.disabled = false;
        var j = res.j;
        if (!j.ok) {
          setStatus("failed — " + (j.message || j.code || res.code), "failed");
          return;
        }
        var st = document.getElementById("resState");
        st.textContent = j.state;
        st.className = "status state-" + j.state;
        document.getElementById("resMeta").textContent =
          j.label + " · findings=" + j.findingsCount + " · providerMode=" + j.providerMode + " · provider=" + j.providerName;
        if (j.aiSummary) {
          document.getElementById("aiWrap").classList.remove("hidden");
          document.getElementById("aiSummary").textContent = j.aiSummary;
        } else {
          document.getElementById("aiSummary").textContent = "";
        }
        var auditEl = document.getElementById("audit");
        auditEl.textContent = "";
        (j.audit || []).forEach(function (ev) {
          var line = document.createElement("div");
          line.className = "lvl-" + ev.level;
          line.textContent = "[" + ev.level + "] " + ev.msg + " " + JSON.stringify(ev.ctx);
          auditEl.appendChild(line);
        });
        setStatus(j.state.toLowerCase(), "state-" + j.state);
      })
      .catch(function (e) {
        btn.disabled = false;
        setStatus("request failed — " + e, "failed");
      });
  });
})();
</script>
</body>
</html>`;
