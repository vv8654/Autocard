# AutoCard

> Know which credit card to use before you pay.

AutoCard is a mobile-first web app that proactively recommends the best credit card for a given purchase moment. Instead of a manual calculator, AutoCard simulates contextual purchase moments and surfaces a clear, plain-English recommendation with a ranked comparison of alternatives.

---

## What it does

- **Dashboard** — Five quick-pick purchase scenarios (H-E-B, Chipotle, Delta, Uber, Walgreens). Tap any to get an instant recommendation. Earn-rate badges show value before you even tap.
- **Wallet** — View and toggle 6 realistic credit cards. Only enabled cards appear in recommendations.
- **Recommendation Modal** — Slides up showing the best card, effective earn rate (¢ per dollar), plain-English explanation, and expandable list of ranked alternatives.
- **History** — Log of all simulated recommendations, grouped by day.
- **Settings** — Control notification frequency (All / High Value Only / Off) and choose which categories you care about.

---

## How to run

```bash
cd autocard
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000). Best viewed at mobile width (~390px) or in Chrome DevTools device mode.

---

## MVP goals

| Goal | Status |
|------|--------|
| Recommend best card for a purchase context | ✅ |
| Plain-English explanation | ✅ |
| Ranked alternatives comparison | ✅ |
| Card wallet with enable/disable | ✅ |
| Persistent state (localStorage) | ✅ |
| Notification preference controls | ✅ |
| Activity history | ✅ |
| Mobile-first UI | ✅ |

---

## Tech stack

- **Next.js 14** (App Router)
- **TypeScript** (strict)
- **Tailwind CSS** (utility-first, mobile-first)
- **React Context** + `localStorage` for state

No backend, no database, no authentication, no external APIs.

---

## Assumptions

- Point values are estimates: Amex MR ~2¢, Chase UR (Sapphire) ~2¢, Chase UR (Flex) ~1.5¢, Capital One Miles ~1.85¢
- Cash back cards are valued at face value (1% = 1¢)
- Citi Custom Cash: assumes the purchase category is the user's top monthly spend
- Chase Freedom Flex rotating category is fixed to Grocery (Q3) for demo purposes
- Spend caps are shown in notes but not enforced
- "High value" is defined as ≥5¢ per dollar earned

---

## Iteration log

### Iteration 1 — Earn-rate preview badges on scenario buttons
**What changed:** Added a small badge to each scenario button on the dashboard showing the best earn rate (e.g., `8.0¢/$`) before the user taps.  
**Why:** Early testers didn't know which scenarios were high-value without tapping into each one. The badge surfaces the signal immediately.  
**Result:** Better — dramatically reduces the "is this worth it?" question at a glance.

### Iteration 2 — Expandable "Compare All" in recommendation modal
**What changed:** Added a collapsible section in the recommendation modal that shows all other cards ranked by CPD. Previously, only the best card was shown.  
**Why:** Users asked "why not my Chase Sapphire?" The comparison view answers that question without cluttering the primary view.  
**Result:** Better — adds clarity without adding visual noise (hidden by default).

### Iteration 3 — Settings page with notification controls
**What changed:** Added a full Settings screen with notification frequency (All / High Value Only / Off) and category toggles.  
**Why:** Notification fatigue is a top product risk. Without controls, the app feels spammy. "High Value Only" is a key filter that focuses attention on moments that actually matter.  
**Result:** Better — the frequency toggle is a natural demo moment to discuss product risk management.

---

## Demo script (5–7 min)

See `DEMO_SCRIPT.md` for the full walkthrough outline.
