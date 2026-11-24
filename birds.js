// ---- Fugle: dukker op med tilfældige mellemrum og forsvinder efter en tilfældig, fast tid ----
class Birds {
  constructor() {
    this.list = [];
    this.spawnIn = 0;
    this.difficulty = "normal";
  }

  reset(difficulty) {
    this.difficulty = difficulty;
    this.list = [];
    this.spawnIn = this.nextInterval();
  }

  // Sværhed styrer fuglene: ingen fugle, normalt, eller flere fugle der dukker op oftere
  get settings() {
    if (this.difficulty === "none") {
      return { maxBirds: 0, minInterval: BIRD_MIN_INTERVAL, maxInterval: BIRD_MAX_INTERVAL };
    }
    if (this.difficulty === "hard") {
      return { maxBirds: 6, minInterval: 2000, maxInterval: 4500 };
    }
    return { maxBirds: MAX_BIRDS, minInterval: BIRD_MIN_INTERVAL, maxInterval: BIRD_MAX_INTERVAL };
  }

  nextInterval() {
    return randomBetween(this.settings.minInterval, this.settings.maxInterval);
  }

  at(x, y) {
    return this.list.find(b => b.x === x && b.y === y);
  }

  add(cell) {
    const lifetime = randomBetween(BIRD_MIN_LIFETIME, BIRD_MAX_LIFETIME);
    const bird = {
      x: cell.x,
      y: cell.y,
      color: Math.random() < 0.5 ? "red" : "yellow",
      lifetime,
      timeLeft: lifetime,
    };
    this.list.push(bird);
    return bird;
  }

  remove(bird) {
    this.list = this.list.filter(b => b !== bird);
  }

  // Kaldes én gang pr. tick. step er den rigtige tid i ms. Fuglenes tid er fast og påvirkes ikke af power-ups.
  // Returnerer true, når en ny fugl skal dukke op (og der er plads til den)
  tick(step) {
    this.list.forEach(b => { b.timeLeft -= step; });
    this.list = this.list.filter(b => b.timeLeft > 0);
    this.spawnIn -= step;
    if (this.spawnIn > 0) return false;
    this.spawnIn = this.nextInterval();
    return this.list.length < this.settings.maxBirds;
  }
}
