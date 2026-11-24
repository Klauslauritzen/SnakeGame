// ---- Game: spillets regler og spil-loop. Binder slange, point, power-ups, fugle og effekter sammen ----
// ui samler det, der vises: { menu, hud, statusRow, bonusPanel, scoreboardView, renderer }
class Game {
  constructor(ui, sound, scoreboard) {
    this.ui = ui;
    this.sound = sound;
    this.scoreboard = scoreboard;

    this.snake = new Snake();
    this.score = new Score();
    this.powerups = new PowerUps();
    this.birds = new Birds();
    this.effects = new Effects();

    this.settings = {
      name: "", walls: false, snakeType: "original", isFemale: false,
      theme: "dark", difficulty: "normal", powerupsOn: true,
    };
    this.food = null;
    this.tickDelay = START_TICK_DELAY;
    this.timer = null;
    this.started = false; // er der kørt et spil endnu, så banen kan tegnes
    this.isRunning = false;
    this.isPaused = false;
    this.waitingForStart = false;
  }

  // ---- Start og slut ----
  start(settings) {
    this.stop(); // stopper et evt. gammelt spil og fyrværkeriet fra det forrige spil
    this.settings = settings;
    this.sound.init();
    this.tickDelay = START_TICK_DELAY;
    this.reset();
    this.started = true;
    this.ui.menu.showGame();
  }

  reset() {
    this.snake.reset();
    this.score.reset();
    this.powerups.reset();
    this.birds.reset(this.settings.difficulty);
    this.effects.reset();
    this.scoreboard.clearLast();
    this.isPaused = false;
    this.isRunning = true;
    this.waitingForStart = true;
    this.food = null;
    this.applesEaten = 0;
    this.intro = {
      fruitDone: false,
      // uden power-ups er der ingen garanteret power-up
      powerupDone: !this.settings.powerupsOn,
      powerupApple: Game.pickIntroPowerupApple(),
    };
    this.placeApple();
    this.ui.hud.update(this);
  }

  // Vælger, efter hvilket æble den garanterede power-up kommer: 4. (40 %), 5. (40 %) eller 6. (20 %)
  static pickIntroPowerupApple() {
    let roll = Math.random();
    for (const option of INTRO_POWERUP_APPLES) {
      if (roll < option.chance) return option.apple;
      roll -= option.chance;
    }
    return INTRO_POWERUP_APPLES[INTRO_POWERUP_APPLES.length - 1].apple;
  }

  stop() {
    clearInterval(this.timer);
    this.ui.fireworks.stop();
  }

  endGame() {
    this.isRunning = false;
    this.stop();
    this.sound.gameOver();
    this.effects.burstAtCell(this.snake.head, "#e94560", 30);

    const stats = this.score.stats();
    this.scoreboard.submit(this.settings.name, stats);
    this.ui.menu.showGameOver(stats);
    this.ui.scoreboardView.render(this.scoreboard);

    // kommer man på top 5 på en af listerne, er der fyrværkeri (længere og vildere for en 1. plads)
    const placement = this.scoreboard.lastPlacement;
    if (placement && placement.rank <= SCOREBOARD_SIZE) this.ui.fireworks.start(placement.rank);
  }

  // ---- Tid og fart ----
  // Tick-tiden i ms lige nu: farten fra frugterne, gjort langsommere af de langsomme ure
  effectiveTick() {
    return Math.min(MAX_TICK_DELAY, this.tickDelay * this.powerups.slowFactor);
  }

  startTimer() {
    clearInterval(this.timer);
    this.timer = setInterval(() => this.tick(), this.effectiveTick());
  }

  // ---- Input ----
  // Piletasterne drejer slangen. Den første piletast starter spillet
  steer(dir) {
    if (this.waitingForStart) {
      this.waitingForStart = false;
      this.startTimer();
    }
    this.snake.queueTurn(dir);
  }

  togglePause() {
    if (this.isRunning && !this.waitingForStart) this.isPaused = !this.isPaused;
  }

