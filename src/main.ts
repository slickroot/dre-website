import type * as DreWeb from "../.dre-web-types/dre_web";

const ESC = "\x1b";

const term = document.querySelector(".term") as HTMLElement;
const canvas = document.getElementById("canvas") as HTMLElement;
const countEl = document.getElementById("count") as HTMLElement;
const dirtyEl = document.getElementById("dirty") as HTMLElement;
const demoBtn = document.getElementById("demo") as HTMLButtonElement;
const hintEl = document.getElementById("hint") as HTMLElement;

// ---------- Session ----------
let WebSession: typeof DreWeb.WebSession;
let session: DreWeb.WebSession;
let marker = "";

function fresh() {
  if (session) session.free();
  const next = new WebSession(() => { if (next === session) draw(marker); });
  session = next;
}

// ---------- Renderer ----------
let base: { cols: number; rows: number };

function draw(m: string) {
  marker = m;
  // grow the canvas if the visitor's diagram outgrows the demo's
  const [w, h] = session.extent();
  const cols = Math.max(base.cols, w + 4), rows = Math.max(base.rows, h + 4);
  canvas.innerHTML = session.svg(cols, rows, w, h);
  const svg = canvas.firstElementChild as SVGElement;
  svg.style.setProperty("--bg", "#12151b");
  svg.style.setProperty("--ink", "#e7e9ee");
  // every <rect> is a box, except the background
  const n = Math.max((canvas.innerHTML.match(/<rect/g) || []).length - 1, 0);
  countEl.textContent = n + (n === 1 ? " box" : " boxes");
  dirtyEl.textContent = m;
}

// ---------- Input ----------
const KEYS: Record<string, string> = { Escape: ESC, Enter: "\r", Backspace: "\x7f" };

const COMMAND_HINT = hintEl.textContent;
const INSERT_HINT = "Esc command mode · Enter new child";
let inInsert = false;

function onKey(e: KeyboardEvent) {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const key = KEYS[e.key] ?? (e.key.length === 1 ? e.key : null);
  if (key === null) return;
  e.preventDefault();
  if (e.key === "b" || e.key === "s" || e.key === "i") inInsert = true;
  else if (e.key === "Escape") inInsert = false;
  hintEl.textContent = inInsert ? INSERT_HINT : COMMAND_HINT;
  session.press_key(key);
  draw("[+]");
}

let interactive = false;

function setInteractive(on: boolean) {
  interactive = on;
  clearTimeout(timer);
  term.classList.toggle("live", on);
  demoBtn.textContent = on ? "Watch the demo" : "Try it";
  hintEl.hidden = !on;
  if (on) {
    inInsert = false;
    hintEl.textContent = COMMAND_HINT;
    fresh();
    draw("");
    addEventListener("keydown", onKey);
  } else {
    removeEventListener("keydown", onKey);
    play();
  }
}
demoBtn.addEventListener("click", () => setInteractive(!interactive));

// ---------- Demo ----------
const word = (w: string) => [...w];
// one colour per depth (c cycles the palette), and f fills the box
const paint = (n: number) => [...Array(n).fill("c"), "f"];
const SCRIPT = [
  "b", ...word("plan"), ESC, ...paint(1),
  "b", ...word("design"), ESC, ...paint(2),
  "b", ...word("edit"), ESC, ...paint(3),
  "b", ...word("tui"), ESC,
  "s", ...word("web"), ESC,
  "C", "C", "C", "C", "F", // colour and fill both siblings at once
];

let timer: ReturnType<typeof setTimeout>;

function play() {
  clearTimeout(timer);
  fresh();
  let i = 0, inInsert = false;
  draw("");
  (function tick() {
    if (i >= SCRIPT.length) {
      // hold the finished diagram, then start over
      timer = setTimeout(play, 3500);
      return;
    }
    const k = SCRIPT[i++];
    session.press_key(k);
    draw(i >= SCRIPT.length ? "written" : "[+]");
    let hold;
    if (inInsert) { hold = k === ESC ? 380 : 80 + Math.random() * 60; if (k === ESC) inInsert = false; }
    else { hold = 260; if (k === "b" || k === "s") inInsert = true; }
    timer = setTimeout(tick, hold);
  })();
}

// ---------- bootstrap ----------
// dre_web.js is fetched into dist/ at build time as a sibling of main.js (see
// scripts/fetch-dre.mjs); it never exists under src/, so this loads it via a
// runtime-only relative path, typed through the fetched .d.ts by assertion.
const dreWebPath = "./dre_web.js";
(import(dreWebPath) as Promise<typeof DreWeb>).then((dreWeb) => {
  WebSession = dreWeb.WebSession;
  return dreWeb.default();
}).then(() => {
  // Play the whole script once on a throwaway session so the canvas size is stable.
  const probe = new WebSession(() => {});
  SCRIPT.forEach((k) => probe.press_key(k));
  const [w, h] = probe.extent();
  probe.free();
  base = { cols: w + 4, rows: h + 4 };

  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) { fresh(); SCRIPT.forEach((k) => session.press_key(k)); draw("written"); }
  else play();
}).catch((e) => console.error("dre demo failed to start", e));
