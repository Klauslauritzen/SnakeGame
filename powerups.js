// ---- Special frugter og power-ups: stjerne, skjold, langsomt ur, kort, dobbelt point og forstærker ----
// Her ligger tilstanden og reglerne for dem. De kan stacke. Hvad der sker på banen, styrer Game
class PowerUps {
  constructor() {
    this.reset();
  }

  reset() {
    this.bonuses = [];       // special frugter og power-ups på banen. Der kan ligge flere på samme tid
    this.starTimeLeft = 0;   // ms tilbage af stjernen. Tager man flere, lægges tiden oven i
    this.shieldCount = 0;    // antal skjolde man har
    this.slowLevel = 0;      // antal langsomme ure man har taget (hvert sænker farten for altid)
    this.doubleTimeLeft = 0; // ms tilbage af dobbelt point. Tager man flere, lægges tiden oven i
    this.buffLevel = 0;      // antal forstærkere man har taget. De varer resten af spillet
    this.ghostTicks = 0;     // felter tilbage, hvor slangen kører hen over sin egen krop
  }

  // ---- På banen ----
  static randomFruitType() {
    const normal = ["pear", "mango", "watermelon"];
    return normal[Math.floor(Math.random() * normal.length)];
  }

  static randomPowerupType() {
    return POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
  }

  // Vælger en type og lægger en special frugt eller power-up på cellen.
  // kind "fruit" giver altid en normal special frugt, og "powerup" altid en power-up.
  // Uden kind bestemmer chancerne, og uden power-ups bliver det altid en normal frugt
  spawn(cell, powerupsOn, kind) {
    let type;
    if (kind === "fruit") {
      type = PowerUps.randomFruitType();
    } else if (kind === "powerup") {
      type = PowerUps.randomPowerupType();
    } else {
      const roll = powerupsOn ? Math.random() : 1;
      let edge = STAR_CHANCE;
      if (roll < edge) {
        type = "star";
      } else if (roll < (edge += SHIELD_CHANCE)) {
        type = "shield";
      } else if (roll < (edge += SLOW_CHANCE)) {
        type = "slow";
      } else if (roll < (edge += SHRINK_CHANCE)) {
        type = "shrink";
      } else if (roll < (edge += DOUBLE_CHANCE)) {
        type = "double";
      } else if (roll < (edge += BUFF_CHANCE)) {
        type = "buff";
      } else {
        type = PowerUps.randomFruitType();
      }
    }
    const bonus = { x: cell.x, y: cell.y, type, timeLeft: BONUS_LIFETIME };
    this.bonuses.push(bonus);
    return bonus;
  }

  at(x, y) {
    return this.bonuses.find(b => b.x === x && b.y === y);
  }

  remove(bonus) {
    this.bonuses = this.bonuses.filter(b => b !== bonus);
  }

  // Special frugt giver 1,1 til 2 gange æblets point, jo hurtigere den spises
  pointFactor(bonus) {
    return BONUS_MIN_FACTOR + (BONUS_MAX_FACTOR - BONUS_MIN_FACTOR) * (bonus.timeLeft / BONUS_LIFETIME);
  }

  // ---- Effekter ----
  // Dobbelt point giver 2 gange alle point, så længe effekten varer
  get pointMultiplier() {
    return this.doubleTimeLeft > 0 ? 2 : 1;
  }

  get canEatBirds() {
    return this.starTimeLeft > 0;
  }

  // Hvor mange gange længere tid hvert tick tager på grund af de langsomme ure
  get slowFactor() {
    return Math.pow(1 / SPEED_FACTOR, SLOW_STEPS * this.slowLevel);
  }

  // Tager en power-up i brug. Kortere håndteres af slangen selv, så den er ikke med her
  activate(type) {
    if (type === "star") this.starTimeLeft += STAR_DURATION;
    if (type === "shield") this.shieldCount = Math.min(MAX_SHIELDS, this.shieldCount + 1);
    if (type === "slow") this.slowLevel += 1;
    if (type === "double") this.doubleTimeLeft += DOUBLE_DURATION;
    if (type === "buff") this.buffLevel = Math.min(BUFF_MAX_LEVEL, this.buffLevel + 1);
  }

  // Kaldes én gang pr. tick. step er den rigtige tid pr. tick i ms
  tick(step) {
    // forstærkerne får special frugten, stjernen og dobbelt point til at løbe langsommere ud, så de varer længere
    const powerStep = step / (1 + this.buffLevel);
    this.bonuses.forEach(b => { b.timeLeft -= powerStep; });
    this.bonuses = this.bonuses.filter(b => b.timeLeft > 0);
    this.starTimeLeft = Math.max(0, this.starTimeLeft - powerStep);
    this.doubleTimeLeft = Math.max(0, this.doubleTimeLeft - powerStep);
  }

  // ---- Skjold ----
  // Bruger ét skjold. Returnerer om man havde et
  useShield() {
    if (this.shieldCount === 0) return false;
    this.shieldCount -= 1;
    return true;
  }

  // Med skjold kan man køre hen over sin egen krop: ét skjold pr. felt krop i en lige linje.
  // Returnerer om man havde nok skjolde
  passOver(run) {
    if (run > this.shieldCount) return false;
    this.shieldCount -= run;
    this.ghostTicks = run - 1; // de resterende felter efter det første
    return true;
  }

  // Er man midt i at køre hen over sig selv, tæller et felt ned, og kollisionen springes over
  consumeGhostTick() {
    if (this.ghostTicks <= 0) return false;
    this.ghostTicks -= 1;
    return true;
  }
}
