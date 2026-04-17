import { Category } from '../types';

// Fast food / QSR chains → single-visit spend ~$12–18
const FAST_FOOD = [
  "mcdonald", "burger king", "wendy", "taco bell", "chick-fil-a", "popeyes",
  "subway", "chipotle", "panda express", "five guys", "whataburger", "in-n-out",
  "jack in the box", "sonic", "dairy queen", "domino", "pizza hut", "papa john",
  "little caesar", "wingstop", "raising cane", "zaxby", "hardee", "carl's jr",
  "arby", "white castle", "cook out", "culver", "checkers", "rally",
];

// Upscale / fine dining → $80–140/person
const FINE_DINING = [
  "steakhouse", "steak house", "chop house", "chophouse", "capital grille",
  "ruth's chris", "morton", "fleming", "nobu", "mastro", "ocean prime",
  "del frisco", "bonefish", "the palm", "gibsons", "omaha", "fogo de chao",
  "eddie v", "truluck", "seasons 52", "le bernardin", "per se", "eleven madison",
];

// Mid-range casual dining → $30–55
// (everything that's not fast food or fine dining falls here as the default)

export function estimateAmount(category: Category, name: string): number {
  const n = name.toLowerCase();

  switch (category) {
    case 'gas':
      // Average US fill-up (Mar 2026)
      return 65;

    case 'grocery':
      // Typical weekly-ish trip
      return 85;

    case 'pharmacy':
      return 35;

    case 'transit':
      // Rideshare / subway / parking
      return 22;

    case 'streaming':
      // Monthly subscription
      return 16;

    case 'travel':
      // Hotel night or domestic flight
      return 350;

    case 'online':
      return 55;

    case 'dining': {
      if (FAST_FOOD.some(kw => n.includes(kw))) return 14;
      if (FINE_DINING.some(kw => n.includes(kw))) return 110;
      // Café / bakery / coffee shop
      if (n.includes('coffee') || n.includes('starbucks') || n.includes('dunkin') ||
          n.includes('café') || n.includes('cafe') || n.includes('bakery') ||
          n.includes('donut') || n.includes('bagel')) return 10;
      // Casual / mid-range default
      return 45;
    }

    case 'general':
    default:
      return 50;
  }
}
