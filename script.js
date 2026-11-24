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
