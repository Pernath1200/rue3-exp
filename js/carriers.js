/**
 * Leaf Sentence carriers — fixed grammatical frames, not free invented sentences.
 *
 * Layer 0: untagged lemmas only get Sentence if on CONCRETE_OBJECT_ALLOWLIST
 *          (safe default carriers). Everything else needs explicit `use: [...]`.
 * Layer 1: item.use lists carrier ids; Sentence = fill that carrier.
 * Layer 2 (DISABLED by default 2026-07-25): core-frame bank expand was teaching
 *          duds (I buy an advertise / a cash / I saw a quality) and tripled set size.
 *          Expand is opt-in only: blockMeta.expand === true. Prefer curated use[] /
 *          trunk recycle units over auto-expand.
 *
 * Emit gate: isCarrierSafeForLemma / isCarrierModelSafe — fail closed (skip > dud).
 * Trunk frames are untouched (authored gap models).
 */

/** One model per unit lemma (honesty over volume). */
export const SENTENCE_MODELS_PER_LEMMA = 1;
/** Soft cap (legacy multi-model); with 1× lemma this rarely bites. */
export const SENTENCE_SET_CAP = 48;

/** @typedef {{ en: string, cz: string, accepts?: string[], use?: string[] }} LeafItem */

function lemmaKey(word) {
  return String(word || "")
    .toLowerCase()
    .replace(/[^a-z].*$/, "");
}

export function cleanEnLemma(item) {
  return String(item?.en || "")
    .replace(/\([^)]*\)/g, "")
    .split("/")[0]
    .trim();
}

export function cleanCzLemma(item) {
  return String(item?.cz || "")
    .split("/")[0]
    .replace(/\([^)]*\)/g, "")
    .trim();
}

function articleFor(word) {
  const raw = String(word || "").trim();
  if (!raw) return "a";
  // Multi-word count phrases (credit card, return ticket): never bare from first token mass
  if (/\s/.test(raw)) {
    const first = raw.split(/\s+/)[0];
    const f = lemmaKey(first);
    if (!f) return "a";
    return /^[aeiou]/.test(f) ? "an" : "a";
  }
  const w = lemmaKey(raw);
  if (!w) return "a";
  // Mass / activity bare only via explicit list — not all *-ing* words
  // (booking, meeting need "a"; sightseeing is listed as bare).
  if (
    /^(water|bread|milk|rice|music|money|coffee|tea|food|fruit|information|advice|news|luggage|homework|furniture|weather|traffic|english|work|fun|love|time|people|children|clothes|jeans|scissors|glasses|police|sheep|fish|travel|travelling|traveling|sightseeing|shopping|swimming|running|reading|writing|cooking|parking|hiking|camping|skiing|dancing|singing|fishing|cycling|help|petrol|tourism|transport|driving|cash|quality|quantity|advertising|fashion|credit|material|jewellery|jewelry|stuff|equipment|software|hardware|research|education|health|happiness|freedom|success|progress)$/.test(
      w,
    )
  ) {
    return "";
  }
  if (/s$/i.test(w) && !/(ss|us|is|ous|ness)$/i.test(w)) return "";
  return /^[aeiou]/.test(w) ? "an" : "a";
}

function roughPlural(word) {
  const w = String(word || "").trim();
  if (!w) return w;
  if (/\s/.test(w)) return w; // multi-word: keep as-is (no "return tickets" invent)
  const lower = w.toLowerCase();
  if (
    /^(people|children|clothes|jeans|scissors|glasses|police|sheep|fish|luggage|news)$/i.test(
      lower,
    )
  ) {
    return w;
  }
  // Already plural-looking — don't make beans → beanses
  if (/s$/i.test(w) && !/(ss|us|is|ous|ness)$/i.test(w)) return w;
  if (/[^aeiou]y$/i.test(w)) return `${w.slice(0, -1)}ies`;
  if (/(s|x|z|ch|sh)$/i.test(w)) return `${w}es`;
  if (/fe$/i.test(w)) return `${w.slice(0, -2)}ves`;
  if (/f$/i.test(w) && !/ff$/i.test(w)) return `${w.slice(0, -1)}ves`;
  return `${w}s`;
}

