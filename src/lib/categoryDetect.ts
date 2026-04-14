import { Category } from '../types';

/**
 * Detects a spend category from a business name using pattern matching.
 * Used as a fallback when OSM tags are unavailable or ambiguous.
 */

const PATTERNS: [RegExp, Category][] = [
  // Dining — chains + generic keywords
  [
    /chipotle|mcdonald|burger.king|wendy|taco.bell|subway|domino|pizza.hut|kfc|popeye|chick.fil|arby|sonic|five.guys|shake.shack|in.n.out|white.castle|jack.in.the|whataburger|raising.cane|wingstop|jersey.mike|panda.express|steak.n.shake|culver|cook.out|hardee|carl.jr/i,
    'dining',
  ],
  [
    /starbucks|dunkin|dutch.bros|peet|tim.horton|coffee.bean|caribou.coffee|scooter/i,
    'dining',
  ],
  [
    /olive.garden|red.lobster|outback|chili|applebee|friday|longhorn|buffalo.wild|cracker.barrel|darden|cheesecake|ihop|denny|waffle.house|perkins/i,
    'dining',
  ],
  [
    /panera|jersey.mike|firehouse.sub|potbelly|jason.deli/i,
    'dining',
  ],
  [
    /restaurant|bistro|grill|eatery|diner|brasserie|chophouse|steakhouse|trattoria|cantina|tavern|pub|bar.and|brewpub|sushi|ramen|pho|thai|curry|wok|dim.sum|taqueria|pizzeria|bakery.cafe/i,
    'dining',
  ],
  [/doordash|uber.eat|grubhub|instacart.restaurant|postmate/i, 'dining'],

  // Grocery
  [
    /walmart|kroger|whole.food|h.e.b|heb|trader.joe|aldi|safeway|publix|meijer|hy.vee|sprouts|wegman|giant|stop.and.shop|food.lion|harris.teeter|winn.dixie|albertson|costco|sam.s.club|bj.s.wholesale|market.basket|piggly.wiggly|jewel|vons|ralphs|fry.s.food|smiths.food/i,
    'grocery',
  ],
  [/supermarket|grocery|food.mart|food.store|fresh.market|organic.market/i, 'grocery'],

  // Pharmacy
  [/walgreen|cvs|rite.aid|duane.reade|pharmacy|drug.store|medicine|apothecary/i, 'pharmacy'],

  // Gas
  [
    /shell|chevron|exxon|mobil|bp |b\.p\.|sunoco|citgo|valero|marathon|speedway|wawa|sheetz|kwik.trip|casey|circle.k|pilot.flying|loves.travel|gas.station|fuel.station/i,
    'gas',
  ],

  // Transit
  [
    /\buber\b|lyft|via.rideshare|taxi|yellow.cab|metro.rail|mta|bart|cta|septa|marta|wmata|metra|amtrak|greyhound|megabus|transit.authority|bus.stop/i,
    'transit',
  ],

  // Travel — airlines
  [
    /delta|united.airlines|american.airlines|southwest.airlines|spirit.airlines|jetblue|frontier.airlines|alaska.airlines|air.canada|british.airways|lufthansa|emirates|air.france|klm|singapore.airlines/i,
    'travel',
  ],
  // Travel — hotels
  [
    /marriott|hilton|hyatt|sheraton|westin|holiday.inn|best.western|radisson|ihg|wyndham|fairfield|courtyard|hampton.inn|doubletree|airbnb|vrbo|hotel|motel|inn |resort|lodge|extended.stay/i,
    'travel',
  ],
  [/expedia|kayak|booking\.com|hotels\.com|priceline|trivago|orbitz|travelocity|hotwire/i, 'travel'],

  // Streaming
  [
    /netflix|hulu|disney\+|disney.plus|hbo.max|\bmax\b.*stream|peacock|paramount\+|apple.tv\+|youtube.premium|spotify|apple.music|pandora|tidal|amazon.music|deezer/i,
    'streaming',
  ],

  // Online shopping
  [/amazon|ebay|etsy|wayfair|best.buy|apple.store|microsoft.store|google.play|steam|playstation.store|xbox|nintendo.eshop/i, 'online'],
];

export function detectCategoryFromName(name: string): Category {
  for (const [pattern, category] of PATTERNS) {
    if (pattern.test(name)) return category;
  }
  return 'general';
}
