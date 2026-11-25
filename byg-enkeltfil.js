// Samler hele spillet i én fil, Snake-spil.html, som kan sendes til andre.
// Kør: node byg-enkeltfil.js
// Filen indeholder siden, stilarterne og al koden, og den skal ikke bruge andre filer.
const fs = require("fs");
const path = require("path");

const dir = __dirname;
const read = file => fs.readFileSync(path.join(dir, file), "utf8");

let html = read("index.html");

// stilarkene lægges ind i siden
// (?v=... efter filnavnet er kun til browserens cache og fjernes her)
html = html.replace(/<link rel="stylesheet" href="([^"?]+)(?:\?[^"]*)?">/g, (match, file) => `<style>\n${read(file)}\n</style>`);

// og hver kodefil lægges ind i samme rækkefølge, som siden henter dem
let scripts = 0;
html = html.replace(/<script src="([^"?]+)(?:\?[^"]*)?"><\/script>/g, (match, file) => {
  const code = read(file);
  if (code.toLowerCase().includes("</script")) {
    throw new Error(`${file} indeholder "</script", som ville ødelægge den samlede fil`);
  }
  scripts += 1;
  return `<script>\n${code}\n</script>`;
});

// der må ikke være noget tilbage, som peger på andre filer (links til andre hjemmesider er fine)
const leftovers = html.match(/(?:src|href)="(?!#|data:|https?:)[^"]*"/g);
if (leftovers) throw new Error("Der peges stadig på andre filer: " + leftovers.join(", "));

const output = path.join(dir, "Snake-spil.html");
fs.writeFileSync(output, html);
console.log(`Færdig: ${output}`);
console.log(`${scripts} kodefiler og stilarkene er samlet. Størrelse: ${(Buffer.byteLength(html) / 1024).toFixed(0)} kB`);
