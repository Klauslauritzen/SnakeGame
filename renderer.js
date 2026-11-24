// ---- Renderer: tegner banen, slangen, frugter, fugle, effekter og overlays ----
// ink er tekstfarven på banen, accent er farven til specialtekst
const THEMES = {
  dark: { base: "#0f0f1a", checker: "rgba(78, 204, 163, 0.04)", ink: "#fff", accent: "#ffd60a" },
  forest: { base: "#1f4a2e", checker: "rgba(0, 0, 0, 0.08)", decor: "#2c6240", ink: "#fff", accent: "#ffd60a" },
  beach: { base: "#e6c97a", checker: "rgba(140, 90, 20, 0.08)", decor: "#d4a84f", ink: "#2b2013", accent: "#9a6b00" },
};

// Udseende for de tre slangetyper. Håret bruges kun, når slangen er en hun
const SNAKE_STYLES = {
  original: {
    head: "#4ecca3",
    bodyA: "#2f9e7a",
    bodyB: "#28886b",
    hair: { fill: "#f7e7a1", edge: "#c9a94a" },
  },
  tiger: {
    head: "#f5f5f5",
    bodyA: "#f5f5f5", // grundfarven på kroppen
    stripe: "#111111", // sorte striber på tværs af kroppen
    hair: { fill: "#1b1b1b", edge: "#666666" },
  },
  sandorm: {
    head: "#ff8c42",
    bodyA: "#f4a261",
    bodyB: "#e9833f",
    hair: { fill: "#c1121f", edge: "#780000" },
  },
};

// Med stjernen bliver slangen guld. De sidste 3 sekunder blinker den mellem guld og sit eget udseende
const GOLD_STYLE = { head: "#ffe066", bodyA: "#ffd60a", bodyB: "#f2b705" };

// Forskellen mellem to felter, så en slange der går ud over kanten tæller som et lille skridt
function wrapDelta(d) {
  if (d > GRID_SIZE / 2) return d - GRID_SIZE;
  if (d < -GRID_SIZE / 2) return d + GRID_SIZE;
  return d;
}

class Renderer {
  constructor(canvas) {
    this.ctx = canvas.getContext("2d");
    this.forestDecor = Renderer.makeDecor(28, 6, 10); // buske
    this.beachDecor = Renderer.makeDecor(70, 1, 2.5); // sandkorn
  }

  // Faste tilfældige positioner for pynten, så den ikke flimrer mellem billeder
  static makeDecor(count, minR, maxR) {
    let seed = 7;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    return Array.from({ length: count }, () => ({
      x: rand() * CANVAS_SIZE,
      y: rand() * CANVAS_SIZE,
      r: minR + rand() * (maxR - minR),
    }));
  }

  // ---- Hele billedet ----
  draw(game) {
    const { ctx } = this;
    const { settings, powerups, effects } = game;
    const theme = THEMES[settings.theme];

    this.drawBackground(settings.theme);

    const scale = this.fruitScale(game);
    this.drawFruitAt("apple", game.food, scale);

    // special frugter og power-ups (blinker de sidste to sekunder)
    powerups.bonuses.forEach(b => {
      const blinking = b.timeLeft < 2000 && Math.floor(b.timeLeft / 150) % 2 === 0;
      if (!blinking) this.drawFruitAt(b.type, b, scale);
    });

    // skjoldet blinker kort, når det er brugt
    ctx.globalAlpha = effects.shieldFlash > 0 && Math.floor(effects.shieldFlash / 100) % 2 === 0 ? 0.3 : 1;
    this.drawSnake(game);
    ctx.globalAlpha = 1;

    this.drawBirds(game, theme);
    this.drawParticles(effects);
    this.drawFloaters(effects, theme);

    if (powerups.canEatBirds) {
      ctx.fillStyle = theme.accent;
      ctx.font = "bold 13px 'Courier New', monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(`Fugle kan spises: ${Math.ceil(powerups.starTimeLeft / 1000)}s`, CANVAS_SIZE / 2, CANVAS_SIZE - 6);
    }

    // start-overlay: slangen står stille, indtil man trykker på en piletast
    if (game.waitingForStart) {
      this.drawOverlay("rgba(15, 15, 26, 0.5)", "bold 18px", "Tryk på en piletast for at starte");
    }

    // pause-overlay
    if (game.isPaused) {
      this.drawOverlay("rgba(15, 15, 26, 0.6)", "bold 32px", "PAUSE");
    }
  }

