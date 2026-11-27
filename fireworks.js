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
    this.rocketsLeft = null; // med et fast antal raketter: hvor mange der mangler. null = så længe timeLeft varer
    this.label = null;       // tekst som "TOP 3", som den første raket skriver på himlen
  }

  // rank er placeringen (1 er bedst). En 1. plads giver mere og længere fyrværkeri.
  // Med count sendes præcis så mange raketter op i stedet. Med label skriver den første raket teksten på himlen
  start(rank, { count = null, label = null } = {}) {
    // har man bedt computeren om at undgå animationer, springer vi det over
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    this.resize();
    this.rockets = [];
    this.sparks = [];
    this.active = true;
    this.canvas.classList.add("active");
    this.rocketsLeft = count;
    this.label = label;
    this.timeLeft = count ? Infinity : rank === 1 ? 7000 : 4500;
    this.interval = count ? 450 : rank === 1 ? 260 : 520;
    this.launchIn = 0;
    this.sound.fanfare();
  }

  stop() {
    this.active = false;
    this.rockets = [];
    this.sparks = [];
    this.timeLeft = 0;
    this.rocketsLeft = null;
    this.label = null;
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

  // Raketten med tekst: går lige op midt på skærmen og springer ud til teksten
  launchLabel(text) {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const targetY = h * 0.28;
    this.rockets.push({
      x: w / 2,
      y: h,
      targetY,
      vy: -(h - targetY) / 1000,
      hue: 48, // guld
      label: text,
    });
  }

  // Punkterne i teksten: teksten tegnes på et lille lærred, og hver n'te lysende pixel bliver til en gnist
  labelPoints(text, cx, cy) {
    const size = Math.round(Math.min(this.canvas.width * 0.17, 120));
    const off = document.createElement("canvas");
    const octx = off.getContext("2d");
    octx.font = `bold ${size}px "Courier New", monospace`;
    off.width = Math.ceil(octx.measureText(text).width) + 8;
    off.height = Math.ceil(size * 1.2);
    octx.font = `bold ${size}px "Courier New", monospace`;
    octx.textBaseline = "middle";
    octx.fillStyle = "#fff";
    octx.fillText(text, 4, off.height / 2);
    const data = octx.getImageData(0, 0, off.width, off.height).data;
    const step = Math.max(3, Math.round(size / 22));
    const points = [];
    for (let y = 0; y < off.height; y += step) {
      for (let x = 0; x < off.width; x += step) {
        if (data[(y * off.width + x) * 4 + 3] > 128) {
          points.push({ x: cx - off.width / 2 + x, y: cy - off.height / 2 + y });
        }
      }
    }
    return points;
  }

  // Tekst-raketten springer: gnisterne flyver ud fra raketten og lægger sig, så de danner teksten
  explodeLabel(rocket) {
    this.labelPoints(rocket.label, rocket.x, rocket.y).forEach(p => {
      const hue = 40 + Math.random() * 20;
      this.sparks.push({
        x: rocket.x,
        y: rocket.y,
        fromX: rocket.x,
        fromY: rocket.y,
        toX: p.x,
        toY: p.y,
        age: 0,
        travel: 500 + Math.random() * 250, // ms om at nå sin plads
        vx: 0,
        vy: 0,
        life: 2600 + Math.random() * 400,
        maxLife: 3000,
        color: Math.random() < 0.2 ? "255, 255, 255" : this.hslToRgb(hue, 1, 0.6),
      });
    });
    this.sound.pop();
  }

  // En raket springer: lysende gnister flyver ud i alle retninger, med nogle få hvide imellem
  explode(rocket) {
    if (rocket.label) return this.explodeLabel(rocket);
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
    if (this.rocketsLeft === 0) this.timeLeft = 0; // alle raketter er sendt op
    if (this.timeLeft > 0) {
      this.launchIn -= dt;
      if (this.launchIn <= 0) {
        // teksten kommer først, så den står færdig, mens de andre raketter springer
        if (this.label) {
          this.launchLabel(this.label);
          this.label = null;
        } else {
          this.launch();
          if (this.rocketsLeft !== null) this.rocketsLeft -= 1;
        }
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
      // gnister fra tekst-raketten glider hen til deres plads i teksten, står stille og falder til sidst lidt ned
      if (s.toX !== undefined) {
        s.age += dt;
        const t = Math.min(1, s.age / s.travel);
        const ease = 1 - Math.pow(1 - t, 3);
        s.x = s.fromX + (s.toX - s.fromX) * ease;
        s.y = s.fromY + (s.toY - s.fromY) * ease;
        if (s.life < 700) s.toY += 0.04 * dt;
        s.life -= dt;
        return;
      }
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
