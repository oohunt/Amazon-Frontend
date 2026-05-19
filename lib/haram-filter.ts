/**
 * Haram product filter
 * Built from Islamic dietary laws, Wikipedia, and IslamQA sources.
 * Applied server-side — nothing haram reaches the client.
 *
 * Categories covered:
 *  1. Alcohol & intoxicating beverages
 *  2. Pork & pork derivatives
 *  3. Tobacco, nicotine & vaping
 *  4. Adult / explicit content
 *  5. Gambling products
 *  6. Drugs & drug paraphernalia
 *  7. Occult, idols & witchcraft
 */

const HARAM_KEYWORDS: Record<string, string[]> = {

  // ── 1. Alcohol & intoxicating beverages ─────────────────────────────────
  alcohol: [
    "alcohol", "alcoholic", "non-alcoholic beer", "alcohol-free wine",
    "wine", "wines", "red wine", "white wine", "rosé wine", "rose wine",
    "sparkling wine", "cooking wine", "wine rack", "wine glass", "wine bottle",
    "wine opener", "wine cellar", "wine aerator", "wine decanter", "wine stopper",
    "beer", "beers", "lager", "ale", "stout", "ipa", "craft beer", "beer mug",
    "beer keg", "beer tap", "beer pong", "beer flight", "beer growler",
    "whiskey", "whisky", "scotch whisky", "bourbon", "rye whiskey",
    "vodka", "rum", "gin", "tequila", "mezcal", "brandy", "cognac",
    "champagne", "prosecco", "cava", "sparkling",
    "liquor", "liqueur", "spirits", "hard liquor", "distilled",
    "vermouth", "absinthe", "schnapps", "sambuca", "amaretto",
    "mead", "cider", "hard cider",
    "sake", "soju", "baijiu", "shochu",
    "sangria", "mimosa", "cocktail", "mocktail",
    "bartender", "bartending", "mixology", "mixologist",
    "sommelier", "winery", "brewery", "distillery",
    "decanter", "hip flask", "shot glass", "pint glass", "beer stein",
  ],

  // ── 2. Pork & pork derivatives ───────────────────────────────────────────
  pork: [
    "pork", "pork rind", "pork belly", "pork chop", "pork loin",
    "bacon", "turkey bacon",
    "ham", "prosciutto", "pancetta", "speck",
    "salami", "pepperoni", "chorizo", "mortadella", "capicola",
    "sausage", "bratwurst", "hot dog", "frankfurter", "wiener",
    "lard", "suet", "pig", "swine", "boar",
    "gelatin capsule", "pork gelatin",
    "carnitas", "pulled pork", "ribs pork",
  ],

  // ── 3. Tobacco, nicotine & vaping ───────────────────────────────────────
  tobacco: [
    "tobacco", "cigarette", "cigarettes", "cigar", "cigars",
    "pipe tobacco", "chewing tobacco", "dipping tobacco", "snuff", "snus",
    "hookah", "shisha", "narghile", "waterpipe",
    "vape", "vaping", "e-cigarette", "e-cig", "vape pen", "vape juice",
    "e-liquid", "e-juice", "pod mod", "juul", "iqos",
    "nicotine", "nicotine patch", "nicotine gum", "nicotine pouch",
    "rolling paper", "blunt wrap", "cigarillo",
    "ashtray", "cigarette case", "cigarette holder", "tobacco pipe",
    "lighter fluid", "cigar cutter", "humidor",
  ],

  // ── 4. Adult / explicit content ──────────────────────────────────────────
  adult: [
    "adult toy", "sex toy", "vibrator", "dildo", "masturbator",
    "fleshlight", "butt plug", "anal plug", "cock ring",
    "bondage", "bdsm", "fetish", "restraint kit",
    "pornographic", "erotic", "adult dvd", "adult film",
    "stripper pole", "pole dancing kit",
    "playboy", "hustler", "penthouse magazine",
    "sexy costume", "exotic dancer",
  ],

  // ── 5. Gambling products ─────────────────────────────────────────────────
  gambling: [
    "gambling", "casino", "slot machine", "slot game",
    "roulette wheel", "roulette table",
    "poker chips", "poker table", "poker set",
    "blackjack table", "craps table", "baccarat",
    "lottery ticket", "scratch card", "betting slip",
  ],

  // ── 6. Drugs & drug paraphernalia ───────────────────────────────────────
  drugs: [
    "marijuana", "cannabis", "weed", "thc", "delta-8", "delta-9",
    "thc gummies", "thc oil", "thc vape",
    "drug paraphernalia", "bong", "dab rig", "dab pen",
    "weed grinder", "rolling tray", "marijuana pipe",
    "magic mushroom", "psilocybin", "lsd",
    "cocaine", "heroin", "methamphetamine", "crack pipe",
    "poppers", "amyl nitrite",
  ],

  // ── 7. Music instruments & accessories ──────────────────────────────────
  music: [
    // String instruments
    "guitar", "electric guitar", "acoustic guitar", "bass guitar", "ukulele",
    "violin", "viola", "cello", "double bass", "fiddle",
    "banjo", "mandolin", "sitar", "oud", "lute", "harp", "zither",
    // Wind instruments
    "flute", "piccolo", "clarinet", "oboe", "bassoon", "saxophone",
    "trumpet", "trombone", "tuba", "french horn", "bugle", "cornet",
    "harmonica", "accordion", "bagpipe", "recorder instrument",
    // Keyboard instruments
    "piano", "grand piano", "upright piano", "keyboard instrument",
    "synthesizer", "organ instrument", "electric organ", "digital piano",
    "harpsichord",
    // Percussion / drums
    "drum kit", "drum set", "snare drum", "bass drum", "drum pad",
    "cymbal", "hi-hat", "tom tom", "djembe", "bongo drum", "conga drum",
    "marimba", "xylophone", "glockenspiel", "vibraphone",
    // DJ & production gear
    "dj controller", "dj mixer", "turntable", "cdj", "serato",
    "music production", "beat machine", "drum machine", "sequencer",
    "midi controller", "midi keyboard", "audio interface",
    // Accessories & gear
    "guitar pick", "guitar strap", "guitar capo", "guitar tuner",
    "guitar amp", "guitar amplifier", "bass amp",
    "music stand", "sheet music", "music book", "songbook",
    "instrument cable", "instrument case",
    "microphone stand", "vocal mic", "condenser microphone",
    "music studio", "recording studio",
    // General
    "musical instrument", "instrument strings", "instrument accessories",
  ],

  // ── 8. Occult, idols & witchcraft ────────────────────────────────────────
  occult: [
    "tarot card", "tarot deck", "tarot reading",
    "ouija board", "spirit board", "talking board",
    "witchcraft", "wicca", "wiccan", "spell kit", "spell book",
    "voodoo doll", "voodoo kit",
    "séance", "crystal ball reading", "divination",
    "black magic", "occult ritual", "pentagram ritual",
    "satanic", "satanism", "devil worship",
    "idol worship", "pagan idol",
  ],

  // ── 9. Other religions' worship items & symbols ──────────────────────────
  religious: [
    // Christian
    "crucifix", "cross necklace", "christian cross", "rosary beads",
    "holy bible", "bible verse", "jesus figurine", "virgin mary statue",
    "nativity scene", "church bell", "baptism gift", "confirmation gift",
    "christmas ornament", "christmas tree", "christmas decoration",
    "easter cross", "easter figurine",
    // Hindu
    "hindu idol", "hindu statue", "ganesh statue", "shiva statue",
    "krishna statue", "lakshmi idol", "durga idol", "hanuman statue",
    "puja set", "pooja thali", "diya lamp hindu", "incense idol",
    "brahma", "vishnu idol",
    // Buddhist
    "buddha statue", "buddha figurine", "laughing buddha",
    "buddhist prayer", "prayer wheel buddhist", "singing bowl",
    "zen idol",
    // Jewish
    "menorah", "dreidel", "star of david", "torah",
    "hanukkah", "passover seder",
    // Sikh
    "khanda symbol",
    // General / pagan
    "idol", "pagan", "shrine", "altar kit", "deity statue",
    "god figurine", "goddess figurine", "religious icon",
  ],


  // ── 11. Statues & figurines of living beings ─────────────────────────────
  statues: [
    "human statue", "human figurine", "human sculpture",
    "animal statue", "animal figurine", "animal sculpture",
    "action figure", "collectible figure", "vinyl figure",
    "bobblehead", "bust statue", "mannequin",
    "taxidermy", "mounted animal", "stuffed animal mount",
    "resin figurine", "ceramic figurine", "porcelain figurine",
    "wax figure", "bronze statue", "marble statue",
  ],

  // ── 12. Gold & silk for men ───────────────────────────────────────────────
  goldSilkMen: [
    // Gold jewelry for men
    "men's gold ring", "mens gold ring", "men gold ring",
    "men's gold chain", "mens gold chain", "men gold chain",
    "men's gold necklace", "mens gold necklace", "men gold necklace",
    "men's gold bracelet", "mens gold bracelet", "men gold bracelet",
    "men's gold bangle", "mens gold bangle", "men gold bangle",
    "men's gold earring", "mens gold earring", "men gold earring",
    "men's gold pendant", "mens gold pendant", "men gold pendant",
    "men's gold watch", "mens gold watch", "men gold watch",
    "men's gold anklet", "mens gold anklet",
    "gold chain for men", "gold necklace for men", "gold ring for men",
    "gold bracelet for men", "gold pendant for men",
    "male gold chain", "male gold necklace", "male gold ring",
    "hip hop chain", "hip hop gold chain", "hip hop jewelry",
    "rapper chain", "rapper necklace", "iced out chain",
    "iced out necklace", "iced out ring", "iced out bracelet",
    "cuban link chain", "cuban chain men", "cuban link men",
    "franco chain men", "rope chain men", "figaro chain men",
    "men's iced", "mens iced", "men iced out",
    // Gold for boys
    "boys gold ring", "boys gold bracelet", "boys gold chain",
    "boys gold necklace",
    // Silk for men
    "men's silk tie", "mens silk tie", "men silk tie",
    "men's silk scarf", "mens silk scarf", "men silk scarf",
    "men silk handkerchief", "men's silk suit", "mens silk suit",
    "men's silk shirt", "mens silk shirt", "men silk shirt",
    "men's silk pants", "mens silk pants", "men silk pants",
    "men's silk shorts", "mens silk shorts", "men silk shorts",
    "men's silk robe", "mens silk robe", "men silk robe",
    "men's silk pajamas", "mens silk pajamas", "men silk pajamas",
    "men's silk kimono", "mens silk kimono",
  ],

  // ── 13. Astrology, fortune-telling & horoscopes ──────────────────────────
  astrology: [
    "astrology", "astrological", "horoscope", "zodiac reading",
    "birth chart", "natal chart", "star sign", "sun sign reading",
    "psychic reading", "fortune telling", "fortune teller",
    "crystal ball", "crystal healing", "chakra healing",
    "numerology", "palmistry", "palm reading", "tea leaf reading",
    "pendulum divination", "rune stones", "rune reading",
    "angel card", "oracle card", "psychic kit",
  ],

  // ── 14. Gambling cards & casino dice (board games excluded) ──────────────
  playingCards: [
    "poker cards", "poker deck", "poker chip set",
    "casino playing cards", "casino card",
    "gambling card", "blackjack card", "blackjack deck",
    "casino dice", "craps dice", "gambling dice",
    "card counting", "card dealing shoe", "casino card shoe",
    "baccarat card", "casino game card",
  ],

  // ── 15. Non-halal food ingredients ───────────────────────────────────────
  nonHalalFood: [
    "pork gelatin", "gelatin capsules", "beef gelatin",
    "blood sausage", "black pudding", "blood pudding",
    "non-halal", "non halal",
    "lard shortening", "pork fat", "pork stock",
    "pepperoni pizza", "bacon bits", "ham flavour",
    "bone broth pork", "pork bone",
  ],

  // ── 16. Alcohol-based food & cooking ingredients ─────────────────────────
  alcoholFood: [
    "rum extract", "rum flavoring", "rum flavouring",
    "vanilla extract alcohol", "pure vanilla extract",
    "cooking wine", "wine vinegar", "sherry cooking",
    "mirin cooking", "sake cooking",
    "beer batter", "whiskey sauce", "wine sauce",
    "bourbon vanilla", "brandy extract",
    "alcohol extract", "alcoholic flavoring",
  ],

  // ── 17. Alcohol-based personal care ──────────────────────────────────────
  alcoholPersonalCare: [
    "alcohol mouthwash", "antiseptic mouthwash",
    "alcohol perfume", "ethanol perfume", "alcohol cologne",
    "alcohol aftershave", "alcohol toner",
    "alcohol-based sanitizer", "ethanol sanitizer",
    "alcohol astringent", "alcohol facial toner",
  ],

  // ── 18. Violent video games ───────────────────────────────────────────────
  violentGames: [
    "grand theft auto", "gta", "mortal kombat", "call of duty",
    "doom game", "wolfenstein", "resident evil", "dead space",
    "god of war", "hitman game", "assassin's creed",
    "manhunt game", "postal game", "hatred game",
    "zombie shooter", "gore game", "ultraviolent",
    "brutal doom", "bloody game", "adult game",
    "rated m game", "mature rated game",
  ],

  // ── 20. Halloween products ────────────────────────────────────────────────
  halloween: [
    "halloween", "halloween costume", "halloween decoration",
    "halloween mask", "halloween prop", "halloween candy",
    "halloween party", "halloween makeup", "halloween skull",
    "jack o lantern", "pumpkin carving kit",
    "skeleton decoration", "skull decoration",
    "ghost costume", "vampire costume", "witch costume",
    "zombie makeup", "horror costume", "haunted house",
    "creepy decoration", "spooky decoration",
  ],

  // ── 22. Horror — themed products, decor & merchandise ────────────────────
  horror: [
    // Horror genre merchandise
    "horror movie", "horror film", "horror series", "horror poster",
    "horror figure", "horror collectible", "horror doll",
    "horror art", "horror print", "horror decor",
    // Specific horror franchises / characters
    "freddy krueger", "jason voorhees", "michael myers",
    "pennywise", "it clown", "chucky doll", "annabelle doll",
    "leatherface", "ghostface", "pinhead", "hellraiser",
    "exorcist", "the ring", "the grudge", "paranormal activity",
    "evil dead", "nightmare on elm street", "texas chainsaw",
    "friday the 13th", "halloween movie",
    // Horror themes
    "slasher", "gore", "gory", "gruesome", "dismembered",
    "severed head", "severed hand", "fake blood decoration",
    "bloody decoration", "murder scene", "crime scene decoration",
    // Demonic & evil imagery
    "demon decoration", "devil statue", "satan figure",
    "demonic doll", "evil clown", "scary clown",
    "possessed doll", "creepy doll", "horror clown",
    // Skulls & death imagery (decorative)
    "skull candle", "skull decor", "skull figurine",
    "skull decoration", "skeleton figurine", "skeleton decoration",
    "grim reaper", "grim reaper statue", "grim reaper figure",
    "death figure", "coffin decoration", "tombstone decoration",
    "graveyard decoration",
    // Horror games
    "horror game", "survival horror", "scary game",
    "five nights at freddy's", "fnaf", "outlast game",
    "amnesia game", "silent hill", "biohazard game",
  ],

  // ── 23. Haram animal-shaped / themed novelty products ────────────────────
  haramAnimals: [
    // Pig / swine themed — any non-food product shaped like or depicting pigs
    "pig piggy bank", "pig money bank", "pig coin bank",
    "pig plush", "pig stuffed", "pig toy", "pig doll",
    "pig figurine", "pig statue", "pig decoration",
    "pig ornament", "pig keychain", "pig mug", "pig cup",
    "pig plate", "pig bowl", "pig cushion", "pig pillow",
    "pig lamp", "pig night light", "pig wall art",
    "pig bag", "pig backpack", "pig purse", "pig wallet",
    "pig phone case", "pig sticker", "pig patch",
    "pig onesie", "pig costume", "pig slippers",
    "piglet toy", "piglet plush", "oink", "snout toy",
    "boar figurine", "boar statue", "wild boar decoration",
    // Dog themed (as per scholarly opinion on dogs being najis)
    "dog figurine", "dog statue", "dog idol", "dog sculpture",
    "dog ornament", "dog decoration", "dog plush toy",
    "dog stuffed animal", "dog doll", "dog puppet",
    "dog keychain", "dog mug", "dog pillow", "dog cushion",
    "dog phone case", "dog mask", "dog onesie",
    // Snake / reptile themed (creatures generally considered haram to keep)
    "snake figurine", "snake statue", "snake decoration",
    "snake toy", "snake plush", "snake pillow",
    // General — products explicitly shaped like haram animals
    "pig shaped", "pig-shaped", "dog shaped", "dog-shaped",
    "snake shaped", "snake-shaped",
  ],

  // ── 21. Valentine's Day products ─────────────────────────────────────────
  valentines: [
    "valentine's day", "valentines day", "valentine gift",
    "be my valentine", "happy valentine",
    "valentine card", "valentine decoration",
    "valentine candy", "valentine chocolate box",
    "valentine teddy", "valentine heart",
    "cupid decoration", "love day gift",
  ],

};

