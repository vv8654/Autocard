import { Merchant } from '../types';

/**
 * Extended merchant database used for search.
 * 60+ merchants across all spend categories.
 */
export const ALL_MERCHANTS: Merchant[] = [
  // ── Dining ──────────────────────────────────────────────────────────────
  { id: 'chipotle',      name: 'Chipotle',            displayName: 'Chipotle',         category: 'dining',    emoji: '🌮', scenarioLabel: 'Fast Casual' },
  { id: 'mcdonalds',     name: "McDonald's",           displayName: "McDonald's",       category: 'dining',    emoji: '🍟', scenarioLabel: 'Fast Food' },
  { id: 'starbucks',     name: 'Starbucks',            displayName: 'Starbucks',        category: 'dining',    emoji: '☕', scenarioLabel: 'Coffee' },
  { id: 'chick-fil-a',   name: 'Chick-fil-A',          displayName: 'Chick-fil-A',      category: 'dining',    emoji: '🍗', scenarioLabel: 'Fast Food' },
  { id: 'subway',        name: 'Subway',               displayName: 'Subway',           category: 'dining',    emoji: '🥖', scenarioLabel: 'Fast Food' },
  { id: 'dominos',       name: "Domino's",             displayName: "Domino's",         category: 'dining',    emoji: '🍕', scenarioLabel: 'Pizza' },
  { id: 'pizza-hut',     name: 'Pizza Hut',            displayName: 'Pizza Hut',        category: 'dining',    emoji: '🍕', scenarioLabel: 'Pizza' },
  { id: 'olive-garden',  name: 'Olive Garden',         displayName: 'Olive Garden',     category: 'dining',    emoji: '🍝', scenarioLabel: 'Italian' },
  { id: 'applebees',     name: "Applebee's",           displayName: "Applebee's",       category: 'dining',    emoji: '🍔', scenarioLabel: 'Bar & Grill' },
  { id: 'panera',        name: 'Panera Bread',         displayName: 'Panera',           category: 'dining',    emoji: '🥗', scenarioLabel: 'Bakery Cafe' },
  { id: 'dunkin',        name: "Dunkin'",              displayName: "Dunkin'",          category: 'dining',    emoji: '🍩', scenarioLabel: 'Coffee & Donuts' },
  { id: 'five-guys',     name: 'Five Guys',            displayName: 'Five Guys',        category: 'dining',    emoji: '🍔', scenarioLabel: 'Burgers' },
  { id: 'wendys',        name: "Wendy's",              displayName: "Wendy's",          category: 'dining',    emoji: '🍔', scenarioLabel: 'Fast Food' },
  { id: 'taco-bell',     name: 'Taco Bell',            displayName: 'Taco Bell',        category: 'dining',    emoji: '🌮', scenarioLabel: 'Fast Food' },
  { id: 'chilis',        name: "Chili's",              displayName: "Chili's",          category: 'dining',    emoji: '🌶️', scenarioLabel: 'Bar & Grill' },
  { id: 'shake-shack',   name: 'Shake Shack',          displayName: 'Shake Shack',      category: 'dining',    emoji: '🍔', scenarioLabel: 'Burgers' },
  { id: 'whataburger',   name: 'Whataburger',          displayName: 'Whataburger',      category: 'dining',    emoji: '🍔', scenarioLabel: 'Fast Food' },
  { id: 'raising-canes', name: "Raising Cane's",       displayName: "Raising Cane's",   category: 'dining',    emoji: '🍗', scenarioLabel: 'Fast Food' },
  { id: 'wingstop',      name: 'Wingstop',             displayName: 'Wingstop',         category: 'dining',    emoji: '🍗', scenarioLabel: 'Wings' },
  { id: 'jersey-mikes',  name: "Jersey Mike's",        displayName: "Jersey Mike's",    category: 'dining',    emoji: '🥖', scenarioLabel: 'Subs' },
  { id: 'panda-express', name: 'Panda Express',        displayName: 'Panda Express',    category: 'dining',    emoji: '🥡', scenarioLabel: 'Fast Food' },
  { id: 'popeyes',       name: 'Popeyes',              displayName: 'Popeyes',          category: 'dining',    emoji: '🍗', scenarioLabel: 'Fast Food' },
  { id: 'dutch-bros',    name: 'Dutch Bros',           displayName: 'Dutch Bros',       category: 'dining',    emoji: '☕', scenarioLabel: 'Coffee' },
  { id: 'buffalo-wild',  name: 'Buffalo Wild Wings',   displayName: 'Buffalo Wild Wings',category: 'dining',   emoji: '🍗', scenarioLabel: 'Sports Bar' },
  { id: 'outback',       name: 'Outback Steakhouse',   displayName: 'Outback',          category: 'dining',    emoji: '🥩', scenarioLabel: 'Steakhouse' },

  // ── Grocery ──────────────────────────────────────────────────────────────
  { id: 'heb',           name: 'H-E-B',               displayName: 'H-E-B',            category: 'grocery',   emoji: '🛒', scenarioLabel: 'Grocery' },
  { id: 'walmart',       name: 'Walmart',              displayName: 'Walmart',          category: 'grocery',   emoji: '🛒', scenarioLabel: 'Supercenter' },
  { id: 'kroger',        name: 'Kroger',               displayName: 'Kroger',           category: 'grocery',   emoji: '🛒', scenarioLabel: 'Grocery' },
  { id: 'whole-foods',   name: 'Whole Foods Market',   displayName: 'Whole Foods',      category: 'grocery',   emoji: '🌿', scenarioLabel: 'Grocery' },
  { id: 'target',        name: 'Target',               displayName: 'Target',           category: 'grocery',   emoji: '🎯', scenarioLabel: 'Grocery & Retail' },
  { id: 'costco',        name: 'Costco',               displayName: 'Costco',           category: 'grocery',   emoji: '📦', scenarioLabel: 'Warehouse' },
  { id: 'trader-joes',   name: "Trader Joe's",         displayName: "Trader Joe's",     category: 'grocery',   emoji: '🌿', scenarioLabel: 'Grocery' },
  { id: 'aldi',          name: 'ALDI',                 displayName: 'ALDI',             category: 'grocery',   emoji: '🛒', scenarioLabel: 'Grocery' },
  { id: 'safeway',       name: 'Safeway',              displayName: 'Safeway',          category: 'grocery',   emoji: '🛒', scenarioLabel: 'Grocery' },
  { id: 'publix',        name: 'Publix',               displayName: 'Publix',           category: 'grocery',   emoji: '🛒', scenarioLabel: 'Grocery' },
  { id: 'sprouts',       name: 'Sprouts Farmers Market',displayName: 'Sprouts',         category: 'grocery',   emoji: '🌿', scenarioLabel: 'Grocery' },
  { id: 'hyvee',         name: 'Hy-Vee',               displayName: 'Hy-Vee',          category: 'grocery',   emoji: '🛒', scenarioLabel: 'Grocery' },
  { id: 'meijer',        name: 'Meijer',               displayName: 'Meijer',          category: 'grocery',   emoji: '🛒', scenarioLabel: 'Grocery' },

  // ── Pharmacy ──────────────────────────────────────────────────────────────
  { id: 'walgreens',     name: 'Walgreens',            displayName: 'Walgreens',        category: 'pharmacy',  emoji: '💊', scenarioLabel: 'Pharmacy' },
  { id: 'cvs',           name: 'CVS Pharmacy',         displayName: 'CVS',              category: 'pharmacy',  emoji: '💊', scenarioLabel: 'Pharmacy' },
  { id: 'rite-aid',      name: 'Rite Aid',             displayName: 'Rite Aid',         category: 'pharmacy',  emoji: '💊', scenarioLabel: 'Pharmacy' },

  // ── Gas ──────────────────────────────────────────────────────────────────
  { id: 'shell',         name: 'Shell',                displayName: 'Shell',            category: 'gas',       emoji: '⛽', scenarioLabel: 'Gas Station' },
  { id: 'chevron',       name: 'Chevron',              displayName: 'Chevron',          category: 'gas',       emoji: '⛽', scenarioLabel: 'Gas Station' },
  { id: 'exxon',         name: 'ExxonMobil',           displayName: 'Exxon',            category: 'gas',       emoji: '⛽', scenarioLabel: 'Gas Station' },
  { id: 'bp',            name: 'BP',                   displayName: 'BP',               category: 'gas',       emoji: '⛽', scenarioLabel: 'Gas Station' },
  { id: 'valero',        name: 'Valero',               displayName: 'Valero',           category: 'gas',       emoji: '⛽', scenarioLabel: 'Gas Station' },
  { id: 'wawa',          name: 'Wawa',                 displayName: 'Wawa',             category: 'gas',       emoji: '⛽', scenarioLabel: 'Gas & Convenience' },
  { id: 'speedway',      name: 'Speedway',             displayName: 'Speedway',         category: 'gas',       emoji: '⛽', scenarioLabel: 'Gas & Convenience' },

  // ── Transit ──────────────────────────────────────────────────────────────
  { id: 'uber',          name: 'Uber',                 displayName: 'Uber',             category: 'transit',   emoji: '🚗', scenarioLabel: 'Rideshare' },
  { id: 'lyft',          name: 'Lyft',                 displayName: 'Lyft',             category: 'transit',   emoji: '🚕', scenarioLabel: 'Rideshare' },
  { id: 'uber-eats',     name: 'Uber Eats',            displayName: 'Uber Eats',        category: 'dining',    emoji: '🛵', scenarioLabel: 'Food Delivery' },
  { id: 'doordash',      name: 'DoorDash',             displayName: 'DoorDash',         category: 'dining',    emoji: '🛵', scenarioLabel: 'Food Delivery' },

  // ── Travel ──────────────────────────────────────────────────────────────
  { id: 'delta',         name: 'Delta Airlines',       displayName: 'Delta',            category: 'travel',    emoji: '✈️', scenarioLabel: 'Airlines' },
  { id: 'united',        name: 'United Airlines',      displayName: 'United',           category: 'travel',    emoji: '✈️', scenarioLabel: 'Airlines' },
  { id: 'american-air',  name: 'American Airlines',    displayName: 'American Airlines',category: 'travel',    emoji: '✈️', scenarioLabel: 'Airlines' },
  { id: 'southwest',     name: 'Southwest Airlines',   displayName: 'Southwest',        category: 'travel',    emoji: '✈️', scenarioLabel: 'Airlines' },
  { id: 'jetblue',       name: 'JetBlue',              displayName: 'JetBlue',          category: 'travel',    emoji: '✈️', scenarioLabel: 'Airlines' },
  { id: 'marriott',      name: 'Marriott',             displayName: 'Marriott',         category: 'travel',    emoji: '🏨', scenarioLabel: 'Hotel' },
  { id: 'hilton',        name: 'Hilton',               displayName: 'Hilton',           category: 'travel',    emoji: '🏨', scenarioLabel: 'Hotel' },
  { id: 'hyatt',         name: 'Hyatt',                displayName: 'Hyatt',            category: 'travel',    emoji: '🏨', scenarioLabel: 'Hotel' },
  { id: 'airbnb',        name: 'Airbnb',               displayName: 'Airbnb',           category: 'travel',    emoji: '🏠', scenarioLabel: 'Travel' },
  { id: 'expedia',       name: 'Expedia',              displayName: 'Expedia',          category: 'travel',    emoji: '✈️', scenarioLabel: 'Travel Booking' },

  // ── Streaming ────────────────────────────────────────────────────────────
  { id: 'netflix',       name: 'Netflix',              displayName: 'Netflix',          category: 'streaming', emoji: '🎬', scenarioLabel: 'Streaming' },
  { id: 'spotify',       name: 'Spotify',              displayName: 'Spotify',          category: 'streaming', emoji: '🎵', scenarioLabel: 'Music' },
  { id: 'hulu',          name: 'Hulu',                 displayName: 'Hulu',             category: 'streaming', emoji: '📺', scenarioLabel: 'Streaming' },
  { id: 'disney-plus',   name: 'Disney+',              displayName: 'Disney+',          category: 'streaming', emoji: '🎬', scenarioLabel: 'Streaming' },
  { id: 'hbo-max',       name: 'Max (HBO)',             displayName: 'Max',              category: 'streaming', emoji: '📺', scenarioLabel: 'Streaming' },
  { id: 'apple-tv',      name: 'Apple TV+',            displayName: 'Apple TV+',        category: 'streaming', emoji: '📺', scenarioLabel: 'Streaming' },
  { id: 'youtube-prem',  name: 'YouTube Premium',      displayName: 'YouTube Premium',  category: 'streaming', emoji: '▶️', scenarioLabel: 'Streaming' },

  // ── Online Shopping ──────────────────────────────────────────────────────
  { id: 'amazon',        name: 'Amazon',               displayName: 'Amazon',           category: 'online',    emoji: '📦', scenarioLabel: 'Online Shopping' },
  { id: 'best-buy',      name: 'Best Buy',             displayName: 'Best Buy',         category: 'online',    emoji: '📱', scenarioLabel: 'Electronics' },
  { id: 'apple-store',   name: 'Apple Store',          displayName: 'Apple Store',      category: 'online',    emoji: '🍎', scenarioLabel: 'Electronics' },
];
