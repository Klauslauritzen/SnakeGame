// ---- Fyrværkeri: når man kommer på top 5, springer raketter over hele skærmen ----
// Tegner på et gennemsigtigt lærred, der dækker siden og ikke tager imod klik
class Fireworks {
  constructor(canvas, sound) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.sound = sound;
    this.active = false;
    this.rockets = [];
    this.sparks = [];
    this.timeLeft = 0;  // hvor længe der stadig sendes nye raketter op
    this.launchIn = 0;  // ms til næste raket
    this.interval = 500;
  }

  // rank er placeringen (1 er bedst). En 1. plads giver mere og længere fyrværkeri
  start(rank) {
    // har man bedt computeren om at undgå animationer, springer vi det over
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    this.resize();
    this.rockets = [];
    this.sparks = [];
    this.active = true;
    this.canvas.classList.add("active");
    this.timeLeft = rank === 1 ? 7000 : 4500;
    this.interval = rank === 1 ? 260 : 520;
    this.launchIn = 0;
    this.sound.fanfare();
  }

  stop() {
    this.active = false;
    this.rockets = [];
    this.sparks = [];
    this.timeLeft = 0;
    this.canvas.classList.remove("active");
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  // Lærredet får samme størrelse som det synlige område (uden rullebjælke), så tegningen ikke bliver skaleret
  resize() {
    const root = document.documentElement;
    this.canvas.width = (root && root.clientWidth) || window.innerWidth || 800;
    this.canvas.height = (root && root.clientHeight) || window.innerHeight || 600;
  }

  launch() {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const targetY = h * (0.12 + Math.random() * 0.38);
    this.rockets.push({
      x: w * (0.1 + Math.random() * 0.8),
      y: h,
      targetY,
      vy: -(h - targetY) / (800 + Math.random() * 300), // px pr. ms, så den når målet på ca. 1 sekund
      hue: Math.floor(Math.random() * 360),
    });
  }

  // En raket springer: lysende gnister flyver ud i alle retninger, med nogle få hvide imellem
  explode(rocket) {
    const count = 60 + Math.floor(Math.random() * 30);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.08 + Math.random() * 0.28; // px pr. ms
      const white = Math.random() < 0.12;
      const hue = (rocket.hue + (Math.random() - 0.5) * 50 + 360) % 360;
      this.sparks.push({
        x: rocket.x,
        y: rocket.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 900 + Math.random() * 900,
        maxLife: 1800,
        color: white ? "255, 255, 255" : this.hslToRgb(hue, 1, 0.62),
      });
    }
    this.sound.pop();
  }

  // Farver som "r, g, b", så gnisterne kan tones ud med en alfa-værdi
  hslToRgb(h, s, l) {
    const a = s * Math.min(l, 1 - l);
    const f = n => {
      const k = (n + h / 30) % 12;
      return l - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)));
    };
    return [f(0), f(8), f(4)].map(v => Math.round(v * 255)).join(", ");
  }

  // dt er tiden siden sidste billede i ms
  update(dt) {
    if (!this.active) return;

    this.timeLeft -= dt;
    if (this.timeLeft > 0) {
      this.launchIn -= dt;
      if (this.launchIn <= 0) {
        this.launch();
        this.launchIn = this.interval * (0.6 + Math.random() * 0.8);
      }
    }

    this.rockets.forEach(r => {
      r.y += r.vy * dt;
      if (r.y <= r.targetY) {
        r.done = true;
        this.explode(r);
      }
    });
    this.rockets = this.rockets.filter(r => !r.done);

    this.sparks.forEach(s => {
      s.vy += 0.00045 * dt; // tyngdekraft
      const drag = Math.pow(0.997, dt);
      s.vx *= drag;
      s.vy *= drag;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
    });
    this.sparks = this.sparks.filter(s => s.life > 0);

    if (this.timeLeft <= 0 && this.rockets.length === 0 && this.sparks.length === 0) {
      this.stop();
      return;
    }
    this.draw();
  }

  draw() {
    const { ctx, canvas } = this;
    // tidligere billeder tones langsomt ud, så gnisterne efterlader en hale
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = "source-over";

    this.rockets.forEach(r => {
      ctx.fillStyle = `hsl(${r.hue}, 100%, 75%)`;
      ctx.beginPath();
      ctx.arc(r.x, r.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });

    this.sparks.forEach(s => {
      const fade = Math.min(1, s.life / 700);
      ctx.fillStyle = `rgba(${s.color}, ${fade})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 1.2 + 1.6 * fade, 0, Math.PI * 2);
      ctx.fill();
    });
  }
}
