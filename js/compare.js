/* Compare bucket: pick up to 4 startups, kept in this browser (localStorage), shown as a bar at the bottom of the page. */
(function () {
  const MAX = 4, KEY = "sh_compare";
  const k = (s) => String(s).toLowerCase().trim();
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  let list = [];
  const load = () => {
    try { const v = JSON.parse(localStorage.getItem(KEY) || "[]"); list = Array.isArray(v) ? v.filter((x) => typeof x === "string").slice(0, MAX) : []; } catch (e) { list = []; }
  };
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) {} };
  load();

  const has = (n) => list.some((x) => k(x) === k(n));
  const fire = () => document.dispatchEvent(new CustomEvent("compare:change"));

  let timer;
  function toast(text) {
    let t = document.getElementById("cmptoast");
    if (!t) { document.body.insertAdjacentHTML("beforeend", '<div class="toast" id="cmptoast" role="status"></div>'); t = document.getElementById("cmptoast"); }
    t.textContent = text; t.classList.add("on");
    clearTimeout(timer); timer = setTimeout(() => t.classList.remove("on"), 3200);
  }

  function toggle(name) {
    if (has(name)) list = list.filter((x) => k(x) !== k(name));
    else {
      if (list.length >= MAX) { toast("You can compare up to " + MAX + " startups. Remove one first."); render(); fire(); return false; }
      list.push(name);
    }
    save(); render(); fire(); return true;
  }
  const remove = (name) => { list = list.filter((x) => k(x) !== k(name)); save(); render(); fire(); };
  const clear = () => { list = []; save(); render(); fire(); };

  function render() {
    const bar = document.getElementById("cmpbar"); if (!bar) return;
    if (document.body.dataset.page === "compare" || !list.length) { bar.hidden = true; return; }
    bar.hidden = false;
    const slots = MAX - list.length;
    document.getElementById("cmpitems").innerHTML =
      '<span class="cmp-title">Compare <b>' + list.length + "/" + MAX + "</b></span>" +
      list.map((n) => '<span class="cmp-pill">' + esc(n) + '<button type="button" data-cmp-rm="' + esc(n) + '" aria-label="Remove ' + esc(n) + '">×</button></span>').join("") +
      (slots ? '<span class="cmp-hint">Add ' + (list.length < 2 ? "at least " + (2 - list.length) + " more" : "up to " + slots + " more") + "</span>" : "");
    const go = document.getElementById("cmpgo");
    go.setAttribute("aria-disabled", list.length < 2 ? "true" : "false");
    go.classList.toggle("off", list.length < 2);
    go.href = "compare.html";
  }

  function init() {
    document.body.insertAdjacentHTML("beforeend",
      '<div class="cmpbar" id="cmpbar" hidden role="region" aria-label="Startups to compare"><div class="wrap cmpbar-in"><div class="cmp-items" id="cmpitems"></div>' +
      '<div class="cmp-act"><button type="button" class="btn btn-sm btn-ghost" id="cmpclear">Clear</button><a class="btn btn-sm btn-solid" id="cmpgo" href="compare.html">Compare now</a></div></div></div>');
    document.getElementById("cmpbar").addEventListener("click", (e) => {
      const rm = e.target.closest("[data-cmp-rm]"); if (rm) remove(rm.dataset.cmpRm);
      if (e.target.closest("#cmpclear")) clear();
      const go = e.target.closest("#cmpgo"); if (go && go.classList.contains("off")) { e.preventDefault(); toast("Pick at least 2 startups to compare."); }
    });
    window.addEventListener("storage", (e) => { if (e.key === KEY) { load(); render(); fire(); } });
    render();
  }
  if (document.body) init(); else document.addEventListener("DOMContentLoaded", init);

  window.Compare = { MAX, get: () => list.slice(), has, toggle, remove, clear };
})();
