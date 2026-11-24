// ---- Sprites: tegning af frugter, power-ups og fugle. Ren tegning uden spillogik ----
// c er den tegnekontekst, der tegnes på: banen eller et lille ikon i panelet over banen
class Sprites {
  // Tegner en frugt eller power-up med en lille skygge under
  static fruit(c, type, cx, cy) {
    c.fillStyle = "rgba(0, 0, 0, 0.3)";
    c.beginPath();
    c.ellipse(cx, cy + 8, 6, 2.5, 0, 0, Math.PI * 2);
    c.fill();

    const draw = {
      pear: Sprites.pear,
      mango: Sprites.mango,
      watermelon: Sprites.watermelon,
      star: Sprites.star,
      shield: Sprites.shield,
      slow: Sprites.clock,
      shrink: Sprites.shrink,
      double: Sprites.double,
      buff: Sprites.buff,
    }[type] || Sprites.apple;
    draw(c, cx, cy);
  }

  static apple(c, cx, cy) {
    c.fillStyle = APPLE_COLOR;
    c.beginPath();
    c.arc(cx - 3, cy + 1, 6.5, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.arc(cx + 3, cy + 1, 6.5, 0, Math.PI * 2);
    c.fill();

    c.strokeStyle = "#6b4226";
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(cx, cy - 4);
    c.lineTo(cx + 1, cy - 8);
    c.stroke();

    c.fillStyle = "#4caf50";
    c.beginPath();
    c.ellipse(cx + 4, cy - 7, 3.5, 2, -0.5, 0, Math.PI * 2);
    c.fill();

    c.fillStyle = "rgba(255, 255, 255, 0.45)";
    c.beginPath();
    c.arc(cx - 4, cy - 1, 2, 0, Math.PI * 2);
    c.fill();
  }

  static pear(c, cx, cy) {
    c.fillStyle = BONUS_FRUITS.pear.color;
    c.beginPath();
    c.arc(cx, cy + 3, 6, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.arc(cx, cy - 3, 4.5, 0, Math.PI * 2);
    c.fill();

    c.strokeStyle = "#6b4226";
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(cx, cy - 7);
    c.lineTo(cx + 1, cy - 9);
    c.stroke();

    c.fillStyle = "rgba(255, 255, 255, 0.45)";
    c.beginPath();
    c.arc(cx - 3, cy + 2, 1.8, 0, Math.PI * 2);
    c.fill();
  }

  static mango(c, cx, cy) {
    c.fillStyle = BONUS_FRUITS.mango.color;
    c.beginPath();
    c.ellipse(cx, cy, 8, 6, -0.6, 0, Math.PI * 2);
    c.fill();

    c.fillStyle = "rgba(230, 57, 70, 0.35)";
    c.beginPath();
    c.ellipse(cx + 1, cy + 1, 5, 3.5, -0.6, 0, Math.PI * 2);
    c.fill();

    c.strokeStyle = "#6b4226";
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(cx + 4, cy - 4);
    c.lineTo(cx + 5, cy - 7);
    c.stroke();
  }

  // Skive med fladen opad: grøn skal, rødt frugtkød og sorte kerner
  static watermelon(c, cx, cy) {
    const cy2 = cy + 1;
    c.fillStyle = "#2a9d8f";
    c.beginPath();
    c.arc(cx, cy2, 9, 0, Math.PI);
    c.closePath();
    c.fill();

    c.fillStyle = BONUS_FRUITS.watermelon.color;
    c.beginPath();
    c.arc(cx, cy2, 7.5, 0, Math.PI);
    c.closePath();
    c.fill();

    c.fillStyle = "#1d1d1d";
    [[-4, 2], [0, 3], [4, 2], [-1, 4]].forEach(([dx, dy]) => {
      c.beginPath();
      c.arc(cx + dx, cy2 + dy, 1, 0, Math.PI * 2);
      c.fill();
    });
  }

  // Gylden stjerne: den der gør fuglene spiselige
  static star(c, cx, cy) {
    c.fillStyle = BONUS_FRUITS.star.color;
    c.strokeStyle = "#f4a261";
    c.lineWidth = 1;
    c.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? 8 : 3.5;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const px = cx + Math.cos(a) * r;
      const py = cy + Math.sin(a) * r;
      if (i === 0) c.moveTo(px, py);
      else c.lineTo(px, py);
    }
    c.closePath();
    c.fill();
    c.stroke();
  }

  // Skjold: blåt skjold med hvid glans
  static shield(c, cx, cy) {
    c.fillStyle = BONUS_FRUITS.shield.color;
    c.strokeStyle = "#0077b6";
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(cx - 7, cy - 7);
    c.lineTo(cx + 7, cy - 7);
    c.lineTo(cx + 7, cy + 1);
    c.quadraticCurveTo(cx + 6, cy + 7, cx, cy + 9);
    c.quadraticCurveTo(cx - 6, cy + 7, cx - 7, cy + 1);
    c.closePath();
    c.fill();
    c.stroke();
    c.fillStyle = "rgba(255, 255, 255, 0.5)";
    c.beginPath();
    c.arc(cx - 3, cy - 3, 2, 0, Math.PI * 2);
    c.fill();
  }

  // Langsomt ur: lilla urskive med to visere
  static clock(c, cx, cy) {
    c.fillStyle = BONUS_FRUITS.slow.color;
    c.strokeStyle = "#3c1d6e";
    c.lineWidth = 1.5;
    c.beginPath();
    c.arc(cx, cy, 8, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    c.beginPath();
    c.moveTo(cx, cy);
    c.lineTo(cx, cy - 5);
    c.moveTo(cx, cy);
    c.lineTo(cx + 3.5, cy + 1.5);
    c.stroke();
  }

  // Dobbelt point: orange rund med et stort 2-tal
  static double(c, cx, cy) {
    c.fillStyle = BONUS_FRUITS.double.color;
    c.beginPath();
    c.arc(cx, cy, 8, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#fff";
    c.font = "bold 11px 'Courier New', monospace";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("2", cx, cy + 0.5);
  }

  // Forstærker: turkis rund med en hvid pil opad
  static buff(c, cx, cy) {
    c.fillStyle = BONUS_FRUITS.buff.color;
    c.beginPath();
    c.arc(cx, cy, 8, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#fff";
    c.beginPath();
    c.moveTo(cx, cy - 5);
    c.lineTo(cx + 4.5, cy);
    c.lineTo(cx + 1.5, cy);
    c.lineTo(cx + 1.5, cy + 5);
    c.lineTo(cx - 1.5, cy + 5);
    c.lineTo(cx - 1.5, cy);
    c.lineTo(cx - 4.5, cy);
    c.closePath();
    c.fill();
  }

  // Korte-power-up: pink rund med et hvidt minus
  static shrink(c, cx, cy) {
    c.fillStyle = BONUS_FRUITS.shrink.color;
    c.beginPath();
    c.arc(cx, cy, 8, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = "#fff";
    c.lineWidth = 2.5;
    c.beginPath();
    c.moveTo(cx - 4, cy);
    c.lineTo(cx + 4, cy);
    c.stroke();
  }

  // Fugl set fra siden, tegnet omkring (0, 0) og skaleret op så den er tydelig
  static bird(c, color, cx, cy) {
    const p = BIRD_COLORS[color];
    c.save();
    c.translate(cx, cy);
    c.scale(1.4, 1.4);
    c.strokeStyle = "#111";
    c.lineWidth = 0.8;

    c.fillStyle = p.body;
    c.beginPath();
    c.ellipse(0, 1, 6, 4.5, 0, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    c.beginPath();
    c.arc(5, -2, 3, 0, Math.PI * 2);
    c.fill();
    c.stroke();

    c.fillStyle = p.wing;
    c.beginPath();
    c.moveTo(-2, 0);
    c.lineTo(-7, -5);
    c.lineTo(1, -1);
    c.closePath();
    c.fill();
    c.stroke();

    c.fillStyle = p.beak;
    c.beginPath();
    c.moveTo(7.5, -2.5);
    c.lineTo(10, -2);
    c.lineTo(7.5, -1.5);
    c.closePath();
    c.fill();

    // øje med hvid og sort pupil
    c.fillStyle = "#fff";
    c.beginPath();
    c.arc(6, -3, 1.3, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#111";
    c.beginPath();
    c.arc(6.3, -3, 0.7, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }
}
