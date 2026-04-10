# AutoCard — 5–7 Minute Demo Script

## Setup before demo
- Run `npm run dev`, open http://localhost:3000
- Set browser to mobile emulation (iPhone 14 / 390px wide) — or just narrow the window
- Pre-open to the Home tab
- 3 cards enabled by default: Amex Gold, Sapphire Preferred, Venture X

---

## Minute 0:30 — Hook / Problem Statement

> "You're at Chipotle. You have 4 credit cards. Do you know which one earns the most right now? Most people don't — and by the time they figure it out, the line has moved. AutoCard solves this."

---

## Minute 1:30 — Show the Dashboard

- Point out the header: **"Right card. Right moment."**
- Show the **active card strip** — 3 cards enabled, mini card visuals
- Show the **scenario buttons** with earn-rate preview badges
  > "Notice these badges — before I even tap, I can already see that H-E-B returns 8¢ per dollar. That's twice as good as Uber. That's Iteration 1 — surfacing value before friction."

---

## Minute 2:30 — Simulate a Purchase

- Tap **H-E-B / Groceries**
- Walk through the **Recommendation Modal**:
  - Best card shown with gradient, earn rate prominently displayed
  - "8.0¢ per dollar — on a $50 grocery run that's 40 cents back"
  - Read the explanation: *"Use Amex Gold — Groceries earns 4x MR pts (≈8.0¢ per dollar). That's 2.0¢ more than your next-best option (Sapphire Preferred)."*

---

## Minute 3:30 — Show Alternatives (Iteration 2)

- Tap **"Compare 2 other cards"** to expand
  > "Users wanted to know why their other cards weren't chosen. So I added this comparison section. Hidden by default so it doesn't clutter the primary view — but it's one tap away."
- Point out the color-coded earn rates, the ranked list
- Close the modal

---

## Minute 4:15 — Wallet Toggle

- Navigate to **Wallet**
- Toggle **Venture X** off, navigate back to Home
  > "Now only 2 cards are active. Watch how the dashboard updates — the badge values change because Venture X is no longer in the mix."
- Tap **Chipotle** again to show a different top card
- Re-enable Venture X

---

## Minute 5:00 — Settings (Iteration 3)

- Navigate to **Settings**
  > "Notification fatigue is a real product risk. If AutoCard fires a recommendation every single time you buy a coffee, you start ignoring it. So I added frequency controls."
- Switch to **"High Value Only"**
  > "With this on, AutoCard only surfaces moments where you're earning 5¢+ per dollar — the truly meaningful moments."
- Show category toggles — uncheck Streaming
  > "If you never think about streaming as a category, you can opt out. This reduces noise and keeps the app feeling helpful, not nagging."

---

## Minute 5:45 — History

- Navigate to **History**
  > "Every simulated recommendation is logged here, grouped by day. You can see the card used, the earn rate, and the full explanation. This is also where the 'High Value' badge shows up to help users spot their best earning moments over time."

---

## Minute 6:30 — Wrap / Learning Reflection

> "The core insight this MVP validates: when you surface the right card at the right moment with a clear explanation, decision friction drops. The three iterations — preview badges, comparison view, and notification controls — each directly addressed a friction point I identified after the first working version."

> "What I'd build next: an onboarding flow to capture the user's real cards, smarter context triggers (geofencing or calendar), and a 'value earned this month' dashboard."

---

## Key numbers to remember for Q&A

| Card | Best category | CPD |
|------|--------------|-----|
| Amex Gold | Dining / Grocery | 8.0¢/$ |
| Blue Cash Preferred | Grocery / Streaming | 6.0¢/$ |
| Sapphire Preferred | Dining | 6.0¢/$ |
| Freedom Flex | Grocery (Q3 rotating) | 7.5¢/$ |
| Venture X | General (2x base) | 3.7¢/$ |
| Citi Custom Cash | Top category (5%) | 5.0¢/$ |
