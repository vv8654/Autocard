# AutoCard — Canvas Written Reflection

---

## Problem, User, and MVP Goal

**Problem:** People with multiple credit cards consistently use the wrong one at checkout. The decision requires remembering which card earns the most for which category (dining, grocery, transit, etc.), mental math on point values, and awareness of rotating categories and caps — all under time pressure. Most people default to a single card and leave rewards on the table.

**User:** A college student or young professional with 2–5 credit cards who wants to maximize rewards without becoming a points hobbyist. They're tech-comfortable, reward-aware, but overwhelmed by complexity at the moment of purchase.

**MVP Goal:** Validate that a proactive, context-aware card recommendation — shown at the moment of purchase — reduces decision friction and helps the user choose the best card without manual calculation.

---

## MVP Goals

1. Show a recommended card within one tap of a purchase context
2. Explain the recommendation in plain English with specific numbers
3. Let users see ranked alternatives to build trust in the recommendation
4. Let users manage which cards are active in their wallet
5. Let users control recommendation frequency to reduce notification fatigue
6. Persist preferences across sessions without requiring sign-in

---

## Technical Approach

**Stack:** Next.js 14 (App Router) + TypeScript + Tailwind CSS

**Architecture:** All state is managed in React Context, persisted to `localStorage`. No backend, no database, no authentication. All card data, merchant mappings, and reward logic live in local TypeScript files.

**Recommendation Engine (`src/lib/recommendation.ts`):**
- Input: `PurchaseContext` (merchant → category) + list of enabled cards
- For each card, finds the matching reward rate for the purchase category (falls back to base multiplier)
- Computes "effective cents per dollar" (CPD): `multiplier × pointValue`
- Ranks cards by CPD descending
- Generates a plain-English explanation including margin vs. second-best card
- Flags "high value" when best CPD ≥ 5¢

**Key simplifications for MVP:**
- Point values are fixed estimates (Amex MR ~2¢, Chase UR ~2¢, Capital One Miles ~1.85¢)
- Spend caps noted but not enforced
- Citi Custom Cash assumes the purchase category is the user's top monthly category
- Chase Freedom Flex rotating category is fixed to Grocery (Q3) for demo

---

## Key Prompts, Workflows, or Requirements

The most important design requirement was: *feel proactive, not reactive*. This shaped every UX decision:

- Dashboard shows earn-rate badges before the user taps (not just after)
- Recommendation modal opens instantly, no loading state
- Explanation text is written in first-person instruction style ("Use Amex Gold here — ...") rather than passive reporting
- "High Value" badge surfaces the best moments visually without the user needing to compare numbers

The second most important requirement: *minimize typing*. Every interaction is a tap. The user never types a merchant, amount, or category — they choose from pre-built scenarios. This made the demo fast and kept the prototype tight.

---

## Iteration and Learning

### Iteration 1 — Earn-rate preview badges on scenario buttons
**Before:** Scenario buttons (H-E-B, Chipotle, etc.) showed only the merchant name and category. Users had no signal about which scenarios were worth their attention.  
**After:** Each button now shows the best earn rate for that context (e.g., `8.0¢/$`) in a green badge, with a lightning icon for high-value moments.  
**Result:** Better. This change made the dashboard itself informative — users could immediately see that groceries returned 8¢/dollar while Uber returned 3.7¢/dollar. It reframed the dashboard from a "trigger panel" to a "value at a glance" overview.

### Iteration 2 — Expandable "Compare All" alternatives in the recommendation modal
**Before:** The modal showed only the recommended card. Users had to take it on faith that it was the best option.  
**After:** A collapsible "Compare X other cards" section shows all other enabled cards ranked by CPD, with card colors and earn rates.  
**Result:** Better. The comparison section directly addressed the question "why not my Sapphire?" It builds trust without cluttering the primary view — it's hidden by default but one tap away.

### Iteration 3 — Notification settings with frequency and category controls
**Before:** Every simulated purchase scenario triggered a recommendation with no way to filter.  
**After:** A Settings screen lets users choose All Recommendations, High Value Only (≥5¢/$), or Off. Category toggles let users opt out of categories they don't care about (e.g., streaming, gas).  
**Result:** Better. This addressed notification fatigue as a product risk and demonstrated product maturity — the app acknowledges that not every recommendation is equally important.

---

## Self-Assessment and Reflection

**What worked well:**
- The recommendation engine is clean, readable, and easy to extend. Adding a new card or merchant takes fewer than 10 lines.
- The mobile-first UI genuinely feels like a real app in device emulation — the bottom sheet modal, card gradients, and bottom nav create a coherent experience.
- The three iterations each addressed a real friction point, and I can explain exactly why each change was made. That makes for a stronger demo narrative.

**What I'd do differently:**
- I'd run the prototype with 2–3 real users before the demo. My "iteration" decisions were based on my own instincts, not actual user feedback — that's a gap in the validation loop.
- The recommendation engine's biggest weak spot is the Citi Custom Cash assumption (that the purchase category is always the top monthly category). In a real product, this would require tracking spend — a significant privacy and complexity tradeoff.
- I'd consider onboarding (adding real card details) as the next sprint. Without it, users see mock card numbers and data, which breaks immersion outside a demo context.

**What this prototype validates:**
The core hypothesis — that proactive, context-aware recommendations reduce decision friction — holds up in demo. A single tap returns a confident, explained recommendation with clear alternatives. The question for validation beyond this MVP: do real users trust the recommendation enough to act on it, and does it change their actual card usage behavior?
