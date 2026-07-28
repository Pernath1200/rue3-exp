/**
 * Batch 3: a1_places, a1_school, a1_work, a1_shopping, a1_tech, a1_freetime
 */
const fs = require("fs");
const path = require("path");

const file = path.join("data/insights/etymology.json");
const data = JSON.parse(fs.readFileSync(file, "utf8"));

/** @type {Record<string, object>} */
const batch = {
  // ─── Places ────────────────────────────────────────────────────
  airport: {
    immediate: {
      path: "latin",
      note: "Modern compound: air (Latin/Greek) + port (Latin portus)",
    },
  },
  arrive: {
    immediate: {
      path: "latin",
      note: "Latin ad + ripa 'shore' via French arriver",
    },
  },
  bank: {
    immediate: {
      path: "germanic",
      note: "Italian/Germanic banca 'bench' (money table) via French/Italian",
    },
  },
  beach: {
    immediate: { path: "other", note: "Old English / dialect; deeper origin uncertain" },
  },
  behind: {
    immediate: { path: "germanic", note: "Old English behindan" },
  },
  between: {
    immediate: { path: "germanic", note: "Old English betweonum" },
  },
  bicycle: {
    immediate: {
      path: "latin",
      note: "Modern: Greek bi- 'two' + cycle (Greek kyklos 'wheel')",
    },
  },
  bike: {
    immediate: { path: "latin", note: "Short for bicycle" },
  },
  boat: {
    immediate: { path: "germanic", note: "Old English bat" },
  },
  building: {
    immediate: { path: "germanic", note: "From build (Old English byldan) + -ing" },
  },
  bus: {
    immediate: {
      path: "latin",
      note: "Short for omnibus (Latin 'for all')",
    },
  },
  cafe: {
    immediate: { path: "other", note: "French cafe from Arabic/Turkish coffeehouse line" },
  },
  car: {
    immediate: { path: "latin", note: "Latin carrus 'wheeled vehicle' via French" },
  },
  centre: {
    immediate: { path: "latin", note: "Greek/Latin centrum via French" },
  },
  cinema: {
    immediate: {
      path: "latin",
      note: "Short for cinematograph (Greek kinema 'movement')",
    },
  },
  city: {
    immediate: { path: "latin", note: "Latin civitas via French cite" },
  },
  corner: {
    immediate: { path: "latin", note: "Latin cornu 'horn, tip' via French" },
  },
  country: {
    immediate: { path: "latin", note: "Latin contra 'opposite' via French contree" },
  },
  flight: {
    immediate: { path: "germanic", note: "Old English flyht (from fly)" },
  },
  here: {
    immediate: { path: "germanic", note: "Old English her" },
    pie: { root: "*ki-", meaning: "this, here" },
  },
  hotel: {
    immediate: {
      path: "latin",
      note: "French hotel from Latin hospitalis (guest house line)",
    },
  },
  "in front of": {
    immediate: {
      path: "latin",
      note: "front from Latin frons 'forehead, front' via French",
    },
  },
  journey: {
    immediate: { path: "latin", note: "French journee 'day's travel' from Latin diurnum" },
  },
  leave: {
    immediate: { path: "germanic", note: "Old English laefan 'remain / leave'" },
  },
  left: {
    immediate: {
      path: "germanic",
      note: "Old English lyft 'weak' (left hand); side sense later",
    },
  },
  library: {
    immediate: { path: "latin", note: "Latin librarium from liber 'book'" },
  },
  map: {
    immediate: { path: "latin", note: "Latin mappa 'cloth, napkin' → map" },
  },
  market: {
    immediate: { path: "latin", note: "Latin mercatus via French" },
  },
  metro: {
    immediate: {
      path: "latin",
      note: "Short for metropolitan (Greek meter 'mother' + polis 'city')",
    },
  },
  museum: {
    immediate: { path: "latin", note: "Greek/Latin mouseion 'seat of the Muses'" },
  },
  near: {
    immediate: { path: "germanic", note: "Old English near 'nearer'" },
  },
  "next to": {
    immediate: { path: "germanic", note: "next (Germanic) + to" },
  },
  office: {
    immediate: { path: "latin", note: "Latin officium via French" },
  },
  opposite: {
    immediate: { path: "latin", note: "Latin oppositus via French" },
  },
  park: {
    immediate: { path: "latin", note: "Medieval Latin parricus via French" },
  },
  passport: {
    immediate: {
      path: "latin",
      note: "French passeport: pass + port (harbour / passage)",
    },
  },
  plane: {
    immediate: {
      path: "latin",
      note: "Short for aeroplane (Greek aer + Latin planus 'flat')",
    },
  },
  police: {
    immediate: { path: "latin", note: "Greek/Latin politia 'citizenship, state' via French" },
  },
  policeman: {
    immediate: { path: "latin", note: "police (Latin/Greek) + man (Germanic)" },
  },
  pool: {
    immediate: {
      path: "germanic",
      note: "Old English pol 'pond'; swimming sense later",
    },
  },
  "post office": {
    immediate: {
      path: "latin",
      note: "post (Latin positum 'placed' mail system) + office",
    },
  },
  restaurant: {
    immediate: {
      path: "latin",
      note: "French restaurant from Latin restaurare 'restore'",
    },
  },
  right: {
    immediate: {
      path: "germanic",
      note: "Old English riht 'straight, just'; also the right side",
    },
    pie: { root: "*reg-", meaning: "straight, rule" },
  },
  road: {
    immediate: { path: "germanic", note: "Old English rad 'riding, road'" },
  },
  shop: {
    immediate: {
      path: "germanic",
      note: "Old English sceoppa 'booth'; also verb 'to shop'",
    },
  },
  square: {
    immediate: { path: "latin", note: "Latin exquadra via French (four-sided place)" },
  },
  station: {
    immediate: { path: "latin", note: "Latin statio 'standing place' via French" },
  },
  stop: {
    immediate: { path: "germanic", note: "Old English stoppian (block, stop)" },
  },
  straight: {
    immediate: { path: "germanic", note: "Old English streht (from stretch)" },
  },
  street: {
    immediate: {
      path: "latin",
      note: "Latin strata (via) 'paved road' into Germanic",
    },
  },
  supermarket: {
    immediate: {
      path: "latin",
      note: "Modern: super (Latin) + market (Latin mercatus)",
    },
  },
  take: {
    immediate: { path: "germanic", note: "Old Norse taka into English" },
  },
  taxi: {
    immediate: {
      path: "latin",
      note: "Short for taximeter cab (Latin taxa 'charge')",
    },
  },
  theatre: {
    immediate: { path: "latin", note: "Greek theatron via Latin/French" },
  },
  there: {
    immediate: { path: "germanic", note: "Old English thaer" },
  },
  tourist: {
    immediate: { path: "latin", note: "French from tour (Latin tornus 'lathe, turn')" },
  },
  town: {
    immediate: { path: "germanic", note: "Old English tun 'enclosure, settlement'" },
  },
  traffic: {
    immediate: { path: "latin", note: "Italian traffico via French" },
  },
  train: {
    immediate: {
      path: "latin",
      note: "French trainer 'drag'; railway sense later",
    },
  },
  tram: {
    immediate: {
      path: "other",
      note: "Dialect/low German 'beam, shaft'; streetcar sense later",
    },
  },
  trip: {
    immediate: {
      path: "germanic",
      note: "Dutch/Low German trippen 'skip'; journey sense later",
    },
  },
  university: {
    immediate: { path: "latin", note: "Latin universitas via French" },
  },
  vacation: {
    immediate: { path: "latin", note: "Latin vacatio 'freedom, empty time'" },
  },
  village: {
    immediate: { path: "latin", note: "Latin villa via French" },
  },
  walk: {
    immediate: { path: "germanic", note: "Old English wealcan 'roll, go'" },
  },
  way: {
    immediate: { path: "germanic", note: "Old English weg" },
    pie: { root: "*wegh-", meaning: "go, transport" },
    czech_cognate: {
      word: "vézt / vůz (related travel line)",
      note: "Same go/carry family as vozit (soft; not everyday cesta)",
    },
  },

  // ─── School ────────────────────────────────────────────────────
  activity: {
    immediate: { path: "latin", note: "Latin activitas via French" },
  },
  answer: {
    immediate: {
      path: "germanic",
      note: "Old English andswaru 'swear against / reply'",
    },
  },
  art: {
    immediate: { path: "latin", note: "Latin ars via French" },
  },
  article: {
    immediate: { path: "latin", note: "Latin articulus 'small joint / item'" },
  },
  artist: {
    immediate: { path: "latin", note: "French artiste from Latin ars" },
  },
  class: {
    immediate: { path: "latin", note: "Latin classis via French" },
  },
  classroom: {
    immediate: { path: "latin", note: "class (Latin) + room (Germanic)" },
  },
  college: {
    immediate: { path: "latin", note: "Latin collegium via French" },
  },
  course: {
    immediate: { path: "latin", note: "Latin cursus 'running, path' via French" },
  },
  dictionary: {
    immediate: { path: "latin", note: "Latin dictionarium from dicere 'say'" },
  },
  exam: {
    immediate: { path: "latin", note: "Short for examination (Latin examinare)" },
  },
  example: {
    immediate: { path: "latin", note: "Latin exemplum via French" },
  },
  geography: {
    immediate: {
      path: "latin",
      note: "Greek ge 'earth' + graphein 'write' via Latin/French",
    },
  },
  history: {
    immediate: { path: "latin", note: "Greek/Latin historia via French" },
  },
  homework: {
    immediate: { path: "germanic", note: "Compound: home + work (both Germanic)" },
  },
  idea: {
    immediate: { path: "latin", note: "Greek idea via Latin" },
  },
  information: {
    immediate: { path: "latin", note: "Latin informatio via French" },
  },
  language: {
    immediate: { path: "latin", note: "Latin lingua 'tongue' via French" },
  },
  learn: {
    immediate: { path: "germanic", note: "Old English leornian" },
  },
  lesson: {
    immediate: { path: "latin", note: "Latin lectio 'reading' via French" },
  },
  letter: {
    immediate: { path: "latin", note: "Latin littera via French" },
  },
  list: {
    immediate: { path: "latin", note: "Italian/French lista from Germanic 'border, strip'" },
  },
  meaning: {
    immediate: { path: "germanic", note: "From mean (Old English maenan 'intend, mean')" },
  },
  note: {
    immediate: { path: "latin", note: "Latin nota via French" },
  },
  opinion: {
    immediate: { path: "latin", note: "Latin opinio via French" },
  },
  page: {
    immediate: { path: "latin", note: "Latin pagina via French" },
  },
  paper: {
    immediate: { path: "latin", note: "Greek/Latin papyrus via French" },
  },
  paragraph: {
    immediate: {
      path: "latin",
      note: "Greek paragraphos via Latin/French",
    },
  },
  pen: {
    immediate: { path: "latin", note: "Latin penna 'feather' via French" },
  },
  pencil: {
    immediate: { path: "latin", note: "Latin penicillus 'little tail / brush'" },
  },
  phrase: {
    immediate: { path: "latin", note: "Greek phrasis via Latin/French" },
  },
  practice: {
    immediate: { path: "latin", note: "Greek/Latin practica via French" },
  },
  question: {
    immediate: { path: "latin", note: "Latin quaestio via French" },
  },
  reading: {
    immediate: { path: "germanic", note: "From read (Old English raedan)" },
  },
  science: {
    immediate: { path: "latin", note: "Latin scientia 'knowledge' via French" },
  },
  scientist: {
    immediate: { path: "latin", note: "Modern formation from science (Latin)" },
  },
  sentence: {
    immediate: { path: "latin", note: "Latin sententia via French" },
  },
  spelling: {
    immediate: {
      path: "germanic",
      note: "From spell (Old French espeller, Frankish origin)",
    },
  },
  story: {
    immediate: { path: "latin", note: "Latin historia shortened via French/English" },
  },
  study: {
    immediate: { path: "latin", note: "Latin studium via French" },
  },
  subject: {
    immediate: { path: "latin", note: "Latin subjectum via French" },
  },
  test: {
    immediate: { path: "latin", note: "Latin testum / testari 'prove' via French" },
  },
  text: {
    immediate: { path: "latin", note: "Latin textus 'woven' via French" },
  },
  title: {
    immediate: { path: "latin", note: "Latin titulus via French" },
  },
  word: {
    immediate: { path: "germanic", note: "Old English word" },
    pie: { root: "*wer-", meaning: "speak, word" },
    czech_cognate: {
      word: "hovořit / výrok (speech family)",
      note: "Same speak/word family (soft; everyday slovo is a different root)",
    },
  },
  writing: {
    immediate: { path: "germanic", note: "From write (Old English writan)" },
  },

  // ─── Work ──────────────────────────────────────────────────────
  actor: {
    immediate: { path: "latin", note: "Latin actor from agere 'do, drive'" },
  },
  actress: {
    immediate: { path: "latin", note: "actor + feminine -ess (French/Latin)" },
  },
  boss: {
    immediate: { path: "other", note: "Dutch baas into American English" },
  },
  break: {
    immediate: {
      path: "germanic",
      note: "Old English brecan; rest-from-work sense later",
    },
  },
  business: {
    immediate: {
      path: "germanic",
      note: "busy + -ness (Germanic); commerce sense later",
    },
  },
  career: {
    immediate: { path: "latin", note: "French carriere from Latin carrus 'cart, road'" },
  },
  colleague: {
    immediate: { path: "latin", note: "Latin collega via French" },
  },
  company: {
    immediate: { path: "latin", note: "Latin companio 'bread-sharer' via French" },
  },
  computer: {
    immediate: {
      path: "latin",
      note: "From compute (Latin computare 'reckon') + -er",
    },
  },
  dancer: {
    immediate: { path: "latin", note: "dance (French/Germanic) + -er" },
  },
  driver: {
    immediate: { path: "germanic", note: "drive (Old English drifan) + -er" },
  },
  email: {
    immediate: {
      path: "latin",
      note: "Modern: electronic + mail (mail from French/Germanic bag line)",
    },
  },
  engineer: {
    immediate: {
      path: "latin",
      note: "French ingenieur from Latin ingenium 'skill'",
    },
  },
  farmer: {
    immediate: { path: "latin", note: "farm (Latin/French) + -er" },
  },
  finish: {
    immediate: { path: "latin", note: "Latin finire via French" },
  },
  interview: {
    immediate: {
      path: "latin",
      note: "French entrevue from Latin inter + videre 'see'",
    },
  },
  manager: {
    immediate: { path: "latin", note: "Italian/French from Latin manus 'hand' (handle)" },
  },
  meeting: {
    immediate: { path: "germanic", note: "From meet (Old English metan)" },
  },
  money: {
    immediate: { path: "latin", note: "Latin moneta via French" },
  },
  partner: {
    immediate: { path: "latin", note: "Latin partitionarius via French" },
  },
  player: {
    immediate: { path: "germanic", note: "play (Old English plegian) + -er" },
  },
  salary: {
    immediate: {
      path: "latin",
      note: "Latin salarium (originally salt allowance) via French",
    },
  },
  singer: {
    immediate: { path: "germanic", note: "sing (Old English singan) + -er" },
  },
  start: {
    immediate: { path: "germanic", note: "Old English styrtan 'leap up'" },
  },
  student: {
    immediate: { path: "latin", note: "Latin studens from studere 'be eager'" },
  },
  waiter: {
    immediate: {
      path: "germanic",
      note: "wait (French/Germanic) + -er; restaurant sense later",
    },
  },
  work: {
    immediate: { path: "germanic", note: "Old English weorc" },
    pie: { root: "*werg-", meaning: "do, work" },
    czech_cognate: {
      word: "varhany / organ (same do/work family via Greek ergon)",
      note: "Ancient do/work line (soft; everyday prace is different)",
    },
  },
  worker: {
    immediate: { path: "germanic", note: "work + -er" },
  },
  writer: {
    immediate: { path: "germanic", note: "write (Old English writan) + -er" },
  },

  // ─── Shopping ──────────────────────────────────────────────────
  buy: {
    immediate: { path: "germanic", note: "Old English bycgan" },
  },
  card: {
    immediate: { path: "latin", note: "Greek/Latin charta via French" },
  },
  cash: {
    immediate: { path: "latin", note: "French casse / Italian cassa from Latin capsa 'box'" },
  },
  cent: {
    immediate: { path: "latin", note: "Latin centum 'hundred' (1/100 of a unit)" },
  },
  change: {
    immediate: {
      path: "latin",
      note: "Latin cambiare via French (money back / alter)",
    },
  },
  cheap: {
    immediate: {
      path: "germanic",
      note: "Old English ceap 'bargain, price'; low-cost sense later",
    },
  },
  checkout: {
    immediate: {
      path: "germanic",
      note: "Modern compound: check + out (desk where you pay)",
    },
  },
  closed: {
    immediate: { path: "latin", note: "From close (Latin clausus via French)" },
  },
  cost: {
    immediate: { path: "latin", note: "Latin constare via French" },
  },
  counter: {
    immediate: {
      path: "latin",
      note: "Latin computare via French (counting table)",
    },
  },
  customer: {
    immediate: { path: "latin", note: "Latin consuetudinarius via French costume/custom" },
  },
  "department store": {
    immediate: {
      path: "latin",
      note: "department (French/Latin) + store (Latin instaurare line)",
    },
  },
  discount: {
    immediate: {
      path: "latin",
      note: "French descompte from Latin dis + computare",
    },
  },
  dollar: {
    immediate: {
      path: "other",
      note: "From German Taler (Joachimsthal coin) via Dutch/English",
    },
  },
  euro: {
    immediate: {
      path: "latin",
      note: "Modern from Europe (Greek Europa)",
    },
  },
  expensive: {
    immediate: { path: "latin", note: "Latin expensivus from expendere 'pay out'" },
  },
  free: {
    immediate: {
      path: "germanic",
      note: "Old English freo 'not in bondage'; also 'without charge'",
    },
    pie: { root: "*pri-", meaning: "love, free" },
  },
  offer: {
    immediate: { path: "latin", note: "Latin offerre via French" },
  },
  open: {
    immediate: { path: "germanic", note: "Old English open" },
  },
  pay: {
    immediate: { path: "latin", note: "Latin pacare 'pacify, settle' via French payer" },
  },
  pound: {
    immediate: {
      path: "latin",
      note: "Latin pondo 'by weight' (currency and weight unit)",
    },
  },
  price: {
    immediate: { path: "latin", note: "Latin pretium via French" },
  },
  purse: {
    immediate: { path: "latin", note: "Latin bursa via French" },
  },
  queue: {
    immediate: { path: "latin", note: "French queue 'tail' from Latin cauda" },
  },
  receipt: {
    immediate: { path: "latin", note: "Latin recepta via French" },
  },
  refund: {
    immediate: { path: "latin", note: "Latin refundere 'pour back' via French" },
  },
  sale: {
    immediate: { path: "germanic", note: "Old English sala (from sell)" },
  },
  sell: {
    immediate: { path: "germanic", note: "Old English sellan 'give, sell'" },
  },
  shopping: {
    immediate: { path: "germanic", note: "From shop + -ing" },
  },
  size: {
    immediate: { path: "latin", note: "Old French sise from assise 'settled amount'" },
  },
  "try on": {
    immediate: {
      path: "germanic",
      note: "try (French trier / Latin) + on (Germanic particle)",
    },
  },
  wallet: {
    immediate: {
      path: "germanic",
      note: "Germanic 'knapsack, bag'; money-case sense later",
    },
  },

  // ─── Tech ──────────────────────────────────────────────────────
  blog: {
    immediate: {
      path: "other",
      note: "Modern short for weblog (web + log)",
    },
  },
  camera: {
    immediate: {
      path: "latin",
      note: "Latin camera 'vaulted room' (camera obscura → camera)",
    },
  },
  cd: {
    immediate: {
      path: "latin",
      note: "Initialism: compact disc (Latin compactus + discus)",
    },
  },
  dvd: {
    immediate: {
      path: "other",
      note: "Initialism: digital versatile/video disc (modern trademark term)",
    },
  },
  internet: {
    immediate: {
      path: "latin",
      note: "Modern: inter (Latin) + network (Germanic net + work)",
    },
  },
  magazine: {
    immediate: {
      path: "other",
      note: "Arabic makhzan 'storehouse' via Italian/French",
    },
  },
  message: {
    immediate: { path: "latin", note: "Latin missus via French" },
  },
  mobile: {
    immediate: { path: "latin", note: "Latin mobilis 'movable' via French" },
  },
  news: {
    immediate: {
      path: "latin",
      note: "Plural of new (Germanic); 'tidings' sense later",
    },
  },
  newspaper: {
    immediate: {
      path: "germanic",
      note: "Compound: news + paper (paper is Latin/Greek)",
    },
  },
  online: {
    immediate: {
      path: "latin",
      note: "Modern: on + line (Latin linea)",
    },
  },
  photo: {
    immediate: {
      path: "latin",
      note: "Short for photograph (Greek phos 'light' + graphein 'write')",
    },
  },
  photograph: {
    immediate: {
      path: "latin",
      note: "Greek phos 'light' + graphein 'write'",
    },
  },
  picture: {
    immediate: { path: "latin", note: "Latin pictura from pingere 'paint'" },
  },
  radio: {
    immediate: {
      path: "latin",
      note: "From radiotelegraphy (Latin radius 'ray')",
    },
  },
  screen: {
    immediate: {
      path: "germanic",
      note: "Old French escren from Germanic; display sense later",
    },
  },
  telephone: {
    immediate: {
      path: "latin",
      note: "Greek tele 'far' + phone 'sound'",
    },
  },
  television: {
    immediate: {
      path: "latin",
      note: "Greek tele 'far' + Latin visio 'sight'",
    },
  },
  tv: {
    immediate: { path: "latin", note: "Initialism for television" },
  },
  video: {
    immediate: { path: "latin", note: "Latin video 'I see'" },
  },
  website: {
    immediate: {
      path: "germanic",
      note: "Modern: web (Germanic) + site (Latin situs)",
    },
  },

  // ─── Free time / feelings / leisure ────────────────────────────
  afraid: {
    immediate: {
      path: "latin",
      note: "Old French afrayer 'disturb' (Frankish into French)",
    },
  },
  amazing: {
    immediate: { path: "latin", note: "From amaze (Old English amasian)" },
  },
  angry: {
    immediate: { path: "germanic", note: "Old Norse angr 'grief' into English" },
  },
  band: {
    immediate: {
      path: "germanic",
      note: "Germanic 'bond, strip'; music-group sense later",
    },
  },
  bored: {
    immediate: { path: "latin", note: "From bore (18th c. English; origin debated)" },
  },
  boring: {
    immediate: { path: "latin", note: "From bore (tedious); origin debated" },
  },
  busy: {
    immediate: { path: "germanic", note: "Old English bisig" },
  },
  common: {
    immediate: { path: "latin", note: "Latin communis via French" },
  },
  complete: {
    immediate: { path: "latin", note: "Latin completus via French" },
  },
  concert: {
    immediate: { path: "latin", note: "Italian concerto via French" },
  },
  cook: {
    immediate: { path: "latin", note: "Latin coquus / coquere via French" },
  },
  correct: {
    immediate: { path: "latin", note: "Latin correctus via French" },
  },
  dance: {
    immediate: {
      path: "latin",
      note: "Old French dancer (Frankish origin into French)",
    },
  },
  dancing: {
    immediate: { path: "latin", note: "From dance + -ing" },
  },
  dangerous: {
    immediate: { path: "latin", note: "French dangerous from Latin dominium line" },
  },
  draw: {
    immediate: {
      path: "germanic",
      note: "Old English dragan 'pull'; sketch sense later",
    },
  },
  excited: {
    immediate: { path: "latin", note: "From excite (Latin excitare)" },
  },
  exercise: {
    immediate: { path: "latin", note: "Latin exercitium via French" },
  },
  fantastic: {
    immediate: { path: "latin", note: "Greek/Latin phantasticus via French" },
  },
  favourite: {
    immediate: { path: "latin", note: "Latin favor via French favorite" },
  },
  film: {
    immediate: {
      path: "germanic",
      note: "Old English filmen 'membrane'; cinema sense later",
    },
  },
  fine: {
    immediate: {
      path: "latin",
      note: "French fin from Latin finis 'end' → refined, OK",
    },
  },
  football: {
    immediate: {
      path: "germanic",
      note: "Compound: foot + ball (both Germanic)",
    },
  },
  fun: {
    immediate: { path: "other", note: "Later English; origin uncertain" },
  },
  funny: {
    immediate: { path: "other", note: "From fun + -y" },
  },
  game: {
    immediate: { path: "germanic", note: "Old English gamen 'sport, joy'" },
  },
  great: {
    immediate: { path: "germanic", note: "Old English great 'big, coarse'" },
  },
  guitar: {
    immediate: {
      path: "other",
      note: "Greek kithara via Arabic/Spanish guitarra",
    },
  },
  gym: {
    immediate: {
      path: "latin",
      note: "Short for gymnasium (Greek gymnasion)",
    },
  },
  happy: {
    immediate: {
      path: "germanic",
      note: "From hap 'chance, luck' (Old Norse) + -y",
    },
  },
  hobby: {
    immediate: {
      path: "other",
      note: "From hobby-horse (toy); pastime sense later",
    },
  },
  holiday: {
    immediate: {
      path: "germanic",
      note: "holy + day (religious day off → vacation)",
    },
  },
  hot: {
    immediate: { path: "germanic", note: "Old English hat" },
  },
  interested: {
    immediate: { path: "latin", note: "From interest (Latin interest 'it matters')" },
  },
  interesting: {
    immediate: { path: "latin", note: "From interest (Latin)" },
  },
  listen: {
    immediate: { path: "germanic", note: "Old English hlysnan" },
  },
  match: {
    immediate: {
      path: "germanic",
      note: "Old English gemaecca 'mate'; contest sense later",
    },
  },
  modern: {
    immediate: { path: "latin", note: "Latin modernus via French" },
  },
  movie: {
    immediate: {
      path: "latin",
      note: "Short for moving picture (move from Latin movere)",
    },
  },
  paint: {
    immediate: { path: "latin", note: "Latin pingere via French peint" },
  },
  party: {
    immediate: { path: "latin", note: "Latin partire 'divide' via French partie" },
  },
  perfect: {
    immediate: { path: "latin", note: "Latin perfectus via French" },
  },
  play: {
    immediate: { path: "germanic", note: "Old English plegian" },
  },
  popular: {
    immediate: { path: "latin", note: "Latin popularis from populus 'people'" },
  },
  pretty: {
    immediate: {
      path: "germanic",
      note: "Old English praettig 'clever'; attractive sense later",
    },
  },
  quick: {
    immediate: { path: "germanic", note: "Old English cwic 'alive, lively'" },
    pie: { root: "*gwei-", meaning: "live" },
  },
  quiet: {
    immediate: { path: "latin", note: "Latin quietus via French" },
  },
  read: {
    immediate: { path: "germanic", note: "Old English raedan 'advise, read'" },
  },
  relax: {
    immediate: { path: "latin", note: "Latin relaxare via French" },
  },
  running: {
    immediate: { path: "germanic", note: "From run (Old English rinnan)" },
  },
  sad: {
    immediate: {
      path: "germanic",
      note: "Old English saed 'sated, weary'; unhappy sense later",
    },
  },
  similar: {
    immediate: { path: "latin", note: "Latin similaris via French" },
  },
  sing: {
    immediate: { path: "germanic", note: "Old English singan" },
    pie: { root: "*sengwh-", meaning: "sing" },
  },
  song: {
    immediate: { path: "germanic", note: "Old English sang" },
    pie: { root: "*sengwh-", meaning: "sing" },
  },
  sorry: {
    immediate: {
      path: "germanic",
      note: "Old English sarig 'sore, distressed'",
    },
  },
  sport: {
    immediate: {
      path: "latin",
      note: "French desport 'leisure' from Latin portare 'carry'",
    },
  },
  sure: {
    immediate: { path: "latin", note: "Latin securus via French sur" },
  },
  swimming: {
    immediate: { path: "germanic", note: "From swim (Old English swimman)" },
  },
  team: {
    immediate: {
      path: "germanic",
      note: "Old English team 'set of draught animals'; group sense later",
    },
  },
  tennis: {
    immediate: {
      path: "latin",
      note: "Probably from French tenez 'take!' (call in jeu de paume)",
    },
  },
  travel: {
    immediate: {
      path: "latin",
      note: "French travailler 'work hard' (journey was hard work)",
    },
  },
  visit: {
    immediate: { path: "latin", note: "Latin visitare via French" },
  },
  well: {
    immediate: {
      path: "germanic",
      note: "Old English wel 'in a good way'; also healthy",
    },
  },
  wonderful: {
    immediate: {
      path: "germanic",
      note: "wonder (Germanic) + -ful",
    },
  },
  worried: {
    immediate: {
      path: "germanic",
      note: "From worry (Old English wyrgan 'strangle' → harass → anxious)",
    },
  },
  write: {
    immediate: { path: "germanic", note: "Old English writan 'score, write'" },
  },
};

