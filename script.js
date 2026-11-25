// ---- Opstart: samler delene og binder knapper og taster ----
// Selve spillet ligger i Game (game.js). Resten:
//   config.js     konstanter            sound.js     lyd
//   score.js      point og combo        scoreboard.js top-listerne
//   snake.js      slangen               birds.js     fugle
//   powerups.js   power-ups             effects.js   partikler og tekst
//   sprites.js    frugter og fugle      renderer.js  tegning af banen
//   hud.js        paneler over banen    menu.js      skærme, indstillinger og pop-ups
// Filerne loades i den rækkefølge, index.html angiver.

const sound = new Sound();
const scoreboard = new Scoreboard();
const menu = new Menu();
const scoreboardView = new ScoreboardView();
const soundButton = new SoundButton(sound, document.getElementById("sound-btn"));

const game = new Game(
  {
    menu,
    scoreboardView,
    hud: new Hud(),
    comboMeter: new ComboMeter(),
    fireworks: new Fireworks(document.getElementById("fireworks"), sound),
    statusRow: new StatusRow(),
    bonusPanel: new BonusPanel(),
    renderer: new Renderer(document.getElementById("game-canvas")),
  },
  sound,
  scoreboard
);

// ---- Knapper ----
function startGame() {
  const settings = menu.readSettings();
  if (settings) game.start(settings);
}
menu.onStart(startGame);

menu.onBackToMenu(() => {
  game.stop();
  menu.showMenu();
  scoreboardView.render(scoreboard);
  scoreboard.refresh(); // andres nye spil kommer med
});

// fanerne på top-listen skifter liste, og søgefeltet filtrerer den fulde liste
document.addEventListener("click", (e) => {
  // når top 100 åbnes, ruller listen hen til det spil, man lige har spillet
  if (e.target.closest(".board-more")) scoreboardView.scrollToCurrent();
  // kontakten skifter mellem computerens og telefonens liste
  const deviceBtn = e.target.closest(".board-device button");
  if (deviceBtn) {
    scoreboard.setDevice(deviceBtn.dataset.mobile === "true");
    scoreboardView.render(scoreboard);
    return;
  }
  const tab = e.target.closest(".board-tab");
  if (!tab) return;
  scoreboard.setBoard(Number(tab.dataset.board));
  scoreboardView.render(scoreboard);
});
document.addEventListener("input", (e) => {
  if (e.target.matches(".board-filter")) scoreboardView.render(scoreboard);
});

// Hemmelig knap: et klik på overskriften "Snake!" sender fyrværkeri op, som ved en 1. plads.
// Holder man Shift nede, får man det korte, som ved en 2.-5. plads
const secretFireworks = (e) => game.ui.fireworks.start(e.shiftKey ? 2 : 1);
document.getElementById("game-title").addEventListener("click", secretFireworks);

// ---- Taster ----
document.addEventListener("keydown", (e) => {
  // M slår lyden til eller fra (ikke når man skriver navn)
  if (e.key.toLowerCase() === "m" && e.target.tagName !== "INPUT") {
    soundButton.toggle();
    return;
  }

  // Mellemrum eller Enter på game over-skærmen starter et nyt spil med samme navn og indstillinger
  if ((e.code === "Space" || e.key === "Enter") && !e.repeat && menu.canRestartByKey) {
    e.preventDefault(); // ellers trykker Enter også på den knap, der har fokus
    startGame();
    return;
  }

  if (e.code === "Space") {
    if (game.isRunning && !game.waitingForStart) {
      e.preventDefault();
      game.togglePause();
    }
    return;
  }

  const dir = KEY_DIRECTIONS[e.key];
  if (!dir || !game.isRunning) return;
  e.preventDefault();
  game.steer(dir);
});

// ---- Telefon: pileknapper og swipe ----
// Knapperne reagerer på pointerdown, så slangen drejer i samme øjeblik fingeren rammer
document.querySelectorAll(".pad[data-dir]").forEach(btn => {
  btn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    if (game.isRunning) game.steer(btn.dataset.dir);
  });
});
document.getElementById("pause-btn").addEventListener("pointerdown", (e) => {
  e.preventDefault();
  game.togglePause();
});

// Swipe på banen: når fingeren har flyttet sig SWIPE_MIN_PX, drejer slangen den vej.
// Startpunktet flyttes med, så man kan swipe flere gange uden at løfte fingeren
const canvas = document.getElementById("game-canvas");
let swipeStart = null;
canvas.addEventListener("pointerdown", (e) => {
  swipeStart = { x: e.clientX, y: e.clientY };
});
canvas.addEventListener("pointermove", (e) => {
  if (!swipeStart || !game.isRunning) return;
  const dx = e.clientX - swipeStart.x;
  const dy = e.clientY - swipeStart.y;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_MIN_PX) return;
  const dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "RIGHT" : "LEFT") : (dy > 0 ? "DOWN" : "UP");
  game.steer(dir);
  swipeStart = { x: e.clientX, y: e.clientY };
});
["pointerup", "pointercancel", "pointerleave"].forEach(type =>
  canvas.addEventListener(type, () => { swipeStart = null; })
);

// ---- Render-loop: tegner med skærmens hastighed, så partikler bevæger sig jævnt ----
let lastFrameTime = 0;
function frame(now) {
  const dt = Math.min(50, now - lastFrameTime);
  lastFrameTime = now;
  game.frame(dt);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

scoreboardView.render(scoreboard);

// Den fælles top-liste hentes ved start, og listerne tegnes igen, hver gang den er hentet
scoreboard.onChange = () => scoreboardView.render(scoreboard);
scoreboard.refresh();
