// ---- Menu og top-lister: skærme, indstillinger, pop-ups, lyd-ikon og visning af listerne ----

// Viser den valgte top-liste i alle bokse: den korte (top 5) i menuen og på game over-skærmen,
// og den fulde (top 100) i pop-up'en, hvor man også kan søge på navn
class ScoreboardView {
  // Sekunder som m:ss
  static formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = String(seconds % 60).padStart(2, "0");
    return `${m}:${s}`;
  }

  // Stort forbogstav i hvert ord i et navn: "klaus lauritzen" bliver til "Klaus Lauritzen".
  // Resten af bogstaverne beholdes, som de er skrevet. Kun visningen ændres, ikke det gemte navn
  static capitalize(name) {
    return name.replace(/(^|\s)(\S)/g, (match, space, letter) => space + letter.toUpperCase());
  }

  // Tallene i en post, delt i to linjer: den vigtigste (point, frugter og længste combo) og resten.
  // key er navnet på tallet, så det tal listen er sorteret efter, kan fremhæves
  static parts(entry) {
    return {
      main: [
        { key: "score", text: `${entry.score} point` },
        { key: "fruits", text: `${entry.fruits} frugter` },
        { key: "combo", text: `combo: ${entry.combo}` },
      ],
      sub: [
        { key: "time", text: ScoreboardView.formatTime(entry.time) },
        { key: "birds", text: `${entry.birds} fugle` },
        { key: "powerups", text: `${entry.powerups} power-ups` },
        { key: "specials", text: `${entry.specials} special frugter` },
      ],
    };
  }

  // De to linjer som almindelig tekst
  static describe(entry) {
    const { main, sub } = ScoreboardView.parts(entry);
    const join = list => list.map(p => p.text).join(" · ");
    return [join(main), join(sub)];
  }

  // Fylder en linje med tallene, hver for sig, så det valgte tal (hotKey) kan fremhæves
  static fillLine(lineEl, parts, hotKey) {
    parts.forEach((part, i) => {
      if (i > 0) {
        const sep = document.createElement("span");
        sep.className = "lb-sep";
        sep.textContent = " · ";
        lineEl.appendChild(sep);
      }
      const span = document.createElement("span");
      span.className = part.key === hotKey ? "lb-part lb-hot" : "lb-part";
      span.textContent = part.text;
      lineEl.appendChild(span);
    });
  }

  // Fanerne øverst i listen viser, hvilken side man er på: den valgte har grøn baggrund og fed skrift.
  // Man kan klikke på en fane for at gå direkte til siden
  renderTabs(tabsEl, scoreboard) {
    if (!tabsEl) return;
    tabsEl.replaceChildren();
    Scoreboard.BOARDS.forEach((board, i) => {
      const active = i === scoreboard.boardIndex;
      const tab = document.createElement("button");
      tab.className = active ? "board-tab active" : "board-tab";
      tab.dataset.board = String(i);
      tab.textContent = board.tab;
      tab.setAttribute("aria-current", active ? "page" : "false");
      tabsEl.appendChild(tab);
    });
  }

  // Bruger textContent, så navne ikke kan indsætte HTML
  render(scoreboard) {
    const board = scoreboard.board;
    document.querySelectorAll(".scoreboard").forEach(root => {
      const limit = Number(root.dataset.limit) || SCOREBOARD_SIZE;
      const filterInput = root.querySelector(".board-filter");
      const filter = filterInput ? filterInput.value : "";
      const entries = scoreboard.topFor(board, limit, filter);

      root.querySelector(".board-title").textContent = board.title;
      this.renderTabs(root.querySelector(".board-tabs"), scoreboard);
      const list = root.querySelector(".board-list");
      list.replaceChildren();

      if (entries.length === 0) {
        const li = document.createElement("li");
        li.textContent = filter.trim() ? "Ingen spil matcher" : "Ingen endnu";
        list.appendChild(li);
        return;
      }

      entries.forEach(entry => {
        const li = document.createElement("li");
        // det spil man lige har spillet, får en anden baggrund
        if (entry === scoreboard.lastEntry) li.className = "lb-current";
        // øverste linje: navn til venstre, og point, frugter og combo til højre
        const row = document.createElement("div");
        row.className = "lb-row";
        const name = document.createElement("span");
        name.className = "lb-name";
        name.textContent = ScoreboardView.capitalize(entry.name);
        row.appendChild(name);
        // det tal listen er sorteret efter, bliver fremhævet
        const { main: mainParts, sub: subParts } = ScoreboardView.parts(entry);
        const main = document.createElement("span");
        main.className = "lb-main";
        ScoreboardView.fillLine(main, mainParts, board.stat);
        row.appendChild(main);
        li.appendChild(row);
        const sub = document.createElement("span");
        sub.className = "lb-sub";
        ScoreboardView.fillLine(sub, subParts, board.stat);
        li.appendChild(sub);
        list.appendChild(li);
      });
    });
    this.scrollToCurrent();
  }

  // Ruller den fulde liste, så det spil man lige har spillet, står midt i billedet, hvis det er med på listen.
  // Kaldes også, når vinduet åbnes, for der er listen skjult, mens den bygges
  scrollToCurrent() {
    document.querySelectorAll(".scoreboard").forEach(root => {
      const list = root.querySelector(".board-list");
      const current = list && list.querySelector(".lb-current");
      if (!current || list.scrollHeight <= list.clientHeight) return;
      list.scrollTop = current.offsetTop - (list.clientHeight - current.offsetHeight) / 2;
    });
  }
}

