// ---- HUD: tal og paneler over banen ----

// Point, combo og hvad næste æble giver
class Hud {
  constructor() {
    this.scoreEl = document.getElementById("score");
    this.comboEl = document.getElementById("combo");
    this.nextPointsEl = document.getElementById("next-points");
  }

  update(game) {
    this.scoreEl.textContent = game.score.points;
    this.comboEl.textContent = game.score.multiplier;
    this.nextPointsEl.textContent = game.applePoints() * game.score.nextMultiplier;
  }
}

// Combo-tallet over banen: hvor høj ens combo er. Det blinker, når der er COMBO_BLINK_MS eller mindre
// tilbage til næste frugt, og er skjult, når der ikke er en combo
class ComboMeter {
  constructor() {
    this.el = document.getElementById("combo-meter");
    this.label = document.getElementById("combo-label");
  }

  update(score) {
    const active = score.comboTimeLeft > 0;
    this.el.classList.toggle("invisible", !active);
    if (!active) {
      this.el.classList.remove("blinking");
      return;
    }
    this.label.textContent = `Combo: ${score.combo}`;
    this.el.classList.toggle("blinking", score.comboTimeLeft <= COMBO_BLINK_MS);
  }
}

// Rækken over banen: de power-ups man har lige nu, og hvor mange eller hvor længe
class StatusRow {
  constructor() {
    this.el = document.getElementById("status-row");
    this.lastKey = "";
  }

  update(powerups) {
    const items = [];
    if (powerups.shieldCount > 0) {
      items.push({ text: `Skjold ${powerups.shieldCount}`, color: BONUS_FRUITS.shield.color });
    }
    if (powerups.slowLevel > 0) {
      items.push({ text: `Ur ${powerups.slowLevel}`, color: BONUS_FRUITS.slow.color });
    }
    if (powerups.starTimeLeft > 0) {
      items.push({ text: `Stjerne ${Math.ceil(powerups.starTimeLeft / 1000)}s`, color: BONUS_FRUITS.star.color });
    }
    if (powerups.doubleTimeLeft > 0) {
      items.push({ text: `Dobbelt ${Math.ceil(powerups.doubleTimeLeft / 1000)}s`, color: BONUS_FRUITS.double.color });
    }
    if (powerups.buffLevel > 0) {
      items.push({ text: `Forstærk ${powerups.buffLevel}`, color: BONUS_FRUITS.buff.color });
    }

    // genopbyg kun, når noget er ændret
    const key = items.map(i => i.text).join("|");
    if (key === this.lastKey) return;
    this.lastKey = key;

    this.el.replaceChildren();
    items.forEach(item => {
      const chip = document.createElement("span");
      chip.className = "status-chip";
      chip.textContent = item.text;
      chip.style.color = item.color;
      this.el.appendChild(chip);
    });
  }
}

// Panelet over banen har en lille boks for hver special frugt og power-up, der ligger på banen
class BonusPanel {
  constructor() {
    this.el = document.getElementById("bonus-panel");
    this.items = new Map(); // special frugt -> dens boks i panelet
  }

  // En boks med billede af special frugten, point eller navn, og en tidslinje
  createItem(bonus) {
    const el = document.createElement("div");
    el.className = "bonus-item";

    const icon = document.createElement("canvas");
    icon.className = "bonus-icon";
    icon.width = 32;
    icon.height = 32;
    const iconCtx = icon.getContext("2d");
    iconCtx.scale(1.4, 1.4);
    Sprites.fruit(iconCtx, bonus.type, 10, 10);

    const label = document.createElement("span");
    const bar = document.createElement("div");
    bar.className = "bonus-bar";
    const fill = document.createElement("div");
    fill.className = "bonus-bar-fill";
    bar.appendChild(fill);

    const info = document.createElement("div");
    info.className = "bonus-info";
    info.appendChild(label);
    info.appendChild(bar);

    el.appendChild(icon);
    el.appendChild(info);
    return { el, label, fill };
  }

  update(game) {
    const bonuses = game.powerups.bonuses;

    // fjern bokse for dem, der er væk
    this.items.forEach((item, bonus) => {
      if (!bonuses.includes(bonus)) {
        item.el.remove();
        this.items.delete(bonus);
      }
    });

    bonuses.forEach(bonus => {
      let item = this.items.get(bonus);
      if (!item) {
        item = this.createItem(bonus);
        this.items.set(bonus, item);
        this.el.appendChild(item.el);
      }
      item.label.textContent = POWERUP_TYPES.includes(bonus.type)
        ? POWERUP_LABELS[bonus.type]
        : `+${game.bonusPoints(bonus) * game.score.nextMultiplier}`;
      item.fill.style.width = `${Math.min(100, (bonus.timeLeft / BONUS_LIFETIME) * 100)}%`;
    });
  }
}