// Soften weak czech_cognate fields that look odd for A1 learners
if (batch.way?.czech_cognate) {
  batch.way.notes =
    "Same ancient go/carry family as Latin vehere; Czech cesta is a different everyday word.";
  delete batch.way.czech_cognate;
}
if (batch.word?.czech_cognate) {
  batch.word.notes =
    "Ancient speak/word family; Czech slovo is a different everyday root.";
  delete batch.word.czech_cognate;
}
if (batch.work?.czech_cognate) {
  batch.work.notes =
    "Same ancient do/work line as Greek ergon; Czech prace is a different everyday word.";
  delete batch.work.czech_cognate;
}

// cafe with accent in packs may be "café"
batch["café"] = batch.cafe;

let added = 0;
let skipped = 0;
for (const [lemma, entry] of Object.entries(batch)) {
  if (data.entries[lemma]) {
    skipped++;
    continue;
  }
  data.entries[lemma] = entry;
  added++;
}

data.note =
  "A1 Word roots. Learner-friendly PIE (no h1/h2/h3). Path-only OK; dual-layer when solid; soft Czech related-family OK. Batches 1-3: family/body/time/nature; food/clothes/colours/animals/health; places/school/work/shopping/tech/freetime.";

fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
console.log(
  "added",
  added,
  "skipped existing",
  skipped,
  "total entries",
  Object.keys(data.entries).length,
);

function norm(en) {
  return String(en || "")
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .split("/")[0]
    .replace(/[.,!?;:"']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

for (const id of [
  "a1_places",
  "a1_school",
  "a1_work",
  "a1_shopping",
  "a1_tech",
  "a1_freetime",
]) {
  const p = JSON.parse(fs.readFileSync(`data/blocks/${id}.json`, "utf8"));
  const lemmas = new Set();
  for (const b of p.blocks || []) {
    for (const it of b.items || []) {
      const L = norm(it.en);
      if (L) lemmas.add(L);
    }
  }
  const miss = [...lemmas].filter((l) => !data.entries[l]).sort();
  console.log(
    id,
    "covered",
    lemmas.size - miss.length,
    "/",
    lemmas.size,
    "missing:",
    miss.join(", ") || "—",
  );
}
