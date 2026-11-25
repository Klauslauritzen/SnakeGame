// ---- Konstanter for hele spillet ----

// Bane
const GRID_SIZE = 20;          // antal celler pr. side
const CANVAS_SIZE = 400;       // pixels
const CELL = CANVAS_SIZE / GRID_SIZE;

// Point, combo og rekord
const BASE_POINTS = 10;        // point for første æble
const POINTS_INCREMENT = 2;    // ekstra point pr. æble man har fanget
const COMBO_WINDOW = 4000;     // ms man har til næste frugt for at holde combo'en
const COMBO_BUFF_BONUS = 1000; // ms mere tid til combo'en pr. forstærker man har
const COMBO_BLINK_MS = 3000;   // combo-måleren blinker, når der er så lidt tid tilbage
const MAX_MULTIPLIER = 4;      // højeste combo-multiplikator
const SCOREBOARD_KEY = "snake-scoreboard";
const SCOREBOARD_SIZE = 5;     // antal navne på den korte top-liste
const SCOREBOARD_MAX = 100;    // antal spil der gemmes pr. liste og kan ses i den fulde liste
const OLD_HIGH_SCORE_KEY = "snake-highscore"; // kun til at flytte en gammel enkelt rekord over

// Fælles top-liste online (Supabase). Står de tomme, bruges kun den lokale liste i browseren.
// Nøglen er den offentlige "publishable"/"anon" nøgle, som må stå i koden. Brug aldrig "secret"/"service_role" nøglen her
const ONLINE_URL = "https://wgsvzcwpoxlxgrqscedl.supabase.co";
const ONLINE_KEY = "sb_publishable__XuYWX-pxsv6UjAjifM8Jg_nIJWZi3-";
const ONLINE_TABLE = "scores"; // tabellen med spil

// Special frugter (power-ups)
const BONUS_CHANCE = 0.25;     // sandsynlighed for at en special frugt kommer med et nyt æble (efter introduktionen)
// Introduktion i starten af et spil, så man bliver vænnet til special frugter og power-ups:
// intet før 2. æble, så altid en special frugt, og så en power-up efter 4., 5. eller 6. æble
const INTRO_FRUIT_APPLE = 2;   // den garanterede special frugt kommer efter dette æble
const INTRO_POWERUP_APPLES = [ // den garanterede power-up kommer efter et af disse æbler, med disse chancer
  { apple: 4, chance: 0.4 },
  { apple: 5, chance: 0.4 },
  { apple: 6, chance: 0.2 },
];
const BONUS_LIFETIME = 6000;   // ms før en special frugt forsvinder
const BONUS_MIN_FACTOR = 1.1;  // special frugt giver mindst så mange gange æblets point (når den er ved at forsvinde)
const BONUS_MAX_FACTOR = 2;    // og højst så mange (når den lige er dukket op)
const STAR_CHANCE = 0.10;     // sandsynlighed for at special frugten er den gyldne stjerne
const SHIELD_CHANCE = 0.10;   // sandsynlighed for at special frugten er et skjold
const SLOW_CHANCE = 0.10;     // sandsynlighed for at special frugten er det langsomme ur
const SHRINK_CHANCE = 0.10;   // sandsynlighed for at special frugten gør slangen kortere
const DOUBLE_CHANCE = 0.10;    // sandsynlighed for at special frugten giver dobbelt point
const BUFF_CHANCE = 0.10;      // sandsynlighed for at special frugten er forstærkeren
const DOUBLE_DURATION = 8000;  // ms dobbelt point varer
const BUFF_MAX_LEVEL = 3;      // en forstærker varer resten af spillet. Hver giver special frugt, stjerne og dobbelt point 1 gang mere tid, op til dette antal
const SHIELD_FLASH_MS = 800;   // ms skjoldet blinker, når det er brugt
const STAR_DURATION = 6000;    // ms man kan spise fuglene efter en stjernefrugt
const SLOW_STEPS = 3;         // hvert langsomt ur sænker farten for altid så mange trin (et trin = det hop farten tager hver 5. frugt)
const SLOW_POINT_STAGES = 2;   // og sætter æblets point så mange trin tilbage pr. ur
const MAX_TICK_DELAY = 220;    // langsomste tilladte tick-tid i ms, uanset hvor mange ure man tager
const MAX_SHIELDS = 9;         // højst så mange skjolde man kan have
const SHRINK_AMOUNT = 4;       // så mange led slangen mister med den korte-power-up
const MIN_SNAKE_LENGTH = 3;    // slangen bliver aldrig kortere end dette
const BONUS_FRUITS = {
  pear: { color: "#b5c94b" },
  mango: { color: "#ffb703" },
  watermelon: { color: "#e63946" },
  star: { color: "#ffd60a" },
  shield: { color: "#4cc9f0" },
  slow: { color: "#9b5de5" },
  shrink: { color: "#f72585" },
  double: { color: "#ff9f1c" },
  buff: { color: "#2ec4b6" },
};
// Power-ups giver en effekt i stedet for point. Teksten vises i panelet over banen
const POWERUP_TYPES = ["star", "shield", "slow", "shrink", "double", "buff"];
const POWERUP_LABELS = {
  star: "Stjerne",
  shield: "Skjold",
  slow: "Langsom",
  shrink: "Kortere",
  double: "Dobbelt",
  buff: "Forstærk",
};
const APPLE_COLOR = "#d62828";

