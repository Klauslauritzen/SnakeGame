// ---- Slangen: led, retning og kø af retningsskift ----
class Snake {
  constructor() {
    this.reset();
  }

  reset() {
    this.segments = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ];
    this.direction = "RIGHT";
    this.turnQueue = []; // retningsskift der venter på næste tick (max 2)
  }

  get head() {
    return this.segments[0];
  }

  get length() {
    return this.segments.length;
  }

  occupies(x, y) {
    return this.segments.some(seg => seg.x === x && seg.y === y);
  }

  // Lægger et retningsskift i køen. Man kan ikke vende 180 grader ind i sig selv, heller ikke ved to hurtige tryk
  queueTurn(dir) {
    const last = this.turnQueue.length > 0 ? this.turnQueue[this.turnQueue.length - 1] : this.direction;
    if (dir !== last && dir !== OPPOSITE[last] && this.turnQueue.length < 2) {
      this.turnQueue.push(dir);
    }
  }

  // Tager næste retningsskift i køen i brug (ét pr. tick)
  applyTurn() {
    if (this.turnQueue.length > 0) this.direction = this.turnQueue.shift();
  }

  // Feltet hovedet flytter til. Uden mure løber slangen rundt, og med mure giver væggen null
  nextHead(walls) {
    const [dx, dy] = DIR_VECTOR[this.direction];
    let x = this.head.x + dx;
    let y = this.head.y + dy;
    if (walls) {
      if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return null;
    } else {
      x = (x + GRID_SIZE) % GRID_SIZE;
      y = (y + GRID_SIZE) % GRID_SIZE;
    }
    return { x, y };
  }

  // Sætter et nyt hoved foran. Kald dropTail() bagefter, hvis slangen ikke skal vokse
  advance(newHead) {
    this.segments.unshift(newHead);
  }

  dropTail() {
    this.segments.pop();
  }

  // Fjerner de sidste led, men aldrig så slangen bliver kortere end MIN_SNAKE_LENGTH
  shrink(amount) {
    const n = Math.min(amount, this.length - MIN_SNAKE_LENGTH);
    if (n > 0) this.segments.splice(this.length - n, n);
  }

  // Antal felter af slangens egen krop i en lige linje fra cell og fremad i den retning, den kører
  runLength(cell, walls) {
    const [dx, dy] = DIR_VECTOR[this.direction];
    let x = cell.x;
    let y = cell.y;
    let n = 0;
    while (n <= this.length && this.occupies(x, y)) {
      n += 1;
      x += dx;
      y += dy;
      if (!walls) {
        x = (x + GRID_SIZE) % GRID_SIZE;
        y = (y + GRID_SIZE) % GRID_SIZE;
      }
    }
    return n;
  }
}
