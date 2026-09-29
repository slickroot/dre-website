import type * as DreWeb from "../.dre-web-types/dre_web";

const ESC = "\x1b";

const COLS = 62;
const ROWS = 17;

const term = document.querySelector(".term") as HTMLElement;
const canvas = document.getElementById("canvas") as HTMLElement;
const demoBtn = document.getElementById("demo") as HTMLButtonElement;

// ---------- Session ----------
let WebSession: typeof DreWeb.WebSession;
let session: DreWeb.WebSession;

function fresh() {
  if (session) session.free();
  session = new WebSession();
}

// ---------- Renderer ----------
function draw() {
  canvas.innerHTML = session.svg(COLS, ROWS);
  const svg = canvas.firstElementChild as SVGElement;
  svg.style.setProperty("--bg", "#12151b");
  svg.style.setProperty("--ink", "#e7e9ee");
}

// ---------- Input ----------
const KEYS: Record<string, string> = { Escape: ESC, Enter: "\r", Backspace: "\x7f" };

function onKey(e: KeyboardEvent) {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const key = KEYS[e.key] ?? (e.key.length === 1 ? e.key : null);
  if (key === null) return;
  e.preventDefault();
  session.press_key(key);
  draw();
}

let interactive = false;

function setInteractive(on: boolean) {
  interactive = on;
  clearTimeout(timer);
  term.classList.toggle("live", on);
  demoBtn.textContent = on ? "Watch the demo" : "Try it";
  if (on) {
    fresh();
    draw();
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
  draw();
  (function tick() {
    if (i >= SCRIPT.length) {
      // hold the finished diagram, then start over
      timer = setTimeout(play, 3500);
      return;
    }
    const k = SCRIPT[i++];
    session.press_key(k);
    draw();
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
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) { fresh(); SCRIPT.forEach((k) => session.press_key(k)); draw(); }
  else play();
}).catch((e) => console.error("dre demo failed to start", e));