  // ---- Banen ----
  // Finder en ledig celle, som hverken er slangen, frugterne eller fuglene
  randomFreeCell() {
    let cell;
    do {
      cell = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (
      this.snake.occupies(cell.x, cell.y) ||
      (this.food && this.food.x === cell.x && this.food.y === cell.y) ||
      this.powerups.at(cell.x, cell.y) ||
      this.birds.at(cell.x, cell.y)
    );
    return cell;
  }

  placeApple() {
    this.food = this.randomFreeCell();
  }

  // Lægger en special frugt eller power-up på banen. Der kan ligge flere på samme tid.
  // kind er "fruit", "powerup" eller ikke angivet (så afgør chancerne)
  spawnBonus(kind) {
    this.powerups.spawn(this.randomFreeCell(), this.settings.powerupsOn, kind);
  }

  // Kaldes når et æble er spist. Hvert æble kan give én special frugt eller power-up.
  // I starten af et spil er det styret, så man bliver vænnet til det: intet før 2. æble,
  // så altid en special frugt, og så altid en power-up efter 4., 5. eller 6. æble. Derefter er det tilfældigt
  bonusAfterApple() {
    const n = this.applesEaten;
    if (!this.intro.fruitDone) {
      if (n === INTRO_FRUIT_APPLE) {
        this.spawnBonus("fruit");
        this.intro.fruitDone = true;
      }
      return;
    }
    if (!this.intro.powerupDone) {
      if (n === this.intro.powerupApple) {
        this.spawnBonus("powerup");
        this.intro.powerupDone = true;
      }
      return;
    }
    if (Math.random() < BONUS_CHANCE) this.spawnBonus();
  }

  // Må en fugl dukke op her? Aldrig i den linje slangen kører i (heller ikke efter et retningsskift, der venter),
  // og altid mindst BIRD_MIN_DISTANCE felter fra hovedet. Uden mure tæller afstanden også rundt om kanten,
  // for der er feltet foran hovedet i den anden side af banen
  isBirdSpawnAllowed(cell) {
    const head = this.snake.head;
    const directions = [this.snake.direction, ...this.snake.turnQueue];
    const isHorizontal = d => d === "LEFT" || d === "RIGHT";
    if (directions.some(d => (isHorizontal(d) ? cell.y === head.y : cell.x === head.x))) return false;

    const gap = (a, b) => {
      const d = Math.abs(a - b);
      return this.settings.walls ? d : Math.min(d, GRID_SIZE - d);
    };
    return Math.max(gap(cell.x, head.x), gap(cell.y, head.y)) >= BIRD_MIN_DISTANCE;
  }

  spawnBird() {
    let cell;
    do {
      cell = this.randomFreeCell();
    } while (!this.isBirdSpawnAllowed(cell));
    this.birds.add(cell);
    this.sound.birdChirp();
  }

  // ---- Point ----
  // Tid til at holde en combo: hver forstærker giver 1 sekund mere
  get comboWindow() {
    return COMBO_WINDOW + COMBO_BUFF_BONUS * this.powerups.buffLevel;
  }

  applePoints() {
    return this.score.applePoints(this.powerups.slowLevel);
  }

  // Special frugt giver 1,1 til 2 gange æblets point, jo hurtigere den spises
  bonusPoints(bonus) {
    return Math.round(this.applePoints() * this.powerups.pointFactor(bonus));
  }

  // ---- Spil-loop ----
  tick() {
    if (this.isPaused) return;

    this.snake.applyTurn();

    // alle timere tæller i rigtig tid. Det langsomme ur ændrer kun farten, og fuglenes tid er fast
    const step = this.effectiveTick();
    this.score.tick(step);
    this.powerups.tick(step);
    if (this.birds.tick(step)) this.spawnBird();
    this.ui.hud.update(this);

    const newHead = this.snake.nextHead(this.settings.walls);
    if (!newHead) return this.crash();

    // en fugl er dødelig, medmindre stjernen er aktiv
    const hitBird = this.birds.at(newHead.x, newHead.y);
    if (hitBird && !this.powerups.canEatBirds) return this.crash(hitBird);

    // med skjold kan man køre hen over sin egen krop: ét skjold pr. felt i en lige linje
    if (!this.powerups.consumeGhostTick() && this.snake.occupies(newHead.x, newHead.y)) {
      if (!this.passOverBody(newHead)) return this.endGame();
    }

    this.snake.advance(newHead);

    const hitBonus = this.powerups.at(newHead.x, newHead.y);
    if (newHead.x === this.food.x && newHead.y === this.food.y) {
      this.eatFruit(this.applePoints(), APPLE_COLOR, newHead);
      this.applesEaten += 1;
      this.placeApple();
      this.bonusAfterApple();
    } else if (hitBonus) {
      this.collectBonus(hitBonus, newHead);
    } else if (hitBird) {
      this.eatBird(hitBird, newHead);
    } else {
      this.snake.dropTail();
    }
  }

  // Dødelig kollision med væg eller fugl: ét skjold beskytter. Hovedet bliver stående, og skjoldet forbruges
  crash(hitBird) {
    if (!this.powerups.useShield()) return this.endGame();
    this.effects.flashShield();
    if (hitBird) this.birds.remove(hitBird);
    this.effects.burstAtCell(this.snake.head, BONUS_FRUITS.shield.color, 20);
  }

  // Kør hen over sin egen krop med skjold. Returnerer om det lykkedes
  passOverBody(cell) {
    const run = this.snake.runLength(cell, this.settings.walls);
    if (!this.powerups.passOver(run)) return false;
    this.effects.flashShield();
    this.effects.burstAtCell(cell, BONUS_FRUITS.shield.color, 20);
    return true;
  }

  // ---- At spise ting ----
  // Fælles for alle frugter: combo, point, fart og effekter
  eatFruit(points, color, at) {
    const before = this.score.multiplier;
    const mult = this.score.registerCombo(this.comboWindow);
    const gained = this.score.add(points * mult, this.powerups.pointMultiplier);
    this.effects.floatTextAtCell(at, `+${gained}`);

    this.score.fruits += 1;
    if (this.score.fruits % SPEED_STEP_EVERY === 0) {
      this.tickDelay = Math.max(MIN_TICK_DELAY, Math.round(this.tickDelay * SPEED_FACTOR));
      this.startTimer();
    }

    this.effects.burstAtCell(at, color, 14);
    this.sound.eat();
    this.sound.comboFeedback(before, mult, this.score.combo);
    this.ui.hud.update(this);
  }

  // Special frugt eller power-up. Power-ups giver en effekt men ingen point, og de tæller ikke med i combo'en eller farten
  collectBonus(bonus, at) {
    this.powerups.remove(bonus);

    if (POWERUP_TYPES.includes(bonus.type)) {
      this.activatePowerUp(bonus.type, at);
      return;
    }

    this.score.specials += 1;
    this.eatFruit(this.bonusPoints(bonus), BONUS_FRUITS[bonus.type].color, at);
  }

  activatePowerUp(type, at) {
    this.score.powerups += 1;
    if (type === "shrink") this.snake.shrink(SHRINK_AMOUNT);
    else this.powerups.activate(type);
    if (type === "slow") this.startTimer(); // tag den nye fart i brug med det samme

    this.effects.burstAtCell(at, BONUS_FRUITS[type].color, 14);
    this.sound.eat();
  }

  // Fuglen spises (kun med stjernen aktiv). Slangen vokser ligesom ved en frugt.
  // Fugle giver altid 2 gange æblets point og tæller med i combo'en ligesom frugter
  eatBird(bird, at) {
    this.birds.remove(bird);
    this.score.birds += 1;

    const before = this.score.multiplier;
    const mult = this.score.registerCombo(this.comboWindow);
    const points = Math.round(this.applePoints() * BIRD_FACTOR * mult);
    const gained = this.score.add(points, this.powerups.pointMultiplier);

    this.effects.floatTextAtCell(at, `+${gained}`);
    this.effects.burstAtCell(at, BIRD_COLORS[bird.color].body, 14);
    this.sound.eat();
    this.sound.comboFeedback(before, mult, this.score.combo);
    this.ui.hud.update(this);
  }

  // ---- Tegning ----
  // Kaldes af render-loopet med tiden siden sidste billede i ms
  frame(dt) {
    this.effects.update(dt);
    this.ui.fireworks.update(dt);
    if (!this.started) return;
    this.ui.renderer.draw(this);
    this.ui.bonusPanel.update(this);
    this.ui.statusRow.update(this.powerups);
    this.ui.comboMeter.update(this.score);
  }
}