// Lyd-ikonet i hjørnet, som altid er synligt
class SoundButton {
  constructor(sound, button) {
    this.sound = sound;
    this.button = button;
    button.addEventListener("click", () => this.toggle());
    this.render();
  }

  toggle() {
    this.sound.toggle();
    this.render();
  }

  render() {
    this.button.textContent = this.sound.enabled ? "🔊" : "🔇";
  }
}

// Skærmene (menu, spil, game over), indstillingerne og pop-up'erne
class Menu {
  constructor() {
    this.screens = {
      menu: document.getElementById("menu-screen"),
      game: document.getElementById("game-screen"),
      gameover: document.getElementById("gameover-screen"),
    };
    this.nameInput = document.getElementById("player-name");
    // den røde ring forsvinder, så snart man skriver noget
    this.nameInput.addEventListener("input", () => this.nameInput.classList.remove("name-missing"));
    this.wallsToggle = document.getElementById("walls-toggle");
    this.finalScoreEl = document.getElementById("final-score");
    this.finalFruitsEl = document.getElementById("final-fruits");
    this.finalStatsEl = document.getElementById("final-stats");

    this.bindOptionRows();
    this.bindModals();
    this.renderRuleIcons();
  }

  // Tegner billederne i regelbogen med de samme tegninger, som bruges i spillet
  renderRuleIcons() {
    document.querySelectorAll("canvas[data-sprite]").forEach(canvas => {
      const c = canvas.getContext("2d");
      const type = canvas.dataset.sprite;
      c.save();
      if (type === "bird") {
        c.scale(1.2, 1.2);
        Sprites.bird(c, "red", 15, 12);
      } else if (type === "combo") {
        c.scale(1.9, 1.9);
        c.fillStyle = BONUS_FRUITS.combo ? BONUS_FRUITS.combo.color : "#4ecca3";
        c.beginPath();
        c.arc(10.5, 10.5, 8, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = "#1a1a2e";
        c.font = "bold 9px 'Courier New', monospace";
        c.textAlign = "center";
        c.textBaseline = "middle";
        c.fillText("x4", 10.5, 11);
      } else {
        c.scale(1.9, 1.9);
        Sprites.fruit(c, type, 10.5, 10);
      }
      c.restore();
    });
  }

  // ---- Skærme ----
  showScreen(name) {
    Object.values(this.screens).forEach(s => s.classList.add("hidden"));
    this.screens[name].classList.remove("hidden");
  }

  showMenu() {
    document.body.classList.remove("in-game");
    this.showScreen("menu");
  }

  // Under spillet vises kun banen, ikke sidens overskrift
  showGame() {
    this.showScreen("game");
    document.body.classList.add("in-game");
  }

  showGameOver(stats) {
    this.finalScoreEl.textContent = stats.score;
    this.finalFruitsEl.textContent = stats.fruits;
    this.finalStatsEl.textContent = `Længste combo: ${stats.combo}\n${ScoreboardView.describe(stats)[1]}`;
    document.body.classList.remove("in-game");
    this.showScreen("gameover");
  }

  // ---- Indstillinger ----
  // Værdien for det flueben der er sat i en række
  groupValue(group) {
    return document.querySelector(`[data-group="${group}"] input:checked`).value;
  }

  // Læser alle indstillinger. Uden navn får navnefeltet fokus og en rød ring, der ryster, og der returneres null
  readSettings() {
    const name = this.nameInput.value.trim();
    if (!name) {
      this.nameInput.classList.remove("name-missing");
      void this.nameInput.offsetWidth; // så rystelsen starter forfra ved hvert klik
      this.nameInput.classList.add("name-missing");
      this.nameInput.focus();
      return null;
    }
    return {
      name,
      walls: this.wallsToggle.checked,
      snakeType: this.groupValue("snake-type"),
      isFemale: this.groupValue("snake-gender") === "female",
      theme: this.groupValue("board-theme"),
      difficulty: this.groupValue("difficulty"),
      powerupsOn: this.groupValue("powerups-mode") === "on",
    };
  }

  // Én markering pr. række: klik på en flueben fjerner de andre i samme række.
  // Man kan ikke fjerne den sidste, så der altid er én valgt
  bindOptionRows() {
    document.querySelectorAll("[data-group]").forEach(row => {
      row.addEventListener("change", (e) => {
        if (!e.target.checked) {
          e.target.checked = true;
          return;
        }
        row.querySelectorAll("input[type='checkbox']").forEach(box => {
          if (box !== e.target) box.checked = false;
        });
      });
    });
  }

  // ---- Pop-ups (regler, indstillinger og top 100) ----
  // Åbnes med knapper, lukkes med Luk, klik udenfor eller Esc
  setModal(id, show) {
    document.getElementById(id).classList.toggle("hidden", !show);
  }

  bindModals() {
    document.querySelectorAll("[data-open]").forEach(btn => {
      btn.addEventListener("click", () => this.setModal(btn.dataset.open, true));
    });
    document.querySelectorAll("[data-close]").forEach(btn => {
      btn.addEventListener("click", () => this.setModal(btn.dataset.close, false));
    });
    document.querySelectorAll(".modal").forEach(modal => {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) modal.classList.add("hidden");
      });
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") document.querySelectorAll(".modal").forEach(m => m.classList.add("hidden"));
    });
  }

  // ---- Knapper ----
  // Start spil, Spil igen og Enter i navnefeltet starter alle et spil
  onStart(handler) {
    document.getElementById("start-btn").addEventListener("click", handler);
    document.getElementById("restart-btn").addEventListener("click", handler);
    this.nameInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") handler();
    });
  }

  onBackToMenu(handler) {
    document.getElementById("menu-btn").addEventListener("click", handler);
  }
}
