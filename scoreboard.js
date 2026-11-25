// ---- Top-lister med navne (gemmes i browserens localStorage, og online hvis ONLINE_URL er sat) ----
// Hver post har navn, point, frugter, fugle, power-ups, special frugter, længste combo og tid.
// Der er fire lister, og man skifter mellem dem ved at klikke på fanerne. Alle viser alle tal.
// Vi gemmer de poster, der er med i top 100 på mindst én af listerne.
// Online er listen fælles for alle spillere. Den lokale kopi vises med det samme, og den online liste
// erstatter den, når den er hentet. Virker nettet ikke, bruges den lokale liste
class Scoreboard {
  constructor() {
    this.entries = this.load();
    this.boardIndex = 0;   // hvilken liste der vises lige nu
    // Telefon og computer har hver sin top-liste, for det er sværere at spille på telefon.
    // Man ser sin egen enheds liste først, men kan skifte til den anden
    this.mobile = IS_TOUCH;
    this.lastEntry = null; // det spil man lige har spillet, så det kan fremhæves i listerne
    this.lastPlacement = null; // dets bedste placering: { boardIndex, rank }, eller null hvis det ikke kom med
    this.onChange = null;  // kaldes, når den online liste er hentet, så den kan tegnes igen
  }

  get isOnline() {
    return Boolean(ONLINE_URL && ONLINE_KEY);
  }

  get board() {
    return Scoreboard.BOARDS[this.boardIndex];
  }

  load() {
    try {
      const data = JSON.parse(localStorage.getItem(SCOREBOARD_KEY));
      if (Array.isArray(data)) return data.map(Scoreboard.clean);
      // en gammel enkelt rekord flyttes over, så den ikke går tabt
      const old = parseInt(localStorage.getItem(OLD_HIGH_SCORE_KEY), 10);
      return old > 0 ? [{ name: "Ukendt", score: old, fruits: 0, birds: 0, powerups: 0, specials: 0, combo: 0, time: 0 }] : [];
    } catch (e) {
      return [];
    }
  }

  // En post med de rigtige typer. Ældre poster mangler nogle tal, så de får 0. id findes kun på online poster
  static clean(entry) {
    const clean = {
      name: String(entry.name),
      score: Number(entry.score) || 0,
      fruits: Number(entry.fruits) || 0,
      birds: Number(entry.birds) || 0,
      powerups: Number(entry.powerups) || 0,
      specials: Number(entry.specials) || 0,
      combo: Number(entry.combo) || 0,
      time: Number(entry.time) || 0,
      mobile: entry.mobile === true, // ældre poster uden mobile hører til computerlisten
    };
    if (entry.id != null) clean.id = entry.id;
    return clean;
  }

  save() {
    try {
      localStorage.setItem(SCOREBOARD_KEY, JSON.stringify(this.entries));
    } catch (e) {
      // localStorage utilgængelig — listerne gælder så kun indtil siden lukkes
    }
  }

  // De bedste på en liste for telefon eller computer (som standard den, der vises nu).
  // Med nameFilter vises kun spillere, hvis navn indeholder teksten (uden store/små bogstaver)
  topFor(board, limit = SCOREBOARD_SIZE, nameFilter = "", mobile = this.mobile) {
    const needle = nameFilter.trim().toLowerCase();
    const pool = this.entries.filter(e => e.mobile === mobile && (!needle || e.name.toLowerCase().includes(needle)));
    return pool.sort(board.sort).slice(0, limit);
  }

  // Skifter mellem telefonens og computerens top-liste
  setDevice(mobile) {
    this.mobile = mobile;
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
    const entry = { name, score: 0, fruits: 0, birds: 0, powerups: 0, specials: 0, combo: 0, time: 0, ...stats, mobile: IS_TOUCH };
    this.entries.push(entry);
    this.lastEntry = entry;
    this.mobile = IS_TOUCH; // efter spillet vises listen for den enhed, man spillede på
    const keep = new Set(Scoreboard.BOARDS.flatMap(board =>
      [false, true].flatMap(mobile => this.topFor(board, SCOREBOARD_MAX, "", mobile))
    ));
    this.entries = this.entries.filter(e => keep.has(e));
    this.lastPlacement = this.placementOf(entry);
    this.boardIndex = this.lastPlacement ? this.lastPlacement.boardIndex : 0;
    this.save();
    this.upload(entry);
  }

  // ---- Online ----
  // Kald til Supabase. Den nye "publishable" nøgle sendes kun som apikey, den gamle "anon" nøgle også som Authorization
  request(query, options = {}) {
    const headers = { apikey: ONLINE_KEY, "Content-Type": "application/json", ...options.headers };
    if (ONLINE_KEY.startsWith("eyJ")) headers.Authorization = `Bearer ${ONLINE_KEY}`;
    return fetch(`${ONLINE_URL}/rest/v1/${ONLINE_TABLE}${query}`, { ...options, headers }).then(res => {
      if (!res.ok) throw new Error(`Top-listen svarede ${res.status}`);
      return res.json();
    });
  }

  // Henter top 100 på hver af de fire lister, for både telefon og computer, og lægger dem sammen
  refresh() {
    if (!this.isOnline) return Promise.resolve();
    const fields = "id,name,score,fruits,birds,powerups,specials,combo,time,mobile";
    const lists = Scoreboard.BOARDS.flatMap(board => [false, true].map(mobile =>
      this.request(`?select=${fields}&mobile=eq.${mobile}&order=${board.stat}.desc,score.desc&limit=${SCOREBOARD_MAX}`)
    ));
    return Promise.all(lists)
      .then(results => {
        const byId = new Map();
        results.flat().forEach(entry => byId.set(entry.id, Scoreboard.clean(entry)));
        // det seneste spil skal stadig kunne fremhæves, så det beholder sin plads blandt de nye poster
        const last = this.lastEntry;
        if (last && last.id != null && byId.has(last.id)) byId.set(last.id, last);
        this.entries = [...byId.values()];
        if (last && last.id == null) this.entries.push(last); // er endnu ikke sendt
        this.save();
        if (this.onChange) this.onChange();
      })
      .catch(err => console.warn("Kunne ikke hente den fælles top-liste:", err));
  }

  // Sender et spil til den fælles liste og henter listen igen bagefter
  upload(entry) {
    if (!this.isOnline) return;
    const { id, ...row } = entry;
    this.request("", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(row) })
      .then(([saved]) => {
        entry.id = saved.id;
        return this.refresh();
      })
      .catch(err => console.warn("Kunne ikke gemme spillet på den fælles top-liste:", err));
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