  drawOverlay(background, font, text) {
    const { ctx } = this;
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.fillStyle = "#eee";
    ctx.font = `${font} 'Courier New', monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, CANVAS_SIZE / 2, CANVAS_SIZE / 2);
  }

  // ---- Baggrund ----
  drawBackground(themeName) {
    const { ctx } = this;
    const theme = THEMES[themeName];
    ctx.fillStyle = theme.base;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // lyse felter i et skakbrætsmønster, så det er lettere at se rækker og kolonner
    ctx.fillStyle = theme.checker;
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if ((x + y) % 2 === 0) ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
      }
    }

    const decor = { forest: this.forestDecor, beach: this.beachDecor }[themeName];
    if (decor) {
      ctx.fillStyle = theme.decor;
      decor.forEach(d => {
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  }

  // ---- Frugter ----
  // Frugterne vokser lidt for hvert combo-trin
  fruitScale(game) {
    return 1 + 0.12 * (game.score.multiplier - 1);
  }

  // Tegner en frugt i en celle, skaleret med combo
  drawFruitAt(type, cell, scale) {
    const { ctx } = this;
    ctx.save();
    ctx.translate(cellCenterPx(cell.x), cellCenterPx(cell.y));
    ctx.scale(scale, scale);
    Sprites.fruit(ctx, type, 0, 0);
    ctx.restore();
  }

  // ---- Slangen ----
  activeSnakeStyle(game) {
    const base = SNAKE_STYLES[game.settings.snakeType];
    const starTimeLeft = game.powerups.starTimeLeft;
    if (starTimeLeft <= 0) return base;
    const blinkOff = starTimeLeft < 3000 && Math.floor(starTimeLeft / 150) % 2 === 0;
    if (blinkOff) return base;
    // tigerens sorte striber bliver sorte: det er de hvide dele, der bliver guld
    return { ...base, head: GOLD_STYLE.head, bodyA: GOLD_STYLE.bodyA, bodyB: GOLD_STYLE.bodyB };
  }

  drawSnake(game) {
    const { ctx } = this;
    const style = this.activeSnakeStyle(game);
    const { snake } = game;

    if (style.stripe) {
      this.drawStripedBody(snake, style);
    } else {
      // kroppen skifter farve mellem to led, så slangen får et skællet udseende
      snake.segments.forEach((seg, i) => {
        if (i === 0) ctx.fillStyle = style.head;
        else ctx.fillStyle = i % 2 === 0 ? style.bodyA : style.bodyB;
        ctx.beginPath();
        ctx.roundRect(seg.x * CELL + 1, seg.y * CELL + 1, CELL - 2, CELL - 2, 5);
        ctx.fill();
        // tynd mørk kant, så slangen også ses mod grønt og sand
        ctx.strokeStyle = "rgba(0, 0, 0, 0.35)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });
    }

    if (game.settings.isFemale) this.drawWig(snake, style.hair);
    this.drawEyes(snake);
    if (game.powerups.shieldCount > 0) this.drawShieldRing(snake, game.powerups.shieldCount);
  }

  // Et felt i tigermønster: hvidt, med to sorte striber der går tværs over slangens retning
  drawTigerSegment(cx, cy, ux, uy, style) {
    const { ctx } = this;
    const half = CELL / 2 - 1;
    const nx = -uy; // vinkelret på retningen
    const ny = ux;

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(cx - half, cy - half, half * 2, half * 2, 5);
    ctx.fillStyle = style.bodyA;
    ctx.fill();
    ctx.clip();

    ctx.strokeStyle = style.stripe;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    [-4, 4].forEach(off => {
      ctx.beginPath();
      ctx.moveTo(cx + ux * off - nx * half, cy + uy * off - ny * half);
      ctx.lineTo(cx + ux * off + nx * half, cy + uy * off + ny * half);
      ctx.stroke();
    });
    ctx.restore();
  }

  // Tigerkrop: hvert felt får sine egne tigerstriber, og hovedet vender i bevægelsesretningen
  drawStripedBody(snake, style) {
    const segs = snake.segments;
    segs.forEach((seg, i) => {
      const cx = cellCenterPx(seg.x);
      const cy = cellCenterPx(seg.y);
      if (i === 0) {
        const [ux, uy] = DIR_VECTOR[snake.direction];
        this.drawTigerSegment(cx, cy, ux, uy, style);
      } else {
        // retningen i kroppen er fra halen mod hovedet
        const before = segs[i - 1];
        const after = segs[Math.min(segs.length - 1, i + 1)];
        const tx = wrapDelta(before.x - after.x);
        const ty = wrapDelta(before.y - after.y);
        const len = Math.hypot(tx, ty) || 1;
        this.drawTigerSegment(cx, cy, tx / len, ty / len, style);
      }
    });
  }

  // Langt hår: lokker der flagrer bagud og en hårbund over hovedet.
  // Tegnes før øjnene, så de ligger ovenpå
  drawWig(snake, hair) {
    const { ctx } = this;
    const hx = cellCenterPx(snake.head.x);
    const hy = cellCenterPx(snake.head.y);
    const [dx, dy] = DIR_VECTOR[snake.direction];
    const px = -dy; // vinkelret på retningen
    const py = dx;
    const angle = Math.atan2(dy, dx);

    ctx.fillStyle = hair.fill;
    ctx.strokeStyle = hair.edge;
    ctx.lineWidth = 1;

    // to lange lokker der flagrer bagud, den ene til hver side
    [-4, 4].forEach(side => {
      ctx.beginPath();
      ctx.ellipse(hx - dx * 13 + px * side, hy - dy * 13 + py * side, 8, 3, angle, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });

    // hårbund over bagerste halvdel af hovedet
    ctx.beginPath();
    ctx.ellipse(hx - dx * 4, hy - dy * 4, 6, 7, angle, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Øjnene kigger i den retning slangen bevæger sig
  drawEyes(snake) {
    const { ctx } = this;
    const cx = cellCenterPx(snake.head.x);
    const cy = cellCenterPx(snake.head.y);
    const eyes = {
      RIGHT: [[3, -3], [3, 3]],
      LEFT: [[-3, -3], [-3, 3]],
      UP: [[-3, -3], [3, -3]],
      DOWN: [[-3, 3], [3, 3]],
    }[snake.direction];
    const look = DIR_VECTOR[snake.direction];

    eyes.forEach(([dx, dy]) => {
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(cx + dx, cy + dy, 2.2, 0, Math.PI * 2);
      ctx.fill();
      // lille kant, så det hvide øje også ses på det hvide tigerhoved
      ctx.strokeStyle = "#111";
      ctx.lineWidth = 0.8;
      ctx.stroke();
      ctx.fillStyle = "#111";
      ctx.beginPath();
      ctx.arc(cx + dx + look[0] * 0.8, cy + dy + look[1] * 0.8, 1.1, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  drawShieldRing(snake, shieldCount) {
    const { ctx } = this;
    ctx.strokeStyle = BONUS_FRUITS.shield.color;
    ctx.lineWidth = 1.5 + Math.min(shieldCount, 4); // ringen bliver tykkere med flere skjolde
    ctx.beginPath();
    ctx.arc(cellCenterPx(snake.head.x), cellCenterPx(snake.head.y), 13, 0, Math.PI * 2);
    ctx.stroke();
  }

  // ---- Fugle ----
  drawBirds(game, theme) {
    const { ctx } = this;
    game.birds.list.forEach(b => {
      const cx = cellCenterPx(b.x);
      const cy = cellCenterPx(b.y);
      const blinking = b.timeLeft < 1000 && Math.floor(b.timeLeft / 150) % 2 === 0;

      // gylden ring: fuglen kan spises nu
      if (game.powerups.canEatBirds) {
        ctx.strokeStyle = BONUS_FRUITS.star.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, 17, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (!blinking) Sprites.bird(ctx, b.color, cx, cy);
      this.drawBirdTimer(b, cx, cy, theme);
    });
  }

  // Ring der tømmes og et sekundtal, så man kan se hvor længe fuglen er der
  drawBirdTimer(b, cx, cy, theme) {
    const { ctx } = this;
    const radius = 13;
    const fraction = b.timeLeft / b.lifetime;

    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = theme.ink;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.strokeStyle = theme.ink;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * fraction);
    ctx.stroke();

    // sekundtallet vises over fuglen, eller under hvis fuglen står øverst
    const labelY = b.y === 0 ? cy + 20 : cy - 20;
    ctx.fillStyle = theme.ink;
    ctx.font = "bold 10px 'Courier New', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${Math.ceil(b.timeLeft / 1000)}s`, cx, labelY);
  }

  // ---- Effekter ----
  drawParticles(effects) {
    const { ctx } = this;
    effects.particles.forEach(p => {
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  drawFloaters(effects, theme) {
    const { ctx } = this;
    ctx.font = "bold 14px 'Courier New', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = theme.ink;
    effects.floaters.forEach(f => {
      ctx.globalAlpha = f.life / f.maxLife;
      ctx.fillText(f.text, f.x, f.y);
    });
    ctx.globalAlpha = 1;
  }
}