function capFirst(s) {
  const t = String(s || "");
  if (!t) return t;
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/**
 * Safe default carriers for concrete count objects only.
 * Fits: This is a / I have a / Where is the / I need a.
 */
export const DEFAULT_CONCRETE_CARRIERS = [
  "this_is_a",
  "i_have_a",
  "where_is_the",
  "i_need_a",
];

/**
 * Allowlist: physical objects / venues that sound natural in the 4 default carriers.
 * Not events (journey), activities (sightseeing), abstracts (tourism), or verbs.
 * Untagged lemmas outside this set get NO auto Sentence (Layer 0 bleed-stop).
 */
export const CONCRETE_OBJECT_ALLOWLIST = new Set(
  [
    // bags / documents / small objects
    "bag",
    "suitcase",
    "backpack",
    "case",
    "passport",
    "ticket",
    "map",
    "phone",
    "book",
    "key",
    "keys",
    "wallet",
    "umbrella",
    "camera",
    "souvenir",
    "postcard",
    "letter",
    "present",
    "gift",
    "box",
    "bottle",
    "cup",
    "glass",
    "plate",
    "pen",
    "pencil",
    "computer",
    "laptop",
    "tablet",
    "watch",
    "clock",
    "lamp",
    "chair",
    "table",
    "desk",
    "bed",
    "door",
    "window",
    "picture",
    "photo",
    "mirror",
    "fridge",
    "television",
    "tv",
    "radio",
    "bicycle",
    "bike",
    "car",
    "bus",
    "train",
    "plane",
    "boat",
    "ship",
    "ferry",
    "taxi",
    "tram",
    "metro",
    "underground",
    "lorry",
    "truck",
    "motorcycle",
    "scooter",
    "vehicle",
    "coach",
    // clothes (count)
    "shirt",
    "dress",
    "skirt",
    "jacket",
    "coat",
    "hat",
    "cap",
    "shoe",
    "shoes",
    "boot",
    "boots",
    "sock",
    "socks",
    "jumper",
    "sweater",
    "trouser",
    "trousers",
    "jeans",
    "scarf",
    "glove",
    "gloves",
    // food count
    "apple",
    "banana",
    "orange",
    "egg",
    "sandwich",
    "pizza",
    "burger",
    "salad",
    "cake",
    "biscuit",
    "cookie",
    "tomato",
    "potato",
    "onion",
    "carrot",
    "lemon",
    // places / venues (where is / I need a hotel)
    "hotel",
    "hostel",
    "airport",
    "station",
    "platform",
    "beach",
    "resort",
    "museum",
    "gallery",
    "library",
    "school",
    "university",
    "hospital",
    "bank",
    "shop",
    "store",
    "market",
    "supermarket",
    "restaurant",
    "cafe",
    "café",
    "cinema",
    "theatre",
    "theater",
    "park",
    "garden",
    "zoo",
    "bridge",
    "tower",
    "castle",
    "palace",
    "church",
    "mosque",
    "temple",
    "stadium",
    "office",
    "factory",
    "farm",
    "house",
    "flat",
    "apartment",
    "room",
    "kitchen",
    "bathroom",
    "bedroom",
    "garden",
    "street",
    "road",
    "path",
    "square",
    "city",
    "town",
    "village",
    "island",
    "mountain",
    "river",
    "lake",
    "sea",
    "forest",
    "cabin",
    // animals (count)
    "dog",
    "cat",
    "bird",
    "horse",
    "cow",
    "pig",
    "sheep",
    "chicken",
    "fish",
    "rabbit",
    "mouse",
    "lion",
    "tiger",
    "elephant",
    "monkey",
    // body (count-ish objects in simple models)
    "hand",
    "foot",
    "head",
    "eye",
    "ear",
    "nose",
    "mouth",
    "arm",
    "leg",
    "finger",
    "tooth",
    "teeth",
    // health / care objects & places
    "hospital",
    "pharmacy",
    "pill",
    "medicine",
    "ambulance",
    "doctor",
    "nurse",
    "patient",
    "dentist",
    "stomach",
    "headache",
    "fever",
    "flu",
    "cough",
    "appointment",
  ].map((w) => w.toLowerCase()),
);

/**
 * Carrier catalogue.
 * Each builder returns { en, cz, accepts, gap, gap_answer, carrier }.
 */
export const CARRIERS = {
  this_is_a: {
    id: "this_is_a",
    label: "This is a …",
    build(word, cz) {
      const art = articleFor(word);
      const aWord = art ? `${art} ${word}` : word;
      const theWord = `the ${word}`;
      const en = `This is ${aWord}.`;
      return {
        en,
        cz: `Tohle je ${cz}.`,
        gap_answer: word,
        accepts: [
          en,
          `This is ${word}`,
          `This is ${aWord}`,
          `This is ${theWord}`,
          `It is ${aWord}`,
          `It's ${aWord}`,
          `It is ${theWord}`,
          `It's ${theWord}`,
          `That is ${aWord}`,
          `That's ${aWord}`,
          `That is ${theWord}`,
          `That's ${theWord}`,
        ],
      };
    },
  },
  i_have_a: {
    id: "i_have_a",
    label: "I have a …",
    build(word, cz) {
      const art = articleFor(word);
      const aWord = art ? `${art} ${word}` : word;
      const en = `I have ${aWord}.`;
      return {
        en,
        cz: `Mám ${cz}.`,
        gap_answer: word,
        accepts: [
          en,
          `I have ${word}`,
          `I have ${aWord}`,
          `I've got ${aWord}`,
          `I've got ${word}`,
          `I have got ${aWord}`,
          `I have got ${word}`,
        ],
      };
    },
  },
  where_is_the: {
    id: "where_is_the",
    label: "Where is the …?",
    build(word, cz) {
      const theWord = `the ${word}`;
      const en = `Where is ${theWord}?`;
      return {
        en,
        cz: `Kde je ${cz}?`,
        gap_answer: word,
        accepts: [
          en,
          `Where is ${theWord}`,
          `Where's ${theWord}`,
          `Where is ${word}`,
          `Where's ${word}`,
        ],
      };
    },
  },
  i_need_a: {
    id: "i_need_a",
    label: "I need a …",
    build(word, cz) {
      const art = articleFor(word);
      const aWord = art ? `${art} ${word}` : word;
      const en = `I need ${aWord}.`;
      return {
        en,
        cz: `Potřebuju ${cz}. / Potřebuji ${cz}.`,
        gap_answer: word,
        accepts: [
          en,
          `I need ${word}`,
          `I need ${aWord}`,
          `I want ${aWord}`,
          `I want ${word}`,
        ],
      };
    },
  },
  i_like_pl: {
    id: "i_like_pl",
    label: "I like …s",
    build(word, cz) {
      const pl = roughPlural(word);
      const en = `I like ${pl}.`;
      const art = articleFor(word);
      const aWord = art ? `${art} ${word}` : word;
      return {
        en,
        cz: `Líbí se mi ${cz}.`,
        gap_answer: word,
        accepts: [
          en,
          `I like ${word}`,
          `I like ${pl}`,
          `I like ${aWord}`,
          `I like the ${word}`,
          `I love ${pl}`,
          `I love ${word}`,
        ],
      };
    },
  },
  i_like_bare: {
    id: "i_like_bare",
    label: "I like … (bare)",
    build(word, cz) {
      const en = `I like ${word}.`;
      return {
        en,
        cz: `Líbí se mi ${cz}.`,
        gap_answer: word,
        accepts: [
          en,
          `I like ${word}`,
          `I love ${word}`,
          `I enjoy ${word}`,
        ],
      };
    },
  },
  i_enjoy: {
    id: "i_enjoy",
    label: "I enjoy …",
    build(word, cz) {
      const en = `I enjoy ${word}.`;
      return {
        en,
        cz: `Baví mě ${cz}. / Užívám si ${cz}.`,
        gap_answer: word,
        accepts: [en, `I enjoy ${word}`, `I like ${word}`, `I love ${word}`],
      };
    },
  },
  is_fun: {
    id: "is_fun",
    label: "… is fun",
    build(word, cz) {
      const cap = capFirst(word);
      const en = `${cap} is fun.`;
      return {
        en,
        cz: `${cz} je fajn. / ${cz} je zábava.`,
        gap_answer: word,
        accepts: [
          en,
          `${cap} is fun`,
          `${word} is fun`,
          `${cap} is great`,
          `${word} is great`,
          `${cap} is nice`,
          `${word} is nice`,
        ],
      };
    },
  },
  i_am_a: {
    id: "i_am_a",
    label: "I am a …",
    build(word, cz) {
      const art = articleFor(word) || "a";
      const en = `I am ${art} ${word}.`;
      return {
        en,
        cz: `Jsem ${cz}.`,
        gap_answer: word,
        accepts: [
          en,
          `I'm ${art} ${word}`,
          `I am a ${word}`,
          `I'm a ${word}`,
          `I am an ${word}`,
          `I'm an ${word}`,
          // specific role reading is often natural (*I am the owner*)
          `I am the ${word}`,
          `I'm the ${word}`,
        ],
      };
    },
  },
  he_is_a: {
    id: "he_is_a",
    label: "He is a …",
    build(word, cz) {
      const art = articleFor(word) || "a";
      const en = `He is ${art} ${word}.`;
      return {
        en,
        cz: `Je ${cz}.`,
        gap_answer: word,
        accepts: [
          en,
          `He's ${art} ${word}`,
          `She is ${art} ${word}`,
          `She's ${art} ${word}`,
          `He is a ${word}`,
          `She is a ${word}`,
          `He is the ${word}`,
          `He's the ${word}`,
          `She is the ${word}`,
          `She's the ${word}`,
        ],
      };
    },
  },
  /** Feelings / states: I am ill · I am healthy (not "I am a ill") */
  i_am_adj: {
    id: "i_am_adj",
    label: "I am … (adj)",
    build(word, cz) {
      const en = `I am ${word}.`;
      return {
        en,
        cz: `Jsem ${cz}.`,
        gap_answer: word,
        accepts: [en, `I am ${word}`, `I'm ${word}`],
      };
    },
  },
  he_is_adj: {
    id: "he_is_adj",
    label: "He is … (adj)",
    build(word, cz) {
      const en = `He is ${word}.`;
      return {
        en,
        cz: `Je ${cz}.`,
        gap_answer: word,
        accepts: [
          en,
          `He is ${word}`,
          `He's ${word}`,
          `She is ${word}`,
          `She's ${word}`,
        ],
      };
    },
  },
  /** Neutral adj: It is red. / It is important. */
  it_is: {
    id: "it_is",
    label: "It is …",
    build(word, cz) {
      const en = `It is ${word}.`;
      return {
        en,
        cz: `Je to ${cz}. / Je ${cz}.`,
        gap_answer: word,
        accepts: [en, `It is ${word}`, `It's ${word}`],
      };
    },
  },
  /** Colours / size on a fixed object */
  the_bag_is: {
    id: "the_bag_is",
    label: "The bag is …",
    build(word, cz) {
      const en = `The bag is ${word}.`;
      return {
        en,
        cz: `Ta taška je ${cz}.`,
        gap_answer: word,
        accepts: [
          en,
          `The bag is ${word}`,
          `My bag is ${word}`,
          `This bag is ${word}`,
        ],
      };
    },
  },
  /** Abstract nouns: Health is important. */
  is_important: {
    id: "is_important",
    label: "… is important",
    build(word, cz) {
      const cap = capFirst(word);
      const en = `${cap} is important.`;
      return {
        en,
        cz: `${cz} je důležité. / ${cz} je důležitá. / ${cz} je důležitý.`,
        gap_answer: word,
        accepts: [
          en,
          `${cap} is important`,
          `${word} is important`,
          `${cap} is very important`,
        ],
      };
    },
  },
  the_is_long: {
    id: "the_is_long",
    label: "The … is long",
    build(word, cz) {
      const en = `The ${word} is long.`;
      return {
        en,
        cz: `${cz} je dlouhá. / ${cz} je dlouhý. / ${cz} je dlouhé.`,
        gap_answer: word,
        accepts: [
          en,
          `The ${word} is long`,
          `It is a long ${word}`,
          `It's a long ${word}`,
          `This ${word} is long`,
        ],
      };
    },
  },
  have_a_good: {
    id: "have_a_good",
    label: "Have a good …!",
    build(word, cz) {
      const en = `Have a good ${word}!`;
      return {
        en,
        cz: `Hezkou ${cz}! / Příjemnou ${cz}!`,
        gap_answer: word,
        accepts: [
          en,
          `Have a good ${word}`,
          `Have a nice ${word}`,
          `Have a great ${word}`,
        ],
      };
    },
  },
  i_need_bare: {
    id: "i_need_bare",
    label: "I need … (mass)",
    build(word, cz) {
      const en = `I need ${word}.`;
      return {
        en,
        cz: `Potřebuju ${cz}. / Potřebuji ${cz}.`,
        gap_answer: word,
        accepts: [
          en,
          `I need ${word}`,
          `I need some ${word}`,
          `I want ${word}`,
          `I want some ${word}`,
        ],
      };
    },
  },
  i_have_bare: {
    id: "i_have_bare",
    label: "I have … (mass)",
    build(word, cz) {
      const en = `I have ${word}.`;
      return {
        en,
        cz: `Mám ${cz}.`,
        gap_answer: word,
        accepts: [
          en,
          `I have ${word}`,
          `I have the ${word}`,
          `I have some ${word}`,
          `I've got ${word}`,
          `I've got the ${word}`,
          `I've got some ${word}`,
        ],
      };
    },
  },
  i_want_to: {
    id: "i_want_to",
    label: "I want to … (verb)",
    build(word, cz) {
      const en = `I want to ${word}.`;
      return {
        en,
        cz: `Chci ${cz}.`,
        gap_answer: word,
        accepts: [
          en,
          `I want to ${word}`,
          `I'd like to ${word}`,
          `I would like to ${word}`,
        ],
      };
    },
  },
  we_need_to: {
    id: "we_need_to",
    label: "We need to … (verb)",
    build(word, cz) {
      const en = `We need to ${word}.`;
      return {
        en,
        cz: `Musíme ${cz}. / Potřebujeme ${cz}.`,
        gap_answer: word,
        accepts: [en, `We need to ${word}`, `I need to ${word}`],
      };
    },
  },

  // ── Richer frames (variety beyond This is / I have / I need) ──

  /** Workplace / org: I work in a department · company · office */
  i_work_in: {
    id: "i_work_in",
    label: "I work in a …",
    build(word, cz) {
      const art = articleFor(word);
      const aWord = art ? `${art} ${word}` : word;
      const en = `I work in ${aWord}.`;
      return {
        en,
        cz: `Pracuju v ${cz}. / Pracuji v ${cz}.`,
        gap_answer: word,
        accepts: [
          en,
          `I work in ${aWord}`,
          `I work in ${word}`,
          `I work in the ${word}`,
          `I work at ${aWord}`,
          `I work at the ${word}`,
        ],
      };
    },
  },
  /** Employer: I work for a company · employer */
  i_work_for: {
    id: "i_work_for",
    label: "I work for a …",
    build(word, cz) {
      const art = articleFor(word);
      const aWord = art ? `${art} ${word}` : word;
      const en = `I work for ${aWord}.`;
      return {
        en,
        cz: `Pracuju pro ${cz}. / Pracuji pro ${cz}.`,
        gap_answer: word,
        accepts: [
          en,
          `I work for ${aWord}`,
          `I work for ${word}`,
          `I work for the ${word}`,
        ],
      };
    },
  },
  /** Roles: He is my boss · colleague · manager */
  he_is_my: {
    id: "he_is_my",
    label: "He is my …",
    build(word, cz) {
      const en = `He is my ${word}.`;
      return {
        en,
        cz: `Je to můj ${cz}. / Je můj ${cz}.`,
        gap_answer: word,
        accepts: [
          en,
          `He is my ${word}`,
          `He's my ${word}`,
          `She is my ${word}`,
          `She's my ${word}`,
          `This is my ${word}`,
        ],
      };
    },
  },
  /** Looking for work nouns */
  i_look_for: {
    id: "i_look_for",
    label: "I am looking for a …",
    build(word, cz) {
      const art = articleFor(word);
      const aWord = art ? `${art} ${word}` : word;
      const en = `I am looking for ${aWord}.`;
      return {
        en,
        cz: `Hledám ${cz}.`,
        gap_answer: word,
        accepts: [
          en,
          `I'm looking for ${aWord}`,
          `I am looking for ${word}`,
          `I'm looking for ${word}`,
          `I look for ${aWord}`,
        ],
      };
    },
  },
  /** Meetings / interviews */
  i_have_a_meeting: {
    id: "i_have_a_meeting",
    label: "I have a … (event)",
    build(word, cz) {
      const art = articleFor(word);
      const aWord = art ? `${art} ${word}` : word;
      const en = `I have ${aWord} tomorrow.`;
      return {
        en,
        cz: `Zítra mám ${cz}.`,
        gap_answer: word,
        accepts: [
          en,
          `I have ${aWord} tomorrow`,
          `I have ${aWord} today`,
          `I've got ${aWord} tomorrow`,
          `I have ${aWord}`,
        ],
      };
    },
  },
  /** Sign / send / write common office verbs + noun gap */
  i_sign_a: {
    id: "i_sign_a",
    label: "I sign a …",
    build(word, cz) {
      const art = articleFor(word);
      const aWord = art ? `${art} ${word}` : word;
      const en = `I sign ${aWord}.`;
      return {
        en,
        cz: `Podepisuju ${cz}. / Podepisuji ${cz}.`,
        gap_answer: word,
        accepts: [en, `I sign ${aWord}`, `I sign the ${word}`, `I'm signing ${aWord}`],
      };
    },
  },
  i_send_a: {
    id: "i_send_a",
    label: "I send a …",
    build(word, cz) {
      const art = articleFor(word);
      const aWord = art ? `${art} ${word}` : word;
      const en = `I send ${aWord}.`;
      return {
        en,
        cz: `Posílám ${cz}.`,
        gap_answer: word,
        accepts: [
          en,
          `I send ${aWord}`,
          `I send the ${word}`,
          `I'm sending ${aWord}`,
          `I sent ${aWord}`,
        ],
      };
    },
  },
  i_get_a: {
    id: "i_get_a",
    label: "I get a …",
    build(word, cz) {
      const art = articleFor(word);
      const aWord = art ? `${art} ${word}` : word;
      const en = `I get ${aWord}.`;
      return {
        en,
        cz: `Dostávám ${cz}. / Dostanu ${cz}.`,
        gap_answer: word,
        accepts: [
          en,
          `I get ${aWord}`,
          `I get the ${word}`,
          `I've got ${aWord}`,
          `I got ${aWord}`,
        ],
      };
    },
  },
  i_need_to_find: {
    id: "i_need_to_find",
    label: "I need to find a …",
    build(word, cz) {
      const art = articleFor(word);
      const aWord = art ? `${art} ${word}` : word;
      const en = `I need to find ${aWord}.`;
      return {
        en,
        cz: `Musím najít ${cz}. / Potřebuju najít ${cz}.`,
        gap_answer: word,
        accepts: [
          en,
          `I need to find ${aWord}`,
          `I need to find ${word}`,
          `I have to find ${aWord}`,
        ],
      };
    },
  },
  lets_talk_about: {
    id: "lets_talk_about",
    label: "Let's talk about …",
    build(word, cz) {
      const en = `Let's talk about ${word}.`;
      return {
        en,
        cz: `Promluvme si o ${cz}. / Pojďme mluvit o ${cz}.`,
        gap_answer: word,
        accepts: [
          en,
          `Let's talk about ${word}`,
          `Let us talk about ${word}`,
          `We talk about ${word}`,
        ],
      };
    },
  },
  /** Clothes */
  i_wear: {
    id: "i_wear",
    label: "I wear a …",
    build(word, cz) {
      const art = articleFor(word);
      const aWord = art ? `${art} ${word}` : word;
      const en = `I wear ${aWord}.`;
      return {
        en,
        cz: `Nosím ${cz}.`,
        gap_answer: word,
        accepts: [
          en,
          `I wear ${aWord}`,
          `I wear ${word}`,
          `I'm wearing ${aWord}`,
          `I am wearing ${aWord}`,
        ],
      };
    },
  },
  /** Places you go to */
  i_go_to: {
    id: "i_go_to",
    label: "I go to the …",
    build(word, cz) {
      const en = `I go to the ${word}.`;
      return {
        en,
        cz: `Jdu do ${cz}. / Chodím do ${cz}.`,
        gap_answer: word,
        accepts: [
          en,
          `I go to the ${word}`,
          `I go to ${word}`,
          `I'm going to the ${word}`,
          `I am going to the ${word}`,
          `We go to the ${word}`,
        ],
      };
    },
  },
  /** See someone / something */
  i_see_a: {
    id: "i_see_a",
    label: "I see a …",
    build(word, cz) {
      const art = articleFor(word);
      const aWord = art ? `${art} ${word}` : word;
      const en = `I see ${aWord}.`;
      return {
        en,
        cz: `Vidím ${cz}.`,
        gap_answer: word,
        accepts: [en, `I see ${aWord}`, `I see ${word}`, `I can see ${aWord}`],
      };
    },
  },
  /** Buy something */
  i_buy_a: {
    id: "i_buy_a",
    label: "I buy a …",
    build(word, cz) {
      const art = articleFor(word);
      const aWord = art ? `${art} ${word}` : word;
      const en = `I buy ${aWord}.`;
      return {
        en,
        cz: `Kupuju ${cz}. / Kupuji ${cz}.`,
        gap_answer: word,
        accepts: [
          en,
          `I buy ${aWord}`,
          `I buy ${word}`,
          `I'm buying ${aWord}`,
          `I bought ${aWord}`,
        ],
      };
    },
  },
  /** Animals / pets */
  i_have_a_pet: {
    id: "i_have_a_pet",
    label: "I have a … (animal)",
    build(word, cz) {
      const art = articleFor(word);
      const aWord = art ? `${art} ${word}` : word;
      const en = `I have ${aWord}.`;
      return {
        en,
        cz: `Mám ${cz}.`,
        gap_answer: word,
        accepts: [
          en,
          `I have ${aWord}`,
          `I've got ${aWord}`,
          `I have got ${aWord}`,
          `I like ${aWord}`,
          `I like ${roughPlural(word)}`,
        ],
      };
    },
  },

  // ── A1/A2 core-frame recycles (trunk automaticity on leaf lexis) ──

  this_is_my: {
    id: "this_is_my",
    label: "This is my …",
    build(word, cz) {
      const en = `This is my ${word}.`;
      return {
        en,
        cz: `Tohle je moje ${cz}. / Tohle je můj ${cz}.`,
        gap_answer: word,
        accepts: [
          en,
          `This is my ${word}`,
          `That's my ${word}`,
          `That is my ${word}`,
          `It's my ${word}`,
          `It is my ${word}`,
        ],
      };
    },
  },
  ive_got_a: {
    id: "ive_got_a",
    label: "I've got a …",
    build(word, cz) {
      const art = articleFor(word);
      const aWord = art ? `${art} ${word}` : word;
      const en = `I've got ${aWord}.`;
      return {
        en,
        cz: `Mám ${cz}.`,
        gap_answer: word,
        accepts: [
          en,
          `I've got ${aWord}`,
          `I have got ${aWord}`,
          `I have ${aWord}`,
          `I've got ${word}`,
        ],
      };
    },
  },
  i_want_a: {
    id: "i_want_a",
    label: "I want a …",
    build(word, cz) {
      const art = articleFor(word);
      const aWord = art ? `${art} ${word}` : word;
      const en = `I want ${aWord}.`;
      return {
        en,
        cz: `Chci ${cz}.`,
        gap_answer: word,
        accepts: [
          en,
          `I want ${aWord}`,
          `I want ${word}`,
          `I'd like ${aWord}`,
          `I would like ${aWord}`,
        ],
      };
    },
  },
  id_like_a: {
    id: "id_like_a",
    label: "I'd like a …",
    build(word, cz) {
      const art = articleFor(word);
      const aWord = art ? `${art} ${word}` : word;
      const en = `I'd like ${aWord}.`;
      return {
        en,
        cz: `Dal bych si ${cz}. / Dala bych si ${cz}. / Chtěl bych ${cz}.`,
        gap_answer: word,
        accepts: [
          en,
          `I'd like ${aWord}`,
          `I would like ${aWord}`,
          `I want ${aWord}`,
          `I'd like ${word}`,
        ],
      };
    },
  },
  there_is_a: {
    id: "there_is_a",
    label: "There is a …",
    build(word, cz) {
      const art = articleFor(word);
      const aWord = art ? `${art} ${word}` : word;
      const en = `There is ${aWord}.`;
      return {
        en,
        cz: `Je tu ${cz}. / Tam je ${cz}.`,
        gap_answer: word,
        accepts: [
          en,
          `There is ${aWord}`,
          `There's ${aWord}`,
          `There is ${word}`,
          `There's ${word}`,
        ],
      };
    },
  },
  is_there_a: {
    id: "is_there_a",
    label: "Is there a …?",
    build(word, cz) {
      const art = articleFor(word) || "a";
      const en = `Is there ${art} ${word}?`;
      return {
        en,
        cz: `Je tu ${cz}? / Je tam ${cz}?`,
        gap_answer: word,
        accepts: [
          en,
          `Is there ${art} ${word}`,
          `Is there a ${word}`,
          `Is there an ${word}`,
          `Is there ${word}`,
        ],
      };
    },
  },
  do_you_have_a: {
    id: "do_you_have_a",
    label: "Do you have a …?",
    build(word, cz) {
      const art = articleFor(word);
      const aWord = art ? `${art} ${word}` : word;
      const en = `Do you have ${aWord}?`;
      return {
        en,
        cz: `Máš ${cz}? / Máte ${cz}?`,
        gap_answer: word,
        accepts: [
          en,
          `Do you have ${aWord}`,
          `Do you have ${word}`,
          `Have you got ${aWord}`,
          `Have you got ${word}`,
        ],
      };
    },
  },
  do_you_like: {
    id: "do_you_like",
    label: "Do you like …?",
    build(word, cz) {
      const pl = roughPlural(word);
      const en = `Do you like ${pl}?`;
      return {
        en,
        cz: `Máš rád ${cz}? / Máš ráda ${cz}?`,
        gap_answer: word,
        accepts: [
          en,
          `Do you like ${pl}`,
          `Do you like ${word}`,
          `Do you like the ${word}`,
        ],
      };
    },
  },
  i_dont_like: {
    id: "i_dont_like",
    label: "I don't like …",
    build(word, cz) {
      const pl = roughPlural(word);
      const en = `I don't like ${pl}.`;
      return {
        en,
        cz: `Nemám rád ${cz}. / Nemám ráda ${cz}.`,
        gap_answer: word,
        accepts: [
          en,
          `I don't like ${pl}`,
          `I do not like ${pl}`,
          `I don't like ${word}`,
          `I hate ${pl}`,
        ],
      };
    },
  },
  he_likes: {
    id: "he_likes",
    label: "He likes …",
    build(word, cz) {
      const pl = roughPlural(word);
      const en = `He likes ${pl}.`;
      return {
        en,
        cz: `Má rád ${cz}.`,
        gap_answer: word,
        accepts: [
          en,
          `He likes ${pl}`,
          `He likes ${word}`,
          `She likes ${pl}`,
          `She likes ${word}`,
          `He loves ${pl}`,
        ],
      };
    },
  },
  i_can_see_a: {
    id: "i_can_see_a",
    label: "I can see a …",
    build(word, cz) {
      const art = articleFor(word);
      const aWord = art ? `${art} ${word}` : word;
      const en = `I can see ${aWord}.`;
      return {
        en,
        cz: `Vidím ${cz}. / Můžu vidět ${cz}.`,
        gap_answer: word,
        accepts: [
          en,
          `I can see ${aWord}`,
          `I can see ${word}`,
          `I see ${aWord}`,
        ],
      };
    },
  },
  i_can: {
    id: "i_can",
    label: "I can … (verb)",
    build(word, cz) {
      const en = `I can ${word}.`;
      return {
        en,
        cz: `Umím ${cz}. / Dokážu ${cz}. / Můžu ${cz}.`,
        gap_answer: word,
        accepts: [en, `I can ${word}`, `I could ${word}`],
      };
    },
  },
  i_like_to: {
    id: "i_like_to",
    label: "I like to … (verb)",
    build(word, cz) {
      const en = `I like to ${word}.`;
      return {
        en,
        cz: `Rád ${cz}. / Ráda ${cz}. / Rád dělám ${cz}.`,
        gap_answer: word,
        accepts: [
          en,
          `I like to ${word}`,
          `I love to ${word}`,
          `I enjoy ${word}`,
        ],
      };
    },
  },
  i_want_bare: {
    id: "i_want_bare",
    label: "I want … (mass)",
    build(word, cz) {
      const en = `I want ${word}.`;
      return {
        en,
        cz: `Chci ${cz}.`,
        gap_answer: word,
        accepts: [
          en,
          `I want ${word}`,
          `I want some ${word}`,
          `I'd like ${word}`,
          `I'd like some ${word}`,
        ],
      };
    },
  },
  do_you_like_bare: {
    id: "do_you_like_bare",
    label: "Do you like … (bare)",
    build(word, cz) {
      const en = `Do you like ${word}?`;
      return {
        en,
        cz: `Máš rád ${cz}? / Máš ráda ${cz}?`,
        gap_answer: word,
        accepts: [en, `Do you like ${word}`, `Do you enjoy ${word}`],
      };
    },
  },
  i_dont_like_bare: {
    id: "i_dont_like_bare",
    label: "I don't like … (bare)",
    build(word, cz) {
      const en = `I don't like ${word}.`;
      return {
        en,
        cz: `Nemám rád ${cz}. / Nemám ráda ${cz}.`,
        gap_answer: word,
        accepts: [
          en,
          `I don't like ${word}`,
          `I do not like ${word}`,
          `I hate ${word}`,
        ],
      };
    },
  },

  // A2 past simple recycles (CARRIER-TENSES: A2 may host past simple)
  i_bought_a: {
    id: "i_bought_a",
    label: "I bought a … (past)",
    build(word, cz) {
      const art = articleFor(word);
      const aWord = art ? `${art} ${word}` : word;
      const en = `I bought ${aWord}.`;
      return {
        en,
        cz: `Koupil jsem ${cz}. / Koupila jsem ${cz}.`,
        gap_answer: word,
        accepts: [
          en,
          `I bought ${aWord}`,
          `I bought ${word}`,
          `I bought the ${word}`,
        ],
      };
    },
  },
  i_saw_a: {
    id: "i_saw_a",
    label: "I saw a … (past)",
    build(word, cz) {
      const art = articleFor(word);
      const aWord = art ? `${art} ${word}` : word;
      const en = `I saw ${aWord}.`;
      return {
        en,
        cz: `Viděl jsem ${cz}. / Viděla jsem ${cz}.`,
        gap_answer: word,
        accepts: [en, `I saw ${aWord}`, `I saw ${word}`, `I saw the ${word}`],
      };
    },
  },
  i_needed_a: {
    id: "i_needed_a",
    label: "I needed a … (past)",
    build(word, cz) {
      const art = articleFor(word);
      const aWord = art ? `${art} ${word}` : word;
      const en = `I needed ${aWord}.`;
      return {
        en,
        cz: `Potřeboval jsem ${cz}. / Potřebovala jsem ${cz}.`,
        gap_answer: word,
        accepts: [en, `I needed ${aWord}`, `I needed ${word}`],
      };
    },
  },
  i_went_to: {
    id: "i_went_to",
    label: "I went to the … (past)",
    build(word, cz) {
      const en = `I went to the ${word}.`;
      return {
        en,
        cz: `Šel jsem do ${cz}. / Šla jsem do ${cz}.`,
        gap_answer: word,
        accepts: [
          en,
          `I went to the ${word}`,
          `I went to ${word}`,
          `We went to the ${word}`,
        ],
      };
    },
  },
  i_had_a: {
    id: "i_had_a",
    label: "I had a … (past)",
    build(word, cz) {
      const art = articleFor(word);
      const aWord = art ? `${art} ${word}` : word;
      const en = `I had ${aWord}.`;
      return {
        en,
        cz: `Měl jsem ${cz}. / Měla jsem ${cz}.`,
        gap_answer: word,
        accepts: [en, `I had ${aWord}`, `I had ${word}`, `I've had ${aWord}`],
      };
    },
  },
};

export const CARRIER_IDS = Object.keys(CARRIERS);

/**
 * Role banks: A1 core frames recycled onto unit lexis.
 * Only applied after Layer 0/1 has already approved the lemma for Sentence.
 *
 * count = universal noun frames (safe on abstracts too: relationship, community…).
 * count_concrete = buy/see/where — only if lemma is allowlisted or already tagged concrete.
 */
export const ROLE_FRAME_BANKS = {
  count: [
    "this_is_a",
    "this_is_my",
    "i_have_a",
    "ive_got_a",
    "i_need_a",
    "i_want_a",
    "id_like_a",
    "there_is_a",
    "is_there_a",
    "do_you_have_a",
    "i_like_pl",
    "do_you_like",
    "i_dont_like",
    "he_likes",
  ],
  /** Physical object actions — not for society / behaviour / personality */
  count_concrete: [
    "i_can_see_a",
    "i_see_a",
    "i_buy_a",
    "where_is_the",
  ],
  mass: [
    "i_like_bare",
    "i_have_bare",
    "i_need_bare",
    "i_want_bare",
    "do_you_like_bare",
    "i_dont_like_bare",
  ],
  place: [
    "where_is_the",
    "i_go_to",
    "there_is_a",
    "is_there_a",
    "this_is_a",
    "i_need_a",
  ],
  person: ["i_am_a", "he_is_a", "he_is_my", "this_is_a", "this_is_my"],
  verb: ["i_want_to", "we_need_to", "i_can", "i_like_to"],
  adj: ["i_am_adj", "he_is_adj", "it_is"],
  activity: [
    "i_like_bare",
    "i_enjoy",
    "is_fun",
    "do_you_like_bare",
    "i_dont_like_bare",
  ],
  work: [
    "i_work_in",
    "i_work_for",
    "i_look_for",
    "i_have_a",
    "i_need_a",
    "lets_talk_about",
    "this_is_a",
    "ive_got_a",
    "i_want_a",
  ],
  clothes: [
    "i_wear",
    "i_have_a",
    "i_need_a",
    "i_buy_a",
    "this_is_a",
    "id_like_a",
    "ive_got_a",
    "do_you_have_a",
  ],
  animal: [
    "i_have_a_pet",
    "i_see_a",
    "i_like_pl",
    "this_is_a",
    "there_is_a",
    "do_you_have_a",
    "i_can_see_a",
  ],
};

/** Extra past-simple frames for A2+ packs only. */
export const ROLE_A2_PAST = {
  count: ["i_needed_a", "i_had_a"],
  count_concrete: ["i_bought_a", "i_saw_a"],
  place: ["i_went_to", "i_saw_a"],
  clothes: ["i_bought_a", "i_had_a"],
  animal: ["i_saw_a", "i_had_a"],
  work: ["i_had_a", "i_needed_a"],
};

const CONCRETE_TAG_MARKERS = new Set([
  "i_buy_a",
  "i_see_a",
  "i_can_see_a",
  "where_is_the",
  "i_wear",
  "i_have_a_pet",
  "i_go_to",
]);

const COUNT_MARKERS = new Set([
  "this_is_a",
  "i_have_a",
  "i_need_a",
  "i_buy_a",
  "i_see_a",
  "where_is_the",
  "i_have_a_pet",
  "i_wear",
  "i_look_for",
  "i_send_a",
  "i_get_a",
  "i_sign_a",
  "i_have_a_meeting",
  "i_need_to_find",
  "i_like_pl",
  "ive_got_a",
  "i_want_a",
  "id_like_a",
  "there_is_a",
  "is_there_a",
  "do_you_have_a",
  "i_can_see_a",
]);
const MASS_MARKERS = new Set(["i_need_bare", "i_have_bare", "i_want_bare"]);
const PLACE_MARKERS = new Set(["i_go_to", "i_went_to"]);
const PERSON_MARKERS = new Set(["i_am_a", "he_is_a", "he_is_my"]);
const VERB_MARKERS = new Set(["i_want_to", "we_need_to", "i_can", "i_like_to"]);
const ADJ_MARKERS = new Set(["i_am_adj", "he_is_adj", "it_is", "the_bag_is"]);
const ACTIVITY_MARKERS = new Set(["i_enjoy", "is_fun"]);
const WORK_MARKERS = new Set([
  "i_work_in",
  "i_work_for",
  "i_look_for",
  "i_sign_a",
  "i_send_a",
  "i_get_a",
  "i_have_a_meeting",
  "lets_talk_about",
]);
const CLOTHES_MARKERS = new Set(["i_wear"]);
const ANIMAL_MARKERS = new Set(["i_have_a_pet"]);

/**
 * Infer lemma role from already-approved carrier ids (never invent from bare en).
 * @param {string[]} ids
 * @returns {string|null}
 */
export function classifyCarrierRole(ids) {
  if (!ids || !ids.length) return null;
  const has = (set) => ids.some((id) => set.has(id));
  if (has(VERB_MARKERS)) return "verb";
  if (has(ADJ_MARKERS)) return "adj";
  if (has(CLOTHES_MARKERS)) return "clothes";
  if (has(ANIMAL_MARKERS)) return "animal";
  if (has(WORK_MARKERS)) return "work";
  if (has(ACTIVITY_MARKERS)) return "activity";
  // bare like + mass need/have → mass; bare like alone → activity
  if (has(MASS_MARKERS)) return "mass";
  if (ids.includes("i_like_bare") && !has(COUNT_MARKERS)) return "activity";
  if (has(PERSON_MARKERS) && !has(COUNT_MARKERS)) return "person";
  if (has(PERSON_MARKERS) && ids.every((id) => PERSON_MARKERS.has(id) || id === "this_is_a" || id === "this_is_my")) {
    return "person";
  }
  if (has(PLACE_MARKERS) && !ids.some((id) => id === "i_buy_a" || id === "i_have_a" || id === "i_need_a")) {
    return "place";
  }
  // place-ish: only where_is + this_is
  if (
    ids.includes("where_is_the") &&
    ids.every((id) => id === "where_is_the" || id === "this_is_a" || id === "i_need_a" || id === "i_go_to")
  ) {
    return "place";
  }
  if (has(COUNT_MARKERS) || has(PERSON_MARKERS)) return "count";
  if (ids.includes("i_like_bare")) return "activity";
  return null;
}

function levelIsA2Plus(level) {
  const L = String(level || "").toUpperCase();
  return L.startsWith("A2") || L.startsWith("B") || L.startsWith("C");
}

/**
 * True when lemma may take buy/see/where frames.
 * @param {string[]} baseIds
 * @param {string} [word]
 */
function isConcreteEligible(baseIds, word) {
  if ((baseIds || []).some((id) => CONCRETE_TAG_MARKERS.has(id))) return true;
  const w = String(word || "").trim();
  if (!w) return false;
  return (
    CONCRETE_OBJECT_ALLOWLIST.has(w.toLowerCase()) ||
    CONCRETE_OBJECT_ALLOWLIST.has(lemmaKey(w))
  );
}

/**
 * Expand approved carrier ids with the core-frame bank.
 * **Opt-in only** (see buildLeafSentenceItems expand flag). Do not call from
 * the default practice path — multiplies weak bulk tags into duds.
 * @param {string[]} baseIds
 * @param {{ level?: string, word?: string, allowPast?: boolean }} [opts]
 * @returns {string[]}
 */
export function expandCarrierIds(baseIds, opts = {}) {
  const base = (baseIds || []).filter((id) => CARRIERS[id]);
  if (!base.length) return [];
  const role = classifyCarrierRole(base);
  if (!role) return base.slice();

  let bank = (ROLE_FRAME_BANKS[role] || []).slice();
  // Past never auto-attached unless caller explicitly allows (default off)
  if (opts.allowPast && levelIsA2Plus(opts.level)) {
    bank = bank.concat(ROLE_A2_PAST[role] || []);
  }
  // Physical action frames only for allowlisted concrete lemmas (not i_buy_a tag alone)
  const concreteOk =
    isConcreteEligible(base, opts.word) &&
    (CONCRETE_OBJECT_ALLOWLIST.has(String(opts.word || "").toLowerCase()) ||
      CONCRETE_OBJECT_ALLOWLIST.has(lemmaKey(opts.word)));
  if (role === "count" && concreteOk) {
    bank = bank.concat(ROLE_FRAME_BANKS.count_concrete || []);
    if (opts.allowPast && levelIsA2Plus(opts.level)) {
      bank = bank.concat(ROLE_A2_PAST.count_concrete || []);
    }
  }

  const seen = new Set();
  const out = [];
  for (const id of [...base, ...bank]) {
    if (!CARRIERS[id] || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

// ── Emit-time safety (fail closed) ──────────────────────────────────────────

/** Mass / uncountable lemmas — no a/an, no rough plural like-frames. */
export const MASS_LEMMA_SET = new Set(
  [
    "cash",
    "quality",
    "quantity",
    "advertising",
    "fashion",
    "credit",
    "material",
    "jewellery",
    "jewelry",
    "money",
    "water",
    "bread",
    "milk",
    "rice",
    "music",
    "coffee",
    "tea",
    "food",
    "fruit",
    "information",
    "advice",
    "news",
    "luggage",
    "homework",
    "furniture",
    "weather",
    "traffic",
    "work",
    "fun",
    "love",
    "time",
    "help",
    "petrol",
    "tourism",
    "transport",
    "research",
    "education",
    "health",
    "software",
    "hardware",
    "equipment",
    "stuff",
    "progress",
    "success",
    "freedom",
    "happiness",
  ].map((w) => w.toLowerCase()),
);

/**
 * Verbs that must not sit in noun frames (buy/have/this is…).
 * Keep this set conservative — dual noun/verb lemmas (book, work, shop…) stay out.
 */
export const VERB_LEMMA_SET = new Set(
  [
    "advertise",
    "download",
    "upload",
    "print",
    "bake",
    "boil",
    "fry",
    "grill",
    "draw",
    "swim",
    "sing",
    "dance",
    "reserve",
    "cancel",
    "compare",
    "delete",
    "click",
    "invest",
    "earn",
    "owe",
    "borrow",
    "lend",
    "stream",
    "install",
    "subscribe",
    "login",
    "log",
    "browse",
    "scroll",
    "swipe",
    "restart",
    "reboot",
    "update",
    "upgrade",
    "compile",
    "debug",
    "advertise",
  ].map((w) => w.toLowerCase()),
);

/** Abstracts that must not take buy/see/go/where/had physical frames. */
export const ABSTRACT_LEMMA_SET = new Set(
  [
    "quality",
    "quantity",
    "advertising",
    "fashion",
    "credit",
    "behaviour",
    "behavior",
    "character",
    "personality",
    "background",
    "community",
    "society",
    "relationship",
    "culture",
    "freedom",
    "success",
    "progress",
    "happiness",
    "health",
    "education",
    "research",
    "information",
    "advice",
    "news",
    "fun",
    "love",
    "time",
    "work",
    "life",
    "death",
    "truth",
    "lie",
    "idea",
    "opinion",
    "fact",
    "problem",
    "solution",
    "chance",
    "luck",
    "risk",
    "danger",
    "peace",
    "war",
    "power",
    "control",
    "support",
    "help",
    "service",
    "experience",
    "memory",
    "knowledge",
    "skill",
    "ability",
    "talent",
    "energy",
    "strength",
    "weakness",
    "beauty",
    "style",
    "design",
    "art",
    "music",
    "science",
    "history",
    "nature",
    "environment",
    "pollution",
    "climate",
    "weather",
    "traffic",
    "tourism",
    "transport",
    "business",
    "management",
    "marketing",
    "advertising",
    "communication",
    "technology",
    "internet",
    "software",
  ].map((w) => w.toLowerCase()),
);

const NOUN_OBJECT_CARRIERS = new Set([
  "this_is_a",
  "this_is_my",
  "i_have_a",
  "ive_got_a",
  "i_need_a",
  "i_want_a",
  "id_like_a",
  "there_is_a",
  "is_there_a",
  "do_you_have_a",
  "i_like_pl",
  "do_you_like",
  "i_dont_like",
  "he_likes",
  "i_can_see_a",
  "i_see_a",
  "i_buy_a",
  "where_is_the",
  "i_wear",
  "i_go_to",
  "i_have_a_pet",
  "i_look_for",
  "i_sign_a",
  "i_send_a",
  "i_get_a",
  "i_have_a_meeting",
  "i_need_to_find",
  "i_bought_a",
  "i_saw_a",
  "i_needed_a",
  "i_went_to",
  "i_had_a",
  "have_a_good",
  "the_is_long",
  "i_work_in",
  "i_work_for",
  "he_is_my",
  "i_am_a",
  "he_is_a",
]);

const MASS_OK_CARRIERS = new Set([
  "i_like_bare",
  "i_have_bare",
  "i_need_bare",
  "i_want_bare",
  "do_you_like_bare",
  "i_dont_like_bare",
  "is_important",
  "is_fun",
  "lets_talk_about",
  "i_enjoy",
]);

const VERB_OK_CARRIERS = new Set([
  "i_want_to",
  "we_need_to",
  "i_can",
  "i_like_to",
]);

const PHYSICAL_ACTION_CARRIERS = new Set([
  "i_buy_a",
  "i_can_see_a",
  "i_see_a",
  "where_is_the",
  "i_go_to",
  "i_bought_a",
  "i_saw_a",
  "i_went_to",
  "i_wear",
  "i_have_a_pet",
]);

const PAST_CARRIERS = new Set([
  "i_bought_a",
  "i_saw_a",
  "i_needed_a",
  "i_went_to",
  "i_had_a",
]);

/**
 * Can this carrier id be used with this English lemma? Fail closed.
 * @param {string} word
 * @param {string} carrierId
 */
export function isCarrierSafeForLemma(word, carrierId) {
  if (!carrierId || !CARRIERS[carrierId]) return false;
  const full = cleanEnLemma({ en: word }).toLowerCase();
  if (!full) return false;
  // Multi-word phrases (credit card): match full string only — do not
  // treat first token "credit" as mass for the whole phrase.
  const w = /\s/.test(full) ? full : lemmaKey(full);
  const first = lemmaKey(full);

  // Known verbs: only infinitive-style frames
  if (VERB_LEMMA_SET.has(w) || (!/\s/.test(full) && VERB_LEMMA_SET.has(first))) {
    return VERB_OK_CARRIERS.has(carrierId);
  }

  // Mass / uncountable: bare / talk / is important only (no a/an frames)
  if (MASS_LEMMA_SET.has(w) || (!/\s/.test(full) && MASS_LEMMA_SET.has(first))) {
    return MASS_OK_CARRIERS.has(carrierId);
  }

  // Abstracts: no buy/see/go/where physical frames
  if (
    (ABSTRACT_LEMMA_SET.has(w) || (!/\s/.test(full) && ABSTRACT_LEMMA_SET.has(first))) &&
    PHYSICAL_ACTION_CARRIERS.has(carrierId)
  ) {
    return false;
  }

  // rough-plural frames on -ing fields (even if not in MASS set)
  if (
    /ing$/i.test(first) &&
    (carrierId === "i_like_pl" ||
      carrierId === "do_you_like" ||
      carrierId === "i_dont_like" ||
      carrierId === "he_likes")
  ) {
    return false;
  }

  return true;
}

/**
 * Post-build English sanity (articles, broken plurals).
 * @param {{ en?: string, carrier?: string, _lemma?: string }} model
 * @param {string} [lemma]
 */
export function isCarrierModelSafe(model, lemma) {
  if (!model || !model.en) return false;
  const en = String(model.en);
  const full = String(lemma || model._lemma || "")
    .toLowerCase()
    .trim();
  const multi = /\s/.test(full);
  const w = multi ? full : lemmaKey(full);
  const lower = en.toLowerCase();

  // mass + article (single-token mass only — not "credit" inside "credit card")
  if (
    !multi &&
    w &&
    MASS_LEMMA_SET.has(w) &&
    /\b(a|an)\s+/.test(lower) &&
    new RegExp(`\\b(a|an)\\s+${w}\\b`, "i").test(en)
  ) {
    return false;
  }
  // broken -ings plurals
  if (/advertisings|informations|furnitures|equipments|softwares|advices/.test(lower)) {
    return false;
  }
  // verb in noun object slot patterns
  if (!multi && w && VERB_LEMMA_SET.has(w)) {
    if (
      new RegExp(
        `\\b(buy|have|need|want|like|see|got)\\s+(a|an|the)?\\s*${w}\\b`,
        "i",
      ).test(en) ||
      new RegExp(`\\b(this is|there is|is there)\\s+(a|an|the)?\\s*${w}\\b`, "i").test(en)
    ) {
      return false;
    }
  }
  // classic duds
  if (/i like the booking|i need sightseeing|i have journey|i buy an advertise|i buy a quality|i saw a quality|i had a quality|i'd like a cash|i like a cash/i.test(lower)) {
    return false;
  }
  return true;
}

/**
 * Filter carrier ids to those safe for the item's English lemma.
 * @param {LeafItem} item
 * @param {string[]} ids
 */
export function filterSafeCarrierIds(item, ids) {
  const word = cleanEnLemma(item);
  return (ids || []).filter((id) => isCarrierSafeForLemma(word, id));
}

/**
 * Resolve which carrier ids apply to a leaf item (Layer 0/1 — no role expand).
 * Explicit `use` wins. Else allowlisted concrete → default four. Else none.
 * @param {LeafItem} item
 * @returns {string[]}
 */
export function resolveCarrierIds(item) {
  if (!item) return [];
  // Explicit use (including use: [] = no Sentence for this lemma)
  if (Array.isArray(item.use)) {
    return item.use.filter((id) => CARRIERS[id]);
  }
  // Already a full authored frame — not a carrier leaf
  if (item.gap && item.gap_answer && String(item.en || "").includes(" ")) {
    return [];
  }
  const word = cleanEnLemma(item);
  if (!word) return [];
  // Multi-word phrases only via explicit use (too easy to generate duds)
  if (/\s/.test(word)) return [];
  const key = lemmaKey(word);
  if (CONCRETE_OBJECT_ALLOWLIST.has(key) || CONCRETE_OBJECT_ALLOWLIST.has(word.toLowerCase())) {
    return DEFAULT_CONCRETE_CARRIERS.slice();
  }
  return [];
}

/**
 * Resolve + expand with core-frame bank (Layer 2).
 * @param {LeafItem} item
 * @param {{ level?: string, expand?: boolean }} [opts]
 */
export function resolveExpandedCarrierIds(item, opts = {}) {
  const base = resolveCarrierIds(item);
  // expand: false short-circuits; default of this helper still expands when called
  if (opts.expand === false) return filterSafeCarrierIds(item, base);
  return filterSafeCarrierIds(
    item,
    expandCarrierIds(base, {
      level: opts.level,
      word: cleanEnLemma(item),
      allowPast: opts.allowPast === true,
    }),
  );
}

/**
 * Build one sentence model from item + carrier id.
 * @param {LeafItem} item
 * @param {string} carrierId
 */
export function buildCarrierModel(item, carrierId) {
  const def = CARRIERS[carrierId];
  if (!def) return null;
  const word = cleanEnLemma(item);
  const cz = cleanCzLemma(item);
  if (!word || !cz) return null;
  const built = def.build(word, cz);
  const en = built.en.endsWith("?") || built.en.endsWith(".") || built.en.endsWith("!")
    ? built.en
    : `${built.en}.`;
  const gap = en.replace(
    new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"),
    "____",
  );
  return {
    en,
    cz: built.cz,
    gap,
    gap_answer: built.gap_answer || word,
    accepts: [...new Set([...(built.accepts || []), en, built.en])],
    carrier: carrierId,
    _fromLeaf: true,
    _lemma: word,
  };
}

/**
 * Pick up to `perItem` carrier ids per lemma, spreading types across the set
 * so Sentence is not twelve× "This is a …" / "I have a …".
 * @param {string[][]} idLists
 * @param {number} perItem
 * @returns {string[][]} parallel lists of chosen ids
 */
function diversifyMultiCarrierPicks(idLists, perItem) {
  const used = new Map(); // carrierId → count
  const allPicks = [];
  for (const ids of idLists) {
    if (!ids.length) {
      allPicks.push([]);
      continue;
    }
    const chosen = [];
    const pool = ids.slice();
    const n = Math.min(perItem, pool.length);
    for (let k = 0; k < n; k++) {
      let best = pool[0];
      let bestN = used.get(best) || 0;
      for (const id of pool) {
        const c = used.get(id) || 0;
        if (c < bestN) {
          best = id;
          bestN = c;
        }
      }
      const ties = pool.filter((id) => (used.get(id) || 0) === bestN);
      best = ties[Math.floor(Math.random() * ties.length)] || best;
      chosen.push(best);
      used.set(best, (used.get(best) || 0) + 1);
      // remove so next pick on same lemma is a different frame
      const ix = pool.indexOf(best);
      if (ix >= 0) pool.splice(ix, 1);
    }
    allPicks.push(chosen);
  }
  return allPicks;
}

function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = arr[i];
    arr[i] = arr[j];
    arr[j] = t;
  }
  return arr;
}

/**
 * Build leaf Sentence models: default **1 per lemma**, Layer 0/1 only.
 * Expand (Layer 2) is opt-in: blockMeta.expand === true.
 * Emit gate drops unsafe carrier+lemma pairs (skip > teach dud).
 * @param {LeafItem[]} items
 * @param {{ title?: string, id?: string, level?: string, modelsPerLemma?: number, setCap?: number, expand?: boolean, allowPast?: boolean }} [blockMeta]
 * @returns {object[]}
 */
export function buildLeafSentenceItems(items, blockMeta = {}) {
  const level = blockMeta.level || "";
  const perLemma = blockMeta.modelsPerLemma ?? SENTENCE_MODELS_PER_LEMMA;
  const setCap = blockMeta.setCap ?? SENTENCE_SET_CAP;
  // Layer 2 off by default — must opt in explicitly
  const expand = blockMeta.expand === true;

  const plan = [];
  (items || []).forEach((item, index) => {
    const enRaw = String(item?.en || "").trim();
    const words = enRaw.split(/\s+/).filter(Boolean);
    if (item?.gap && item?.gap_answer && words.length >= 3) {
      plan.push({ kind: "authored", item, index });
      return;
    }
    let ids = expand
      ? resolveExpandedCarrierIds(item, {
          level,
          allowPast: blockMeta.allowPast === true,
        })
      : resolveCarrierIds(item);
    ids = filterSafeCarrierIds(item, ids);
    if (!ids.length) {
      plan.push({ kind: "skip", item, index });
      return;
    }
    plan.push({ kind: "carrier", item, index, ids });
  });

  const carrierSlots = plan.filter((p) => p.kind === "carrier");
  const multiPicks = diversifyMultiCarrierPicks(
    carrierSlots.map((p) => p.ids),
    perLemma,
  );
  let pi = 0;

  const out = [];
  for (const p of plan) {
    if (p.kind === "authored") {
      const item = p.item;
      const enRaw = String(item.en || "").trim();
      const en = /[.!?]$/.test(enRaw) ? enRaw : `${enRaw}.`;
      out.push({
        en,
        cz: item.cz,
        accepts: item.accepts || [enRaw, en],
        gap: item.gap || en,
        gap_answer: item.gap_answer,
        carrier: "authored",
        _fromLeaf: true,
      });
      continue;
    }
    if (p.kind === "skip") continue;
    const picks = multiPicks[pi++] || [];
    const word = cleanEnLemma(p.item);
    let emitted = 0;
    for (const carrierId of picks) {
      const model = buildCarrierModel(p.item, carrierId);
      if (model && isCarrierModelSafe(model, word)) {
        out.push(model);
        emitted++;
      }
    }
    // If the diversify pick was unsafe at build time, try other safe ids
    if (!emitted) {
      for (const carrierId of p.ids) {
        if (picks.includes(carrierId)) continue;
        const model = buildCarrierModel(p.item, carrierId);
        if (model && isCarrierModelSafe(model, word)) {
          out.push(model);
          break;
        }
      }
    }
  }

  // Light shuffle only when multi-model; keep stable-ish for 1× lemma
  if (perLemma > 1) shuffleInPlace(out);

  if (out.length > setCap) {
    return out.slice(0, setCap);
  }
  return out;
}

/**
 * @param {LeafItem[]} items
 * @returns {{ eligible: number, total: number, tagged: number, allowlisted: number, skipped: number }}
 */
export function leafSentenceCoverage(items) {
  let eligible = 0;
  let tagged = 0;
  let allowlisted = 0;
  let skipped = 0;
  const total = (items || []).length;
  for (const item of items || []) {
    const explicit = Array.isArray(item.use) && item.use.length > 0;
    const ids = resolveCarrierIds(item);
    if (ids.length) {
      eligible++;
      if (explicit) tagged++;
      else allowlisted++;
    } else {
      skipped++;
    }
  }
  return { eligible, total, tagged, allowlisted, skipped };
}

export function isConcreteAllowlisted(word) {
  const w = String(word || "").trim();
  if (!w) return false;
  return (
    CONCRETE_OBJECT_ALLOWLIST.has(w.toLowerCase()) ||
    CONCRETE_OBJECT_ALLOWLIST.has(lemmaKey(w))
  );
}
