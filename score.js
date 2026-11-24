// ---- Point, combo og statistik for det spil, man er i gang med ----
class Score {
  constructor() {
    this.reset();
  }

  reset() {
    this.points = 0;
    this.fruits = 0;       // æbler og special frugter (pære, mango, vandmelon)
    this.combo = 0;
    this.comboTimeLeft = 0;
    this.comboWindow = COMBO_WINDOW; // hvor lang tid den aktuelle combo har, så måleren kan vise hvor meget der er tilbage
    this.maxCombo = 0;    // den længste combo (flest frugter i træk) i dette spil
    // statistik til top-listerne
    this.birds = 0;        // fugle spist med stjernen
    this.powerups = 0;     // power-ups taget
    this.specials = 0;     // special frugter spist (pære, mango, vandmelon)
    this.playTimeMs = 0;   // spilletid i ms, uden pauser
  }

  // Point for et æble: stiger med antal fangede frugter. Hvert langsomt ur sætter det SLOW_POINT_STAGES trin tilbage
  applePoints(slowLevel) {
    const stage = Math.max(0, this.fruits - SLOW_POINT_STAGES * slowLevel);
    return BASE_POINTS + stage * POINTS_INCREMENT;
  }

  // ---- Combo: frugter spist kort efter hinanden giver en multiplikator ----
  static multiplierFor(n) {
    return Math.min(MAX_MULTIPLIER, 1 + Math.floor((n - 1) / 3));
  }

  // Multiplikatoren lige nu
  get multiplier() {
    return this.comboTimeLeft > 0 ? Score.multiplierFor(this.combo) : 1;
  }

  // Multiplikatoren man får, hvis man spiser en frugt lige nu
  get nextMultiplier() {
    return this.comboTimeLeft > 0 ? Score.multiplierFor(this.combo + 1) : 1;
  }

  // Kaldes når en frugt eller fugl spises: returnerer multiplikatoren for den.
  // window er hvor lang tid man har til den næste (længere med forstærkere)
  registerCombo(window = COMBO_WINDOW) {
    this.combo = this.comboTimeLeft > 0 ? this.combo + 1 : 1;
    this.comboWindow = window;
    this.comboTimeLeft = window;
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    return Score.multiplierFor(this.combo);
  }

  // Lægger point til (ganget med dobbelt point, hvis det er aktivt). Returnerer det der blev lagt til
  add(points, pointMultiplier) {
    const gained = Math.round(points * pointMultiplier);
    this.points += gained;
    return gained;
  }

  // Kaldes én gang pr. tick. step er tick-tiden i ms. Combo'en udløber, og spilletiden tæller op
  tick(step) {
    this.comboTimeLeft = Math.max(0, this.comboTimeLeft - step);
    this.playTimeMs += step;
  }

  // Tallene fra det spil, man lige har spillet, i det format top-listen bruger
  stats() {
    return {
      score: this.points,
      fruits: this.fruits,
      birds: this.birds,
      powerups: this.powerups,
      specials: this.specials,
      combo: this.maxCombo,
      time: Math.round(this.playTimeMs / 1000),
    };
  }
}
