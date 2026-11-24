// ---- Lyd (8-bit style via Web Audio API) ----
class Sound {
  constructor() {
    this.ctx = null; // oprettes først ved det første spil, fordi browsere kræver et klik først
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  // Slår lyden til eller fra. Returnerer om den nu er til
  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  // Kort tone der glider fra én frekvens til en anden. delay er ventetid i sekunder før den starter
  sweep(fromHz, toHz, duration, rampTime, delay = 0, type = "square") {
    if (!this.ctx || !this.enabled) return;
    const start = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(fromHz, start);
    osc.frequency.exponentialRampToValueAtTime(toHz, start + rampTime);

    gain.gain.setValueAtTime(0.15, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(start);
    osc.stop(start + duration);
  }

  eat() {
    this.sweep(440, 880, 0.1, 0.08);
  }

  gameOver() {
    this.sweep(220, 60, 0.4, 0.4);
  }

  // To korte, lyse toner, så det lyder som en fugl
  birdChirp() {
    this.sweep(2200, 3000, 0.08, 0.07, 0, "sine");
    this.sweep(2600, 3400, 0.1, 0.09, 0.1, "sine");
  }

  // Combo-tone: stiger en halvtone for hvert combo-trin, så man kan høre hvor langt man er
  comboNote(combo) {
    const steps = Math.min(combo - 1, 12);
    const hz = 523 * Math.pow(2, steps / 12);
    this.sweep(hz, hz, 0.12, 0.12, 0, "triangle");
  }

  // Lyd når man går op i multiplikator: en hurtig opadgående arpeggio
  levelUp() {
    this.sweep(523, 523, 0.1, 0.1, 0, "triangle");
    this.sweep(659, 659, 0.1, 0.1, 0.09, "triangle");
    this.sweep(784, 784, 0.16, 0.16, 0.18, "triangle");
  }

  // Fanfare når man kommer på top 5: fire toner op
  fanfare() {
    [523, 659, 784, 1047].forEach((hz, i) => {
      this.sweep(hz, hz, i === 3 ? 0.35 : 0.14, i === 3 ? 0.35 : 0.14, i * 0.12, "triangle");
    });
  }

  // Et lille knald, når en fyrværkeriraket springer
  pop() {
    this.sweep(260, 50, 0.16, 0.14, 0, "sawtooth");
  }

  // Lyd for combo'en: en arpeggio ved ny multiplikator, ellers en tone der stiger med combo'en
  comboFeedback(before, mult, combo) {
    if (mult > before) this.levelUp();
    else if (combo >= 2) this.comboNote(combo);
  }
}
