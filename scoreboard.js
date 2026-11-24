// ---- Top-lister med navne (gemmes i browserens localStorage) ----
// Hver post har navn, point, frugter, fugle, power-ups, special frugter, længste combo og tid.
// Der er fire lister, og man skifter mellem dem ved at klikke på fanerne. Alle viser alle tal.
// Vi gemmer de poster, der er med i top 100 på mindst én af listerne
class Scoreboard {
  constructor() {
    this.entries = this.load();
    this.boardIndex = 0;   // hvilken liste der vises lige nu
    this.lastEntry = null; // det spil man lige har spillet, så det kan fremhæves i listerne
    this.lastPlacement = null; // dets bedste placering: { boardIndex, rank }, eller null hvis det ikke kom med
  }

  get board() {
    return Scoreboard.BOARDS[this.boardIndex];
  }

  load() {
    try {
      const data = JSON.parse(localStorage.getItem(SCOREBOARD_KEY));
      if (Array.isArray(data)) {
        // ældre poster mangler nogle tal, så de får 0
        return data.map(entry => ({
          name: String(entry.name),
          score: Number(entry.score) || 0,
          fruits: Number(entry.fruits) || 0,
          birds: Number(entry.birds) || 0,
          powerups: Number(entry.powerups) || 0,
          specials: Number(entry.specials) || 0,
          combo: Number(entry.combo) || 0,
          time: Number(entry.time) || 0,
        }));
      }
      // en gammel enkelt rekord flyttes over, så den ikke går tabt
      const old = parseInt(localStorage.getItem(OLD_HIGH_SCORE_KEY), 10);
      return old > 0 ? [{ name: "Ukendt", score: old, fruits: 0, birds: 0, powerups: 0, specials: 0, combo: 0, time: 0 }] : [];
    } catch (e) {
      return [];
    }
  }

  save() {
    try {
      localStorage.setItem(SCOREBOARD_KEY, JSON.stringify(this.entries));
    } catch (e) {
      // localStorage utilgængelig — listerne gælder så kun indtil siden lukkes
    }
  }

  // De bedste på en liste. Med nameFilter vises kun spillere, hvis navn indeholder teksten (uden store/små bogstaver)
  topFor(board, limit = SCOREBOARD_SIZE, nameFilter = "") {
    const needle = nameFilter.trim().toLowerCase();
    const pool = needle ? this.entries.filter(e => e.name.toLowerCase().includes(needle)) : this.entries;
    return [...pool].sort(board.sort).slice(0, limit);
  }

  // Gemmer et spil. Posten beholdes, hvis den er med i top 100 for point, frugter, tid eller combo.
  // Bagefter vises den liste, hvor spillet fik den bedste placering. Kom det ikke med i top 100, vises point
  submit(name, stats) {
    if (stats.score <= 0 && stats.fruits <= 0 && stats.time <= 0) {
      this.lastEntry = null;
      this.lastPlacement = null;
      this.boardIndex = 0;
      return;
    }
    // tal der mangler, bliver 0, så sorteringen altid virker
    const entry = { name, score: 0, fruits: 0, birds: 0, powerups: 0, specials: 0, combo: 0, time: 0, ...stats };
    this.entries.push(entry);
    this.lastEntry = entry;
    const keep = new Set(Scoreboard.BOARDS.flatMap(board => this.topFor(board, SCOREBOARD_MAX)));
    this.entries = this.entries.filter(e => keep.has(e));
    this.lastPlacement = this.placementOf(entry);
    this.boardIndex = this.lastPlacement ? this.lastPlacement.boardIndex : 0;
    this.save();
  }

  // Placeringen i top 100 på den liste, hvor posten står bedst: { boardIndex, rank }, hvor rank 1 er bedst.
  // Ved lige placering vinder den første liste, så point kommer før frugter, tid og combo.
  // Er posten ikke med i top 100 på nogen liste, er svaret null
  placementOf(entry) {
    let best = null;
    Scoreboard.BOARDS.forEach((board, i) => {
      const index = this.topFor(board, SCOREBOARD_MAX).indexOf(entry);
      if (index !== -1 && (best === null || index + 1 < best.rank)) {
        best = { boardIndex: i, rank: index + 1 };
      }
    });
    return best;
  }

  // Går til en bestemt liste, når man klikker på dens fane
  setBoard(index) {
    if (index >= 0 && index < Scoreboard.BOARDS.length) this.boardIndex = index;
  }

  // Nyt spil: intet er "det seneste spil" endnu
  clearLast() {
    this.lastEntry = null;
    this.lastPlacement = null;
  }
}

// title er overskriften på listen, tab er teksten på fanen, og stat er det tal, listen er sorteret efter
// (det bliver fremhævet i hver post)
Scoreboard.BOARDS = [
  { title: "Flest point", tab: "Point", stat: "score", sort: (a, b) => b.score - a.score || b.fruits - a.fruits },
  { title: "Flest frugter", tab: "Frugter", stat: "fruits", sort: (a, b) => b.fruits - a.fruits || b.score - a.score },
  { title: "Længste spil", tab: "Tid", stat: "time", sort: (a, b) => b.time - a.time || b.score - a.score },
  { title: "Længste combo", tab: "Combo", stat: "combo", sort: (a, b) => b.combo - a.combo || b.score - a.score },
];