// Fart
const START_TICK_DELAY = 100;  // starthastighed i ms pr. tick
const SPEED_STEP_EVERY = 5;    // hver 5. frugt øges hastigheden
const SPEED_FACTOR = 0.9;      // tick-tiden ganges med denne faktor ved hvert trin
const MIN_TICK_DELAY = 40;     // hurtigste tilladte tick-tid i ms

// Fugle
const BIRD_FACTOR = 2;           // en fugl giver så mange gange æblets point
const BIRD_MIN_LIFETIME = 3000;  // ms en fugl bliver på banen (min)
const BIRD_MAX_LIFETIME = 10000; // ms en fugl bliver på banen (max)
const BIRD_MIN_INTERVAL = 4000;  // ms mellem fugle der dukker op (min)
const BIRD_MAX_INTERVAL = 9000;  // ms mellem fugle der dukker op (max)
const MAX_BIRDS = 3;             // højst så mange fugle på banen ad gangen
const BIRD_MIN_DISTANCE = 3;     // en ny fugl dukker op mindst så mange felter fra hovedet (også rundt om kanten)
const BIRD_COLORS = {
  red: { body: "#e63946", wing: "#9d0208", beak: "#ffb703" },
  yellow: { body: "#ffd60a", wing: "#e09f3e", beak: "#f77f00" },
};

// Retninger: hvordan et skridt flytter hovedet, hvad der er modsat, og hvilke taster der styrer
const DIR_VECTOR = { RIGHT: [1, 0], LEFT: [-1, 0], UP: [0, -1], DOWN: [0, 1] };
const OPPOSITE = { UP: "DOWN", DOWN: "UP", LEFT: "RIGHT", RIGHT: "LEFT" };
const KEY_DIRECTIONS = {
  ArrowUp: "UP",
  ArrowDown: "DOWN",
  ArrowLeft: "LEFT",
  ArrowRight: "RIGHT",
};

// Telefon eller tablet: styres med swipe og knapper i stedet for piletaster
const IS_TOUCH = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
const SWIPE_MIN_PX = 24; // så langt fingeren skal flytte sig, før det tæller som et swipe
// Så længe (ms) efter game over ignoreres Mellemrum og Enter, så et tryk fra lige før man døde, ikke starter et nyt spil
const RESTART_KEY_DELAY_MS = 500;

// Midten af en celle i pixels
function cellCenterPx(n) {
  return n * CELL + CELL / 2;
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}