// Non-product listings to exclude regardless of category
const EXCLUDED_TITLES = [
  "shipping protection",
  "shipping insurance",
  "package protection",
  "order protection",
];

// Flatten and normalise once at module load
const FLAT_KEYWORDS = Object.values(HARAM_KEYWORDS).flat().map((k) => k.toLowerCase());

// Pre-compile matchers once at module load.
// Single-word keywords use word-boundary regexes to prevent false positives:
//   "gin"  must not match "engine", "original", "ginger"
//   "ale"  must not match "male", "female", "scale", "pale"
//   "mead" must not match "meadow"
//   "rum"  must not match "forum"
//   "wine" must not match "twine"
// Multi-word phrases stay as plain substring matches (already precise).
const COMPILED_MATCHERS: Array<(h: string) => boolean> = FLAT_KEYWORDS.map((kw) => {
  if (kw.includes(" ")) {
    return (h: string) => h.includes(kw);
  }
  const re = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`);
  return (h: string) => re.test(h);
});

export function isHaram(productName: string, category = "", subcategory = ""): boolean {
  const name    = productName.toLowerCase();
  const haystack = `${name} ${category.toLowerCase()} ${subcategory.toLowerCase()}`;

  if (EXCLUDED_TITLES.some((t) => name.includes(t))) return true;
  return COMPILED_MATCHERS.some((test) => test(haystack));
}

// Export grouped list for reference / admin UI later
export { HARAM_KEYWORDS };
