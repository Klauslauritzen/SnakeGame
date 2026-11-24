// ---- Effekter: partikler, flyvende point-tekst og skjoldets blink (logik her, tegning i renderer.js) ----
class Effects {
  constructor() {
    this.reset();
  }

  reset() {
    this.particles = [];
    this.floaters = [];
    this.shieldFlash = 0; // ms tilbage af skjoldets blink
  }

  burst(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.02 + Math.random() * 0.05; // px pr. ms
      const life = 400 + Math.random() * 300;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life,
        maxLife: life,
        color,
      });
    }
  }

  burstAtCell(cell, color, count) {
    this.burst(cellCenterPx(cell.x), cellCenterPx(cell.y), color, count);
  }

  floatText(x, y, text) {
    this.floaters.push({ x, y, text, life: 900, maxLife: 900 });
  }

  floatTextAtCell(cell, text) {
    this.floatText(cellCenterPx(cell.x), cellCenterPx(cell.y), text);
  }

  flashShield() {
    this.shieldFlash = SHIELD_FLASH_MS;
  }

  // dt er tiden siden sidste billede i ms
  update(dt) {
    this.particles.forEach(p => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    });
    this.particles = this.particles.filter(p => p.life > 0);

    this.floaters.forEach(f => {
      f.y -= 0.03 * dt;
      f.life -= dt;
    });
    this.floaters = this.floaters.filter(f => f.life > 0);

    this.shieldFlash = Math.max(0, this.shieldFlash - dt);
  }
}
